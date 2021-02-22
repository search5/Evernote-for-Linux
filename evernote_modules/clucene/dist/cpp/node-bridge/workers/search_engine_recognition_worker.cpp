#include "search_engine_recognition_worker.h"

#include "ense_utils.h"
#include "ense_reco_resource_parser.h"

namespace en_search 
{
    SearchEngineRecognitionWorker::SearchEngineRecognitionWorker(
        Napi::Function& callback, const std::string& hex_buffer):
        Napi::AsyncWorker(callback), hex_buffer_(hex_buffer), parsing_time_(0)
    {}

    void SearchEngineRecognitionWorker::Execute()
    {
        auto result = resource::get_recognition_text(hex_buffer_);
        error_ = result.first;
        recognition_plain_text_ = result.second;
    }

    void SearchEngineRecognitionWorker::OnOK()
    {
        auto env = Env();
        Napi::HandleScope scope(env);

        Callback().Call({
            error_.empty() ? env.Undefined() : Napi::String::New(env, error_), 
            Napi::String::New(env, recognition_plain_text_)
        });
    }
}