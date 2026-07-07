/**
 * @jest-environment jsdom
 */
// Import the resetMocks function if not available globally
const resetMocks = global.resetMocks || (() => {
  // Fallback implementation if not available
  if (chrome && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get.mockReset && chrome.storage.sync.get.mockReset();
    chrome.storage.sync.set.mockReset && chrome.storage.sync.set.mockReset();
  }
  if (chrome && chrome.runtime) {
    chrome.runtime.lastError = null;
  }
});

describe('GitHub navigation detection', () => {
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

  test('setupGitHubNavigationDetection sets up mutation observer on the document', () => {
    // Get the function from the module exports
    const setupGitHubNavigationDetection = contentScript?.setupGitHubNavigationDetection;

    // Mock MutationObserver
    const observeSpy = jest.spyOn(MutationObserver.prototype, 'observe');

    // Call the function
    setupGitHubNavigationDetection();

    // Check if observe was called on the document
    expect(observeSpy).toHaveBeenCalledWith(document, {
      subtree: true,
      childList: true
    });
  });

  test('setupGitHubNavigationDetection adds popstate event listener', () => {
    // Mock window.addEventListener
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    // Get the function from the module exports
    const setupGitHubNavigationDetection = contentScript?.setupGitHubNavigationDetection;

    // Call the function
    setupGitHubNavigationDetection();

    // Check if popstate event listener was added
    expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
  });

  test('setupGitHubNavigationDetection listens for Turbo/pjax page loads', () => {
    // Mock document.addEventListener
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    // Get the function from the module exports
    const setupGitHubNavigationDetection = contentScript?.setupGitHubNavigationDetection;

    // Call the function
    setupGitHubNavigationDetection();

    // Check if Turbo/pjax event listeners were added
    expect(addEventListenerSpy).toHaveBeenCalledWith('turbo:load', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('pjax:end', expect.any(Function));
  });
});
