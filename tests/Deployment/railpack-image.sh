#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."
image="${1:?Usage: tests/Deployment/railpack-image.sh IMAGE}"
expected="$(sha256sum public/index.php | cut -d ' ' -f 1)"
actual="$(docker run --rm --entrypoint sha256sum "$image" /app/public/index.php | cut -d ' ' -f 1)"

if [ "$actual" != "$expected" ]; then
    echo 'The image must contain the application entry point from this checkout.' >&2
    exit 1
fi

echo 'The image contains the Laravel application entry point.'
