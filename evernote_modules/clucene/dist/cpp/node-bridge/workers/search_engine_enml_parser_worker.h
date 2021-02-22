#ifndef _search_search_engine_enml_parser_worker_
#define _search_search_engine_enml_parser_worker_

#include <thread>
#include <memory>
#include <string>

#include "napi.h"

namespace en_search 
{
    class SearchEngineENMLParserWorker : public Napi::AsyncWorker {
    public:
        SearchEngineENMLParserWorker(
            Napi::Function& callback, 
            const std::string& enml);

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
        std::string enml_;
        std::string search_text_;

    private:
        std::string error_;
        int32_t parsing_time_;
    };
}

#endif