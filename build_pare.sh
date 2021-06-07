#!/bin/bash
set -e

ELECTRON_VERSION=11.3.0
EVERNOTE_VERSION=10.15.6-win-ddl-ga-2680
EVERNOTE_BINARY=evernote.exe
BUILD_ARCH=${1:-x64}
PACKAGE_ARCH=${2:-amd64}
BUILD_DIR=build-$BUILD_ARCH
PATH="node_modules/.bin:$PATH"

check-command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo Missing command: "$1"
    exit 1
  fi
}

commands=(node npm 7z fakeroot dpkg g++ make)

# Check for required commands
for command in "${commands[@]}"; do
  check-command "$command"
done

# Install NPM dependencies
if ! [ -d node_modules ]; then
  npm install
fi

# Download Evernote executable
if ! [ -f $EVERNOTE_BINARY ]; then
  origin=https://cdn1.evernote.com/boron/win/builds
  wget "$origin/Evernote-$EVERNOTE_VERSION-setup.exe" -O evernote.exe
fi

# Setup the build directory
mkdir -p "$BUILD_DIR"

# Extract the Evernote executable
if ! [ -f "$BUILD_DIR/evernote-exe/\$PLUGINSDIR/app-64.7z" ]; then
  7z x $EVERNOTE_BINARY -o"$BUILD_DIR/evernote-exe"
fi

# Extract the app bundle
if ! [ -f "$BUILD_DIR/app-bundle/resources/app.asar" ]; then
  7z x "$BUILD_DIR/evernote-exe/\$PLUGINSDIR/app-64.7z" -o"$BUILD_DIR"/app-bundle
fi

# Extract the app container
if ! [ -d "$BUILD_DIR/app-unpacked" ]; then
  asar extract \
    "$BUILD_DIR/app-bundle/resources/app.asar" "$BUILD_DIR/app-unpacked"
fi

