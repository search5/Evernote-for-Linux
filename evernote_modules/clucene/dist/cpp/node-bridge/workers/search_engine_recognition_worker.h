#ifndef _search_search_engine_recognition_worker_
#define _search_search_engine_recognition_worker_

#include <iostream>
#include <thread>
#include <memory>
#include <string>

#include "napi.h"

namespace en_search 
{
    class SearchEngineRecognitionWorker : public Napi::AsyncWorker {
    public:
        SearchEngineRecognitionWorker(
            Napi::Function& callback, 
            const std::string& hex_buffer);

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
        std::string hex_buffer_;
        std::string recognition_plain_text_;

    private:
        std::string error_;
        int32_t parsing_time_;
    };
}

#endif