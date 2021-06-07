#ifndef _ense_scheduler_
#define _ense_scheduler_

#include <vector>
#include <string>
#include <memory>
#include <unordered_set>
#include <unordered_map>

#include "json.hpp"

#include "search_engine_index.h"
#include "search_engine_context.h"
#include "search_document_context.h"

using json = nlohmann::json;

namespace evernote {
namespace cosm {
namespace core {

  class ENScheduler {
    public:
      ENScheduler();
      json execute(const json& js);
      std::string execute_str(const std::string& js);

      // temporary delegate API 
      void import_index(const std::string& base64_buffer);
      std::string export_index();
      void optimize_index();
      void delete_document(const std::string& guid);
      void add_document(const std::string& guid, std::unique_ptr<en_search::SearchDocumentContext> document);
      void add_document(const std::string& guid, en_search::SearchDocumentContext* document);
      std::pair<std::string, std::string> search_str(const std::string& queryWithParams);
      // end of temporary delegate API
    private:
      json search(const json& js);

      const std::string kAction;
      const std::string kTransformAction;
      const std::string kSearchAction;
      const std::string kDocuments;

      const std::string kIndex;
      const std::string kNoteIndex;
      const std::string kHistoryIndex;

      const std::string kQueryString;
      const std::string kSortType;
      const std::string kReverseOrder;
      const std::string kFrom;
      const std::string kSize;
      const std::string kStoredFields;

      std::unordered_map<std::string, std::shared_ptr<ENSearchEngineIndex>> indices_;
      // temporary main index API
      std::shared_ptr<en_search::SearchEngineContext> search_engine_context_;
  };


}
}
}


#endif