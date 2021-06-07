#ifndef _search_search_engine_index_
#define _search_search_engine_index_

#include <string>
#include <memory>
#include <mutex>
#include <unordered_map>
#include <unordered_set>

#include "CLucene.h"
#include "json.hpp"

#include "ense_utils.h"

using json = nlohmann::json;

namespace evernote {
namespace cosm {
namespace core {

  // using action_func_t = json (ENSearchEngineIndex::*)(const json& js);

  class ENSearchEngineIndex
  {
    public:
      ENSearchEngineIndex();
      // ENSearchEngineIndex(const json& scheme);
      virtual ~ENSearchEngineIndex();

      json execute(const json& js);

    protected:
      json set_mapping(const json& js);
      virtual json import_index(const json& js);
      virtual json export_index(const json& js);
      virtual json add_document(const json& js);
      virtual json delete_document(const json& js);
      virtual json search(const json& js);

      bool check_index_needs_creation_and_unlock();
      util::cst_del_unique_ptr<lucene::index::IndexWriter> get_index_writer();
      util::cst_del_unique_ptr<lucene::index::IndexReader> get_index_reader();
      void clear_storage();

      virtual std::string serialize_index() const;
      virtual void deserialize_index(const std::string& buffer);
      void optimize_index();

      // general constants
      const std::string kAction;
      const std::string kProperties;
      const std::string kType;

      //action types
      const std::string kSetMappingAction;
      const std::string kImportAction;
      const std::string kExportAction;
      const std::string kAddAction;
      const std::string kDeleteAction;
      const std::string kSearchAction;

      const std::string kFlags;
      const std::string kIndex;
      const std::string kIndexData;

      const std::string kId;
      const std::string kKeyword;
      const std::string kText;

      // search constants
      const std::string kTotalResultCount;
      const std::string kStartIndex;
      const std::string kDocuments;
      const std::string kGuid;
      const std::string kScore;

      // stored field contants
      const std::string kTag;
      const std::string kTagGuid;

      // sorting constants
      const std::wstring kCreated;
      const std::wstring kUpdated;
      const std::wstring kTitleRaw;

      const std::string kVersion;
      const std::string kSortField;
      
      
      mutable std::mutex mtx_;
      std::unordered_map<std::string, json (ENSearchEngineIndex::*)(const json&)> actions_;
      std::unordered_map<std::string, int> flags_;
      std::unique_ptr<lucene::analysis::PerFieldAnalyzerWrapper> analyzer_;
      std::unique_ptr<lucene::store::RAMDirectory> storage_;

      std::string name_;
  };

}
}
}

#endif