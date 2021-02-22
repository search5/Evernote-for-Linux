#include "ense_utils.h"

#include "search_document_context.h"

namespace en_search {

    SearchDocumentContext::SearchDocumentContext(): document_(std::make_unique<Document>())
    {}

    void SearchDocumentContext::add_field(const std::string& utf8_key, const std::string& utf8_value, int32_t flags)
    {
        auto w_key = util::toWstring(utf8_key);
        auto w_value = util::toWstring(utf8_value);
        auto field = _CLNEW Field(w_key.c_str(), w_value.c_str(), flags);
        document_->add(*field);
    }

    void SearchDocumentContext::clear()
    {
        document_->clear();
    }

    std::unique_ptr<Document> SearchDocumentContext::get_document()
    {
        auto rv = std::move(document_);
        document_ = std::make_unique<Document>();
        return rv;
    }

}