---
sidebar:
  title: extend API
  step: 4
isTimeLine: true
title: extendAP
date: 2020-04-14T00:00:00.000Z
tags:
  - 前端
  - Vue
  - JavaScript
categories:
  - 大前端
  - Vue
---
# extend API
扩展组件生成一个构造器，通常会与 $mount 一起使用

## 简单使用
```html
<div id="app"></div>
<script>
    let Component = Vue.extend({
        template: '<div>{{param1}}</div>',
        data(){
            return{
                param1:666
            }
        }
    })
    // 挂载到 #app 上
    new Component().$mount('#app')
</script>
```

## 扩展现有组件
接着上面的示例
```html
<script>
    let SuperComponent = Vue.exte   (Component)
    new SuperComponent({
        created() {
            console.log(1)
        }
    })
    // 挂载到 #app 上
    new SuperComponent().$mount('#app')
</script>
```

<Citation type="转载" source="粥里有勺糖的博客" url="https://sugarat.top/bigWeb/vue/extend.html" />
