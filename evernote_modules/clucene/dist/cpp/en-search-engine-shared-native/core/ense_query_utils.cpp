#include "ense_query_utils.h"


namespace evernote {
namespace cosm {
namespace core {

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
        searchParams.from = ((jQueryWithParams.contains("from") && jQueryWithParams["from"].is_number_unsigned())) ? 
            jQueryWithParams["from"].get<size_t>() : 0;
        searchParams.size = ((jQueryWithParams.contains("size") && jQueryWithParams["size"].is_number_unsigned())) ? 
            jQueryWithParams["size"].get<size_t>() : 128;
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

}
}
}