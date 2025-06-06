/**
 * @jest-environment jsdom
 */

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

    // Save original History API methods
    global.originalPushState = history.pushState;
    global.originalAddEventListener = window.addEventListener;

    // Mock history.pushState
    history.pushState = jest.fn();

    // Re-import the script to reset its state
    jest.isolateModules(() => {
      contentScript = require('../content');
    });
  });

  afterEach(() => {
    // Restore original History API methods
    if (global.originalPushState) {
      history.pushState = global.originalPushState;
    }
    if (global.originalAddEventListener) {
      window.addEventListener = global.originalAddEventListener;
    }
  });

  test('setupGitHubNavigationDetection sets up mutation observer', () => {
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

  test('setupGitHubNavigationDetection overrides history.pushState', () => {
    // Get the function from the module exports
    const setupGitHubNavigationDetection = contentScript?.setupGitHubNavigationDetection;

    // Call the function
    setupGitHubNavigationDetection();

    // Check if history.pushState was overridden
    expect(history.pushState).not.toBe(global.originalPushState);
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
});
