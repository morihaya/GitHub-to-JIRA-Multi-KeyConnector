// GitHub to JIRA Multi-KeyConnector — content script
// Converts JIRA issue keys (e.g. PROJ-123) into clickable links on GitHub.
// Supports both GitHub's legacy (Rails) UI and the current React/Primer UI.

// Custom logger that can be disabled in production
const logger = {
  enabled: false, // Set to false to disable all console output in production
  debug: function(...args) {
    if (this.enabled) {
      console.debug('[GitHub-to-JIRA]', ...args);
    }
  }
};

// Elements that may contain JIRA keys, across current and legacy GitHub UIs.
const TARGET_SELECTORS = [
  // Current React/Primer UI (Issues, PRs, commit lists)
  '[data-testid="issue-title"]',
  '[data-testid="issue-title-sticky"]',
  '[data-testid="issue-body"]',
  '[data-testid="comment-body"]',
  '[data-testid="commit-row-item"]',
  'h1[data-component="PH_Title"]',
  // Rendered markdown (stable across both UIs: comments, descriptions, README)
  '.markdown-body',
  // Legacy UI
  '.js-issue-title',
  '.gh-header-title',
  '.markdown-title',
  '.comment-body',
  '.js-comment-body',
  '.review-comment-body',
  '.js-issue-body',
  '.commit-message',
  '.commit-title',
  '.commit-desc'
].join(', ');

// Never rewrite text inside these elements.
const SKIP_CLOSEST = 'a, script, style, textarea, input, button';

// Inject link styling once. Uses GitHub's CSS variables so links follow
// the active color theme (light/dark), falling back to Primer blue.
function ensureLinkStyles() {
  if (document.getElementById('jira-link-styles')) return;
  const style = document.createElement('style');
  style.id = 'jira-link-styles';
  style.textContent = [
    '.jira-link { color: var(--fgColor-accent, #0969da); text-decoration: none; font-weight: 600; }',
    '.jira-link:hover { text-decoration: underline; }'
  ].join('\n');
  (document.head || document.documentElement).appendChild(style);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to convert JIRA issue codes to links
function convertJiraCodesInElement(element, jiraUrl, jiraKeys) {
  if (!element || !jiraKeys || jiraKeys.length === 0) return;
  // Skip elements that are (inside) links or form controls
  if (element.closest && element.closest(SKIP_CLOSEST)) return;

  const keysPattern = jiraKeys.map(escapeRegExp).join('|');
  const pattern = new RegExp(`\\b(?:${keysPattern})-\\d+\\b`, 'g');
  const baseUrl = jiraUrl.replace(/\/$/, '');

  // Collect matching text nodes first — replacing while walking is unsafe.
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest(SKIP_CLOSEST)) {
        return NodeFilter.FILTER_REJECT;
      }
      pattern.lastIndex = 0;
      return pattern.test(node.nodeValue)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    }
  });

  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach(node => {
    const text = node.nodeValue;
    const fragment = document.createDocumentFragment();
    pattern.lastIndex = 0;

    let lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
      }

      const link = document.createElement('a');
      link.href = `${baseUrl}/browse/${match[0]}`;
      link.textContent = match[0];
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'jira-link';
      fragment.appendChild(link);

      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    node.parentNode.replaceChild(fragment, node);
  });
}

// Main function to convert JIRA codes on the page
function convertJiraCodes() {
  chrome.storage.sync.get({
    jiraUrl: 'https://YOURORGNAME.atlassian.net/',
    jiraKeys: []
  }, function(items) {
    if (chrome.runtime.lastError) {
      logger.debug('設定の取得中にエラーが発生しました:', chrome.runtime.lastError.message);
      return;
    }
    if (!items.jiraKeys || items.jiraKeys.length === 0) {
      return; // No keys defined, nothing to do
    }

    ensureLinkStyles();

    document.querySelectorAll(TARGET_SELECTORS).forEach(element => {
      convertJiraCodesInElement(element, items.jiraUrl, items.jiraKeys);
    });
  });
}

// Run conversion now and again after the given delays, to catch content
// that GitHub's React UI loads asynchronously (timelines, comments, ...).
function scheduleConvert(delays = [0, 600, 1500]) {
  delays.forEach(delay => {
    setTimeout(() => {
      try {
        convertJiraCodes();
      } catch (e) {
        logger.debug('Conversion failed:', e);
      }
    }, delay);
  });
}

// Detect GitHub's soft navigations (React Router / Turbo) and dynamically
// loaded content with a single MutationObserver.
// Note: patching history.pushState does NOT work here — content scripts run
// in an isolated world, so the page's own pushState calls never hit a patch.
function setupGitHubNavigationDetection() {
  let lastUrl = location.href;
  let debounceTimer = null;

  const observer = new MutationObserver(function(mutations) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(function() {
      // Soft navigation: the URL changed without a full page load
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        logger.debug('GitHub navigation detected to:', location.href);
        scheduleConvert([0, 600, 1500]);
        return;
      }

      // Otherwise convert only when relevant content was added
      const hasRelevantContent = mutations.some(mutation =>
        Array.from(mutation.addedNodes).some(node =>
          node.nodeType === Node.ELEMENT_NODE &&
          (node.matches(TARGET_SELECTORS) || node.querySelector(TARGET_SELECTORS))
        )
      );
      if (hasRelevantContent) {
        convertJiraCodes();
      }
    }, 300);
  });

  observer.observe(document, {
    subtree: true,
    childList: true
  });

  // Back/forward navigation
  window.addEventListener('popstate', function() {
    logger.debug('History popstate detected');
    scheduleConvert([300, 800]);
  });

  // Turbo/pjax page loads (legacy GitHub pages still fire these DOM events)
  ['turbo:load', 'turbo:render', 'pjax:end'].forEach(eventName => {
    document.addEventListener(eventName, function() {
      logger.debug(`${eventName} detected`);
      scheduleConvert([0, 600]);
    });
  });
}

function init() {
  setupGitHubNavigationDetection();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scheduleConvert());
  } else {
    scheduleConvert();
  }

  // Late-loading content after full page load
  window.addEventListener('load', () => scheduleConvert([500, 1500, 3000]));

  // Re-run when the user changes settings in the popup
  if (chrome.storage.onChanged && chrome.storage.onChanged.addListener) {
    chrome.storage.onChanged.addListener(function(changes, areaName) {
      if (areaName === 'sync' && (changes.jiraKeys || changes.jiraUrl)) {
        convertJiraCodes();
      }
    });
  }
}

init();

// Export functions for testing (will be ignored by the browser)
try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      convertJiraCodesInElement,
      convertJiraCodes,
      setupGitHubNavigationDetection
    };
  }
} catch (_e) {
  // Ignore errors in browser environment where module may not be defined
}
