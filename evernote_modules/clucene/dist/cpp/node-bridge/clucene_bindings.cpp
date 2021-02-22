#include "napi.h"

#include "CLucene.h"
#include "Misc.h"
#include "search_engine_context.h"
#include "search_document_context.h"
#include "ense_reco_resource_parser.h"
#include "enml_parser.h"

#include "search_engine_indexation_worker.h"
#include "search_engine_delete_worker.h"
#include "search_engine_search_worker.h"
#include "search_engine_export_worker.h"
#include "search_engine_import_worker.h"
#include "search_engine_recognition_worker.h"
#include "search_engine_enml_parser_worker.h"


using namespace lucene::util;

/*
 * JS API. Wrappred LuceneDocument object. 
 * 
 * Link to the ObjectWrap API:
 * https://github.com/nodejs/node-addon-api/blob/master/doc/object_wrap.md
 * 
*/
class LuceneDocument : public Napi::ObjectWrap<LuceneDocument> {
public:
    /*
     * JS API. Synchronous. Adds field to existing lucene document with flags.
     * 
     * @param String* key 
     * @param String* value
     * @param Integer flags
     */
    Napi::Value AddField(const Napi::CallbackInfo& info) {

        auto env = info.Env();

        //mandatory arguments check
        if (info.Length() <= 2 || !info[0].IsString() || !info[1].IsString() || !info[2].IsNumber()) {
            //todo(vglazkov) change this in order to always simply return errors
            Napi::TypeError::New(env, "LuceneDocument: AddField: Wrong arguments").ThrowAsJavaScriptException();
        }

        //utf-8 std::string-s
        //https://github.com/nodejs/node-addon-api/blob/master/doc/string.md#operator-stdstring
        std::string key = info[0].As<Napi::String>();
        std::string value = info[1].As<Napi::String>();
        
        auto flags = info[2].As<Napi::Number>().Int32Value();

        auto rv_obj = Napi::Object::New(env);
        rv_obj.Set(Napi::String::New(env, "error"), env.Undefined());

        try {

            document_context_->add_field(key, value, flags);

        } catch (CLuceneError& exception) {
            if (exception.number() == CL_ERR_OutOfMemory) {
                throw;
            }
            rv_obj.Set(Napi::String::New(env, "error"), util::format_exception("AddField", "CLuceneError", std::to_string(exception.number())));
        } catch (std::bad_alloc& exception) {
            throw;
        } catch (std::exception& exception) {
            rv_obj.Set(Napi::String::New(env, "error"), util::format_exception("AddField", "std::exception", "masked exception"));
        } catch(...) {
            rv_obj.Set(Napi::String::New(env, "error"), util::format_exception("AddField", "unknown exception", "unknown"));
        }

        return rv_obj;
    }

    /*
     * JS API. Synchronous. Removes all keys, values from internal lucene document.
     */
    Napi::Value Clear(const Napi::CallbackInfo& info) {
        auto env = info.Env();

        auto rv_obj = Napi::Object::New(env);
        rv_obj.Set(Napi::String::New(env, "error"), env.Undefined());

        try {

            document_context_->clear();

        } catch (CLuceneError& exception) {
            if (exception.number() == CL_ERR_OutOfMemory) {
                throw;
            }
            rv_obj.Set(Napi::String::New(env, "error"), util::format_exception("Clear", "CLuceneError", std::to_string(exception.number())));
        } catch (std::bad_alloc& exception) {
            throw;
        } catch (std::exception& exception) {
            rv_obj.Set(Napi::String::New(env, "error"), util::format_exception("Clear", "std::exception", "masked exception"));
        } catch(...) {
            rv_obj.Set(Napi::String::New(env, "error"), util::format_exception("Clear", "unknown exception", "unknown"));
        }

        return rv_obj;
    }
public:
    std::unique_ptr<en_search::SearchDocumentContext> get_document() {
        auto rv = std::move(document_context_);
        document_context_ = std::make_unique<en_search::SearchDocumentContext>();
        return rv;
    }
private:
    std::unique_ptr<en_search::SearchDocumentContext> document_context_;

//node-addon-api boilerplate
public:
    /*
     * 
     */
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        Napi::HandleScope scope(env);

