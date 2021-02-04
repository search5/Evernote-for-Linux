#include <Cocoa/Cocoa.h>
#include <string>
#include <node.h>
using namespace std;
using v8::Array;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

Local<Array> get_file_names(Isolate *isolate);