---
sidebar:
  title: 中等-数组去重
  step: 14
title: 笔试题-数组去重
date: 2021-03-07T00:00:00.000Z
tags:
  - 前端
  - JavaScript
categories:
  - 大前端
  - JavaScript
---
# 笔试题-数组去重

>这是一个比较常规的面试手写题,能够考查面试者对各种数据类型特性了解程度

与网上所叙述的常规`N种方法实现去重`又有些不一样

本文咱们先理清思路,然后顺着思路**使用朴素的代码进行实现**,并**满足一些特殊要求**

## 题目描述
实现一个`duplicate`方法,实现数组的去重

### 特殊要求
1. 考虑值类型与引用类型
   1. 引用类型只考虑普通`Array`与`Object`
   2. 可以不考虑Symbol与BigInt
2. 不考虑function
3. `{}`与`{}`,`{a:1,b:2}`与`{b:2,a:1}`,`[]`与`[]`算相等
   1. 即只要对象的每一项值都相等那么也算相等
4. **不能使用set** (直接使用set就降低了题目难度)

```js
function duplicate(arr){
    // ...code
}
```

## 题目分析
1. 首先需要考虑的值类型有5种
   * null
   * undefined
   * string
   * boolean
   * number
2. number 的话需要特殊考虑`NaN`
   * `NaN !== NaN` --> `true`
3. 判断步骤可以**先判断类型是否一致**,如果一致**再判断内容**
4. 按**题目特殊要求**判断引用类型是否相等的步骤
   1. 有朋友可能会说直接`JSON.stringify(obj)`,说明没有考虑周全,对象的键顺序不一致,导致stringify的结果不一致的问题

## 解题思路
1. (笔者) `判断两个引用类型是否值完全一致` 的思路
   1. 判断引用类型
      1. 数组
      2. 对象
   2. 数组
      1. 判断数组长度是否一致
      2. 逐项进行比较
   3. 对象
      1. 判断目标对象自身属性键的数量是否一致,一致再判断Ａ是否完全包含Ｂ的键
      2. 逐项判断值是否一致
6. 去重步骤思路
   1. 原数组记为`arr`,新数组记为`res`
   2. 遍历`arr`与`res`的每一项进行比较
      1. 先判断类型是否一致
      2. 都是值类型,则 `===` 比较
      3. 都是数组,则比较数组的每一项是否一致
      4. 都是对象,则比较是否拥有相同的键且键的值是一样
## 分步骤实现

### 功能函数实现
1. 判断类型是否一致
```js
function isSameType(a, b) {
    // 两者都是值类型
    if (typeof a === typeof b && !(a instanceof Object) && !(b instanceof Object)) {
        return true
    }

    // 两者都是对象
    if (a instanceof Object && b instanceof Object) {
        let aOk = a instanceof Array
        let bOk = b instanceof Array
        // 都是数组,或者都不是数组则ok --> aOK === bOk
        return aOk === bOk
    }
    return false
}
```
2. 判断是否是值/引用类型

>因为题目的引用类型只包含Array与Object,所以这里简单使用**instanceof**判断
```js
function isObject(a){
    return a instanceof Object
}

function isValueType(a){
    return !isObject(a)
}
```

3. 判断值类型的两者是否值一致

```js
function isSame(a, b) {
    // 为什么不用isNaN
    // 因为isNaN(undefined) 为true
    return (a === b) || (a !== a && b !== b)
}
```

4. 判断引用类型的两者是否一致
   
> 代码未做优化,可能有点💩💩(完全按照上述思路编写),有优化空间
```js
function isEqual(a, b) {
    if (!isSameType(a, b)) {
        return false
    }
    // 都是数组
    if (Array.isArray(a)) {
        if (a.length !== b.length) {
            return false
        }

        // 逐项判断
        for (let i = 0; i < a.length; i++) {
            let _a = a[i]
            let _b = b[i]
            // 类型不等
            if (!isSameType(_a, _b)) {
                return false
            }

            // 值类型,值不等
            if (isValueType(_a) && !isSame(_a, _b)) {
                return false
            }

            // 对象 - 递归判断了
            if(isObject(_a)&&!isEqual(_a,_b)){
                return false
            }
        }
    }
    else {
        // 都是普通对象
        let aKeys = Reflect.ownKeys(a)
        let bKeys = Reflect.ownKeys(b)

        // 键数量不一致
        if(aKeys.length!==bKeys.length){
            return false
        }

        for (const aKey of aKeys) {
            let _a = a[aKey]
            let _b = b[aKey]
            // 类型不等
            if (!isSameType(_a, _b)) {
                return false
            }

            // 值类型,值不等
            if (isValueType(_a) && !isSame(_a, _b)) {
                return false
            }

            // 对象 - 递归判断了
            if(isObject(_a)&&!isEqual(_a,_b)){
                return false
            }
        }
    }

    return true
}
```

准备工作到此算完成了,现在咱们**开始组装零件**

### 去重函数实现
```js
function duplicate(arr) {
    // 存放最终结果
    const res = []
    // 遍历咱们的原数组
    for (const a of arr) {
        // 判断是否存在
        let isExist = res.findIndex(b => {
            // 这里就变成了当前项与原来的每一项进行比较
            if (!isSameType(a, b)) {
                return false
            }
            if (isValueType(a) && !isSame(a, b)) {
                return false
            }

            if (isObject(a) && !isEqual(a, b)) {
                return false
            }

            return true
        }) !== -1

        // 不存在则放入
        if (!isExist) {
            res.push(a)
        }
    }
    return res
}
```

## 最终测试

测试数据
```js
let obj1 = { age: [1, 2, { data: [1, 2, 3], name: 'a' }], name: 'xm' }
let obj2 = { name: 'xm', age: [1, 2, { name: 'a', data: [1, 2, 3] }] }
let a = [1, 2, '1', '2', 1, null, null, undefined, undefined, {}, {}, [], [], [1], [1], [1, 2], [2, 1], ['1'], ['1'], obj1, obj2, false, false, NaN,NaN, true, true]
```

结果
```js
duplicate(a)
[
  1,
  2,
  '1',
  '2',
  null,
  undefined,
  {},
  [],
  [ 1 ],
  [ 1, 2 ],
  [ 2, 1 ],
  [ '1' ],
  { age: [ 1, 2, { data: [1, 2, 3], name: 'a' } ], name: 'xm' },
  false,
  NaN,
  true
]
```

## 总结
1. 考查知识点
   1. 类型判断
   2. 值类型特点
   3. 引用类型特点
   4. NaN的特点
2. 整个从代码量看下来,就是**判断两个对象是否值相等**那里稍微复杂一点
3. 做笔试题只要把**边界情况考虑清楚**,**理清思路**,在不考虑时间复杂度的时候,用朴素的代码就能完成

>笔者能力有限,代码如有bug,还行指正

<Citation type="转载" source="粥里有勺糖的博客" url="https://sugarat.top/coding/js/duplicate.html" />