        // This method is used to hook the accessor and method callbacks
        // https://github.com/nodejs/node-addon-api/blob/master/doc/object_wrap.md#defineclass
        Napi::Function func = DefineClass(env, LuceneDocument::get_class_name().c_str(), 
        {
            InstanceMethod("addField", &LuceneDocument::AddField),
            InstanceMethod("clear", &LuceneDocument::Clear)
        });

        // Create a peristent reference to the class constructor. This will allow
        // a function called on a class prototype and a function
        // called on instance of a class to be distinguished from each other.
        constructor = Napi::Persistent(func);
        // Call the SuppressDestruct() method on the static data prevent the calling
        // to this destructor to reset the reference when the environment is no longer
        // available.
        constructor.SuppressDestruct();
        exports.Set(LuceneDocument::get_class_name().c_str(), func);
        return exports;
    }

    // static void New(const Nan::FunctionCallbackInfo<v8::Value>& info) {
    //     // useful samples:
    //     // https://github.com/nodejs/node-addon-examples/blob/master/6_object_wrap/nan/myobject.cc
    //     if (info.IsConstructCall()) {
    //         // Invoked as constructor: `new MyObject(...)`
    //         LuceneDocument* newDoc = new LuceneDocument();
    //         newDoc->Wrap(info.This());
    //         info.GetReturnValue().Set(info.This());
    //     } else {
    //         // Invoked as plain function `MyObject(...)`, turn into construct call.
    //         v8::Local<v8::Function> cons = Nan::New(constructor());
    //         info.GetReturnValue().Set(Nan::NewInstance(cons).ToLocalChecked());
    //     }
    // }

public:
    LuceneDocument(const Napi::CallbackInfo& info) : Napi::ObjectWrap<LuceneDocument>(info) {
        document_context_ = std::make_unique<en_search::SearchDocumentContext>();
    }

    ~LuceneDocument() {
    }
private:
    static std::string get_class_name() {
        static const std::string kClassName = "LuceneDocument";
        return kClassName;
    }
private:
    static Napi::FunctionReference constructor;
};

Napi::FunctionReference LuceneDocument::constructor;


/*
 *
 * https://github.com/nodejs/node-addon-api/blob/master/doc/object_wrap.md
 */
class Lucene : public Napi::ObjectWrap<Lucene> {    
public:
    /**
     * JS API. Synchronous. Creates RAM buffer with specified size.
     * 
     * @param Buffer* buffer 
     * @param Int* bufferSize
     * @param Function* callback
     * @return String* error
    */  
    void LoadRAMDirectory (const Napi::CallbackInfo& info) {

        auto env = info.Env();
        // due to the reason we create Napi::Values in our function and want to be sure that they will not be collected by GC
        // https://github.com/nodejs/node-addon-api/blob/master/doc/object_lifetime_management.md#object-lifetime-management
        Napi::HandleScope scope(env);

        //mandatory argument check
        if (info.Length() <= 2 || !info[0].IsBuffer() || !info[1].IsNumber() || !info[2].IsObject()) {
            // todo(vglazkov) - this should be consistent with return errors
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }

        auto cb = info[2].As<Napi::Function>();

        Napi::Value rv = env.Undefined();

        try {
            auto size = info[1].As<Napi::Number>().Uint32Value();

            std::string base64_buffer(info[0].As<Napi::Buffer<char> >().Data(), size);
            search_engine_context_->import_index(base64_buffer);

        } catch (CLuceneError& exception) {
            if (exception.number() == CL_ERR_OutOfMemory) {
                throw;
            }
            rv = Napi::String::New(env, util::format_exception("LoadRAMDirectory", "CLuceneError", std::to_string(exception.number())));
        } catch (std::bad_alloc& exception) {
            throw;
        } catch (std::exception& exception) {
            rv =  Napi::String::New(env, util::format_exception("LoadRAMDirectory", "std::exception", "masked exception"));
        } catch(...) {
            rv = Napi::String::New(env, util::format_exception("LoadRAMDirectory", "unknown exception", "unknown"));
        }

        cb.Call(env.Global(), { rv });
    }

