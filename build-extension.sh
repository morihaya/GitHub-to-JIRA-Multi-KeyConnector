#!/bin/bash

# Extension build script for Chrome Web Store and Edge Add-ons.
set -e

EXTENSION_NAME="github-to-jira-multi-keyconnector"
BUILD_DIR="build"
DIST_DIR="dist"
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")

echo "Building extension: $EXTENSION_NAME v$VERSION"

rm -rf "$BUILD_DIR" "$DIST_DIR"
mkdir -p "$BUILD_DIR" "$DIST_DIR"

cp manifest.json "$BUILD_DIR/"
cp content.js "$BUILD_DIR/"
cp popup.html "$BUILD_DIR/"
cp popup.js "$BUILD_DIR/"
cp style.css "$BUILD_DIR/"
cp -r icons "$BUILD_DIR/"
cp README.md "$BUILD_DIR/" 2>/dev/null || true
cp LICENSE "$BUILD_DIR/" 2>/dev/null || true

find "$BUILD_DIR" -name ".DS_Store" -delete 2>/dev/null || true
rm -rf "$BUILD_DIR/store-assets" 2>/dev/null || true

echo "Creating Chrome Web Store package..."
cd "$BUILD_DIR"
zip -r "../$DIST_DIR/${EXTENSION_NAME}-chrome-v${VERSION}.zip" .
cd ..

echo "Creating Edge Add-ons package..."
cp "$DIST_DIR/${EXTENSION_NAME}-chrome-v${VERSION}.zip" "$DIST_DIR/${EXTENSION_NAME}-edge-v${VERSION}.zip"

echo "Build completed!"
echo "Chrome Web Store: $DIST_DIR/${EXTENSION_NAME}-chrome-v${VERSION}.zip"
echo "Edge Add-ons: $DIST_DIR/${EXTENSION_NAME}-edge-v${VERSION}.zip"
