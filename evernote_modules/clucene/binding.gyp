{
    "targets": [{
        "target_name": "clucene-binding",
        "include_dirs": [
            "/usr/lib/x86_64-linux-gnu",
            "/usr/include/c++/8",
            "dist/cpp",
            "dist/cpp/node-bridge/workers",
            "dist/cpp/en-search-engine-shared-native/core",
            "dist/cpp/en-search-engine-shared-native/util",
            "dist/cpp/en-search-engine-shared-native/external",
            "dist/cpp/lib/clucene/src/core",
            "dist/cpp/lib/clucene/src/shared",
            "dist/cpp/lib/clucene/src/ext",
            "dist/cpp/lib/clucene/src/ext/zlib",
            "dist/lib/clucene/config/linux",
            "/home/jiho/Evernote-for-Linux/venv/lib/node_modules/node-addon-api"
        ],
        "cflags!": ["-fno-exceptions", "-L/usr/lib/x86_64-linux-gnu/", "-I/usr/include/c++/8"],
        "cflags_cc!": ["-fno-exceptions", "-L/usr/lib/x86_64-linux-gnu/", "-I/usr/include/c++/8"],
        "sources": ["dist/cpp/node-bridge/clucene_bindings.cpp",
                            "dist/cpp/node-bridge/workers/search_engine_indexation_worker.cpp",
                            "dist/cpp/node-bridge/workers/search_engine_delete_worker.cpp",
                            "dist/cpp/node-bridge/workers/search_engine_export_worker.cpp",
                            "dist/cpp/node-bridge/workers/search_engine_import_worker.cpp",
                            "dist/cpp/node-bridge/workers/search_engine_search_worker.cpp",
                            "dist/cpp/node-bridge/workers/search_engine_recognition_worker.cpp",
                            "dist/cpp/node-bridge/workers/search_engine_enml_parser_worker.cpp",
                            "dist/cpp/node-bridge/workers/search_engine_execute_worker.cpp",
                            "dist/cpp/en-search-engine-shared-native/core/ense_document_utils.cpp",
                            "dist/cpp/en-search-engine-shared-native/core/ense_query_utils.cpp",
                            "dist/cpp/en-search-engine-shared-native/core/ense_scheduler.cpp",
                            "dist/cpp/en-search-engine-shared-native/core/search_engine_context.cpp",
                            "dist/cpp/en-search-engine-shared-native/core/search_document_context.cpp",
                            "dist/cpp/en-search-engine-shared-native/core/search_engine_index.cpp",
                            "dist/cpp/en-search-engine-shared-native/util/ense_utils.cpp",
                            "dist/cpp/en-search-engine-shared-native/util/ense_reco_resource_parser.cpp",
                            "dist/cpp/en-search-engine-shared-native/util/ense_symb_type.cpp",
                            "dist/cpp/en-search-engine-shared-native/util/ense_tokenization.cpp",
                            "dist/cpp/en-search-engine-shared-native/util/enml_parser.cpp",
                            "dist/cpp/en-search-engine-shared-native/util/tinyxml2.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/StdHeader.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/debug/error.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/util/ThreadLocal.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/util/Reader.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/util/Equators.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/util/FastCharStream_util.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/util/MD5Digester.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/util/StringIntern.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/util/BitSet.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/queryParser/FastCharStream.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/queryParser/MultiFieldQueryParser.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/queryParser/QueryParser.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/queryParser/QueryParserTokenManager.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/queryParser/QueryToken.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/queryParser/legacy/Lexer.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/queryParser/legacy/MultiFieldQueryParser_legacy.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/queryParser/legacy/QueryParser_legacy.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/queryParser/legacy/QueryParserBase.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/queryParser/legacy/QueryToken_legacy.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/queryParser/legacy/TokenList.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/analysis/standard/StandardAnalyzer.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/analysis/standard/StandardFilter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/analysis/standard/StandardTokenizer.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/analysis/Analyzers.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/analysis/AnalysisHeader.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/store/MMapInput.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/store/IndexInput.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/store/Lock.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/store/LockFactory.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/store/IndexOutput.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/store/Directory.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/store/FSDirectory.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/store/RAMDirectory.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/document/Document.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/document/DateField.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/document/DateTools.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/document/Field.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/document/FieldSelector.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/document/NumberTools.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/IndexFileNames.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/IndexFileNameFilter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/IndexDeletionPolicy.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/SegmentMergeInfo.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/SegmentInfos.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/MergeScheduler.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/SegmentTermDocs.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/FieldsWriter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/TermInfosWriter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/Term.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/Terms.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/MergePolicy.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/DocumentsWriter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/DocumentsWriterThreadState.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/SegmentTermVector.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/TermVectorReader.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/FieldInfos.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/CompoundFile.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/SkipListReader.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/SkipListWriter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/IndexFileDeleter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/SegmentReader.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/DirectoryIndexReader.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/TermVectorWriter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/IndexReader.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/SegmentTermPositions.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/SegmentMerger.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/IndexWriter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/MultiReader.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/MultiSegmentReader.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/Payload.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/SegmentTermEnum.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/TermInfo.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/IndexModifier.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/SegmentMergeQueue.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/FieldsReader.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/TermInfosReader.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/index/MultipleTermPositions.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/Compare.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/Scorer.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/ScorerDocQueue.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/PhraseScorer.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/SloppyPhraseScorer.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/DisjunctionSumScorer.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/ConjunctionScorer.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/PhraseQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/PrefixQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/ExactPhraseScorer.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/TermScorer.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/Similarity.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/BooleanScorer.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/BooleanScorer2.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/HitQueue.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/FieldCacheImpl.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/ChainedFilter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/RangeFilter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/CachingWrapperFilter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/QueryFilter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/TermQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/FuzzyQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/SearchHeader.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/RangeQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/IndexSearcher.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/Sort.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/PhrasePositions.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/FieldDocSortedHitQueue.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/WildcardTermEnum.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/MultiSearcher.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/Hits.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/MultiTermQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/FilteredTermEnum.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/FieldSortedHitQueue.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/WildcardQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/Explanation.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/BooleanQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/FieldCache.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/DateFilter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/MatchAllDocsQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/MultiPhraseQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/ConstantScoreQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/CachingSpanFilter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/SpanQueryFilter.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/spans/NearSpansOrdered.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/spans/NearSpansUnordered.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/spans/SpanFirstQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/spans/SpanNearQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/spans/SpanNotQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/spans/SpanOrQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/spans/SpanScorer.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/spans/SpanTermQuery.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/spans/SpanWeight.cpp",
                            "dist/cpp/lib/clucene/src/core/CLucene/search/spans/TermSpans.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/SharedHeader.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/config/gunichartables.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/config/repl_tcslwr.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/config/repl_tcstoll.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/config/repl_tcscasecmp.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/config/repl_tprintf.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/config/repl_lltot.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/config/repl_tcstod.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/config/utf8.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/config/threads.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/debug/condition.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/util/StringBuffer.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/util/Misc.cpp",
                            "dist/cpp/lib/clucene/src/shared/CLucene/util/dirent.cpp",
                            "dist/cpp/lib/clucene/src/ext/zlib/adler32.c",
                            "dist/cpp/lib/clucene/src/ext/zlib/compress.c",
                            "dist/cpp/lib/clucene/src/ext/zlib/crc32.c",
                            "dist/cpp/lib/clucene/src/ext/zlib/deflate.c",
                            "dist/cpp/lib/clucene/src/ext/zlib/gzio.c",
                            "dist/cpp/lib/clucene/src/ext/zlib/inffast.c",
                            "dist/cpp/lib/clucene/src/ext/zlib/inflate.c",
                            "dist/cpp/lib/clucene/src/ext/zlib/inftrees.c",
                            "dist/cpp/lib/clucene/src/ext/zlib/trees.c",
                            "dist/cpp/lib/clucene/src/ext/zlib/zutil.c",
                            "../../../../venv/lib/node_modules/node-gyp/src/win_delay_load_hook.cc"
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