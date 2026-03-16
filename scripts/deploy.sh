#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/apps/pethotel}"
BRANCH="${BRANCH:-main}"
FRONT_DIR="$APP_DIR/front"
BACK_DIR="$APP_DIR/back/demo"
FRONT_DIST_DIR="${FRONT_DIST_DIR:-/var/www/pethotel}"
JAR_SOURCE="$BACK_DIR/target/demo-0.0.1-SNAPSHOT.jar"
JAR_TARGET_DIR="${JAR_TARGET_DIR:-/opt/pethotel}"
JAR_TARGET="$JAR_TARGET_DIR/pethotel.jar"
SERVICE_NAME="${SERVICE_NAME:-pethotel}"

echo "[deploy] app dir: $APP_DIR"
cd "$APP_DIR"

echo "[deploy] update source"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[deploy] build front"
cd "$FRONT_DIR"
npm ci
npm run build
sudo mkdir -p "$FRONT_DIST_DIR"
sudo rsync -av --delete dist/ "$FRONT_DIST_DIR/"

echo "[deploy] build back"
cd "$BACK_DIR"
chmod +x mvnw
./mvnw clean package -DskipTests

echo "[deploy] install jar"
sudo mkdir -p "$JAR_TARGET_DIR"
sudo cp "$JAR_SOURCE" "$JAR_TARGET"
sudo chmod 644 "$JAR_TARGET"

echo "[deploy] restart service"
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager
