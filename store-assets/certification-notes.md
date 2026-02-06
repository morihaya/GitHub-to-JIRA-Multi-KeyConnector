# Edge Add-on Certification Notes

This document contains the certification notes for Edge Add-on submission.

---

## Extension Overview

GitHub to JIRA Multi-KeyConnector is a browser extension that automatically converts JIRA issue codes (e.g., PROJECT-123) into clickable links on GitHub pages.

## Testing Instructions

### Setup
1. Install the extension
2. Click the extension icon in the toolbar
3. Set JIRA URL (e.g., https://yourcompany.atlassian.net/)
4. Add JIRA project keys (e.g., PROJECT, ISSUE, BUG)
5. Click "Save Settings"

### Test Scenarios

**Test 1: PR/Issue Title Conversion**
1. Navigate to any GitHub Pull Request or Issue page
2. If the title contains a JIRA code matching your configured keys (e.g., "PROJECT-123 Fix bug"), it should become a clickable link

**Test 2: Comment Body Conversion**
1. On a GitHub PR/Issue page, scroll to comments
2. JIRA codes in comment text should be converted to clickable links

**Test 3: Issue/PR List Page**
1. Navigate to GitHub Issues or Pull Requests list page (e.g., github.com/owner/repo/issues)
2. JIRA codes in issue/PR titles should be converted to clickable links

**Test 4: Settings Persistence**
1. Configure settings and save
2. Close and reopen the browser
3. Click extension icon - settings should be preserved

### Expected Behavior
- JIRA codes matching configured keys become blue, clickable links
- Clicking a link opens the JIRA issue in a new tab
- Non-matching text remains unchanged
- Extension works on github.com/* URLs only

### Permissions Used
- storage: Save user settings (JIRA URL, project keys)
- host_permissions (github.com): Modify GitHub pages to add links

### No Backend/Account Required
This extension works entirely client-side. No login or external service connection is required.
