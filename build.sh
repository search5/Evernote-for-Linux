#!/bin/bash
set -e

ELECTRON_VERSION=11.3.0
EVERNOTE_VERSION=10.18.3-win-ddl-ga-2820
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

# Install NPM dependencies
if ! [ -f "$BUILD_DIR/app-unpacked/package-lock.json" ]; then
  # Replace package name to fix some issues:
  # - conflicting package in Ubuntu repos called "evernote"
  # - icon not showing up properly when only the DEB package is renamed
  sed -i 's/"Evernote"/"evernote-client"/' "$BUILD_DIR/app-unpacked/package.json"

  # Remove existing node_modules
  rm -rf "$BUILD_DIR/app-unpacked/node_modules"

  # Configure build settings
  # See https://www.electronjs.org/docs/tutorial/using-native-node-modules
  export npm_config_target=$ELECTRON_VERSION
  export npm_config_arch=$BUILD_ARCH
  export npm_config_target_arch=$BUILD_ARCH
  export npm_config_disturl=https://electronjs.org/headers
  export npm_config_runtime=electron
  export npm_config_build_from_source=true

  HOME=~/.electron-gyp npm install --registry http://localhost:4873 --prefix "$BUILD_DIR/app-unpacked"
fi

# Create Electron package
if ! [ -d "$BUILD_DIR/app-linux-$BUILD_ARCH" ]; then
  electron-packager "$BUILD_DIR/app-unpacked" app \
    --platform linux \
    --arch "$BUILD_ARCH" \
    --out "$BUILD_DIR" \
    --electron-version $ELECTRON_VERSION \
    --executable-name evernote-client
fi

if ! [ -f "$BUILD_DIR/app-unpacked/resources/static" ]; then
  cp -r "$BUILD_DIR/app-bundle/resources/static" "$BUILD_DIR/app-linux-$BUILD_ARCH/resources"
  find "$BUILD_DIR/app-linux-$BUILD_ARCH/resources/static" -type d -exec chmod 755 {} \;
fi

if ! [ -f "out/evernote-client_${EVERNOTE_VERSION}_$PACKAGE_ARCH.deb" ]; then
  # Create Debian package
  electron-installer-debian \
    --src "$BUILD_DIR/app-linux-$BUILD_ARCH" \
    --dest out \
    --arch "$PACKAGE_ARCH" \
    --options.productName Evernote \
    --options.icon "$BUILD_DIR/app-linux-$BUILD_ARCH/resources/static/linux/icons/icon.png"
fi