    /**
     * JS API. Asynchronous. Creates RAM buffer in the background thread.
     * 
     * @param Buffer* buffer 
     * @param Int* bufferSize
     * @param Function* callback
     * @return String* error
    */  
    Napi::Value LoadRAMDirectoryAsync (const Napi::CallbackInfo& info) {

        auto env = info.Env();
        // due to the reason we create Napi::Values in our function and want to be sure that they will not be collected by GC
        // https://github.com/nodejs/node-addon-api/blob/master/doc/object_lifetime_management.md#object-lifetime-management
        Napi::HandleScope scope(env);

        //mandatory argument check
        if (info.Length() <= 2 || !info[0].IsBuffer() || !info[1].IsNumber() || !info[2].IsObject()) {
            // todo(vglazkov) - this should be consistent with return errors
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }

        auto size = info[1].As<Napi::Number>().Uint32Value();
        auto callback = info[2].As<Napi::Function>();

        std::string base64_buffer(info[0].As<Napi::Buffer<char> >().Data(), size);
        auto search_engine_import_worker = new en_search::SearchEngineImportWorker(callback, search_engine_context_, base64_buffer);
        search_engine_import_worker->Queue();

        return info.Env().Undefined();
    }


    /**
     * JS API. Synchronous. Dumps RAM buffer. Returns corresponding js buffer object and size.
     * 
     * @return String* error
     * @return Int* dumpTime elapsed time in ms
     * @return Int* size output buffer size
     * @return Buffer* buffer
    */
    void DumpRAMDirectory (const Napi::CallbackInfo& info) {

        auto env = info.Env();
        Napi::HandleScope scope(info.Env());

        //mandatory argument check
        if (!info[0].IsObject()) {
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }

        auto cb = info[0].As<Napi::Function>();
        std::vector<napi_value> rv(4, env.Undefined());
 
        try {

            auto start = Misc::currentTimeMillis();

            std::string buffer = search_engine_context_->export_index();

            auto elapsedMs = (Misc::currentTimeMillis() - start);

            rv[1] = Napi::Number::New(env, (uint32_t)elapsedMs);
            rv[2] = Napi::Number::New(env, (uint32_t)buffer.size());
            rv[3] = Napi::Buffer<char>::Copy(env, buffer.c_str(), buffer.size());

        } catch (CLuceneError& exception) {
            if (exception.number() == CL_ERR_OutOfMemory) {
                throw;
            }
            rv[0] = Napi::String::New(env, util::format_exception("DumpRAMDirectory", "CLuceneError", std::to_string(exception.number())));
        } catch (std::bad_alloc& exception) {
            throw;
        } catch (std::exception& exception) {
            rv[0] = Napi::String::New(env, util::format_exception("DumpRAMDirectory", "std::exception", "masked exception"));
        } catch(...) {
            rv[0] = Napi::String::New(env, util::format_exception("DumpRAMDirectory", "unknown exception", "unknown"));
        }

        cb.Call(env.Global(), rv);
    }

    /**
     * JS API. Asynchronous. Dumps RAM buffer in the background thread.
     * 
     * @return String* error
     * @return Int* dumpTime elapsed time in ms
     * @return Int* size output buffer size
     * @return Buffer* buffer
    */
    Napi::Value DumpRAMDirectoryAsync (const Napi::CallbackInfo& info) {

        auto env = info.Env();
        Napi::HandleScope scope(info.Env());

        //mandatory argument check
        if (!info[0].IsFunction()) {
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }

        auto callback = info[0].As<Napi::Function>();
        
        auto search_engine_export_worker = new en_search::SearchEngineExportWorker(callback, search_engine_context_);
        search_engine_export_worker->Queue();
        return info.Env().Undefined();
    }


    /*
     * JS API. Synchronous. Indexes input document.
     * 
     * @param String* document id
     * @param Document* lucene document
     * @param String* index path inside lucene ram dir
    */     
    Napi::Value AddDocument(const Napi::CallbackInfo& info) {

        auto env = info.Env();

        //mandatory argument check
        if (!info[0].IsString() || !info[1].IsObject() || !info[2].IsString()) {
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }
        
        std::string guid = info[0].As<Napi::String>();
        //useful Unwrap example
        //https://medium.com/@atulanand94/beginners-guide-to-writing-nodejs-addons-using-c-and-n-api-node-addon-api-9b3b718a9a7f
        auto document = Napi::ObjectWrap<LuceneDocument>::Unwrap(info[1].As<Napi::Object>());

        auto rv_obj = Napi::Object::New(env);
        rv_obj.Set(Napi::String::New(env, "error"), env.Undefined());
        rv_obj.Set(Napi::String::New(env, "indexTime"), (uint32_t)0);
        rv_obj.Set(Napi::String::New(env, "docsReplaced"), (uint32_t)0);
        
        try {
    
            auto start_index_time = Misc::currentTimeMillis();
            search_engine_context_->add_document(guid, document->get_document());
            auto index_time = Misc::currentTimeMillis() - start_index_time;

            rv_obj.Set(Napi::String::New(env, "indexTime"), (uint32_t)index_time);
            rv_obj.Set(Napi::String::New(env, "docsReplaced"), (uint32_t)1);

        } catch(CLuceneError& exception) {
            if (exception.number() == CL_ERR_OutOfMemory) {
                throw;
            }
            rv_obj.Set(Napi::String::New(env, "error"), util::format_exception("AddDocument", "CLuceneError", std::to_string(exception.number())));
        } catch (std::bad_alloc& exception) {
            throw;
        } catch(std::exception& exception) {
            rv_obj.Set(Napi::String::New(env, "error"), util::format_exception("AddDocument", "std::exception", "masked exception"));
        } catch(...) {
            rv_obj.Set(Napi::String::New(env, "error"), util::format_exception("AddDocument", "unknown exception", "unknown"));
        }

        return rv_obj;
    }

