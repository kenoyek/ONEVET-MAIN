#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
unset DOCKER_HOST DOCKER_CONTEXT DOCKER_TLS DOCKER_TLS_VERIFY DOCKER_CERT_PATH
core_test_container="onevet-core-test-$$"
postgres_image="postgres:16-alpine@sha256:aa6cb33cf4c19c765cefcf48d96176258800870a9a1e930ad126200f9d825139"
docker --host=unix:///var/run/docker.sock run --detach --name "$core_test_container" --network none --tmpfs /var/lib/postgresql/data -e POSTGRES_HOST_AUTH_METHOD=trust "$postgres_image" >/dev/null
trap 'docker --host=unix:///var/run/docker.sock rm --force "$core_test_container" >/dev/null' EXIT
for attempt in {1..30}; do
 if docker --host=unix:///var/run/docker.sock exec "$core_test_container" pg_isready -U postgres >/dev/null 2>&1; then break; fi
 sleep 1
done
{
 cat supabase/tests/core-bootstrap.sql \
 supabase/migrations/20260401000000_independent_architecture_master.sql \
 supabase/migrations/20261106010000_live_security_repairs.sql \
 supabase/migrations/20261106020000_payment_receipt_ledger.sql \
 supabase/migrations/20261106030000_bootstrap_customer_farms.sql \
 supabase/migrations/20261106040000_public_read_boundaries.sql \
 supabase/migrations/20261106050000_provider_draft_registration.sql \
 supabase/migrations/20261106060000_provider_verification_workflow.sql \
 supabase/migrations/20261106070000_verification_evidence_history.sql \
 supabase/migrations/20261106080000_provider_service_publication.sql \
 supabase/migrations/20261106090000_provider_booking_requests.sql \
 supabase/migrations/20261106100000_booking_rescheduling.sql \
 supabase/migrations/20261107010000_booking_notifications.sql \
 supabase/migrations/20261107020000_provider_team_access.sql \
 supabase/migrations/20261109010000_appointment_messaging.sql
 echo 'BEGIN;'
 cat supabase/tests/core-security.sql \
 supabase/tests/provider-drafts.sql \
 supabase/tests/provider-verification.sql \
 supabase/tests/provider-publication.sql \
 supabase/tests/provider-booking-setup.sql \
 supabase/tests/provider-booking.sql \
 supabase/tests/booking-rescheduling.sql \
 supabase/tests/booking-notifications.sql \
 supabase/tests/provider-team.sql \
 supabase/tests/appointment-messaging.sql
 echo 'ROLLBACK;'
} | docker --host=unix:///var/run/docker.sock exec --interactive "$core_test_container" psql --username postgres --set ON_ERROR_STOP=1 --quiet
python scripts/test-booking-concurrency.py "$core_test_container"
