---
isTimeLine: true
title: null是对象吗
date: 2020-04-14T00:00:00.000Z
tags:
  - 前端
  - JavaScript
categories:
  - 大前端
  - JavaScript
---
# null是对象吗

**null不是对象**

>虽然 typeof null 会输出 object，但是这只是 JS 存在的一个悠久 Bug。在 JS 的最初版本中使用的是 32 位系统，为了性能考虑使用低位存储变量的类型信息，000 开头代表是对象，然而 null 表示为全零，所以将它错误的判断为 object

<Citation type="转载" source="粥里有勺糖的博客" url="https://sugarat.top/interview/js/nullobj.html" />
