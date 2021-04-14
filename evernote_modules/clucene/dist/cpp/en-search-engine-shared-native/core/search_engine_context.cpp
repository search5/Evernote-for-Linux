#include <sstream>
#include <algorithm>
#include <chrono>

#include "ense_utils.h"
#include "ense_reco_resource_parser.h"
#include "search_engine_context.h"

#include "CLucene/search/QueryFilter.h"

namespace en_search {

    SearchEngineContext::SearchEngineContext(): kMaxIDSize(220), kIDField("_id"), kIDFieldWide(L"_id"),
    kNotebookField(L"notebook"), kNotebookTextField(L"notebookText"), kNotebookTextAltField(L"notebookTextAlt"), kNotebookTextSuffixField(L"notebookTextSuffix"),kNotebookGuidField(L"nbGuid"), kStack(L"stack"), kStackText(L"stackText"), kStackTextAlt(L"stackTextAlt"), kStackTextSuffix(L"stackTextSuffix"),
    kTagField(L"tag"), kTagTextField(L"tagText"), kTagTextAltField(L"tagTextAlt"), kTagTextSuffixField(L"tagTextSuffix"), kTagGuidField(L"tagGuid"), kSpaceField(L"space"), kSpaceTextField(L"spaceText"), kSpaceTextAltField(L"spaceTextAlt"), kSpaceTextSuffixField(L"spaceTextSuffix"),
    kSpaceGuidField(L"spaceGuid"), kResourceMime(L"resourceMime"), kResourceFileName(L"resourceFileName"), kCreated(L"created"),
    kUpdated(L"updated"), KTitle(L"title"), KTitleAlt(L"titleAlt"), KTitleSuffix(L"titleSuffix"), KTitleRaw(L"titleRaw"), kSubjectDate(L"subjectDate"), kAuthor(L"author"), kAuthorText(L"authorText"),
    kCreatorId(L"creatorId"), kLastEditorId(L"lastEditorId"), kSource(L"source"), kSourceApplication(L"sourceApplication"),
    kSourceURL(L"sourceURL"), kContentClass(L"contentClass"), kPlaceName(L"placeName"), kApplicationData(L"applicationData"),
    kReminderOrder(L"reminderOrder"), kReminderTime(L"reminderTime"), kReminderDoneTime(L"reminderDoneTime"), kContains(L"contains"),
    kExists(L"_exists_")
    {
        this->initialize();
    }

    /**
     * Imports index from the external database. 
     * 
     * Expects input in the base64 format.
     **/
    void SearchEngineContext::import_index(const std::string& base64_buffer)
    {
        std::lock_guard<std::mutex> lk(mtx_);
        this->initialize();
        if (!base64_buffer.size()) {
            return;
        }
        auto serialized_index = util::base64_decode(base64_buffer);
        this->deserialize_index(serialized_index);
    }

    /**
     * Exports index to the external database. 
     * 
     * Before export, calls optimize procedure which merges all index segements into one (for performance/size). 
     * @return base64 encoded index.
     **/
    std::string SearchEngineContext::export_index() 
    {
        std::lock_guard<std::mutex> lk(mtx_);
        this->optimize_index();
        const auto& serialized_index = this->serialize_index();
        const auto& encoded_index = util::base64_encode((unsigned char*)serialized_index.c_str(), serialized_index.size());
        return encoded_index;
    }

    /**
     * Updates document in the index. Creates document if it is not in the index.
     * 
     * @param guid - document guid
     * @param document - lucene document
     **/
    void SearchEngineContext::add_document(const std::string& guid, std::unique_ptr<SearchDocumentContext> document_context)
    {
        this->add_document(guid, document_context.get());
    }

    /**
     * Updates document in the index. Creates document if it is not in the index.
     *
     * @param guid - document guid
     * @param document - lucene document
     **/
    void SearchEngineContext::add_document(const std::string& guid, SearchDocumentContext* document_context)
    {
        std::lock_guard<std::mutex> lk(mtx_);
        auto document = document_context->get_document();

        // replace document._id if it's also set in the document itself
        auto id_key = this->get_id_key();
        auto id_value = this->get_id_value(guid);
        document->removeFields(id_key.get());
        auto id_field = _CLNEW Field(id_key.get(), id_value.get(), Field::STORE_YES | Field::INDEX_UNTOKENIZED);
        document->add(*id_field);

        auto id_term = util::cst_del_unique_ptr<Term>(new Term(id_key.get(), id_value.get()), [](Term* term) {
            _CLDECDELETE(term);
        });

        auto index_writer = this->get_index_writer();
        index_writer->updateDocument(id_term.get(), document.get());
    }


