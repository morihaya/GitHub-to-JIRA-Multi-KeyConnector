/**
 * @jest-environment jsdom
 */

describe('Mutation Observer functionality', () => {
  // We don't need to import functions from content.js for this test

  beforeEach(() => {
    // Reset document body for each test
    document.body.innerHTML = `
      <div id="test-container"></div>
    `;

    // Define resetMocks if it doesn't exist
    if (typeof resetMocks !== 'function') {
      global.resetMocks = function() {
        if (chrome && chrome.storage && chrome.storage.sync) {
          if (chrome.storage.sync.get.mockReset) chrome.storage.sync.get.mockReset();
          if (chrome.storage.sync.set.mockReset) chrome.storage.sync.set.mockReset();
        }
        if (chrome && chrome.runtime) {
          chrome.runtime.lastError = null;
        }
        // Mock console methods
        console.error = jest.fn();
        console.log = jest.fn();
      };
    }

    // Reset chrome mocks if needed
    if (chrome && chrome.storage && chrome.storage.sync) {
      if (chrome.storage.sync.get.mockReset) chrome.storage.sync.get.mockReset();
      if (chrome.storage.sync.set.mockReset) chrome.storage.sync.set.mockReset();
    }
    if (chrome && chrome.runtime) {
      chrome.runtime.lastError = null;
    }

    // Mock console methods
    console.error = jest.fn();
    console.log = jest.fn();

    // Mock the MutationObserver
    const mockObserve = jest.fn();
    const mockDisconnect = jest.fn();

    global.MutationObserver = jest.fn(() => {
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        timeout: null
      };
    });

    // Make the mock observe function available on the prototype so it's properly tracked
    MutationObserver.prototype.observe = mockObserve;

    // Import the script to initialize MutationObserver
    require('../content');
  });

  test('MutationObserver is initialized when content is loaded', () => {
    // Check if MutationObserver was initialized
    expect(MutationObserver).toHaveBeenCalled();

    // Check if observe was called with document.body
    expect(MutationObserver.prototype.observe).toHaveBeenCalledWith(document.body, {
      childList: true,
      subtree: true
    });
  });
});
