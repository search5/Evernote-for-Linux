#ifndef _search_search_engine_delete_worker_
#define _search_search_engine_delete_worker_

#include <iostream>
#include <thread>
#include <memory>

#include "napi.h"

#include "CLucene.h"

#include "Misc.h"
#include "repl_tchar.h"

#include "ense_scheduler.h"

namespace en_search 
{
    class SearchEngineDeleteWorker : public Napi::AsyncWorker {
    public:
        SearchEngineDeleteWorker(
            Napi::Function& callback, 
            std::shared_ptr<evernote::cosm::core::ENScheduler> scheduler,
            const std::string& guid);

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
        std::string guid_;
        
    private:
        std::string error_;
        int documents_deleted_;
        int32_t delete_time_;
    };
}

#endif

