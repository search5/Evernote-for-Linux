#include "search_engine_delete_worker.h"

#include "ense_utils.h"

namespace en_search 
{
    using namespace lucene::util;

    SearchEngineDeleteWorker::SearchEngineDeleteWorker(
        Napi::Function& callback, std::shared_ptr<evernote::cosm::core::ENScheduler> scheduler,
        const std::string& guid):
        Napi::AsyncWorker(callback), scheduler_(scheduler),
        guid_(guid), documents_deleted_(0), delete_time_(0)
    {}

    void SearchEngineDeleteWorker::Execute()
    {
        try {
            auto start_time = Misc::currentTimeMillis();
            // std::cerr << "guid: " << guid_ << std::endl;
            scheduler_->delete_document(guid_);
            delete_time_ = static_cast<uint32_t>(Misc::currentTimeMillis() - start_time);
            documents_deleted_ = 1;
        } catch(CLuceneError& exception) {
            if (exception.number() == CL_ERR_OutOfMemory) {
                throw;
            }
            error_ = util::format_exception("DeleteDocumentAsync", "CLuceneError", std::to_string(exception.number()));
        } catch (std::bad_alloc& exception) {
            throw;
        } catch(std::exception& exception) {
            error_ = util::format_exception("DeleteDocumentAsync", "std::exception", "masked exception");
        } catch(...) {
            error_ = util::format_exception("DeleteDocumentAsync", "unknown exception", "unknown");
        }
    }

    void SearchEngineDeleteWorker::OnOK()
    {
        auto env = Env();
        Napi::HandleScope scope(env);

        Callback().Call({
            error_.empty() ? env.Undefined() : Napi::String::New(env, error_), 
            Napi::Number::New(Env(), delete_time_),
            Napi::Number::New(Env(), documents_deleted_)
            });
    }

}