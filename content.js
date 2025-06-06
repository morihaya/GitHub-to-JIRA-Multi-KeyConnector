// Function to convert JIRA issue codes to links
function convertJiraCodesInElement(element, jiraUrl, jiraKeys) {
  if (!element || !jiraKeys || jiraKeys.length === 0) return;

  // Create a pattern to match any of the specified JIRA keys followed by a number
  const keysPattern = jiraKeys.join('|');
  const pattern = new RegExp(`(${keysPattern})-\\d+`, 'g');

  // Recursive function to process text nodes
  function processNode(node) {
    // Only process text nodes
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      if (pattern.test(text)) {
        // Create a document fragment to hold the converted text
        const fragment = document.createDocumentFragment();

        // Reset the regex
        pattern.lastIndex = 0;

        let lastIndex = 0;
        let match;

        // Process all matches
        while ((match = pattern.exec(text)) !== null) {
          // Add text before the match
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
          }

          // Create a link for the JIRA issue that mimics GitHub's internal links
          const link = document.createElement('a');
          link.href = `${jiraUrl.replace(/\/$/, '')}/browse/${match[0]}`;
          link.textContent = match[0];
          link.target = '_blank';
          link.rel = 'noopener noreferrer'; // CSP対策: faviconの読み込みを防止
          link.className = 'jira-link'; // カスタムクラス名を追加

          // GitHubのリンクスタイルをインラインで適用（faviconの自動読み込みを抑制）
          link.style.color = '#0366d6';
          link.style.textDecoration = 'none';
          link.style.fontWeight = '600';

          // マウスオーバー効果をシミュレート
          link.addEventListener('mouseover', function() {
            this.style.textDecoration = 'underline';
          });
          link.addEventListener('mouseout', function() {
            this.style.textDecoration = 'none';
          });

          fragment.appendChild(link);

          lastIndex = pattern.lastIndex;
        }

        // Add any remaining text
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        // Replace the original text node with the fragment
        node.parentNode.replaceChild(fragment, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE &&
              !['A', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(node.nodeName)) {
      // Process child nodes of non-special elements
      Array.from(node.childNodes).forEach(processNode);
    }
  }

  // Start processing the element
  processNode(element);
}

// Main function to convert JIRA codes on the page
function convertJiraCodes() {
  chrome.storage.sync.get({
    jiraUrl: 'https://YOURORGNAME.atlassian.net/',
    jiraKeys: []
  }, function(items) {
    // エラーハンドリングを追加
    if (chrome.runtime.lastError) {
      console.debug('設定の取得中にエラーが発生しました:', chrome.runtime.lastError.message);
      return;
    }

    if (!items.jiraKeys || items.jiraKeys.length === 0) {
      return; // No keys defined, nothing to do
    }

    // Process both PR and Issue page content

    // Process title of PR or Issue
    const titles = document.querySelectorAll('.js-issue-title, .gh-header-title h1, .gh-header-title');
    titles.forEach(title => {
      convertJiraCodesInElement(title, items.jiraUrl, items.jiraKeys);
    });

    // Process all comment bodies (works for both PR and Issues)
    const commentBodies = document.querySelectorAll('.comment-body, .js-comment-body');
    commentBodies.forEach(body => {
      convertJiraCodesInElement(body, items.jiraUrl, items.jiraKeys);
    });

    // Process review comments (PR specific)
    const reviewComments = document.querySelectorAll('.review-comment-body');
    reviewComments.forEach(comment => {
      convertJiraCodesInElement(comment, items.jiraUrl, items.jiraKeys);
    });

    // Process PR/Issue descriptions
    const descriptions = document.querySelectorAll('.comment-body:first-of-type, .js-comment-body:first-of-type, .js-issue-body');
    descriptions.forEach(desc => {
      convertJiraCodesInElement(desc, items.jiraUrl, items.jiraKeys);
    });

    // Process commit messages
    const commitMessages = document.querySelectorAll('.commit-message, .commit-title, .commit-desc');
    commitMessages.forEach(message => {
      convertJiraCodesInElement(message, items.jiraUrl, items.jiraKeys);
    });

    // Process timeline comments
    const timelineComments = document.querySelectorAll('.timeline-comment-wrapper .comment-body, .js-timeline-item .comment-body, .js-timeline-item .js-comment-body');
    timelineComments.forEach(comment => {
      convertJiraCodesInElement(comment, items.jiraUrl, items.jiraKeys);
    });
  });
}

// GitHubのページ遷移を検知する（Turbolinks/pjax対応）
function setupGitHubNavigationDetection() {
  // URL変更を監視
  let lastUrl = location.href;

  // GitHubのTurbolinks/pjax遷移を検知するMutationObserver
  const navigationObserver = new MutationObserver(function(mutations) {
    // URLが変わったかチェック
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.debug('GitHub navigation detected to:', location.href);

      // ページ遷移を検知したらコード変換を実行（少し遅延させて実行）
      setTimeout(function() {
        try {
          convertJiraCodes();
        } catch (e) {
          console.debug('Navigation conversion failed:', e);
        }
      }, 300);

      // 複数回実行してコンテンツが完全に読み込まれたことを確認
      setTimeout(convertJiraCodes, 800);
      setTimeout(convertJiraCodes, 1500);
    }
  });

  // document全体の変更を監視
  navigationObserver.observe(document, {
    subtree: true,
    childList: true
  });

  // History APIを使った遷移の検知
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);

    // pushStateが実行された（内部遷移した）
    console.debug('History pushState detected');
    setTimeout(convertJiraCodes, 300);
    setTimeout(convertJiraCodes, 800);
  };

  // 戻る・進むボタン対応
  window.addEventListener('popstate', function() {
    console.debug('History popstate detected');
    setTimeout(convertJiraCodes, 300);
    setTimeout(convertJiraCodes, 800);
  });
}

