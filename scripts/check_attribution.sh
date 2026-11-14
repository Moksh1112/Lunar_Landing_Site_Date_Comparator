#!/usr/bin/env bash
# Azelux attribution guard for CI (and manual runs).
# Usage: scripts/check_attribution.sh <base-ref> <head-ref>
# Fails if any commit in base..head credits an AI tool as author, committer
# or co-author, or if the PR body (env PR_BODY) has an AI "generated with" line.
set -euo pipefail

base="${1:-origin/main}"
head="${2:-HEAD}"
AI_NAMES='claude|anthropic|openai|chatgpt|gpt-[0-9]|copilot|gemini|cursor|codeium|windsurf|devin|codex|tabnine|\[bot\]'
status=0

if [ "$base" = "--root" ]; then
  commits="$(git rev-list "$head")" || exit 1
else
  commits="$(git rev-list "${base}..${head}")" || exit 1
fi

while read -r sha; do
  [ -z "$sha" ] && continue
  who="$(git log -1 --format='%an <%ae> | %cn <%ce>' "$sha")"
  body="$(git log -1 --format='%B' "$sha")"
  if echo "$who" | grep -Eiq "(${AI_NAMES}|noreply@anthropic\.com)"; then
    echo "::error::Commit $sha has an AI/bot author or committer: $who"; status=1
  fi
  if echo "$body" | grep -Eiq "^[[:space:]]*(co-authored-by|signed-off-by|authored-by|assisted-by)[[:space:]]*:.*(${AI_NAMES}|noreply@anthropic\.com)"; then
    echo "::error::Commit $sha has an AI co-author trailer."; status=1
  fi
  if echo "$body" | grep -Eiq "(generated|created|written|made)[[:space:]]+(with|by|using)[[:space:]]+\[?(${AI_NAMES})"; then
    echo "::error::Commit $sha has an AI 'generated with' line."; status=1
  fi
done <<< "$commits"

if [ -n "${PR_BODY:-}" ] && echo "$PR_BODY" | grep -Eiq "(generated|created|written|made)[[:space:]]+(with|by|using)[[:space:]]+\[?(${AI_NAMES})|co-authored-by:.*(${AI_NAMES})"; then
  echo "::error::Pull request description credits an AI tool. Edit the description."; status=1
fi

if [ "$status" -eq 0 ]; then echo "Attribution guard: OK"; fi
exit "$status"
