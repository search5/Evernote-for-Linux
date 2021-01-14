#!/usr/bin/env python
import click
import glob
import json


@click.command()
@click.option('--registry', help='Please be sure to enter the private NPM Registry URL.')
def main(registry):
    # Node Modules Selection
    npm_packages = glob.glob("../evernote_modules/*")

    for entry in npm_packages:
        # 일반 패키지
        package_json = json.load(open("{0}/package.json".format(entry), "r"))

        # private url registry set
        package_json["publishConfig"] = {"registry": registry}

        json.dump(package_json, open("{0}/package.json".format(entry), "w"), indent=4)


if __name__ == "__main__":
    main()
