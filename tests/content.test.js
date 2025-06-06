/**
 * @jest-environment jsdom
 */

describe('content.js functionality', () => {
  // Import the functions from content.js
  let contentScript;

  beforeEach(() => {
    // Reset document body for each test
    document.body.innerHTML = `
      <div class="js-issue-title">Test PR Title with PROJECT-123</div>
      <div class="comment-body">This is a comment with ISSUE-456 reference</div>
    `;

    // Reset mocks
    resetMocks();

    // Re-import the script to reset its state
    jest.isolateModules(() => {
      contentScript = require('../content');
    });
  });

  test('convertJiraCodesInElement converts issue codes to links', () => {
    // Create a mock element with JIRA codes
    const element = document.createElement('div');
    element.textContent = 'This contains PROJECT-123 and ISSUE-456 references';

    // Call the function directly
    const jiraUrl = 'https://example.atlassian.net/';
    const jiraKeys = ['PROJECT', 'ISSUE'];

    // Get the function from the module exports or global scope
    const convertJiraCodesInElement = contentScript?.convertJiraCodesInElement || window.convertJiraCodesInElement;

    // Execute the function
    convertJiraCodesInElement(element, jiraUrl, jiraKeys);

    // Verify links were created
    const links = element.querySelectorAll('a');
    expect(links.length).toBe(2);

    // Verify the first link
    expect(links[0].href).toBe('https://example.atlassian.net/browse/PROJECT-123');
    expect(links[0].textContent).toBe('PROJECT-123');
    expect(links[0].target).toBe('_blank');
    expect(links[0].rel).toBe('noopener noreferrer');

    // Verify the second link
    expect(links[1].href).toBe('https://example.atlassian.net/browse/ISSUE-456');
    expect(links[1].textContent).toBe('ISSUE-456');
  });

  test('convertJiraCodes fetches settings and processes the page', () => {
    // Mock the chrome.storage.sync.get function to return settings
    chrome.storage.sync.get.mockImplementation((defaults, callback) => {
      callback({
        jiraUrl: 'https://test.atlassian.net/',
        jiraKeys: ['PROJECT', 'ISSUE']
      });
    });

    // Get the function from the module exports or global scope
    const convertJiraCodes = contentScript?.convertJiraCodes || window.convertJiraCodes;

    // Call the function
    convertJiraCodes();

    // Check if chrome.storage.sync.get was called
    expect(chrome.storage.sync.get).toHaveBeenCalled();

    // Verify that links were created in the document
    const titleLinks = document.querySelector('.js-issue-title').querySelectorAll('a');
    expect(titleLinks.length).toBe(1);
    expect(titleLinks[0].href).toBe('https://test.atlassian.net/browse/PROJECT-123');

    const commentLinks = document.querySelector('.comment-body').querySelectorAll('a');
    expect(commentLinks.length).toBe(1);
    expect(commentLinks[0].href).toBe('https://test.atlassian.net/browse/ISSUE-456');
  });

  test('convertJiraCodes handles storage error gracefully', () => {
    // Set up Chrome runtime error
    chrome.runtime.lastError = { message: 'Test error' };

    // Mock the chrome.storage.sync.get function to simulate an error
    chrome.storage.sync.get.mockImplementation((defaults, callback) => {
      callback(defaults); // Just return the defaults as is
    });

    // Get the function
    const convertJiraCodes = contentScript?.convertJiraCodes || window.convertJiraCodes;

    // Call the function
    convertJiraCodes();

    // Verify chrome.storage.sync.get was called
    expect(chrome.storage.sync.get).toHaveBeenCalled();

    // Verify no links were created (function should exit early)
    const titleLinks = document.querySelector('.js-issue-title').querySelectorAll('a');
    expect(titleLinks.length).toBe(0);
  });
});
