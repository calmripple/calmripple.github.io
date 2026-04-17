---
isTimeLine: true
title: 将任意类型转为Boolean的方案
date: 2020-09-11T00:00:00.000Z
tags:
  - 前端
  - JavaScript
categories:
  - 大前端
  - JavaScript
---
# 将任意类型转为Boolean的方案

## 1.Boolean函数
```js
Boolean('') // false
Boolean(1) // true
```

## 2.取反两次
```js
!!'' // false
```

<Citation type="转载" source="粥里有勺糖的博客" url="https://sugarat.top/interview/js/getBool.html" />
