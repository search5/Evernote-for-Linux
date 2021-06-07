#include <functional>
#include <sstream>
#include <iostream>

#include "search_engine_index.h"
// #include "search_engine_context.h"
#include "ense_document_utils.h"
#include "ense_query_utils.h"
#include "ense_utils.h"

#define ENSE_CALL_MEMBER_FN(object,ptrToMember)  ((object).*(ptrToMember))

namespace evernote {
namespace cosm {
namespace core {

  namespace la = lucene::analysis;
  namespace las = lucene::analysis::standard;
  namespace li = lucene::index;
  namespace ls = lucene::store;
  namespace lse = lucene::search;
  namespace lqp = lucene::queryParser;

  ENSearchEngineIndex::ENSearchEngineIndex() : kAction("action"), kProperties("properties"), 
  kType("type"), 
  kSetMappingAction("set_mapping"), kImportAction("import_index"), kExportAction("export_index"), 
  kAddAction("add_document"), kDeleteAction("delete_document"), kSearchAction("search"),
  kFlags("flags"), kIndex("index"), kIndexData("index_data"), kId("_id"), kKeyword("keyword"), 
  kText("text"), kTotalResultCount("totalResultCount"),
  kStartIndex("startIndex"), kDocuments("documents"), kGuid("guid"), kScore("score"),
  kTag("tag"), kTagGuid("tagGuid"),
  kCreated(L"created"), kUpdated(L"updated"), kTitleRaw(L"titleRaw"), kVersion("version"),
  kSortField("_sort_field")
  {
    this->clear_storage();

    // register actions
    actions_.emplace(kSetMappingAction, &ENSearchEngineIndex::set_mapping);
    actions_.emplace(kImportAction, &ENSearchEngineIndex::import_index);
    actions_.emplace(kExportAction, &ENSearchEngineIndex::export_index);
    actions_.emplace(kAddAction, &ENSearchEngineIndex::add_document);
    actions_.emplace(kDeleteAction, &ENSearchEngineIndex::delete_document);
    actions_.emplace(kSearchAction, &ENSearchEngineIndex::search);
  }

  ENSearchEngineIndex::~ENSearchEngineIndex()
  {}

  json ENSearchEngineIndex::execute(const json& js)
  {
    // std::cout << js << std::endl;
    if (!js.contains(kAction) || !js[kAction].is_string()) {
      return util::encode_error("execute", "invalid input action");
    }

    auto action = js[kAction].get<std::string>();
    if (actions_.find(action) == actions_.end()) {
      return util::encode_error("execute", "unsupported action");
    }

    return ENSE_CALL_MEMBER_FN(*this, actions_[action])(js);
  }

  json ENSearchEngineIndex::set_mapping(const json& js)
  {
    std::lock_guard<std::mutex> lk(mtx_);

    this->clear_storage();

    if (!js.contains(kProperties) || !js[kProperties].is_object()) {
      return util::encode_error("malformed_scheme", "invalid properties field");
    }

    for (auto& element : js[kProperties].items()) {
      auto field_name = element.key();
      auto object = element.value();

      if (!object.contains(kType) || !object[kType].is_string()) {
        return util::encode_error("malformed_scheme", "invalid type field");
      }
      auto field_type = object[kType].get<std::string>();

      if (!object.contains(kFlags) || !object[kFlags].is_number_integer()) {
        return util::encode_error("malformed_scheme", "invalid flags field");
      }
      auto flags = object[kFlags].get<int>();

      if (field_type == kKeyword) {
        analyzer_->addAnalyzer(util::toWstring(field_name).c_str(), new la::KeywordAnalyzer());
      } else if (field_type == kText) {
        analyzer_->addAnalyzer(util::toWstring(field_name).c_str(), new las::StandardAnalyzer());
      } else {
        return util::encode_error("malformed_scheme", "unsupported type field");
      }

      flags_[field_name] = flags;
    }

    this->get_index_writer();

    return json::object();
  }
  
  /**
   * Imports index from the external database. 
   * 
   **/
  json ENSearchEngineIndex::import_index(const json& js)
  {
    std::lock_guard<std::mutex> lk(mtx_);

    if (!js.contains(kIndexData) || !js[kIndexData].is_string()) {
      return util::encode_error("import_index", "invalid input index");
    }

    auto base64_buffer = js[kIndexData].get<std::string>();
    if (!base64_buffer.size()) {
        return json::object();
    }

    auto serialized_index = util::base64_decode(base64_buffer);
    this->deserialize_index(serialized_index);

    return json::object();
  }

  /**
   * Exports index to the external database. 
   * 
   * Before export, calls optimize procedure which merges all index segements into one (for performance/size). 
   * @return base64 encoded index.
   **/
  json ENSearchEngineIndex::export_index(const json& js)
  {
    std::lock_guard<std::mutex> lk(mtx_);
    this->optimize_index();
    const auto& serialized_index = this->serialize_index();
    const auto& encoded_index = util::base64_encode((unsigned char*)serialized_index.c_str(), serialized_index.size());

    json out;
    out[kIndexData] = encoded_index;

    return out;
  }