    /**
     * JS API. Asynchronous. Indexes input document in the background thread.
     * 
     * @param String* document id
     * @param Document* lucene document
     * @param String* index path inside lucene ram dir
     * 
    */ 
    Napi::Value AddDocumentAsync(const Napi::CallbackInfo& info) {

        auto env = info.Env();

        if (!info[0].IsString() || !info[1].IsObject() || !info[2].IsString() || !info[3].IsFunction()) {
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }

        std::string guid = info[0].As<Napi::String>();

        //useful Unwrap example
        //https://medium.com/@atulanand94/beginners-guide-to-writing-nodejs-addons-using-c-and-n-api-node-addon-api-9b3b718a9a7f
        auto document = Napi::ObjectWrap<LuceneDocument>::Unwrap(info[1].As<Napi::Object>());

        //mandatory argument check
        // if (!info[0].IsFunction()) {
        //     Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        // }
        auto callback = info[3].As<Napi::Function>();

        auto search_engine_indexation_worker = new en_search::SearchEngineIndexationWorker(callback, search_engine_context_, guid, document->get_document());
        search_engine_indexation_worker->Queue();
        return info.Env().Undefined();
    }

    /**
     * JS API. Synchronous. Deletes document. Internally calls search_engine_context_.delete_document(guid) function, which does actual work.
     * 
     * @param String* docID - document id
     * @param String* indexPath - index path
    */  
    Napi::Value DeleteDocument(const Napi::CallbackInfo& info) {

        auto env = info.Env();

        //mandatory argument check
        if (!info[0].IsString() || !info[1].IsString()) {
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }

        std::string guid = info[0].As<Napi::String>();

        auto rv_obj = Napi::Object::New(env);
        rv_obj.Set(Napi::String::New(env, "error"), env.Undefined());
        rv_obj.Set(Napi::String::New(env, "deleteTime"), (uint32_t)0);
        rv_obj.Set(Napi::String::New(env, "docsDeleted"), (uint32_t)0);

        try {

            auto start_delete_time = Misc::currentTimeMillis();
            search_engine_context_->delete_document(guid);
            auto delete_time = Misc::currentTimeMillis() - start_delete_time;
            
            rv_obj.Set(Napi::String::New(env, "deleteTime"), (uint32_t)delete_time);
            rv_obj.Set(Napi::String::New(env, "docsDeleted"), (uint32_t)1);

        } catch(CLuceneError& exception) {
            if (exception.number() == CL_ERR_OutOfMemory) {
                throw;
            }
            rv_obj.Set(Napi::String::New(env, "error"), util::format_exception("DeleteDocument", "CLuceneError", std::to_string(exception.number())));
        } catch (std::bad_alloc& exception) {
            throw;
        } catch(std::exception& exception) {
            rv_obj.Set(Napi::String::New(env, "error"), util::format_exception("DeleteDocument", "std::exception", "masked exception"));
        } catch(...) {
            rv_obj.Set(Napi::String::New(env, "error"), util::format_exception("DeleteDocument", "unknown exception", "unknown"));
        }

        return rv_obj;
    }

