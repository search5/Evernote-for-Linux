#!/usr/bin/env python
import json

dist_clucene = open("../build-x64/app-unpacked/node_modules/clucene/package.json")

save_clucene = open("../evernote_modules/clucene/package.json")

dist_json = json.load(dist_clucene)
save_json = json.load(save_clucene)

print(">> dist clucene version")
print(dist_json['version'])

print(">> save clucene version")
print(save_json['version'])
