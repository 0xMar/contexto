#!/usr/bin/env bash
# setup-auto-delete-branches.sh — Enable auto-delete for merged PR branches.
# Usage: ./scripts/setup-auto-delete-branches.sh [owner/repo]
# Requires: gh CLI authenticated with admin permissions on the repo.

set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

echo "==> Enabling auto-delete merged branches for $REPO..."

gh api \
  --method PATCH \
  "repos/$REPO" \
  -f delete_branch_on_merge=true

echo "✅ Auto-delete merged branches enabled for $REPO"
echo ""
echo "  Merged feature/fix branches will be automatically deleted."
echo "  Keep local copies with: git checkout <branch> before merging."