---
on:
  issues:
    types: [opened]
permissions:
  contents: read
safe-outputs:
  add-comment:
    issues: true
  add-labels:
    allowed: ["*"]
---

# 課題の自動整理タスク
新しく作成されたIssueの内容を読み取って自律的に実行してください。
