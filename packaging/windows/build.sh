#!/usr/bin/env bash
# Assembles a self-contained, non-technical-friendly Windows package for BMC.
# Runs entirely on the dev machine (Mac) - the end user's Windows laptop never
# needs Composer, npm, or artisan; it only ever runs the bundled php.exe via
# the VBS launchers.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PKG_DIR="$ROOT_DIR/packaging/windows"
DIST_ROOT="$PKG_DIR/dist-root"
APP_DEST="$DIST_ROOT/app"
BUILD_TMP="$PKG_DIR/.build-tmp"
TEMPLATES_DIR="$PKG_DIR/templates"
PHP_RUNTIME_DIR="$PKG_DIR/php-runtime"
PHP_VERSION="8.4.23"

if [ ! -f "$PHP_RUNTIME_DIR/php.exe" ]; then
  echo "==> Downloading portable PHP $PHP_VERSION (Windows NTS x64) - one-time, cached at $PHP_RUNTIME_DIR"
  rm -rf "$PHP_RUNTIME_DIR"
  mkdir -p "$PHP_RUNTIME_DIR"
  curl -sL --max-time 120 -o "$PHP_RUNTIME_DIR/php.zip" \
    "https://downloads.php.net/~windows/releases/php-${PHP_VERSION}-nts-Win32-vs17-x64.zip"
  unzip -q "$PHP_RUNTIME_DIR/php.zip" -d "$PHP_RUNTIME_DIR"
  rm "$PHP_RUNTIME_DIR/php.zip"
fi
cp "$TEMPLATES_DIR/php.ini" "$PHP_RUNTIME_DIR/php.ini"

echo "==> Building production vendor/ and frontend assets in a clean copy"
rm -rf "$BUILD_TMP"
mkdir -p "$BUILD_TMP"

# Copy source, excluding dev-only / generated / secret-bearing paths.
rsync -a "$ROOT_DIR/" "$BUILD_TMP/" \
    --exclude ".git" \
    --exclude "node_modules" \
    --exclude "vendor" \
    --exclude "tests" \
    --exclude "packaging" \
    --exclude "public/build" \
    --exclude "storage/logs/*.log" \
    --exclude "storage/framework/cache/data" \
    --exclude "storage/framework/sessions/*" \
    --exclude "storage/framework/views/*" \
    --exclude "database/*.sqlite" \
    --exclude ".env" \
    --exclude ".env.backup" \
    --exclude ".env.production" \
    --exclude ".DS_Store" \
    --exclude ".phpunit.result.cache" \
    --exclude ".idea" \
    --exclude ".vscode"

cd "$BUILD_TMP"

echo "==> composer install (production, no dev deps)"
composer install --no-dev --optimize-autoloader --no-interaction --quiet

echo "==> Generating a fresh, production-ready .env for this package"
cp .env.example .env
php -r '
$env = file_get_contents(".env");
$env = preg_replace("/^APP_DEBUG=.*/m", "APP_DEBUG=false", $env);
file_put_contents(".env", $env);
'
php artisan key:generate --force --ansi

REVERB_APP_KEY="$(php -r 'echo bin2hex(random_bytes(16));')"
REVERB_APP_SECRET="$(php -r 'echo bin2hex(random_bytes(16));')"
export REVERB_APP_KEY REVERB_APP_SECRET
php -r '
$env = file_get_contents(".env");
$env = preg_replace("/^REVERB_APP_KEY=.*/m", "REVERB_APP_KEY=".getenv("REVERB_APP_KEY"), $env);
$env = preg_replace("/^REVERB_APP_SECRET=.*/m", "REVERB_APP_SECRET=".getenv("REVERB_APP_SECRET"), $env);
file_put_contents(".env", $env);
'

echo "==> npm install + production build (bakes REVERB_APP_KEY into the JS bundle)"
npm install --no-fund --no-audit --silent
npm run build

echo "==> Creating and migrating a fresh SQLite database"
mkdir -p database
touch database/database.sqlite
php artisan migrate --force --ansi

echo "==> Assembling final Windows dist folder"
rm -rf "$DIST_ROOT"
mkdir -p "$APP_DEST"
rsync -a "$BUILD_TMP/" "$APP_DEST/" \
    --exclude "node_modules" \
    --exclude ".git"

rm -rf "$BUILD_TMP"

echo "==> Copying launcher templates (Start/Stop/README/debug scripts)"
cp "$TEMPLATES_DIR/Start BMC.vbs" "$TEMPLATES_DIR/Stop BMC.vbs" "$TEMPLATES_DIR/README.txt" "$DIST_ROOT/"

echo "==> Copying portable PHP runtime"
cp -R "$PHP_RUNTIME_DIR" "$DIST_ROOT/php-runtime"

ZIP_NAME="BMC-Windows.zip"
ZIP_PATH="$PKG_DIR/$ZIP_NAME"
echo "==> Zipping package"
rm -f "$ZIP_PATH"
(cd "$DIST_ROOT" && zip -qr "$ZIP_PATH" .)

echo ""
echo "Done. Package: $ZIP_PATH"
du -sh "$ZIP_PATH"
