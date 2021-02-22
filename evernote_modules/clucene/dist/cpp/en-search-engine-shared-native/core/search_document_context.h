#ifndef _search_search_document_context_
#define _search_search_document_context_

#include <memory>

#include "CLucene.h"

namespace en_search
{
    using namespace lucene::document;

    class SearchDocumentContext
    {
    public:
        SearchDocumentContext();
    public:
        void add_field(const std::string& utf8_key, const std::string& utf8_value, int32_t flags);
        void clear();
        std::unique_ptr<Document> get_document();
    private:
        std::unique_ptr<Document> document_;
    };
}


#endif