  json ENSearchEngineIndex::add_document(const json& js) 
  {
    std::lock_guard<std::mutex> lk(mtx_);

    json js_err;

    auto id_term = get_string_term_from_js_field(js["document"], kId, js_err);
    if (!id_term) {
      return js_err;
    }

    auto lucene_document = create_document(js["document"], flags_, js_err);
    if (!lucene_document) {
      return js_err;
    }

    auto index_writer = this->get_index_writer();
    index_writer->updateDocument(id_term.get(), lucene_document.get());

    return json::object();
  }

  /**
   * Removes document from the index. If there's no such document, does nothing.
   * 
   * @param guid - document guid
   **/
  json ENSearchEngineIndex::delete_document(const json& js) {
    std::lock_guard<std::mutex> lk(mtx_);

    json js_err;

    auto id_term = get_string_term_from_js_field(js["document"], kId, js_err);
    if (!id_term) {
      return js_err;
    }

    auto reader = this->get_index_reader();
    reader->deleteDocuments(id_term.get());

    return json::object();
  }

  /**
   * Searches documents in the index. If the index is empty, returns empty array. 
   * 
   * @param queryWithParams - serialized json, contains query string and search params
   * @return serialized json
   **/
  json ENSearchEngineIndex::search(const json& in)
  {
    try {
      std::lock_guard<std::mutex> lk(mtx_);
      json searchResultGroup = {
          { kTotalResultCount, 0 },
          { kStartIndex, 0 },
          { kDocuments, json::array() }
      };

      std::vector<std::string> files;
      storage_->list(&files);
      if (files.empty()) {
          return searchResultGroup;
      }

      auto reader = this->get_index_reader();
      if (reader->numDocs() == 0) {
          return searchResultGroup;
      }

      auto jQueryWithParams = in;
      
      auto queryString = evernote::cosm::core::getQueryStringFromJson(jQueryWithParams);
      if (queryString.empty()) {
        return searchResultGroup;
      }

      auto queryStringUc = util::toWstring(queryString);
      auto queryStringQuery = util::cst_del_unique_ptr<lse::Query>(
            lucene::queryParser::QueryParser::parse(queryStringUc.c_str(), _T("_id"), analyzer_.get()), 
                [](lse::Query* query) {
                    _CLLDELETE(query);
                });


      auto searchParams = evernote::cosm::core::getSearchParamsFromJson(jQueryWithParams);
      auto storedFields = evernote::cosm::core::getStoredFieldsFromJson(jQueryWithParams);
      // printf("queryString: %s\n", queryString.c_str());

      lse::SortField* sortField = NULL;
      switch (searchParams.sortType) {
          case evernote::cosm::core::SortType::CREATED:
              sortField = _CLNEW lse::SortField (kCreated.c_str(), lse::SortField::LONG, searchParams.reverseOrder);
              break;
          case evernote::cosm::core::SortType::UPDATED:
              sortField = _CLNEW lse::SortField (kUpdated.c_str(), lse::SortField::LONG, searchParams.reverseOrder);
              break;
          case evernote::cosm::core::SortType::TITLE:
              sortField = _CLNEW lse::SortField (kTitleRaw.c_str(), lse::SortField::STRING, searchParams.reverseOrder);
              break;
          case evernote::cosm::core::SortType::RELEVANCE:
          default:
              sortField = lse::SortField::FIELD_SCORE();
              break;
      }

      auto sort = util::cst_del_unique_ptr<lse::Sort>(_CLNEW lse::Sort(sortField), [](lse::Sort* sort) {
        _CLDELETE(sort);
      });

      auto searcher = std::make_unique<lse::IndexSearcher>(reader.get());
      auto hits = util::cst_del_unique_ptr<lse::Hits>(
          searcher->search(queryStringQuery.get(), sort.get()),
          [](lse::Hits* hits) {
              _CLLDELETE(hits);
          });

      auto maxHitsCount = hits->length();
      auto startIndex = std::min((size_t)std::max(searchParams.from, 0), maxHitsCount);
      maxHitsCount -= startIndex;
      auto maxResults = (searchParams.size >= 0 && (size_t)searchParams.size < maxHitsCount) ? (size_t)searchParams.size : maxHitsCount;

      for (auto i = startIndex; i < startIndex + maxResults; ++i) {
          // ids/guids can only contain ascii symbols
        auto wide_guid = std::wstring(hits->doc(i).get(util::toWstring(kId).c_str()));
        auto score = hits->score(i);

        auto doc = json::object();
        doc[kGuid] = util::toUtf(wide_guid);
        doc[kScore] =  util::sigmoid(score);

        for (const auto& field: storedFields) {
          doc[field] = get_string_from_field(hits->doc(i), std::wstring(field.begin(), field.end()).c_str());
        }

        searchResultGroup[kDocuments].emplace_back(doc);
      }

      searchResultGroup[kStartIndex] = startIndex;
      searchResultGroup[kTotalResultCount] = hits->length();

      return searchResultGroup;
    } catch (CLuceneError& exception) {
      if (exception.number() == CL_ERR_OutOfMemory) {
        throw;
      }
      return util::encode_error("ENSearchEngineIndex", "search", util::format_exception("search", "CLuceneError", std::to_string(exception.number())));

    } catch (std::bad_alloc& exception) {
      throw;

    } catch (std::exception& exception) {
      return util::encode_error("ENSearchEngineIndex", "search", util::format_exception("search", "std::exception", "masked exception"));

    } catch (...) {
      return util::encode_error("ENSearchEngineIndex", "search", util::format_exception("search", "unknown exception", "unknown"));

    }
  }

