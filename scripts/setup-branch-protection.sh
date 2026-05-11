#!/usr/bin/env bash
# setup-branch-protection.sh — Configure GitHub branch protection for master.
# Usage: ./scripts/setup-branch-protection.sh [owner/repo]
# Requires: gh CLI authenticated with admin permissions on the repo.

set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
BRANCH="master"

echo "==> Configuring branch protection for $REPO ($BRANCH)..."

gh api \
  --method PUT \
  "repos/$REPO/branches/$BRANCH/protection" \
  -f required_status_checks.strict=true \
  -f required_status_checks.contexts='["backend", "frontend"]' \
  -f enforce_admins=true \
  -f required_pull_request_reviews.required_approving_review_count=1 \
  -f required_pull_request_reviews.dismiss_stale_reviews=true \
  -f required_pull_request_reviews.require_code_owner_reviews=false \
  -f restrictions=null \
  -f required_linear_history=false \
  -f allow_force_pushes=false \
  -f allow_deletions=false

echo "✅ Branch protection configured for $BRANCH"
echo ""
echo "=== Protection settings ==="
echo "  - Status checks required: backend, frontend"
echo "  - Strict: yes (all checks must pass)"
echo "  - Enforce for admins: yes"
echo "  - Required approvals: 1"
echo "  - Dismiss stale reviews: yes"
echo "  - Force pushes: blocked"
echo "  - Branch deletion: blocked"