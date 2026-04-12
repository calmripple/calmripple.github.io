---
sidebar:
  title: 简单--斐波拉契数列1
  step: 9
isTimeLine: true
title: 斐波拉契数列
date: 2020-10-02T00:00:00.000Z
tags:
  - 编程
  - 算法
  - 数据结构
  - 编程实践
categories:
  - 编程开发
  - 算法
---
# 斐波拉契数列I

斐波那契数列示例： 

1，1，2，3，5，8，13，21，34 。。。。

实现这样一个函数，得到斐波拉契数列指定位置上的值

## 迭代
```js
/**
 * 求斐波拉契数列第n项
 * @param {number} index 
 * @returns {number}
 */
function fib(index) {
    let a = 1, b = 1, c = 0
    if (index === 1 || index === 2) {
        return 1
    }
    while (index-- > 2) {
        c = a + b
        a = b
        b = c
    }
    return c
};
```

## 递归
```js
/**
 * 求斐波拉契数列第n项
 * @param {number} index 
 * @returns {number}
 */
function fib(index) {
    if (index === 1 || index === 2) {
        return 1
    }
    return fib(index - 1) + fib(index - 2)
};
```

<Citation type="转载" source="粥里有勺糖的博客" url="https://sugarat.top/coding/algorithm/feibo1.html" />
