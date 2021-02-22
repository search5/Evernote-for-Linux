#include "search_engine_export_worker.h"

#include "ense_utils.h"

namespace en_search 
{
    using namespace lucene::util;

    SearchEngineExportWorker::SearchEngineExportWorker(
        Napi::Function& callback, std::shared_ptr<SearchEngineContext> search_engine_context):
        Napi::AsyncWorker(callback), search_engine_context_(search_engine_context), export_time_(0)
    {}

    void SearchEngineExportWorker::Execute()
    {
        try {
            auto start_time = Misc::currentTimeMillis();
            buffer_ = search_engine_context_->export_index();
            export_time_ = static_cast<uint32_t>(Misc::currentTimeMillis() - start_time);
        } catch(CLuceneError& exception) {
            if (exception.number() == CL_ERR_OutOfMemory) {
                throw;
            }
            error_ = util::format_exception("DumpRAMDirectoryAsync", "CLuceneError", std::to_string(exception.number()));
        } catch(std::bad_alloc& exception) {
            throw;
        } catch(std::exception& exception) {
            error_ = util::format_exception("DumpRAMDirectoryAsync", "std::exception", "masked exception");
        } catch(...) {
            error_ = util::format_exception("DumpRAMDirectoryAsync", "unknown exception", "unknown");
        }
    }

    void SearchEngineExportWorker::OnOK()
    {
        auto env = Env();
        Napi::HandleScope scope(env);

        Callback().Call({
            error_.empty() ? env.Undefined() : Napi::String::New(env, error_),
            Napi::Number::New(Env(), export_time_),
            Napi::Number::New(Env(), buffer_.size()),
            Napi::Buffer<char>::Copy(env, buffer_.c_str(), buffer_.size())
        });
    }

}