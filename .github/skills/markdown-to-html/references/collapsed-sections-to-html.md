<!--
📝 【中文注释】
  工具名称: 折叠区转HTML
  功能分类: 文档生成
  功能说明: 用于展示 Markdown 折叠区域（<details>标签）转为 HTML 的效果，便于信息收纳。
  使用方式: 参考文档内容，或在 Copilot markdown-to-html skill 中查看折叠区转换示例。
  关键标签: 折叠区、HTML、Markdown、信息收纳
-->

# Collapsed Sections to HTML

## `<details>` Block (Raw HTML in Markdown)

### Markdown

````md
<details>

<summary>Tips for collapsed sections</summary>

### You can add a header

You can add text within a collapsed section.

You can add an image or a code block, too.

    ```ruby
    puts "Hello World"
    ```

</details>
````

---

### Parsed HTML

```html
<details>
  <summary>Tips for collapsed sections</summary>

  <h3>You can add a header</h3>

  <p>You can add text within a collapsed section.</p>

  <p>You can add an image or a code block, too.</p>

  <pre><code class="language-ruby">
puts "Hello World"
</code></pre>
</details>
```

#### Notes:

* Markdown **inside `<details>`** is still parsed normally.
* Syntax highlighting is preserved via `class="language-ruby"`.

---

## Open by Default (`open` attribute)

### Markdown

````md
<details open>

<summary>Tips for collapsed sections</summary>

### You can add a header

You can add text within a collapsed section.

You can add an image or a code block, too.

    ```ruby
    puts "Hello World"
    ```

</details>
````

### Parsed HTML

```html
<details open>
  <summary>Tips for collapsed sections</summary>

  <h3>You can add a header</h3>

  <p>You can add text within a collapsed section.</p>

  <p>You can add an image or a code block, too.</p>

  <pre><code class="language-ruby">
puts "Hello World"
</code></pre>
</details>
```

## Key Rules

* `<details>` and `<summary>` are **raw HTML**, not Markdown syntax
* Markdown inside `<details>` **is still parsed**
* Syntax highlighting works normally inside collapsed sections
* Use `<summary>` as the **clickable label**

## Paragraphs with Inline HTML & SVG

### Markdown

```md
You can streamline your Markdown by creating a collapsed section with the `<details>` tag.
```

### Parsed HTML

```html
<p>
  You can streamline your Markdown by creating a collapsed section with the <code>&lt;details&gt;</code> tag.
</p>
```

---

### Markdown (inline SVG preserved)

```md
Any Markdown within the `<details>` block will be collapsed until the reader clicks <svg ...></svg> to expand the details.
```

### Parsed HTML

```html
<p>
  Any Markdown within the <code>&lt;details&gt;</code> block will be collapsed until the reader clicks
  <svg version="1.1" width="16" height="16" viewBox="0 0 16 16"
       class="octicon octicon-triangle-right"
       aria-label="The right triangle icon"
       role="img">
    <path d="m6.427 4.427 3.396 3.396a.25.25 0 0 1 0 .354l-3.396 3.396A.25.25 0 0 1 6 11.396V4.604a.25.25 0 0 1 .427-.177Z"></path>
  </svg>
  to expand the details.
</p>
```
