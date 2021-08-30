#ifndef _ense_query_utils_
#define _ense_query_utils_

#include <string>
#include <vector>
#include <list>

#include "json.hpp"

using json = nlohmann::json;

namespace evernote {
namespace cosm {
namespace core {

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
    size_t from;
    size_t size;
  };

  std::string getFilterStringFromJson(const json &jQueryWithParams);
  std::string getQueryStringFromJson(const json &jQueryWithParams);
  SearchParams getSearchParamsFromJson(const json &jQueryWithParams);
  std::vector<std::string> getStoredFieldsFromJson(const json &jQueryWithParams);

}
}
}

#endif