# GitHub Copilot Instructions for GitHub-to-JIRA-Multi-KeyConnector

## リリース時のチェックリスト

機能が追加・修正された場合、以下のファイルを必ず更新すること。

### 1. バージョン番号の更新

以下の2つのファイルのバージョンを同時に更新する：

| ファイル | フィールド | 形式例 |
|---------|-----------|--------|
| `manifest.json` | `version` | `1.1`, `1.2` など |
| `package.json` | `version` | `1.1.0`, `1.2.0` など（セマンティックバージョニング） |

### 2. テストファイルの更新

変更内容に応じて、以下のテストファイルを更新する：

| 変更内容 | 対象テストファイル |
|---------|-------------------|
| JIRA コード変換ロジックの変更 | `tests/content.test.js` |
| 新しいセレクタの追加 | `tests/content.test.js` |
| MutationObserver関連の変更 | `tests/mutation_observer.test.js` |
| ページナビゲーション関連の変更 | `tests/navigation.test.js` |
| ポップアップUI関連の変更 | `tests/popup.test.js`, `tests/popup_additional.test.js` |

### 3. テストの実行

変更後は必ずテストを実行して全てパスすることを確認：

```bash
npm test
```

## コード変更時の注意点

### 新しいGitHub要素のサポートを追加する場合

1. `content.js` の `convertJiraCodes()` 関数内に新しいセレクタを追加
2. `content.js` の MutationObserver のセレクタリストにも同じクラスを追加
3. `tests/content.test.js` の `beforeEach` で新しい要素をDOMに追加
4. 新しいテストケースを追加して動作を検証

### 例：markdown-title サポートの追加時

```javascript
// convertJiraCodes() に追加
const listTitles = document.querySelectorAll('.markdown-title');
listTitles.forEach(title => {
  convertJiraCodesInElement(title, items.jiraUrl, items.jiraKeys);
});

// MutationObserver にも追加
const hasComments = node.querySelector('..., .markdown-title');
// および
node.classList.contains('markdown-title')
```
