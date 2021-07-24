#!/usr/bin/env python
from lxml import etree

import json

result_binding = {
    "targets": [{
        "target_name": "clucene-binding",
        "include_dirs": ["/usr/lib/x86_64-linux-gnu", "/usr/include/c++/8"],
        "cflags!": ["-fno-exceptions", "-L/usr/lib/x86_64-linux-gnu/", "-I/usr/include/c++/8"],
        "cflags_cc!": ["-fno-exceptions", "-L/usr/lib/x86_64-linux-gnu/", "-I/usr/include/c++/8"],
        "sources": [],
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

parse_xml = etree.parse("../build-x64/app-unpacked/node_modules/clucene/build/clucene-binding.vcxproj")

ns = {"Project": "http://schemas.microsoft.com/developer/msbuild/2003"}

ElemAdditionalIncludeDirectories = parse_xml.xpath("//Project:AdditionalIncludeDirectories", namespaces=ns)[0].text
AdditionalIncludeDirectories = ElemAdditionalIncludeDirectories.replace("\\", "/").split(";")


for item in AdditionalIncludeDirectories:
    if "clucene/dist" not in item:
        continue

    dist_start_pos = item.find("clucene/dist") + len("clucene/")
    result_binding["targets"][0]["include_dirs"].append(item[dist_start_pos:])

SourceList = parse_xml.xpath("//Project:ItemGroup/Project:ClCompile", namespaces=ns)
for item in SourceList:
    source_path_detail = item.get("Include").replace("\\", "/")
    
    if "win_delay_load_hook" not in source_path_detail:
        result_binding["targets"][0]["sources"].append(source_path_detail[len("../"):])
    else:
        node_gyp_start_pos = source_path_detail.find("node-gyp/")
        win_delay_load_hook_pure_path = source_path_detail[node_gyp_start_pos:]

        result_binding["targets"][0]["sources"].append(f"system_modules/{win_delay_load_hook_pure_path}")
        
json.dump(result_binding, open("../build-x64/app-unpacked/node_modules/clucene/binding.gyp", "w"))
