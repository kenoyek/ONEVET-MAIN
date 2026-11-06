#!/usr/bin/env bash
# Local-only type blueprint validation. Never connects to main or applies production changes.
set -euo pipefail
cd "$(dirname "$0")/../.."
unset DOCKER_HOST DOCKER_CONTEXT DOCKER_TLS DOCKER_TLS_VERIFY DOCKER_CERT_PATH
blueprint_container="onevet-blueprint-$$"
blueprint_catalog="$(mktemp)"
cleanup() { docker --host=unix:///var/run/docker.sock rm -f "$blueprint_container" >/dev/null; rm -f "$blueprint_catalog"; }
trap cleanup EXIT
docker --host=unix:///var/run/docker.sock run -d --name "$blueprint_container" --network none --tmpfs /var/lib/postgresql/data -e POSTGRES_HOST_AUTH_METHOD=trust postgres:16-alpine@sha256:aa6cb33cf4c19c765cefcf48d96176258800870a9a1e930ad126200f9d825139 >/dev/null
for attempt in {1..30}; do
 if docker --host=unix:///var/run/docker.sock exec "$blueprint_container" pg_isready -U postgres >/dev/null 2>&1; then break; fi
 sleep 1
done
docker --host=unix:///var/run/docker.sock exec -i "$blueprint_container" psql -U postgres -v ON_ERROR_STOP=1 -q < supabase/tests/core-bootstrap.sql
for file in supabase/migrations/20260*.sql; do
 if [[ "$file" == *20260808000000* ]]; then
  docker --host=unix:///var/run/docker.sock exec -i "$blueprint_container" psql -U postgres -v ON_ERROR_STOP=1 -q < supabase/planned/module-foundations.sql
 fi
 docker --host=unix:///var/run/docker.sock exec -i "$blueprint_container" psql -U postgres -v ON_ERROR_STOP=1 -q < "$file"
done
docker --host=unix:///var/run/docker.sock exec -i "$blueprint_container" psql -U postgres -v ON_ERROR_STOP=1 -At < scripts/schema/planned-catalog.sql > "$blueprint_catalog"
python3 scripts/schema/generate-planned-types.py "$blueprint_catalog" src/integrations/supabase/planned-types.ts
