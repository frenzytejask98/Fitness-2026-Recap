#!/bin/sh
# Builds the single-file app: index.html
cd "$(dirname "$0")/src" && cat partA.html gen.js facts.js deck.js importer.js sources.js export.js ui.js > ../index.html && echo "built index.html"