    /**
     * Removes document from the index. If there's no such document, does nothing.
     * 
     * @param guid - document guid
     **/
    void SearchEngineContext::delete_document(const std::string& guid) 
    {
        std::lock_guard<std::mutex> lk(mtx_);
        auto term = this->get_id_term(guid);
        auto reader = this->get_index_reader();
        reader->deleteDocuments(term.get());
    }

    /**
     * Searches documents in the index. If the index is empty, returns empty array. 
     * 
     * @param queryWithParams - serialized json, contains query string and search params
     * @return serialized json
     **/
    std::pair<std::string, std::string> SearchEngineContext::search(const std::string& queryWithParams)
    {
        std::string error;
        json searchResultGroup = get_empty_search_result_group();

        try {
            std::lock_guard<std::mutex> lk(mtx_);

            std::vector<std::string> files;
            storage_->list(&files);
            if (files.empty()) {
                return std::make_pair(error, searchResultGroup.dump());
            }

            auto reader = this->get_index_reader();
            if (reader->numDocs() == 0) {
                return std::make_pair(error, searchResultGroup.dump());
            }

            auto jQueryWithParams = json::parse(queryWithParams);
            
            auto filterString = getFilterStringFromJson(jQueryWithParams);
            // printf("filterString: %s\n", filterString.c_str());
            auto filterStringUc = util::toWstring(filterString);
            auto filterStringQuery = util::cst_del_unique_ptr<Query>(
            QueryParser::parse(filterStringUc.c_str(), _T("_id"), analyzer_.get()), 
                [](Query* query) {
                    _CLLDELETE(query);
                });
            
            auto filter = util::cst_del_unique_ptr<Filter>(_CLNEW QueryFilter(filterStringQuery.get()), [](Filter* filter) {
                _CLDELETE(filter);
            });

            auto queryString = getQueryStringFromJson(jQueryWithParams);
            // printf("queryString: %s\n", queryString.c_str());
            auto queryStringUc = util::toWstring(queryString);
            auto queryStringQuery = util::cst_del_unique_ptr<Query>(
            QueryParser::parse(queryStringUc.c_str(), _T("_id"), analyzer_.get()), 
                [](Query* query) {
                    _CLLDELETE(query);
                });


            auto searchParams = getSearchParamsFromJson(jQueryWithParams);
            auto storedFields = getStoredFieldsFromJson(jQueryWithParams);
            
            SortField* sortField = NULL;
            switch (searchParams.sortType) {
                case SortType::CREATED:
                    sortField = _CLNEW SortField (_T("created"), SortField::LONG, searchParams.reverseOrder);
                    break;
                case SortType::UPDATED:
                    sortField = _CLNEW SortField (_T("updated"), SortField::LONG, searchParams.reverseOrder);
                    break;
                case SortType::TITLE:
                    sortField = _CLNEW SortField (_T("titleRaw"), SortField::STRING, searchParams.reverseOrder);
                    break;
                case SortType::RELEVANCE:
                default:
                    sortField = SortField::FIELD_SCORE();
                    break;
            }

            auto sort = util::cst_del_unique_ptr<Sort>(_CLNEW Sort(sortField), [](Sort* sort) {
                _CLDELETE(sort);
            });

            auto searcher = std::make_unique<IndexSearcher>(reader.get());
            auto hits = util::cst_del_unique_ptr<Hits>(
                searcher->search(queryStringQuery.get(), filter.get(), sort.get()),
                [](Hits* hits) {
                    _CLLDELETE(hits);
                });

            auto maxHitsCount = hits->length();
            std::vector<SInterimResults> interimResults;
            auto needRescoring = searchParams.sortType == SortType::RELEVANCE;
            if (needRescoring) {
                interimResults.resize(maxHitsCount);
                for (size_t i = 0; i < maxHitsCount; ++i) {
                    auto updatedStr = getStringFromField(hits->doc(i), L"updated");
                    auto updated = std::stoll(updatedStr.c_str());
                    interimResults[i].index = i;
                    interimResults[i].score = hits->score(i) * smarttiming2plain(updated);
                }

                std::sort(interimResults.begin(), interimResults.end(), [](const SInterimResults &lhs, const SInterimResults &rhs) {
                    return lhs.score > rhs.score;
                });
            }

            auto startIndex = std::min((size_t)std::max(searchParams.from, 0), maxHitsCount);
            maxHitsCount -= startIndex;
            auto maxResults = (searchParams.size >= 0 && (size_t)searchParams.size < maxHitsCount) ? (size_t)searchParams.size : maxHitsCount;
            for (auto i = startIndex; i < startIndex + maxResults; ++i) {
                auto index = needRescoring ? interimResults[i].index : i;
                auto interimScore = needRescoring ? interimResults[i].score : hits->score(i);
                auto &hitDoc = hits->doc(index);

                // ids/guids can only contain ascii symbols
                auto wide_guid = std::wstring(hitDoc.get(_T("_id")));
                std::string guid(wide_guid.begin(), wide_guid.end());
                auto wide_type = std::wstring(hitDoc.get(_T("type")));
                auto wide_version = std::wstring(hitDoc.get(_T("version")));
                auto score = util::sigmoid(interimScore);

                auto doc = json::object();
                doc["guid"] = guid;
                doc["type"] = std::stol(wide_type.c_str());
                doc["version"] = std::stol(wide_version.c_str());
                doc["score"] = score;
                for (const auto &field: storedFields) {
                    if (field == "tag" || field == "tagGuid") {
                        doc[field] = getArrayOfStringFromField(hitDoc, std::wstring(field.begin(), field.end()).c_str());
                    } else {
                        doc[field] = getStringFromField(hitDoc, std::wstring(field.begin(), field.end()).c_str());
                    }
                }
                searchResultGroup["documents"].emplace_back(doc);
            }

            searchResultGroup["startIndex"] = startIndex;
            searchResultGroup["totalResultCount"] = hits->length();
        } catch (CLuceneError& exception) {
            if (exception.number() == CL_ERR_OutOfMemory) {
                throw;
            }
            error = util::format_exception("search", "CLuceneError", std::to_string(exception.number()));
            searchResultGroup = get_empty_search_result_group();
        } catch (std::bad_alloc& exception) {
            throw;
        } catch (std::exception& exception) {
            error = util::format_exception("search", "std::exception", "masked exception");
            searchResultGroup = get_empty_search_result_group();
        } catch (...) {
            error = util::format_exception("DumpRAMDirectoryAsync", "unknown exception", "unknown");
            searchResultGroup = get_empty_search_result_group();
        }
       
        return std::make_pair(error, searchResultGroup.dump());
    }

