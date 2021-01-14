{
    "targets": [{
        "target_name": "clucene-binding",
        "include_dirs": [
            "src",
            "/usr/lib/x86_64-linux-gnu",
            "dist/cpp",
            "dist/cpp/node-bridge/workers",
            "dist/cpp/en-search-engine-shared-native/core",
            "dist/cpp/en-search-engine-shared-native/util",
            "dist/cpp/en-search-engine-shared-native/external",
            "../node-addon-api",
        ],
        "cflags!": ["-fno-exceptions", "-L/usr/lib/x86_64-linux-gnu/"],
        "cflags_cc!": ["-fno-exceptions", "-L/usr/lib/x86_64-linux-gnu/"],
        "sources": ["dist/cpp/node-bridge/clucene_bindings.cpp",
            "dist/cpp/node-bridge/workers/search_engine_indexation_worker.cpp",
            "dist/cpp/node-bridge/workers/search_engine_delete_worker.cpp",
            "dist/cpp/node-bridge/workers/search_engine_export_worker.cpp",
            "dist/cpp/node-bridge/workers/search_engine_import_worker.cpp",
            "dist/cpp/node-bridge/workers/search_engine_search_worker.cpp",
            "dist/cpp/node-bridge/workers/search_engine_recognition_worker.cpp",
            "dist/cpp/node-bridge/workers/search_engine_enml_parser_worker.cpp",
            "dist/cpp/en-search-engine-shared-native/core/search_engine_context.cpp",
            "dist/cpp/en-search-engine-shared-native/core/search_document_context.cpp",
            "dist/cpp/en-search-engine-shared-native/util/ense_utils.cpp",
            "dist/cpp/en-search-engine-shared-native/util/ense_reco_resource_parser.cpp",
            "dist/cpp/en-search-engine-shared-native/util/enml_parser.cpp",
            "dist/cpp/en-search-engine-shared-native/util/tinyxml2.cpp",
            "/home/jiho/.virtualenvs/evernote/lib/node_modules/node-gyp/src/win_delay_load_hook.cc"
        ],
        "link_settings": {
            "libraries": [
                "-lclucene-core",
                "-lclucene-shared",
                "-luv",
                "-lrt",
                "-lpthread",
                "-lnsl",
                "-ldl",
                "-lssl",
                "-lcrypto"
            ]
        }
    }]
}
