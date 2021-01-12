import glob
import os.path
import requests

files = glob.glob("*")

private_registry = []

for item in files:
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
