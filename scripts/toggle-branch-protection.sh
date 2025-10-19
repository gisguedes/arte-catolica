#!/usr/bin/env bash
# 🛡️ Toggle branch protection for self-merge in solo repos
# Usage: ./scripts/toggle-branch-protection.sh <PR_NUMBER>

PR_NUMBER=$1
if [ -z "$PR_NUMBER" ]; then
  echo "❌ Usage: $0 <PR_NUMBER>"
  exit 1
fi

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
BRANCH="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"

echo "🔐 Repo: $REPO | Branch: $BRANCH | PR: #$PR_NUMBER"
echo "1️⃣ Lowering protection temporarily (0 approvals)..."

gh api -X PUT "/repos/${REPO}/branches/${BRANCH}/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "enforce_admins": true,
  "required_linear_history": true,
  "restrictions": null,
  "required_status_checks": null
}
JSON

echo "2️⃣ Merging PR #$PR_NUMBER ..."
gh pr merge "$PR_NUMBER" --squash || { echo "⚠️ Merge failed"; exit 1; }

echo "3️⃣ Restoring protection (1 approval required)..."
gh api -X PUT "/repos/${REPO}/branches/${BRANCH}/protection" \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "enforce_admins": true,
  "required_linear_history": true,
  "restrictions": null,
  "required_status_checks": null
}
JSON

echo "✅ Done! Branch protection restored and PR merged."
