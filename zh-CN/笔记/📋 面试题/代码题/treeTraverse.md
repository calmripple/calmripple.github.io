---
isTimeLine: true
title: 二叉树的遍历
date: 2020-05-03T00:00:00.000Z
tags:
  - 面试题
  - 算法
  - 代码题
  - 数据结构
categories:
  - 面试题
  - 代码题
---
# 二叉树的遍历
## 前序遍历
```js
function prePrint(root) {
  if (root) {
    console.log(root.val)
    prePrint(root.left)
    prePrint(root.right)
  }
}
```
## 中序遍历
```js
function prePrint(root) {
  if (root) {
    prePrint(root.left)
    console.log(root.val)
    prePrint(root.right)
  }
}
```
## 后序遍历
```js
function prePrint(root) {
  if (root) {
    prePrint(root.left)
    prePrint(root.right)
    console.log(root.val)
  }
}
```

## 层序遍历
```js
function sequenceTraversal(root) {
  if (!this.root) {
    return
  }
  const q = []
  q.push(this.root)
  while (q.length > 0) {
    const t = q.shift()
    console.log(t.value)
    if (t.left)
      q.push(t.left)
    if (t.right)
      q.push(t.right)
  }
}
```

