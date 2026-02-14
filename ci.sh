#!/usr/bin/env bash
set -e

echo "==> ShareTable CI"
echo

echo "==> Backend: test + format check"
cd backend
./mvnw test spotless:check -q
cd ..
echo

echo "==> Frontend: typecheck + lint + format check"
cd frontend
npm run check
cd ..
echo

echo "==> CI passed"
