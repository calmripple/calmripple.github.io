---
sidebar:
  title: 箭头函数
  step: 26
isTimeLine: true
title: 箭头函数?
date: 2020-04-14T00:00:00.000Z
tags:
  - 前端
  - JavaScript
categories:
  - 大前端
  - JavaScript
---
# 箭头函数?
## 简单使用
```js
const fn = () =>{
    return 666
}
```
## 特点
* 本身没有this,this由包裹箭头函数的第一个普通函数决定
* 箭头函数使用bind,call,this无效
* 不能当做构造函数,即不能使用new
* 没有arguments对象,可以使用``...rest``代替
* 不能使用yield命令,即不可以用作Generator函数

<Citation type="转载" source="粥里有勺糖的博客" url="https://sugarat.top/bigWeb/js/arrowfun.html" />
