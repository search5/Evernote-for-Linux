#ifndef _search_search_engine_indexation_worker_
#define _search_search_engine_indexation_worker_

#include <iostream>
#include <thread>
#include <memory>

#include "napi.h"

#include "CLucene.h"

#include "Misc.h"
#include "repl_tchar.h"

#include "search_engine_context.h"
#include "search_document_context.h"

namespace en_search 
{
    class SearchEngineIndexationWorker : public Napi::AsyncWorker {
    public:
        SearchEngineIndexationWorker(
            Napi::Function& callback, 
            std::shared_ptr<SearchEngineContext> search_engine_context,
            const std::string& guid,
            std::unique_ptr<SearchDocumentContext> search_document_context);

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
        std::shared_ptr<SearchEngineContext> search_engine_context_;
        std::string guid_;
        std::unique_ptr<SearchDocumentContext> search_document_context_;

    private:
        std::string error_;
        int documents_indexed_;
        int32_t indexation_time_;
    };
}

#endif

