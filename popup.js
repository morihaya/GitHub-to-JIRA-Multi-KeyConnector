document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  loadSettings();

  // Add event listeners
  document.getElementById('add-key').addEventListener('click', addKey);
  document.getElementById('save').addEventListener('click', saveSettings);
  document.getElementById('new-key').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addKey();
    }
  });
});

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get({
    jiraUrl: 'https://YOURORGNAME.atlassian.net/',
    jiraKeys: []
  }, function(items) {
    // エラーハンドリング
    if (chrome.runtime.lastError) {
      // Use console.error for critical issues
      console.error('設定の読み込み時にエラーが発生しました:', chrome.runtime.lastError.message);
      return;
    }

    document.getElementById('jira-url').value = items.jiraUrl;

    // Display saved keys
    const keysContainer = document.getElementById('keys-container');
    keysContainer.innerHTML = '';

    items.jiraKeys.forEach(function(key) {
      const keyElement = createKeyElement(key);
      keysContainer.appendChild(keyElement);
    });
  });
}

// Save settings to storage
function saveSettings() {
  const jiraUrl = document.getElementById('jira-url').value;
  const keyElements = document.querySelectorAll('.key-item span');
  const jiraKeys = Array.from(keyElements).map(span => span.textContent);

  // Update status immediately to provide feedback
  const status = document.getElementById('status');
  status.textContent = 'Saving...';

  chrome.storage.sync.set({
    jiraUrl: jiraUrl,
    jiraKeys: jiraKeys
  }, function() {
    // エラーハンドリング
    if (chrome.runtime.lastError) {
      console.error('保存時にエラーが発生しました:', chrome.runtime.lastError.message);
      status.textContent = 'Error saving settings!';
      return;
    }

    // Update status to let user know settings were saved
    status.textContent = 'Settings saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 1500);
  });
}

// Add a new JIRA key
function addKey() {
  const newKeyInput = document.getElementById('new-key');
  const key = newKeyInput.value.trim().toUpperCase();

  if (key) {
    // Check if key already exists
    const existingKeys = Array.from(document.querySelectorAll('.key-item span')).map(span => span.textContent);
    if (!existingKeys.includes(key)) {
      const keyElement = createKeyElement(key);
      document.getElementById('keys-container').appendChild(keyElement);
      newKeyInput.value = '';
    } else {
      alert('This key already exists!');
    }
  }
}

// Create a key element with delete button
function createKeyElement(key) {
  const keyDiv = document.createElement('div');
  keyDiv.className = 'key-item';

  const keySpan = document.createElement('span');
  keySpan.textContent = key;
  keyDiv.appendChild(keySpan);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Remove';
  deleteButton.className = 'remove-key';
  deleteButton.addEventListener('click', function() {
    keyDiv.remove();
  });

  keyDiv.appendChild(deleteButton);
  return keyDiv;
}

// Export functions for testing (will be ignored by the browser)
try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      loadSettings,
      saveSettings,
      addKey,
      createKeyElement
    };
  }
} catch (e) {
  // Ignore errors in browser environment where module may not be defined
}
