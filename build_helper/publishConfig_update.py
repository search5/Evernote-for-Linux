#!/usr/bin/env python
import click
import glob
import json
import os


@click.command()
@click.argument('registry')
def main(registry):
    # Node Modules Selection
    evernote_module_prefix = "../evernote_modules"
    npm_packages = glob.glob(f"{evernote_module_prefix}/*", recursive=False)
    npm_packages.append(f"{evernote_module_prefix}/en-graph-types/node_modules/en-data-model")
    #print(npm_packages)

    for idx, item in enumerate(npm_packages):
        if "/@" in item:
            del npm_packages[idx]
            sub_items = glob.glob(f"{item}/*", recursive=False)
            npm_packages.extend(sub_items)
            
            break

    current_dir = os.getcwd()

    for entry in npm_packages:
        # 일반 패키지
        package_json = json.load(open("{0}/package.json".format(entry), "r"))

        # private url registry set
        package_json["publishConfig"] = {"registry": registry}

        json.dump(package_json, open("{0}/package.json".format(entry), "w"), indent=2)

        os.chdir(entry)
        os.system("npm publish")
        os.chdir(current_dir)


if __name__ == "__main__":
    main()