    /**
     * JS API. Asynchronous. Deletes document in the background thread.
     * 
     * @param String* docID - document id
     * @param String* indexPath - index path
    */  
    Napi::Value DeleteDocumentAsync(const Napi::CallbackInfo& info) {

        auto env = info.Env();

        //mandatory argument check
        if (!info[0].IsString() || !info[1].IsString() || !info[2].IsFunction()) {
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }

        std::string guid = info[0].As<Napi::String>();
        auto callback = info[2].As<Napi::Function>();

        auto search_engine_delete_worker = new en_search::SearchEngineDeleteWorker(callback, search_engine_context_, guid);
        search_engine_delete_worker->Queue();
        return info.Env().Undefined();
    }

    Napi::Value ParseRecognitionData(const Napi::CallbackInfo& info) {
        auto env = info.Env();

        //mandatory argument check
        if (!info[0].IsString()) {
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }

        std::string hex_buffer = info[0].As<Napi::String>();
        auto rv_obj = Napi::Object::New(env);
        rv_obj.Set(Napi::String::New(env, "error"), env.Undefined());

        std::string error;
        auto result = resource::get_recognition_text(hex_buffer);
        error = result.first;
        auto recognition_text = result.second;
        
        rv_obj.Set(Napi::String::New(env, "recognitionText"), recognition_text);
        if (!error.empty()) {
            rv_obj.Set(Napi::String::New(env, "error"), error);
        }
        
        return rv_obj;
    }

    Napi::Value ParseRecognitionDataAsync(const Napi::CallbackInfo& info) {
        auto env = info.Env();

        //mandatory argument check
        if (!info[0].IsString() || !info[1].IsFunction()) {
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }

        std::string hex_buffer = info[0].As<Napi::String>();
        auto callback = info[1].As<Napi::Function>();

        auto search_engine_recognition_worker = new en_search::SearchEngineRecognitionWorker(callback, hex_buffer);
        search_engine_recognition_worker->Queue();
        return info.Env().Undefined();
    }

    Napi::Value ParseENML(const Napi::CallbackInfo& info) {
        auto env = info.Env();

        //mandatory argument check
        if (!info[0].IsString()) {
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }

        std::string enml = info[0].As<Napi::String>();
        auto rv_obj = Napi::Object::New(env);
        rv_obj.Set(Napi::String::New(env, "error"), env.Undefined());

        std::string error;
        auto result = util::enml_to_plain_text(enml);
        error = result.first;
        auto search_text = result.second;

        rv_obj.Set(Napi::String::New(env, "searchText"), search_text);
        if (!error.empty()) {
            rv_obj.Set(Napi::String::New(env, "error"), error);
        }
        
        return rv_obj;
    }

    Napi::Value ParseENMLAsync(const Napi::CallbackInfo& info) {
        auto env = info.Env();

        //mandatory argument check
        if (!info[0].IsString() || !info[1].IsFunction()) {
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }

        std::string enml = info[0].As<Napi::String>();
        auto callback = info[1].As<Napi::Function>();

        auto search_engine_enml_parser_worker = new en_search::SearchEngineENMLParserWorker(callback, enml);
        search_engine_enml_parser_worker->Queue();
        return info.Env().Undefined();
    }

    /**
     * JS API. Synchronous. Searches in specified index with specified query. Internally calls EIO_Search function, which does actual work.
     * 
     * @param String* indexPath - index path
     * @param String* query - input lucene query
     * 
     */  
    Napi::Value Search(const Napi::CallbackInfo& info) {

        auto env = info.Env();

        //mandatory argument check
        if (!info[0].IsString() || !info[1].IsString()) {
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }

        std::string queryWithParams = info[1].As<Napi::String>();
        auto rv_obj = Napi::Object::New(env);
        rv_obj.Set(Napi::String::New(env, "error"), env.Undefined());
        rv_obj.Set(Napi::String::New(env, "searchTime"), (uint32_t)0);

        auto start_search_time = Misc::currentTimeMillis();
        auto result = search_engine_context_->search(queryWithParams);
        auto error = result.first;
        auto search_results = result.second;
        auto search_time = Misc::currentTimeMillis() - start_search_time;

        if (!error.empty()) {
            rv_obj.Set(Napi::String::New(env, "error"), error);
        }
        rv_obj.Set(Napi::String::New(env, "result"), Napi::String::New(env, search_results));

        return rv_obj;
    }

