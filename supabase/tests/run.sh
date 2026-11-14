#!/usr/bin/env bash
# Runs the database security tests on a throwaway PostgreSQL database.
set -euo pipefail
DB=answerdesk_test
dropdb --if-exists "$DB" >/dev/null 2>&1 || true
createdb "$DB"
cd "$(dirname "$0")"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f auth-shim.sql
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f ../migrations/0001_answerdesk.sql
OUT=$(psql -v ON_ERROR_STOP=1 -q -d "$DB" -f security.test.sql 2>&1 | grep -E "PASS|FAIL|ERROR" | sed "s/^.*NOTICE:  //")
dropdb "$DB"
echo "$OUT"
if echo "$OUT" | grep -qE "FAIL|ERROR"; then exit 1; fi
