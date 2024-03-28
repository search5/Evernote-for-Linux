# Evernote for Linux

Bendingspoon, the company that acquired Evernote, removed all compilable source code and Linux support that had been added to the Evernote for Windows binaries.

With version 10.60.4 officially locked down, it's now virtually impossible to repackage, even if I were to provide the community with the build scripts I've been using.

This was a project that I personally took on without permission from Evernote when I first saw the notion-for-linux project and was inspired by it, and it seems clear that Bendingspoon no longer intends to support Linux.
If I were to recommend an alternative to Evernote to anyone who came to this project, I would recommend going to notion, obsidian, etc. and if you still need to use Evernote for the time being, I would recommend installing a program called webcatalog to use the web version of Evernote.
We apologize that we are no longer able to maintain the project.

2024-03-29 build notice update
- After a certain version of Evernote, I was concerned that I could be sued for reverse engineering the Evernote program, so I kept the build script to myself and no longer updated it.


## Setup Requirements
* Debian 9 or Ubuntu Linux 18.04
* Python3
* Git
* NodeJS 14.15.4

## Setup

Download the system package.
```bash
apt-get install libsecret-1-dev libclucene-dev build-essential p7zip-full libuv1-dev
```

Private NPM Registry setup
```bash
npm install -g node-gyp node-pre-gyp
npm install verdaccio
```

Please refer to other documentation on how to set up Verdaccio.

Python Packages Install
```bash
pip install click
```

Git Clone
```bash
git clone https://github.com/search5/Evernote-for-Linux.git
```

Registering required packages in private NPM Registry
```bash
cd Evernote-for-Linux/build_helper
./publishConfig_update.py --registry http://localhost:4873
```

Please note that the private NPM Registry URL may vary depending on the setting (the value used here is the default value).

Packages to be registered in the private registry need to go into a separate directory and only issue the npm publish command.

There are two types of en-data-model: evernote_modules/en-data-model and evernote_modules/en-graph-types/node_modules/en-data-model, each with completely different versions and content. Therefore, these two modules must be registered separately with the private NPM.

### Evernote Build

```bash
cd Evernote-for-Linux
./build.sh
```

When Evernote build is complete, a deb file is created in the out directory, and once this file is installed, Evernote can be used in Linux.

ElectronJS used in this project is version 11.1.1, and if the version to be used is different, you need to enter build.sh as well as electron-clipboard-files, modify package.json, rebuild, and upload to private NPM (for convenience of development). There are some pre-built for Electron 11.1.1, Linux, and amd64)

**Warning:**
This project is based on information extracted from the official Evernote EXE file, and unauthorized modification of the source code is not permitted, and redistribution is not permitted. In the case of distribution or general distribution by modifying the source code in any form, the legal responsibility for the person concerned lies with the actor.

**Copyright:**
The copyright of the program code in the node_modules directory belongs to Evernote, and the copyrights of various Python scripts and shell scripts belong to Lee Persy Ji-ho (search5@gmail.com), and are subject to the BSD license.