  bool ENSearchEngineIndex::check_index_needs_creation_and_unlock()
  {
    auto needs_creation = true;
    if (li::IndexReader::indexExists(storage_.get())) {
      if (li::IndexReader::isLocked(storage_.get())) {
        li::IndexReader::unlock(storage_.get());
      }
      needs_creation = false;
    }
    return needs_creation;
  }


  util::cst_del_unique_ptr<li::IndexWriter> ENSearchEngineIndex::get_index_writer()
  {
    auto needs_creation = this->check_index_needs_creation_and_unlock();
    auto index_writer = util::cst_del_unique_ptr<li::IndexWriter>(new li::IndexWriter(storage_.get(), analyzer_.get(), needs_creation), 
    [](li::IndexWriter* writer) {
        writer->flush();
        writer->close(true);
        delete writer;
    });
    // todo(vglazkov) adjust this limit
    // To bypass a possible exception (we have no idea what we will be indexing...)
    index_writer->setMaxFieldLength(0x7FFFFFFFL);
    // Turn this off to make indexing faster; we'll turn it on later before optimizing
    index_writer->setUseCompoundFile(false);

    return index_writer;
  }

  util::cst_del_unique_ptr<li::IndexReader> ENSearchEngineIndex::get_index_reader()
  {
    this->check_index_needs_creation_and_unlock();
    auto reader = util::cst_del_unique_ptr<li::IndexReader>(li::IndexReader::open(this->storage_.get()), [](li::IndexReader* reader) {
      reader->close();
      delete reader;
    });
    return reader;
  }

  void ENSearchEngineIndex::clear_storage()
  {
    storage_ = std::make_unique<ls::RAMDirectory>();
    analyzer_ = std::make_unique<la::PerFieldAnalyzerWrapper>(new las::StandardAnalyzer());
  }

  std::string ENSearchEngineIndex::serialize_index() const
  {
    std::vector<std::string> files;
    this->storage_->list(&files);
    std::stringstream ss(std::stringstream::in|std::stringstream::out|std::stringstream::binary);
    auto total_files = files.size();
    // total number of files
    ss.write((char const*) &total_files, sizeof(size_t));

    for (const auto& file: files) {
      // filename size
      auto filename_size = file.size();
      ss.write((char const*) &filename_size, sizeof(size_t));
      // filename
      ss.write(file.c_str(), filename_size);

      // file size
      auto file_size = this->storage_->fileLength(file.c_str());
      ls::IndexInput *input;
      CLuceneError error;
      this->storage_->openInput(file.c_str(), input, error);
      ss.write((char const*) &file_size, sizeof(int64_t));

      // file
      auto file_buffer = std::make_unique<unsigned char[]>(file_size);
      input->readBytes(file_buffer.get(), file_size);
      ss.write((char const*)file_buffer.get(), file_size);
    }

    return ss.str();
  }

  void ENSearchEngineIndex::deserialize_index(const std::string& buffer) 
  {
    std::stringstream ss(std::stringstream::in|std::stringstream::out|std::stringstream::binary);
    ss.str(buffer);
    size_t files_count = 0;
    ss.read((char*) &files_count, sizeof(size_t));

    for (auto i = 0u; i < files_count; ++i) {
      // filename size
      size_t filename_size = 0;
      ss.read((char*) &filename_size, sizeof(size_t));

      // filename
      auto filename = std::make_unique<char[]>(filename_size + 1);
      ss.read(filename.get(), filename_size);
      filename[filename_size] = '\0';

      // file
      auto output = util::cst_del_unique_ptr<ls::IndexOutput>(this->storage_->createOutput(filename.get()), 
          [](ls::IndexOutput* output) {
              output->flush();
              output->close();
          });

      // file size
      int64_t file_size = 0;
      ss.read((char*) &file_size, sizeof(int64_t)); 
      // file content
      auto file_buffer = std::make_unique<unsigned char[]>(file_size);
      ss.read((char*) file_buffer.get(), file_size); 
      output->writeBytes(file_buffer.get(), file_size);
    }
  }

  void ENSearchEngineIndex::optimize_index()
  {
    auto writer = this->get_index_writer();
    writer->optimize();
  }

}
}
}