#include "search_engine_import_worker.h"

#include "ense_utils.h"

namespace en_search 
{
    using namespace lucene::util;

    SearchEngineImportWorker::SearchEngineImportWorker(
        Napi::Function& callback, std::shared_ptr<evernote::cosm::core::ENScheduler> scheduler, const std::string& base64_buffer):
        Napi::AsyncWorker(callback), scheduler_(scheduler), base64_buffer_(base64_buffer)
    {}

    void SearchEngineImportWorker::Execute()
    {
        try {
            scheduler_->import_index(base64_buffer_);
        } catch(CLuceneError& exception) {
            if (exception.number() == CL_ERR_OutOfMemory) {
                throw;
            }
            error_ = util::format_exception("DumpRAMDirectoryAsync", "CLuceneError", std::to_string(exception.number()));
        } catch (std::bad_alloc& exception) {
            throw;
        } catch(std::exception& exception) {
            error_ = util::format_exception("DumpRAMDirectoryAsync", "std::exception", "masked exception");
        } catch(...) {
            error_ = util::format_exception("DumpRAMDirectoryAsync", "unknown exception", "unknown");
        }
    }

    void SearchEngineImportWorker::OnOK()
    {
        auto env = Env();
        Napi::HandleScope scope(env);

        Callback().Call({
            error_.empty() ? env.Undefined() : Napi::String::New(env, error_)
        });
    }

}