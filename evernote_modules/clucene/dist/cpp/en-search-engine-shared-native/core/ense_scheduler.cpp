#include <iostream>
#include <stack>
#include <functional>
#include <utility>

#include "ense_scheduler.h"

#include "ense_utils.h"



namespace evernote {
namespace cosm {
namespace core {

  ENScheduler::ENScheduler() : kAction("action"), kTransformAction("transform"), kSearchAction("search"),
  kIndex("index"), kNoteIndex("note"), kHistoryIndex("history"),
  kQueryString("queryString"), kSortType("sortType"), kReverseOrder("reverseOrder"), kFrom("from"), kSize("size"), kStoredFields("storedFields")
  {
    search_engine_context_ = std::make_shared<en_search::SearchEngineContext>();
    // todo:: should be registered from typescript
    indices_.emplace("tag", std::make_shared<ENSearchEngineIndex>());
    indices_.emplace("notebook", std::make_shared<ENSearchEngineIndex>());
    indices_.emplace("stack", std::make_shared<ENSearchEngineIndex>());
    indices_.emplace("space", std::make_shared<ENSearchEngineIndex>());
  }

  void ENScheduler::import_index(const std::string& base64_buffer)
  {
    search_engine_context_->import_index(base64_buffer);
  }

  std::string ENScheduler::export_index()
  {
    return search_engine_context_->export_index();
  }

  // todo:: check if this is needed
  void ENScheduler::optimize_index()
  {
    search_engine_context_->optimize_index();
  }

  void ENScheduler::delete_document(const std::string& guid)
  {
    search_engine_context_->delete_document(guid);
  }

  void ENScheduler::add_document(const std::string& guid, std::unique_ptr<en_search::SearchDocumentContext> document)
  {
    search_engine_context_->add_document(guid, std::move(document));
  }

  void ENScheduler::add_document(const std::string& guid, en_search::SearchDocumentContext* document)
  {
    search_engine_context_->add_document(guid, document);
  }

  std::pair<std::string, std::string> ENScheduler::search_str(const std::string& queryWithParams)
  {
    return search_engine_context_->search(queryWithParams);
  }

  json ENScheduler::execute(const json& js)
  {
    if (!js.contains(kAction) || !js[kAction].is_string()) {
      return util::encode_error("execute", "invalid action");
    }

    // auto action = js[kAction].get<std::string>();

    // if (action == kSearchAction) {
    //   return this->search(js);
    // }

    if (!js.contains(kIndex) || !js[kIndex].is_string()) {
      return util::encode_error("execute", "invalid target index");
    }

    auto index = js[kIndex].get<std::string>();

    auto index_iter = indices_.find(index);
    if (index_iter == indices_.end()) {
      return util::encode_error("execute", "unknown target index");
    }

    return index_iter->second->execute(js);
  }

  std::string ENScheduler::execute_str(const std::string& js)
  {
    json in;
    try {
      in = json::parse(js);
    } catch (json::parse_error& ex) {
      return util::encode_error("execute", "failed to parsed input json");
    } catch (std::bad_alloc& ex) {
      throw;
    } catch (...) {
      return util::encode_error("execute", "unknown exception on input parsing");
    }

    return this->execute(in).dump();
  }

  json ENScheduler::search(const json& js)
  {
    return json::object();
  }

}
}
}