    /**
     * JS API. Asynchronous. Searches in specified index with specified query in the background thread.
     * 
     * @param String* indexPath - index path
     * @param String* query - input lucene query
     * 
     */  
    Napi::Value SearchAsync(const Napi::CallbackInfo& info) {

        auto env = info.Env();

        //mandatory argument check
        if (!info[0].IsString() || !info[1].IsString() || !info[2].IsFunction()) {
            Napi::TypeError::New(env, "Wrong arguments").ThrowAsJavaScriptException();
        }

        std::string queryWithParams = info[1].As<Napi::String>();
        auto callback = info[2].As<Napi::Function>();
        auto search_engine_search_worker = new en_search::SearchEngineSearchWorker(callback, search_engine_context_, queryWithParams);
        search_engine_search_worker->Queue();
        return info.Env().Undefined();
    }

private:
    std::shared_ptr<en_search::SearchEngineContext> search_engine_context_;

//node-addon-api boilerplate
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports) {
        
        Napi::HandleScope scope(env);
        // This method is used to hook the accessor and method callbacks
        Napi::Function func = DefineClass(env, Lucene::get_class_name().c_str(), 
        {
            InstanceMethod("loadRAMDirectory", &Lucene::LoadRAMDirectory),
            InstanceMethod("loadRAMDirectoryAsync", &Lucene::LoadRAMDirectoryAsync),
            InstanceMethod("dumpRAMDirectory", &Lucene::DumpRAMDirectory),
            InstanceMethod("dumpRAMDirectoryAsync", &Lucene::DumpRAMDirectoryAsync),
            InstanceMethod("addDocument", &Lucene::AddDocument),
            InstanceMethod("addDocumentAsync", &Lucene::AddDocumentAsync),
            InstanceMethod("deleteDocument", &Lucene::DeleteDocument),
            InstanceMethod("deleteDocumentAsync", &Lucene::DeleteDocumentAsync),
            InstanceMethod("parseRecognitionData", &Lucene::ParseRecognitionData),
            InstanceMethod("parseRecognitionDataAsync", &Lucene::ParseRecognitionDataAsync),
            InstanceMethod("parseENML", &Lucene::ParseENML),
            InstanceMethod("parseENMLAsync", &Lucene::ParseENMLAsync),
            InstanceMethod("search", &Lucene::Search),
            InstanceMethod("searchAsync", &Lucene::SearchAsync)
        });
        // Create a peristent reference to the class constructor. This will allow
        // a function called on a class prototype and a function
        // called on instance of a class to be distinguished from each other.
        constructor = Napi::Persistent(func);
        // Call the SuppressDestruct() method on the static data prevent the calling
        // to this destructor to reset the reference when the environment is no longer
        // available.
        constructor.SuppressDestruct();
        exports.Set(Lucene::get_class_name().c_str(), func);
        return exports;
    }

    Lucene(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Lucene>(info) {
        search_engine_context_ = std::make_shared<en_search::SearchEngineContext>();
    }

    ~Lucene() {
    }

    // static void New(const Nan::FunctionCallbackInfo<v8::Value>& info) {
    //     if (info.IsConstructCall()) {
    //         // Invoked as constructor: `new MyObject(...)`
    //         Lucene* lucene = new Lucene();
    //         lucene->writer_ = 0;
    //         lucene->Wrap(info.This());
    //         info.GetReturnValue().Set(info.This());
    //     } else {
    //         // Invoked as plain function `MyObject(...)`, turn into construct call.
    //         v8::Local<v8::Function> cons = Nan::New(constructor());
    //         info.GetReturnValue().Set(Nan::NewInstance(cons).ToLocalChecked());
    //     }
    // }
private:
    static std::string get_class_name() {
        static const std::string kClassName = "Lucene";
        return kClassName;
    }
private:
    static Napi::FunctionReference constructor;

};

Napi::FunctionReference Lucene::constructor;

/*
 * Initialize native add-on. C++ constructs that are exposed to javascript are exported here. Here's userful sample:
 * https://github.com/fcanas/node-native-boilerplate/blob/master/NativeExtension.cc
 * Useful resources (both NAN and NAPI):
 * https://github.com/nodejs/node-addon-examples
 * https://nodejs.org/en/docs/guides/abi-stability/
 * https://stackoverflow.com/questions/54740947/node-js-addons-nan-vs-n-api
 */
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    LuceneDocument::Init(env, exports);
    Lucene::Init(env, exports);
    return exports;
}
// Register and initialize native add-on
NODE_API_MODULE(clucene_bindings, Init)

