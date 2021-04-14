#ifndef _search_search_document_context_
#define _search_search_document_context_

#include <memory>
#include <unordered_map>
#include <unordered_set>
#include <string>
#include <vector>

#include "CLucene.h"

namespace en_search
{
    using namespace lucene::document;

    enum class ENSearchAlternativeFieldType
    {
        ALTERNATIVE,    // alternative field
        SUFFIX          // suffix field
    };

    struct ENSearchAlternativeField
    {
        std::wstring name;
        ENSearchAlternativeFieldType field_type;
    };

    class SearchDocumentContext
    {
    public:
        SearchDocumentContext();
    public:
        void add_field(const std::string& utf8_key, const std::string& utf8_value, int32_t flags);
        void add_alternative_field(const std::wstring& w_key, const std::wstring& w_value);
        void add_suffix_field(const std::wstring& w_key, const std::wstring& w_value);
        void clear();
        std::unique_ptr<Document> get_document();
    private:
        std::unique_ptr<Document> document_;
        const int kMaxTokenLengthForSuffixTokenization;

        const static std::unordered_map<std::wstring, std::vector<ENSearchAlternativeField>> alternative_fields_;

    };
}


#endif