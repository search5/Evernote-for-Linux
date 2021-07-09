#!/bin/bash

NESTED_NODE_MODULES=$(find ../evernote_modules -name "node_modules")

find_modules=()

for node_modules in $NESTED_NODE_MODULES
do
    find_modules+=$(find $node_modules/ -maxdepth 1)
    find_modules+="|"
done

./unique_nested_module_filter.py $find_modules
