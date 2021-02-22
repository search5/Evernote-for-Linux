#include "search_engine_indexation_worker.h"

#include "ense_utils.h"

namespace en_search 
{
    using namespace lucene::util;

    SearchEngineIndexationWorker::SearchEngineIndexationWorker(
        Napi::Function& callback, std::shared_ptr<SearchEngineContext> search_engine_context,
        const std::string& guid, std::unique_ptr<SearchDocumentContext> search_document_context):
        Napi::AsyncWorker(callback), search_engine_context_(search_engine_context),
        guid_(guid), search_document_context_(std::move(search_document_context)), 
        documents_indexed_(0), indexation_time_(0)
    {}

    void SearchEngineIndexationWorker::Execute()
    {
        try {
            auto start_time = Misc::currentTimeMillis();
            // std::cerr << "guid: " << guid_ << std::endl;
            search_engine_context_->add_document(guid_, std::move(search_document_context_));
            indexation_time_ = static_cast<uint32_t>(Misc::currentTimeMillis() - start_time);
            documents_indexed_ = 1;
        } catch(CLuceneError& exception) {
            if (exception.number() == CL_ERR_OutOfMemory) {
                throw;
            }
            error_ = util::format_exception("AddDocumentAsync", "CLuceneError", std::to_string(exception.number()));
        } catch (std::bad_alloc& exception) {
            throw;
        } catch(std::exception& exception) {
            error_ = util::format_exception("AddDocumentAsync", "std::exception", "masked exception");
        } catch(...) {
            error_ = util::format_exception("AddDocumentAsync", "unknown exception", "unknown");
        }
    }

    void SearchEngineIndexationWorker::OnOK()
    {
        auto env = Env();
        Napi::HandleScope scope(env);

        Callback().Call({
            error_.empty() ? env.Undefined() : Napi::String::New(env, error_), 
            Napi::Number::New(Env(), indexation_time_),
            Napi::Number::New(Env(), documents_indexed_)
            });
    }

}