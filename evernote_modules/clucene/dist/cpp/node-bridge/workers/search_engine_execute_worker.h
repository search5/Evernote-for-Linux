#ifndef _search_search_engine_execute_worker_
#define _search_search_engine_execute_worker_

#include <thread>
#include <memory>
#include <string>

#include "napi.h"

#include "ense_scheduler.h"


namespace evernote {
namespace cosm {
namespace bridge {

  class SearchEngineExecutionWorker : public Napi::AsyncWorker {
    public:
      SearchEngineExecutionWorker(
        Napi::Function& callback,
        std::shared_ptr<evernote::cosm::core::ENScheduler> scheduler,
        const std::string& request);

      // Executed inside the worker-thread.
      // It is not safe to access JS engine data structure
      // here, so everything we need for input and output
      // should go on `this`.
      void Execute() override;
      // Executed when the async work is complete
      // this function will be run inside the main event loop
      // so it is safe to use JS engine data again
      void OnOK() override;

    private:
      std::shared_ptr<evernote::cosm::core::ENScheduler> scheduler_;
      std::string request_;
      std::string result_;
    };

}
}
}

#endif