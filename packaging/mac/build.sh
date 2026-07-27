#!/usr/bin/env bash
# Assembles a self-contained, non-technical-friendly macOS package for BMC.
# Requires this exact Mac (or a similar Apple Silicon dev machine with
# Homebrew/Xcode CLT) to build - the end user's Mac never needs PHP/Composer/
# Node; it only ever runs the bundled static php binary via the .app launchers.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PKG_DIR="$ROOT_DIR/packaging/mac"
DIST_ROOT="$PKG_DIR/dist-root"
APP_DEST="$DIST_ROOT/app"
BUILD_TMP="$PKG_DIR/.build-tmp"
TEMPLATES_DIR="$PKG_DIR/templates"
PHP_RUNTIME_DIR="$PKG_DIR/php-runtime"
SPC_DIR="$PKG_DIR/spc-build"

if [ ! -x "$PHP_RUNTIME_DIR/php" ]; then
  echo "==> No cached static PHP binary found - building one with static-php-cli (one-time, ~4 min)"
  mkdir -p "$SPC_DIR"
  if [ ! -x "$SPC_DIR/spc" ]; then
    curl -fsSL -o "$SPC_DIR/spc" https://dl.static-php.dev/v3/spc-bin/nightly/spc-macos-aarch64
    chmod +x "$SPC_DIR/spc"
  fi
  cat > "$SPC_DIR/craft.yml" << 'EOF'
php-version: "8.4"
extensions: "pdo_sqlite,sqlite3,mbstring,openssl,curl,fileinfo,tokenizer,ctype,session,filter,dom,xml,simplexml,xmlwriter,phar,pcntl,posix"
sapi:
  - cli
download-options:
  parallel: 10
EOF
  (cd "$SPC_DIR" && ./spc craft --no-interaction)
  mkdir -p "$PHP_RUNTIME_DIR"
  cp "$SPC_DIR/buildroot/bin/php" "$PHP_RUNTIME_DIR/php"
  chmod +x "$PHP_RUNTIME_DIR/php"
fi
cp "$TEMPLATES_DIR/php.ini" "$PHP_RUNTIME_DIR/php.ini"
cp "$TEMPLATES_DIR/mb_split-polyfill.php" "$PHP_RUNTIME_DIR/mb_split-polyfill.php"

echo "==> Building production vendor/ and frontend assets in a clean copy"
rm -rf "$BUILD_TMP"
mkdir -p "$BUILD_TMP"

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

echo "==> Assembling final macOS dist folder"
rm -rf "$DIST_ROOT"
mkdir -p "$APP_DEST"
rsync -a "$BUILD_TMP/" "$APP_DEST/" \
    --exclude "node_modules" \
    --exclude ".git"

rm -rf "$BUILD_TMP"

echo "==> Copying launcher templates (Start/Stop .app bundles, README)"
cp -R "$TEMPLATES_DIR/Start BMC.app" "$DIST_ROOT/"
cp -R "$TEMPLATES_DIR/Stop BMC.app" "$DIST_ROOT/"
cp "$TEMPLATES_DIR/README.txt" "$DIST_ROOT/"

echo "==> Copying static PHP runtime"
cp -R "$PHP_RUNTIME_DIR" "$DIST_ROOT/php-runtime"

ZIP_NAME="BMC-Mac.zip"
ZIP_PATH="$PKG_DIR/$ZIP_NAME"
echo "==> Zipping package"
rm -f "$ZIP_PATH"
(cd "$DIST_ROOT" && zip -qr "$ZIP_PATH" .)

echo ""
echo "Done. Package: $ZIP_PATH"
du -sh "$ZIP_PATH"
