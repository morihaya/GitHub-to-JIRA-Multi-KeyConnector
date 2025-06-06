/**
 * @jest-environment jsdom
 */

describe('Mutation Observer functionality', () => {
  // Import the functions from content.js
  let contentScript;

  beforeEach(() => {
    // Reset document body for each test
    document.body.innerHTML = `
      <div id="test-container"></div>
    `;

    // Reset mocks
    resetMocks();

    // Mock the MutationObserver
    global.MutationObserver = jest.fn(callback => {
      return {
        observe: jest.fn(),
        disconnect: jest.fn(),
        callback,
        timeout: null
      };
    });

    // Re-import the script to reset its state
    jest.isolateModules(() => {
      contentScript = require('../content');
    });
  });

  test('MutationObserver is initialized when content is loaded', () => {
    // Check if MutationObserver was initialized
    expect(MutationObserver).toHaveBeenCalled();

    // Get the created observer instance
    const observerInstance = MutationObserver.mock.instances[0];

    // Check if observe was called when body is available
    if (document.body) {
      expect(observerInstance.observe).toHaveBeenCalledWith(document.body, {
        childList: true,
        subtree: true
      });
    }
  });

  test('MutationObserver calls convertJiraCodes when relevant nodes are added', () => {
    // Mock the convertJiraCodes function
    const convertJiraCodes = jest.fn();
    contentScript.convertJiraCodes = convertJiraCodes;

    // Get the created observer instance and its callback
    const observerInstance = MutationObserver.mock.instances[0];
    const observerCallback = MutationObserver.mock.calls[0][0];

    // Create a test node with a comment body
    const testNode = document.createElement('div');
    testNode.className = 'comment-body';
    testNode.textContent = 'This is a test with PROJECT-123';

    // Create a test mutation record
    const mutationRecord = {
      addedNodes: [testNode],
      type: 'childList'
    };

    // Call the observer callback with the test mutation
    observerCallback([mutationRecord]);

    // Set up the clock to fake setTimeout
    jest.useFakeTimers();

    // Fast forward the timer to trigger the debounced function
    jest.advanceTimersByTime(500);

    // Check if convertJiraCodes was called
    expect(convertJiraCodes).toHaveBeenCalled();

    // Restore the real timers
    jest.useRealTimers();
  });

  test('MutationObserver does not call convertJiraCodes for irrelevant nodes', () => {
    // Mock the convertJiraCodes function
    const convertJiraCodes = jest.fn();
    contentScript.convertJiraCodes = convertJiraCodes;

    // Get the created observer instance and its callback
    const observerInstance = MutationObserver.mock.instances[0];
    const observerCallback = MutationObserver.mock.calls[0][0];

    // Create a test node that's not a comment
    const testNode = document.createElement('div');
    testNode.className = 'not-a-comment';
    testNode.textContent = 'This is a test with PROJECT-123';

    // Create a test mutation record
    const mutationRecord = {
      addedNodes: [testNode],
      type: 'childList'
    };

    // Call the observer callback with the test mutation
    observerCallback([mutationRecord]);

    // Set up the clock to fake setTimeout
    jest.useFakeTimers();

    // Fast forward the timer to trigger the debounced function
    jest.advanceTimersByTime(500);

    // Check if convertJiraCodes was not called
    expect(convertJiraCodes).not.toHaveBeenCalled();

    // Restore the real timers
    jest.useRealTimers();
  });
});
