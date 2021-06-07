#include "ense_utils.h"
#include "ense_tokenization.h"

#include "search_document_context.h"

namespace en_search {

    SearchDocumentContext::SearchDocumentContext(): document_(std::make_unique<Document>()), kMaxTokenLengthForSuffixTokenization(3)
    {}

    void SearchDocumentContext::add_field(const std::string& utf8_key, const std::string& utf8_value, int32_t flags)
    {
        auto w_key = util::toWstring(utf8_key);
        auto w_value = util::toWstring(utf8_value);
        auto field = _CLNEW Field(w_key.c_str(), w_value.c_str(), flags);

        document_->add(*field);

        try {
            auto iter = alternative_fields_.find(w_key);
            if (iter != alternative_fields_.end()) {
                auto alternative_field_name = iter->second[0].name;
                this->add_alternative_field(alternative_field_name, w_value);

                auto suffix_field_name = iter->second[1].name;
                this->add_suffix_field(suffix_field_name, w_value);
            }
        } catch (CLuceneError& exception) {
            if (exception.number() == CL_ERR_OutOfMemory) {
                throw;
            }
        } catch (std::bad_alloc& exception) {
            throw;
        } catch (std::exception& exception) {
        }
        
    }

    void SearchDocumentContext::add_alternative_field(const std::wstring& w_key, const std::wstring& w_value)
    {
        if (w_value.empty()) {
            return;
        }

        auto tokens = evernote::cosm::util::token::alternative_tokenize(w_value, kMaxTokenLengthForSuffixTokenization);
        if (tokens.empty()) {
            return;
        }

        auto field_content = util::join_strings(tokens, L" ");
        auto field = _CLNEW Field(w_key.c_str(), field_content.c_str(), lucene::document::Field::Store::STORE_NO | lucene::document::Field::Index::INDEX_TOKENIZED);
        document_->add(*field);
    }

    void SearchDocumentContext::add_suffix_field(const std::wstring& w_key, const std::wstring& w_value)
    {
        if (w_value.empty()) {
            return;
        }

        auto lowercase_w_value = evernote::cosm::util::token::token_to_lowercase_token(w_value);
        auto tokens = evernote::cosm::util::token::suffix_tokenize(lowercase_w_value, kMaxTokenLengthForSuffixTokenization);
        for (const auto& token : tokens) {
            auto field = _CLNEW Field(w_key.c_str(), token.c_str(), lucene::document::Field::Store::STORE_NO | lucene::document::Field::Index::INDEX_UNTOKENIZED);
            document_->add(*field);
        }
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

    const std::unordered_map<std::wstring, std::vector<ENSearchAlternativeField>> SearchDocumentContext::alternative_fields_ = 
    {
        {L"notebook", {
            {L"notebookTextAlt", ENSearchAlternativeFieldType::ALTERNATIVE},
            {L"notebookTextSuffix", ENSearchAlternativeFieldType::SUFFIX}
        }},
        {L"stack", {
            {L"stackTextAlt", ENSearchAlternativeFieldType::ALTERNATIVE},
            {L"stackTextSuffix", ENSearchAlternativeFieldType::SUFFIX}
        }},
        {L"tag", {
            {L"tagTextAlt", ENSearchAlternativeFieldType::ALTERNATIVE},
            {L"tagTextSuffix", ENSearchAlternativeFieldType::SUFFIX}
        }},
        {L"space", {
            {L"spaceTextAlt", ENSearchAlternativeFieldType::ALTERNATIVE},
            {L"spaceTextSuffix", ENSearchAlternativeFieldType::SUFFIX}
        }},
        {L"title", {
            {L"titleAlt", ENSearchAlternativeFieldType::ALTERNATIVE},
            {L"titleSuffix", ENSearchAlternativeFieldType::SUFFIX}
        }}
    };

}