#ifndef _ense_document_utils_
#define _ense_document_utils_

#include <memory>
#include <vector>
#include <unordered_map>

#include "CLucene.h"
#include "Misc.h"
#include "repl_tchar.h"

#include "json.hpp"

#include "ense_utils.h"

using json = nlohmann::json;

namespace evernote {
namespace cosm {
namespace core {

std::string get_string_from_js_field(const json& in, const std::string& field_name, json& err);
std::wstring get_wstring_from_js_field(const json& in, const std::string& field_name, json& err);

std::string get_string_from_js_field(const json& in);
std::vector<std::string> get_v_string_from_js_field(const json& value);

// todo:: simplify this functions or remove them
std::wstring get_wstring_from_js_field(const json& in);
std::vector<std::wstring> get_v_wstring_from_js_field(const json& in);

util::cst_del_unique_ptr<lucene::index::Term> get_string_term_from_js_field(const json& in, const std::string& field_name, json& err);

std::unique_ptr<lucene::document::Document> create_document(const json& in, const std::unordered_map<std::string, int>& flags, json& err);
std::string get_string_from_field(const lucene::document::Document& document, const TCHAR* field_name);
std::vector<std::string> get_array_of_strings_from_field(const lucene::document::Document& document, const TCHAR* field_name);

}
}
}

#endif