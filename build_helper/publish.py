#!/usr/bin/env python
import click
import glob
import json


@click.command()
@click.option('--registry', help='Please be sure to enter the private NPM Registry URL.')
def main(registry):
    # Node Modules Selection
    npm_packages = glob.glob("*")

    for entry in npm_packages:
        # 일반 패키지
        print("cd {} && npm publish && cd ..".format(entry))


if __name__ == "__main__":
    main()
