#ifndef _search_search_engine_context_
#define _search_search_engine_context_

#include <memory>
#include <mutex>
#include <vector>
#include <string>
#include <unordered_set>
#include <utility>

#include "CLucene.h"

#include "Misc.h"
#include "repl_tchar.h"

#include "search_document_context.h"
#include "ense_utils.h"
#include "json.hpp"

using json = nlohmann::json;

// 

namespace en_search {

using namespace lucene::analysis::standard;
using namespace lucene::document;
using namespace lucene::index;
using namespace lucene::search;
using namespace lucene::store;
using namespace lucene::queryParser;

const double kRelevanceFactor = -4.313191834428174e-8; // from elastic relevance function

enum class SortType 
{
    CREATED = 1,
    UPDATED = 2,
    RELEVANCE = 3,
    TITLE = 5,
};

struct SearchParams
{
    SortType sortType;
    bool reverseOrder;
    int from;
    int size;
};

struct SInterimResults {
    size_t index;
    float score;
};

/*
 * Provides high level abstraction around Clucene library. 
 * 
 * This class is essentially a facade (https://en.wikipedia.org/wiki/Facade_pattern)
 * which is going to be shared between electron/react native search engine implementations.
 */
class SearchEngineContext {
    public:
        SearchEngineContext();
    public:
        void import_index(const std::string& base64_buffer);
        std::string export_index();
        void optimize_index();
        void delete_document(const std::string& guid);
        void add_document(const std::string& guid, std::unique_ptr<SearchDocumentContext> document);
        void add_document(const std::string& guid, SearchDocumentContext* document);
        std::pair<std::string, std::string> search(const std::string& queryWithParams);
        
    private:
        void initialize();
        bool check_index_needs_creation_and_unlock();
        util::cst_del_unique_ptr<IndexWriter> get_index_writer();
        util::cst_del_unique_ptr<IndexReader> get_index_reader();
        std::unique_ptr<TCHAR[]> get_id_key() const;
        util::cst_del_unique_ptr<TCHAR> get_id_value(const std::string& guid) const;
        util::cst_del_unique_ptr<Term> get_id_term(const std::string& guid) const;
    private:
        std::string serialize_index() const;
        void deserialize_index(const std::string& buffer);
    private:
        mutable std::mutex mtx_;
        std::unique_ptr<lucene::analysis::PerFieldAnalyzerWrapper> analyzer_;
        std::unique_ptr<lucene::store::RAMDirectory> storage_;
    private:
        // id
        const unsigned int kMaxIDSize;
        const std::string kIDField;
        const std::wstring kIDFieldWide;
        // notebook
        const std::wstring kNotebookField;
        const std::wstring kNotebookTextField;
        const std::wstring kNotebookTextAltField;
        const std::wstring kNotebookTextSuffixField;
        const std::wstring kNotebookGuidField;
        // stack
        const std::wstring kStack;
        const std::wstring kStackText;
        const std::wstring kStackTextAlt;
        const std::wstring kStackTextSuffix;
        // tag
        const std::wstring kTagField;
        const std::wstring kTagTextField;
        const std::wstring kTagTextAltField;
        const std::wstring kTagTextSuffixField;
        const std::wstring kTagGuidField;
        // space
        const std::wstring kSpaceField;
        const std::wstring kSpaceTextField;
        const std::wstring kSpaceTextAltField;
        const std::wstring kSpaceTextSuffixField;
        const std::wstring kSpaceGuidField;
        // resource
        const std::wstring kResourceMime;
        const std::wstring kResourceFileName;
        // 
        const std::wstring kCreated;
        const std::wstring kUpdated;
        // title
        const std::wstring KTitle;
        const std::wstring KTitleAlt;
        const std::wstring KTitleSuffix;
        const std::wstring KTitleRaw;
        //
        const std::wstring kSubjectDate;
        // author
        const std::wstring kAuthor;
        const std::wstring kAuthorText;
        // 
        const std::wstring kCreatorId;
        const std::wstring kLastEditorId;
        // attributes
        const std::wstring kSource;
        const std::wstring kSourceApplication;
        const std::wstring kSourceURL;
        const std::wstring kContentClass;
        const std::wstring kPlaceName;
        const std::wstring kApplicationData;
        // reminder
        const std::wstring kReminderOrder;
        const std::wstring kReminderTime;
        const std::wstring kReminderDoneTime;
        // 
        const std::wstring kContains;

        const std::wstring kExists;
    };

    std::string getFilterStringFromJson(const json &jQueryWithParams);
    std::string getQueryStringFromJson(const json &jQueryWithParams);
    SearchParams getSearchParamsFromJson(const json &jQueryWithParams);
    std::vector<std::string> getStoredFieldsFromJson(const json &jQueryWithParams);

    std::string getStringFromField(const Document &document, const TCHAR *fieldName);
    std::vector<std::string> getArrayOfStringFromField(const Document &document, const TCHAR *fieldName);

    json get_empty_search_result_group();

    double smarttiming2plain(long long updated);
}
#endif
