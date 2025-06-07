// Set up Jest globals for all tests
global.jest = jest;
global.expect = expect;
global.test = test;
global.describe = describe;
global.beforeEach = beforeEach;
global.afterEach = afterEach;

// Mock for Chrome extension API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  runtime: {
    lastError: null,
  },
};

// Create a basic DOM environment for testing content script
document.body.innerHTML = `
  <div class="js-issue-title">Test PR Title with PROJECT-123</div>
  <div class="comment-body">This is a comment with ISSUE-456 reference</div>
`;

// Mock for MutationObserver
global.MutationObserver = class {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}
  disconnect() {}
};

// Helper to reset mocks between tests
global.resetMocks = () => {
  chrome.storage.sync.get.mockReset();
  chrome.storage.sync.set.mockReset();
  chrome.runtime.lastError = null;
};
