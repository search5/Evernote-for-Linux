#!/usr/bin/env python
import sys
import os
import requests
import json

module_splits = sys.argv[1:]
module_splits_flatten = []

for item in module_splits:
    if "|" not in item:
        module_splits_flatten.append(item)
    else:
        module_splits_flatten.extend(item.split("|"))

module_splits = module_splits_flatten.copy()

nested_module_paths = []

for item in module_splits:
    if not item.endswith("node_modules/"):
       pkg_name = os.path.basename(item)
       r = requests.head("https://registry.npmjs.org/{}".format(pkg_name))

       if r.status_code == 200:
           continue

       nested_module_paths.append(item)

unique_versions = {}

for item in nested_module_paths:
    jr = json.load(open(f"{item}/package.json"))
    
    unique_versions[f"{jr['name']}:{jr['version']}"] = item

open("evernote_nested_modules.txt", "w").writelines('\n'.join(unique_versions.values()))