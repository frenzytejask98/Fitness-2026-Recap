#!/bin/sh
# Builds the site: app.html (the studio) and index.html (the landing page)
cd "$(dirname "$0")/src" && cat partA.html gen.js facts.js deck.js importer.js sources.js export.js ui.js > ../app.html && cp landing.html ../index.html && echo "built app.html and index.html"
