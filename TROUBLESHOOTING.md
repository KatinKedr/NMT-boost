# Troubleshooting

## "Failed to create PR" banner
If you see a red banner that says **Failed to create PR**, the pull request creation request did not go through. Common causes include:

- You are not authenticated or your token/session expired.
- Your account lacks permission to push to the branch or open PRs in the repository.
- Network glitches or API outages on the hosting platform (e.g., GitHub).
- Required fields (title, description, base/compare branches) are missing or invalid.

**How to fix**
1. Refresh your authentication (re-login or renew your token) and retry.
2. Confirm you have write access to the target repository/branch.
3. Ensure the PR has a valid title, description, and branches selected.
4. If the service is degraded, wait a few minutes and try again.

If the banner persists, check the platform's status page or logs for more detail.
