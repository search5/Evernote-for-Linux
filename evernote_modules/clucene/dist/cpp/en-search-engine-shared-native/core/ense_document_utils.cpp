#include <string>

#include "ense_document_utils.h"
#include "ense_utils.h"

namespace evernote {
namespace cosm {
namespace core {

namespace li = lucene::index;
namespace ld = lucene::document;

std::string get_string_from_js_field(const json& in, const std::string& field_name, json& err)
{
  if (!in.contains(field_name)) {
    err = util::encode_error("get_string_from_js_field", "no such field");
    return "";
  }

  if (!in[field_name].is_string()) {
    err = util::encode_error("get_string_from_js_field", "no such field");
    return "";
  }

  return in[field_name].get<std::string>();
}

std::wstring get_wstring_from_js_field(const json& in, const std::string& field_name, json& err)
{
  auto out = get_string_from_js_field(in, field_name, err);
  if (!out.empty()) {
    return util::toWstring(out);
  }
  
  return L"";
}

std::string get_string_from_js_field(const json& value)
{
  std::string field_value;

  if (value.is_boolean()) {
    field_value = std::to_string(value.get<bool>());

  } else if (value.is_number_integer()) {
    field_value = std::to_string(value.get<int64_t>());

  } else if (value.is_number_float()) {
    field_value = std::to_string(value.get<double>());

  } else if (value.is_string()) {
    field_value = value.get<std::string>();
  }

  return field_value;
}

std::vector<std::string> get_v_string_from_js_field(const json& value) {
  std::vector<std::string> field_values;

  if (value.is_boolean() || value.is_number_integer() || value.is_number_float() || value.is_string()) {
    field_values.emplace_back(get_string_from_js_field(value));
  } else if (value.is_array()) {
    for (const auto& element : value) {
      if (element.is_boolean() || element.is_number_integer() || element.is_number_float() || element.is_string()) {
        field_values.emplace_back(get_string_from_js_field(element));
      }
    }
  }

  return field_values;
}

std::wstring get_wstring_from_js_field(const json& value)
{
  std::wstring w_field_value;

  if (value.is_boolean()) {
    w_field_value = std::to_wstring(value.get<bool>());

  } else if (value.is_number_integer()) {
    w_field_value = std::to_wstring(value.get<int64_t>());

  } else if (value.is_number_float()) {
    w_field_value = std::to_wstring(value.get<double>());

  } else if (value.is_string()) {
    w_field_value = util::toWstring(value.get<std::string>());
  }

  return w_field_value;
}

std::vector<std::wstring> get_v_wstring_from_js_field(const json& value) {
  std::vector<std::wstring> w_field_values;

  if (value.is_boolean() || value.is_number_integer() || value.is_number_float() || value.is_string()) {
    w_field_values.emplace_back(get_wstring_from_js_field(value));
  } else if (value.is_array()) {
    for (const auto& element : value) {
      if (element.is_boolean() || element.is_number_integer() || element.is_number_float() || element.is_string()) {
        w_field_values.emplace_back(get_wstring_from_js_field(element));
      }
    }
  }

  return w_field_values;
}

util::cst_del_unique_ptr<li::Term> get_string_term_from_js_field(const json& in, const std::string& field_name, json& err)
{
  auto w_field_name = util::toWstring(field_name);
  auto w_field_value = get_wstring_from_js_field(in, field_name, err);

  if (!w_field_value.empty()) {
    auto id_term = util::cst_del_unique_ptr<li::Term>(new li::Term(w_field_name.c_str(), w_field_value.c_str()), [](li::Term* term) {
      _CLDECDELETE(term);
    });

    return id_term;
  }

  return nullptr;
}

std::unique_ptr<lucene::document::Document> create_document(const json& in, const std::unordered_map<std::string, int>& flags, json& err)
{
  auto document = std::make_unique<ld::Document>();

  for (auto& element : in.items()) {
    auto field_name = element.key();
    auto flags_iterator = flags.find(field_name);
    if (flags_iterator == flags.end()) {
      err = util::encode_error("create_document", "unknown field");
      return nullptr;
    }

    std::vector<std::wstring> w_field_values;
    if (field_name == "tag_utf8" || field_name == "notebook_utf8" || field_name == "stack_utf8" || field_name == "space_utf8") {
      auto field_values = get_v_string_from_js_field(element.value());
      for (const auto& field_value : field_values) {
        w_field_values.emplace_back(std::wstring(field_value.begin(), field_value.end()));
      }
    } else {
      w_field_values = get_v_wstring_from_js_field(element.value());
    }

    if (w_field_values.empty()) {
      continue;
    }

    auto w_field_name = util::toWstring(field_name);
    auto field_flags = flags_iterator->second;

    for (const auto& w_field_value : w_field_values) {
      auto field = _CLNEW ld::Field(w_field_name.c_str(), w_field_value.c_str(), field_flags);
      document->add(*field);
    }
  }

  return document;
}

std::string get_string_from_field(const lucene::document::Document& document, const TCHAR* field_name)
{
  // todo:: fix this
  std::wstring w_field_name(field_name);

  auto* field_value = document.get(field_name);
  if (field_value) {
    auto wide_value = std::wstring(field_value);
    // todo:: fix this
    if (w_field_name == L"tag_utf8" || w_field_name == L"notebook_utf8" || w_field_name == L"stack_utf8" || w_field_name == L"space_utf8") {
      return std::string(wide_value.begin(), wide_value.end());
    } else {
      return util::toUtf(wide_value);
    }
  }
  return "";
}

std::vector<std::string> get_array_of_strings_from_field(const lucene::document::Document& document, const TCHAR* field_name)
{
  std::vector<std::string> values;
  auto fields = document.getFields();

  for (ld::Document::FieldsType::const_iterator itr = fields->begin(); itr != fields->end(); ++itr ) {
    if (_tcscmp((*itr)->name(), field_name) == 0 && (*itr)->stringValue() != NULL) {
      auto wide_value = std::wstring((*itr)->stringValue());
      values.emplace_back(util::toUtf(wide_value));
    }
  }

  return values;
}

}
}
}