/**
 * @jest-environment jsdom
 */

describe('popup.js additional functionality', () => {
  // Import the functions from popup.js
  let popupScript;

  beforeEach(() => {
    // Set up a simple DOM for testing
    document.body.innerHTML = `
      <div class="container">
        <input type="text" id="jira-url" value="https://test.atlassian.net/">
        <div id="keys-container"></div>
        <input type="text" id="new-key" value="">
        <button id="add-key">Add</button>
        <button id="save">Save Settings</button>
        <div id="status"></div>
      </div>
    `;

    // Reset mocks directly without using resetMocks
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

    // Re-import the script to reset its state
    jest.isolateModules(() => {
      popupScript = require('../popup');
    });
  });

  test('createKeyElement creates a key element with correct structure', () => {
    // Get function directly from module or global scope
    const createKeyElement = popupScript?.createKeyElement || window.createKeyElement;

    // Test with a sample key
    const keyElement = createKeyElement('TEST-KEY');

    // Check structure of created element
    expect(keyElement.className).toBe('key-item');

    // Check if span with key text exists
    const keySpan = keyElement.querySelector('span');
    expect(keySpan).not.toBeNull();
    expect(keySpan.textContent).toBe('TEST-KEY');

    // Check if remove button exists and has correct properties
    const removeButton = keyElement.querySelector('button.remove-key');
    expect(removeButton).not.toBeNull();
    expect(removeButton.textContent).toBe('Remove');
  });

  test('remove button in key element removes the key when clicked', () => {
    // Get function directly from module or global scope
    const createKeyElement = popupScript?.createKeyElement || window.createKeyElement;

    // Create a test key element
    const keyElement = createKeyElement('TEST-KEY');

    // Add it to the container
    const keysContainer = document.getElementById('keys-container');
    keysContainer.appendChild(keyElement);

    // Verify it's in the DOM
    expect(keysContainer.children.length).toBe(1);

    // Get the remove button and click it
    const removeButton = keyElement.querySelector('button.remove-key');
    removeButton.click();

    // Check if the element was removed
    expect(keysContainer.children.length).toBe(0);
  });

  test('saveSettings handles storage error gracefully', () => {
    // Set up Chrome runtime error
    chrome.runtime.lastError = { message: 'Test error' };

    // Mock console methods
    console.error = jest.fn();
    console.log = jest.fn();

    // Mock chrome.storage.sync.set to simulate an error
    chrome.storage.sync.set.mockImplementation((data, callback) => {
      callback(); // Call the callback with the error present in runtime.lastError
    });

    // Call the saveSettings function
    const saveSettings = popupScript?.saveSettings || window.saveSettings;
    saveSettings();

    // Verify chrome.storage.sync.set was called
    expect(chrome.storage.sync.set).toHaveBeenCalled();

    // Check if error was logged with console.error instead of console.log
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('保存時にエラーが発生しました:'),
      expect.any(String)
    );

    // Check that the status element shows an error
    const status = document.getElementById('status');
    expect(status.textContent).toBe('Error saving settings!');
  });

  test('loadSettings handles storage error gracefully', () => {
    // Add a status element to the DOM
    const statusDiv = document.createElement('div');
    statusDiv.id = 'status';
    document.body.appendChild(statusDiv);

    // Set up Chrome runtime error
    chrome.runtime.lastError = { message: 'Test error' };

    // Mock console.log
    console.log = jest.fn();

    // Mock chrome.storage.sync.get to simulate an error
    chrome.storage.sync.get.mockImplementation((defaults, callback) => {
      callback(defaults); // Just pass through the defaults
    });

    // Call the loadSettings function
    const loadSettings = popupScript?.loadSettings || window.loadSettings;
    loadSettings();

    // Verify chrome.storage.sync.get was called
    expect(chrome.storage.sync.get).toHaveBeenCalled();

    // Check if error was logged - we changed from console.log to console.error
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('設定の読み込み時にエラーが発生しました:'),
      expect.any(String)
    );
  });
});
