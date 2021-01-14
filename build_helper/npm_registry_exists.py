import glob
import os.path
import requests

files = glob.glob("../build-x64/app-unpacked/node_modules/*")

private_registry = []

for entry in files:
    item_pos = entry.rfind("/") + 1
    item = entry[item_pos:]
    
    if os.path.isfile(item):
        continue
    
    if item.startswith("@"):
        continue
    
    r = requests.head("https://registry.npmjs.org/{}".format(item))
    print("{} Processing... {}".format(item, r.status_code))

    if r.status_code == 404:
        private_registry.append("{}\n".format(item))

print(private_registry)
open("output_log.txt", "w").writelines(private_registry)
