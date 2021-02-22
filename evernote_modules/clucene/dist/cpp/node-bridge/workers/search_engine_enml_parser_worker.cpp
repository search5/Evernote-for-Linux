#include "search_engine_enml_parser_worker.h"

#include "ense_utils.h"
#include "enml_parser.h"

namespace en_search 
{
    SearchEngineENMLParserWorker::SearchEngineENMLParserWorker(
        Napi::Function& callback, const std::string& enml):
        Napi::AsyncWorker(callback), enml_(enml), parsing_time_(0)
    {}

    void SearchEngineENMLParserWorker::Execute()
    {
        auto result = util::enml_to_plain_text(enml_);
        error_ = result.first;
        search_text_ = result.second;
    }

    void SearchEngineENMLParserWorker::OnOK()
    {
        auto env = Env();
        Napi::HandleScope scope(env);

        Callback().Call({
            error_.empty() ? env.Undefined() : Napi::String::New(env, error_), 
            Napi::String::New(env, search_text_)
        });
    }
}