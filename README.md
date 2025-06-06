# GitHub to JIRA Multi-KeyConnector

A Microsoft Edge and Chrome extension that automatically converts JIRA issue codes (like PROJECT-123) to clickable links in GitHub Pull Request reviews and Issue pages. The extension enables one-way linking from GitHub to JIRA with support for multiple project keys.

## Features

- Converts JIRA issue codes to clickable links in GitHub Pull Request and Issue pages
- Customizable JIRA instance URL
- Support for multiple JIRA project keys
- Settings are saved across browser sessions

## Setup Instructions

1. Load the extension in Microsoft Edge:
   - Open Edge and navigate to `edge://extensions/`
   - Enable "Developer mode" using the toggle in the bottom-left corner
   - Click "Load unpacked" and select this directory

2. Configure the extension:
   - Click on the extension icon in your browser's toolbar
   - Set your JIRA URL (default is `https://YOURORGNAME.atlassian.net/`)
   - Add your JIRA project keys (e.g., PROJECT, FEAT, BUG)
   - Click "Save Settings"

3. Navigate to any GitHub Pull Request or Issue page, and JIRA issue codes will be automatically converted to clickable links

## Notes for Production Use

- For production use, convert the SVG icons in the `/images` folder to PNG files
- You can use the included `icon_generator.html` file to create proper PNG icons

## Troubleshooting

### Content Security Policy (CSP) Issues

- If you see CSP-related errors in the console about favicon loading, this is expected behavior due to GitHub's security restrictions
- The extension uses `rel="noopener noreferrer"` on generated links to prevent these issues
- The extension functionality should still work properly even if these warnings appear

## License

This software is licensed for use as is. This software comes with no warranty.
