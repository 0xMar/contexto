#!/usr/bin/env bash
# semantic-version.sh — Determine next semantic version from conventional commits.
# Usage: ./scripts/semantic-version.sh [major|minor|patch]
#   - With no argument: auto-detect from commit messages since last tag.
#   - With argument: force that bump type (useful for manual overrides).
#
# Requires: git, grep, sed, sort
# Works with Conventional Commits:
#   feat(...)       → minor
#   fix(...)        → patch
#   BREAKING CHANGE → major (or ! after type, e.g. feat!: )
#
# Examples:
#   ./scripts/semantic-version.sh        # auto-detect
#   ./scripts/semantic-version.sh minor  # force minor bump

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# ── Get current version from latest tag ──────────────────────────────────────
CURRENT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "0.0.0")

MAJOR=$(echo "$CURRENT_TAG" | sed 's/^\([0-9]*\)\..*/\1/')
MINOR=$(echo "$CURRENT_TAG" | sed 's/^[0-9]*\.\([0-9]*\).*/\1/')
PATCH=$(echo "$CURRENT_TAG" | sed 's/^[0-9]*\.[0-9]*\.\(.*\)/\1/' | sed 's/[^0-9].*//')

# ── Get merge commits since last tag ────────────────────────────────────────
# Filter to merge commits whose title matches conventional commit format
LOG_FORMAT="%s"
SINCE="${CURRENT_TAG}..HEAD"

# If no tags exist, look at all commits
if [ "$CURRENT_TAG" = "0.0.0" ]; then
    SINCE="--all"
fi

COMMITS=$(git log "$SINCE" --merges --format="$LOG_FORMAT" 2>/dev/null || true)

# ── Auto-detect bump type ───────────────────────────────────────────────────
BUMP_TYPE="${1:-auto}"

if [ "$BUMP_TYPE" = "auto" ]; then
    if echo "$COMMITS" | grep -qE '(^[a-z]+!|BREAKING CHANGE)'; then
        BUMP_TYPE="major"
    elif echo "$COMMITS" | grep -qE '^feat(\(|!)'; then
        BUMP_TYPE="minor"
    elif echo "$COMMITS" | grep -qE '^fix(\(|!)'; then
        BUMP_TYPE="patch"
    else
        BUMP_TYPE="patch"  # Default to patch for other conventional commits
    fi
fi

# ── Calculate next version ──────────────────────────────────────────────────
case "$BUMP_TYPE" in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
    *)
        echo "ERROR: Unknown bump type '$BUMP_TYPE'. Use: major, minor, patch, or auto" >&2
        exit 1
        ;;
esac

NEXT_TAG="${MAJOR}.${MINOR}.${PATCH}"
echo "$NEXT_TAG"