// GitHubナビゲーション検知を初期化
setupGitHubNavigationDetection();

// より確実にコンテンツを変換するための複数段階でのロード処理

// すぐに最初の変換を試みる（早期実行）
setTimeout(function() {
  try {
    // ドキュメントの準備ができているか確認
    if (document.readyState === 'loading') {
      console.debug('ドキュメントがまだロード中です。後で再試行します。');
      return; // 後のイベントで処理される
    }
    convertJiraCodes();
  } catch (e) {
    console.debug('Early conversion attempt failed:', e);
  }
}, 0);

// DOMContentLoadedで実行
document.addEventListener('DOMContentLoaded', function() {
  // 複数のタイミングで実行して確実に処理
  try {
    convertJiraCodes();
    setTimeout(function() {
      try { convertJiraCodes(); } catch(e) { console.debug('DOMContentLoaded+300ms error:', e); }
    }, 300);
    setTimeout(function() {
      try { convertJiraCodes(); } catch(e) { console.debug('DOMContentLoaded+800ms error:', e); }
    }, 800);
  } catch(e) {
    console.debug('DOMContentLoaded execution error:', e);
  }
});

// ページが完全に読み込まれた後にも実行
window.addEventListener('load', function() {
  // ページロード完了後に実行
  convertJiraCodes();

  // GitHubのTurbolinksなどの動的ページ遷移後のために、複数回の遅延実行を行う
  setTimeout(function() {
    try { convertJiraCodes(); } catch(e) { console.debug('Load+500ms error:', e); }
  }, 500);
  setTimeout(function() {
    try { convertJiraCodes(); } catch(e) { console.debug('Load+1500ms error:', e); }
  }, 1500);
  setTimeout(function() {
    try { convertJiraCodes(); } catch(e) { console.debug('Load+3000ms error:', e); }
  }, 3000);
});

// Set up a mutation observer to catch dynamically loaded comments
const observer = new MutationObserver(function(mutations) {
  // Debounce the conversion to avoid running it too frequently
  if (observer.timeout) {
    clearTimeout(observer.timeout);
  }

  observer.timeout = setTimeout(function() {
    let shouldConvert = false;

    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (let j = 0; j < mutation.addedNodes.length; j++) {
          const node = mutation.addedNodes[j];
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for comment elements that might contain JIRA codes
            const hasComments = node.querySelector('.comment-body, .review-comment-body, .js-comment-body, .js-issue-body, .gh-header-title, .timeline-comment-wrapper');
            if (hasComments ||
                node.classList.contains('comment-body') ||
                node.classList.contains('review-comment-body') ||
                node.classList.contains('js-comment-body') ||
                node.classList.contains('js-issue-body') ||
                node.classList.contains('gh-header-title') ||
                node.classList.contains('js-issue-title')) {
              shouldConvert = true;
              break;
            }
          }
        }
      }
      if (shouldConvert) break;
    }

    if (shouldConvert) {
      convertJiraCodes();
    }
  }, 500); // Debounce delay
});

// Start observing as early as possible
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
} else {
  // ドキュメントがまだ完全にロードされていない場合は、body要素を待つ
  document.addEventListener('DOMContentLoaded', function() {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}
