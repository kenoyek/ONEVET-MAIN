#!/usr/bin/env bash
# Real Postgres policy tests in an isolated container; never uses a remote DB URL.
set -euo pipefail
cd "$(dirname "$0")/.."
unset DOCKER_HOST DOCKER_CONTEXT DOCKER_TLS DOCKER_TLS_VERIFY DOCKER_CERT_PATH
farm_test_container="onevet-farm-test-$$"
postgres_image="postgres:16-alpine@sha256:aa6cb33cf4c19c765cefcf48d96176258800870a9a1e930ad126200f9d825139"
docker --host=unix:///var/run/docker.sock run --detach --name "$farm_test_container" --network none --tmpfs /var/lib/postgresql/data -e POSTGRES_HOST_AUTH_METHOD=trust "$postgres_image" >/dev/null
trap 'docker --host=unix:///var/run/docker.sock rm --force "$farm_test_container" >/dev/null' EXIT
for attempt in {1..30}; do
 if docker --host=unix:///var/run/docker.sock exec "$farm_test_container" pg_isready -U postgres >/dev/null 2>&1; then break; fi
 sleep 1
done
cat supabase/tests/farm-bootstrap.sql \
 supabase/migrations/20260811000000_phase13_livestock_production_animal_care.sql | docker --host=unix:///var/run/docker.sock exec --interactive "$farm_test_container" psql --username postgres --set ON_ERROR_STOP=1 --quiet
docker --host=unix:///var/run/docker.sock exec "$farm_test_container" psql --username postgres --set ON_ERROR_STOP=1 --quiet --command 'CREATE POLICY unexpected_fixture_policy ON public.livestock_farms FOR SELECT USING (true)'
if docker --host=unix:///var/run/docker.sock exec --interactive "$farm_test_container" psql --username postgres --set ON_ERROR_STOP=1 --quiet < supabase/migrations/20261106000000_customer_farm_ownership.sql; then
 echo 'FAIL: migration accepted an unknown permissive policy' >&2
 exit 1
fi
docker --host=unix:///var/run/docker.sock exec "$farm_test_container" psql --username postgres --set ON_ERROR_STOP=1 --quiet --command 'DROP POLICY unexpected_fixture_policy ON public.livestock_farms'
echo 'PASS: migration rejects unknown policies before changing grants'
cat supabase/migrations/20261106000000_customer_farm_ownership.sql \
 supabase/tests/farm-ownership.sql | docker --host=unix:///var/run/docker.sock exec --interactive "$farm_test_container" psql --username postgres --set ON_ERROR_STOP=1 --quiet
