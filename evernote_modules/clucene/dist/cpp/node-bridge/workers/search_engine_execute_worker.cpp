#include "search_engine_execute_worker.h"

namespace evernote {
namespace cosm {
namespace bridge {

  SearchEngineExecutionWorker::SearchEngineExecutionWorker(
    Napi::Function& callback, std::shared_ptr<evernote::cosm::core::ENScheduler> scheduler,
    const std::string& request):
    Napi::AsyncWorker(callback), scheduler_(scheduler),
    request_(request)
  {}

  void SearchEngineExecutionWorker::Execute()
  {
    result_ = scheduler_->execute_str(request_);
  }

  void SearchEngineExecutionWorker::OnOK()
  {
    auto env = Env();
    Napi::HandleScope scope(env);

    // auto rv_obj = Napi::Object::New(env);
    // rv_obj.Set(Napi::String::New(env, "result"), result);
    // todo:: fix consistency
    Callback().Call({
      Napi::String::New(env, result_)
    });
  }

}
}
}

namespace en_search 
{
    using namespace lucene::util;



}