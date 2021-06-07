#pragma once

#include <functional>
#include <memory>
#include <vector>
#include <string>
#include <utility>

#include "json.hpp"
using json = nlohmann::json;

namespace util {
    template<typename T>
    using cst_del_unique_ptr = std::unique_ptr<T,std::function<void(T*)>>;

    void UtfFile2Wstring(const char * text, size_t size, std::wstring& strUni, std::vector<int> *pArUtfEndPos = 0);
	std::wstring toWstring(const std::string & sText);
    std::string toUtf(const std::wstring & sUni);
    std::string base64_encode(unsigned char const* bytes_to_encode, unsigned int in_len);
    std::string base64_decode(std::string const& encoded_string);
    std::string format_exception(const std::string& method, const std::string& exception_type, const std::string& reason);
    std::string hex_decode(const std::string& hex_buffer);
    std::pair<std::string, std::string> enml_to_plain_text(const std::string& enml);

    std::wstring join_strings(const std::vector<std::wstring>& input, const std::wstring& delimeter);

    float sigmoid(float input);
    float sigmoid_inverse(float sigmoid_input);

    json encode_error(const std::string& func_name, const std::string& reason);
    json encode_error(const std::string& cls_name, const std::string& func_name, const std::string& reason);

    int get_unicode_code_point(const std::string& utf8);

}