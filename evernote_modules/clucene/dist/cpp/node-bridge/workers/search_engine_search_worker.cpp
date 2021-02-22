#include "search_engine_search_worker.h"

#include "ense_utils.h"

namespace en_search 
{
    using namespace lucene::util;

    SearchEngineSearchWorker::SearchEngineSearchWorker(
        Napi::Function& callback, std::shared_ptr<SearchEngineContext> search_engine_context,
        const std::string& queryWithParams):
        Napi::AsyncWorker(callback), search_engine_context_(search_engine_context),
        queryWithParams_(queryWithParams), search_time_(0)
    {}

    void SearchEngineSearchWorker::Execute()
    {
        auto start_time = Misc::currentTimeMillis();
        auto result = search_engine_context_->search(queryWithParams_);
        error_ = result.first;
        search_results_ = result.second;
        search_time_ = static_cast<uint32_t>(Misc::currentTimeMillis() - start_time);
    }

    void SearchEngineSearchWorker::OnOK()
    {
        auto env = Env();
        Napi::HandleScope scope(env);

        Callback().Call({
            error_.empty() ? env.Undefined() : Napi::String::New(env, error_), 
            Napi::String::New(env, search_results_),
            Napi::Number::New(Env(), search_time_)
        });
    }

}