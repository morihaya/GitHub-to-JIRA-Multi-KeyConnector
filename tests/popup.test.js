/**
 * @jest-environment jsdom
 */

describe('popup.js functionality', () => {
  // Import the functions from popup.js
  let popupScript;

  beforeEach(() => {
    // Set up the DOM for popup.html
    document.body.innerHTML = `
      <div class="container">
        <input type="text" id="jira-url" value="">
        <div id="keys-container"></div>
        <input type="text" id="new-key" value="NEW-KEY">
        <button id="add-key">Add</button>
        <button id="save">Save Settings</button>
        <div id="status"></div>
      </div>
    `;

    // Reset mocks
    resetMocks();

    // Re-import the script to reset its state
    jest.isolateModules(() => {
      popupScript = require('../popup');
    });

    // Simulate DOMContentLoaded to initialize the script
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  test('loadSettings should populate UI elements with stored settings', () => {
    // Mock chrome.storage.sync.get to return test settings
    chrome.storage.sync.get.mockImplementation((defaults, callback) => {
      callback({
        jiraUrl: 'https://test.atlassian.net/',
        jiraKeys: ['TEST', 'PROJ']
      });
    });

    // Call loadSettings function
    const loadSettings = popupScript?.loadSettings || window.loadSettings;
    loadSettings();

    // Check if the UI is updated correctly
    expect(document.getElementById('jira-url').value).toBe('https://test.atlassian.net/');
    
    // Check if keys were added to the container
    const keysContainer = document.getElementById('keys-container');
    expect(keysContainer.children.length).toBe(2);
    
    // Check the content of the keys
    const keyElements = keysContainer.querySelectorAll('.key-item span');
    expect(keyElements[0].textContent).toBe('TEST');
    expect(keyElements[1].textContent).toBe('PROJ');
  });

  test('saveSettings should save the current UI state', () => {
    // Set up the UI state
    document.getElementById('jira-url').value = 'https://new.atlassian.net/';
    
    // Add keys to the container
    const keysContainer = document.getElementById('keys-container');
    keysContainer.innerHTML = `
      <div class="key-item"><span>KEY1</span><button class="remove-key">Remove</button></div>
      <div class="key-item"><span>KEY2</span><button class="remove-key">Remove</button></div>
    `;

    // Call saveSettings function
    const saveSettings = popupScript?.saveSettings || window.saveSettings;
    saveSettings();

    // Check if chrome.storage.sync.set was called with the correct data
    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      jiraUrl: 'https://new.atlassian.net/',
      jiraKeys: ['KEY1', 'KEY2']
    }, expect.any(Function));

    // Check if the status was updated
    const status = document.getElementById('status');
    expect(status.textContent).toBe('Settings saved.');
  });

  test('addKey should add a new key to the container', () => {
    // Set up the new key input
    document.getElementById('new-key').value = 'NEWKEY';

    // Call addKey function
    const addKey = popupScript?.addKey || window.addKey;
    addKey();

    // Check if the key was added to the container
    const keysContainer = document.getElementById('keys-container');
    expect(keysContainer.children.length).toBe(1);
    
    // Check the content of the key
    const keyElement = keysContainer.querySelector('.key-item span');
    expect(keyElement.textContent).toBe('NEWKEY');

    // Check if the input was cleared
    expect(document.getElementById('new-key').value).toBe('');
  });

  test('addKey should not add duplicate keys', () => {
    // Add a key first
    const keysContainer = document.getElementById('keys-container');
    keysContainer.innerHTML = `
      <div class="key-item"><span>DUPKEY</span><button class="remove-key">Remove</button></div>
    `;

    // Set up the new key input with the same key
    document.getElementById('new-key').value = 'DUPKEY';

    // Mock window.alert
    window.alert = jest.fn();

    // Call addKey function
    const addKey = popupScript?.addKey || window.addKey;
    addKey();

    // Check if the alert was shown
    expect(window.alert).toHaveBeenCalledWith('This key already exists!');
    
    // Check that no new key was added
    expect(keysContainer.children.length).toBe(1);
  });
});