    bool SearchEngineContext::check_index_needs_creation_and_unlock()
    {
       auto needs_creation = true;
        if (IndexReader::indexExists(storage_.get())) {
            if (IndexReader::isLocked(storage_.get())) {
                IndexReader::unlock(storage_.get());
            }
            needs_creation = false;
        }
        return needs_creation;
    }

    util::cst_del_unique_ptr<IndexWriter> SearchEngineContext::get_index_writer()
    {      
        auto needs_creation = this->check_index_needs_creation_and_unlock();
        auto index_writer = util::cst_del_unique_ptr<IndexWriter>(new IndexWriter(storage_.get(), analyzer_.get(), needs_creation), 
        [](IndexWriter* writer) {
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

    util::cst_del_unique_ptr<IndexReader> SearchEngineContext::get_index_reader()
    {
        this->check_index_needs_creation_and_unlock();
        auto reader = util::cst_del_unique_ptr<lucene::index::IndexReader>(lucene::index::IndexReader::open(this->storage_.get()), [](lucene::index::IndexReader* reader) {
            reader->close();
            delete reader;
        });
        return reader;
    }

    void SearchEngineContext::optimize_index()
    {
        auto writer = this->get_index_writer();
        writer->optimize();
    }

    std::string SearchEngineContext::serialize_index() const
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
            lucene::store::IndexInput *input;
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

    void SearchEngineContext::deserialize_index(const std::string& buffer) 
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
            auto output = util::cst_del_unique_ptr<lucene::store::IndexOutput>(this->storage_->createOutput(filename.get()), 
                [](lucene::store::IndexOutput* output) {
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

    std::unique_ptr<TCHAR[]> SearchEngineContext::get_id_key() const
    {
        auto id_key = std::make_unique<TCHAR[]>(kMaxIDSize);
        STRCPY_AtoT(id_key.get(), kIDField.c_str(), kMaxIDSize);
        return id_key;
    }

    util::cst_del_unique_ptr<TCHAR> SearchEngineContext::get_id_value(const std::string& guid) const
    {
        auto id_value = util::cst_del_unique_ptr<TCHAR>(STRDUP_AtoT(guid.c_str()),[](TCHAR* value) {
            free(value);
        });
        return id_value;
    }

    util::cst_del_unique_ptr<Term> SearchEngineContext::get_id_term(const std::string& guid) const
    {
        auto id_key = this->get_id_key();
        auto id_value = this->get_id_value(guid);
        auto id_term = util::cst_del_unique_ptr<Term>(new Term(id_key.get(), id_value.get()), [](Term* term) {
            _CLDECDELETE(term);
        });

        return id_term;
    }

    void SearchEngineContext::initialize()
    {
        storage_ = std::make_unique<lucene::store::RAMDirectory>();
        analyzer_ = std::make_unique<lucene::analysis::PerFieldAnalyzerWrapper>(new StandardAnalyzer());

        // text fields for suggestions must be indexed by each term, stop word list is empty
        const TCHAR* EMPTY_STOP_WORDS[] = { NULL }; 
        
        analyzer_->addAnalyzer(kIDFieldWide.c_str(), new lucene::analysis::KeywordAnalyzer());
        // notebook
        analyzer_->addAnalyzer(kNotebookField.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kNotebookTextField.c_str(), new StandardAnalyzer(EMPTY_STOP_WORDS));
        analyzer_->addAnalyzer(kNotebookTextAltField.c_str(), new StandardAnalyzer(EMPTY_STOP_WORDS));
        analyzer_->addAnalyzer(kNotebookTextSuffixField.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kNotebookGuidField.c_str(), new lucene::analysis::KeywordAnalyzer());
        // stack
        analyzer_->addAnalyzer(kStack.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kStackText.c_str(), new StandardAnalyzer(EMPTY_STOP_WORDS));
        analyzer_->addAnalyzer(kStackTextAlt.c_str(), new StandardAnalyzer(EMPTY_STOP_WORDS));
        analyzer_->addAnalyzer(kStackTextSuffix.c_str(), new lucene::analysis::KeywordAnalyzer());
        // tag
        analyzer_->addAnalyzer(kTagField.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kTagTextField.c_str(), new StandardAnalyzer(EMPTY_STOP_WORDS));
        analyzer_->addAnalyzer(kTagTextAltField.c_str(), new StandardAnalyzer(EMPTY_STOP_WORDS));
        analyzer_->addAnalyzer(kTagTextSuffixField.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kTagGuidField.c_str(), new lucene::analysis::KeywordAnalyzer());
        // space
        analyzer_->addAnalyzer(kSpaceField.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kSpaceTextField.c_str(), new StandardAnalyzer(EMPTY_STOP_WORDS));
        analyzer_->addAnalyzer(kSpaceTextAltField.c_str(), new StandardAnalyzer(EMPTY_STOP_WORDS));
        analyzer_->addAnalyzer(kSpaceTextSuffixField.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kSpaceGuidField.c_str(), new lucene::analysis::KeywordAnalyzer());
        // resource
        analyzer_->addAnalyzer(kResourceMime.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kResourceFileName.c_str(), new StandardAnalyzer());
        // created / updated
        analyzer_->addAnalyzer(kCreated.c_str(), new StandardAnalyzer());
        analyzer_->addAnalyzer(kUpdated.c_str(), new StandardAnalyzer());
        // title
        analyzer_->addAnalyzer(KTitle.c_str(), new StandardAnalyzer());
        analyzer_->addAnalyzer(KTitleAlt.c_str(), new StandardAnalyzer(EMPTY_STOP_WORDS));
        analyzer_->addAnalyzer(KTitleSuffix.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(KTitleRaw.c_str(), new lucene::analysis::KeywordAnalyzer());
        // subject date
        analyzer_->addAnalyzer(kSubjectDate.c_str(), new StandardAnalyzer());
        // author
        analyzer_->addAnalyzer(kAuthor.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kAuthorText.c_str(), new StandardAnalyzer(EMPTY_STOP_WORDS));
        // other fields
        analyzer_->addAnalyzer(kCreatorId.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kLastEditorId.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kSource.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kSourceApplication.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kSourceURL.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kContentClass.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kPlaceName.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kApplicationData.c_str(), new lucene::analysis::KeywordAnalyzer());
        analyzer_->addAnalyzer(kReminderOrder.c_str(), new StandardAnalyzer());
        analyzer_->addAnalyzer(kReminderTime.c_str(), new StandardAnalyzer());
        analyzer_->addAnalyzer(kReminderDoneTime.c_str(), new StandardAnalyzer());
        analyzer_->addAnalyzer(kContains.c_str(), new lucene::analysis::KeywordAnalyzer());

        analyzer_->addAnalyzer(kExists.c_str(), new StandardAnalyzer());
        
        this->get_index_writer();
    }

    std::string getFilterStringFromJson(const json &jQueryWithParams) {
        return ((jQueryWithParams.contains("filterString") && jQueryWithParams["filterString"].is_string())) ? 
            jQueryWithParams["filterString"].get<std::string>() : "*:*";
    }

    std::string getQueryStringFromJson(const json &jQueryWithParams) {
        return ((jQueryWithParams.contains("queryString") && jQueryWithParams["queryString"].is_string())) ? 
            jQueryWithParams["queryString"].get<std::string>() : "*:*";
    }

    SearchParams getSearchParamsFromJson(const json &jQueryWithParams) {
        SearchParams searchParams;
        searchParams.from = ((jQueryWithParams.contains("from") && jQueryWithParams["from"].is_number())) ? 
            jQueryWithParams["from"].get<int>() : 0;
        searchParams.size = ((jQueryWithParams.contains("size") && jQueryWithParams["size"].is_number())) ? 
            jQueryWithParams["size"].get<int>() : -1;
        searchParams.sortType = ((jQueryWithParams.contains("sortType") && jQueryWithParams["sortType"].is_number())) ? 
            static_cast<SortType>(jQueryWithParams["sortType"].get<int>()) : SortType::RELEVANCE;
        searchParams.reverseOrder = ((jQueryWithParams.contains("reverseOrder") && jQueryWithParams["reverseOrder"].is_boolean())) ? 
            jQueryWithParams["reverseOrder"].get<bool>() : false;        
        
        return searchParams;
    }

    std::vector<std::string> getStoredFieldsFromJson(const json &jQueryWithParams) {
        std::vector<std::string> storedFields; 
        if (jQueryWithParams.contains("stored_fields") && jQueryWithParams["stored_fields"].is_array()) {
            for (const auto &field: jQueryWithParams["stored_fields"]) {
                if (field.is_string()) {
                    storedFields.push_back(field.get<std::string>());
                }
            }
        }

        return storedFields;
    }

    std::string getStringFromField(const Document &document, const TCHAR *fieldName) {
        auto *pFieldValue = document.get(fieldName);
        if (pFieldValue) {
            auto wide_value = std::wstring(pFieldValue);
            return util::toUtf(wide_value);
        }
        return "";
    }

    std::vector<std::string> getArrayOfStringFromField(const Document &document, const TCHAR *fieldName) {
        std::vector<std::string> values;
        auto fields = document.getFields();
        for (Document::FieldsType::const_iterator itr = fields->begin(); itr != fields->end(); ++itr ) {
			if (_tcscmp((*itr)->name(), fieldName) == 0 && (*itr)->stringValue() != NULL) {
                auto wide_value = std::wstring((*itr)->stringValue());
                values.emplace_back(util::toUtf(wide_value));
            }
	    }
        return values;
    }

    json get_empty_search_result_group()
    {
        json searchResultGroup = {
                { "totalResultCount", 0 },
                { "startIndex", 0 },
                { "documents", json::array() }
            };
        return searchResultGroup;
    }

    double smarttiming2plain(long long updated) {
        auto currentTime = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count();
        double tx = std::fabs(updated - currentTime) / 1000; 
        return std::exp(tx * kRelevanceFactor);
    }
}
