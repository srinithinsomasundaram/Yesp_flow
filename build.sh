#!/bin/bash
set -e
APP_DIR="Downloads/yesp email /leadcraft-ai"
cd "$APP_DIR"
npm ci
npm run build
