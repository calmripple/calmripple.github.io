---
isTimeLine: true
title: 定时器实现
date: 2020-05-03T00:00:00.000Z
tags:
  - 面试题
  - 算法
  - 代码题
categories:
  - 面试题
  - 代码题
---
# 定时器实现
>借助requestAnimationFrame实现,精度更高
## mySetTimeout
```js
function mySetTimeout(callback, delay) {
  let timer; const start = Date.now()
  const loop = () => {
    if (start + delay > Date.now()) {
      timer = requestAnimationFrame(loop)
    }
    else {
      callback(timer)
    }
  }
  loop()
  return timer
}
```

## mySetInterval
```js
function mySetInterval(callback, delay) {
  let timer; let start = Date.now()
  const loop = () => {
    if (start + delay <= Date.now()) {
      callback(timer)
      start = Date.now()
    }
    timer = requestAnimationFrame(loop)
  }
  loop()
  return timer
}
```

<Citation type="转载" source="粥里有勺糖的博客" url="https://sugarat.top/interview/code/myClock.html" />
