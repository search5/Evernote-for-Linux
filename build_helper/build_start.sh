#!/bin/bash
./clucene_binding.py
cp -r ../build-x64/app-unpacked/node_modules/clucene ../evernote_modules/
./npm_registry_exists.py
./copy_unique_modules.sh
./nested_modules.sh
./publishConfig_update.py http://localhost:4873
