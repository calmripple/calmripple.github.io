<!--
🧪 【中文注释】
  工具名称: Pinia测试模式
  功能分类: 测试辅助
  功能说明: 提供 Pinia 测试的常用代码片段和模式，便于快速编写和复用测试逻辑。
  使用方式: 在 VS Code 编辑 Pinia 测试文件时，参考或插入此文档中的代码片段。
  关键标签: Pinia、测试片段、代码复用、单元测试
-->

# Pinia Testing Snippets (Cookbook-Aligned)

Use these patterns directly when writing tests with `@pinia/testing`.

## Component mount with `createTestingPinia`

```ts
import { mount } from "@vue/test-utils";
import { createTestingPinia } from "@pinia/testing";
import { vi } from "vitest";

const wrapper = mount(ComponentUnderTest, {
  global: {
    plugins: [
      createTestingPinia({
        createSpy: vi.fn,
      }),
    ],
  },
});
```

## Execute real actions

Use this only when behavior inside the action must run.
If the test only checks call/no-call expectations, keep default stubbing (`stubActions: true`).

```ts
const wrapper = mount(ComponentUnderTest, {
  global: {
    plugins: [
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      }),
    ],
  },
});
```

## Seed starting state

```ts
const wrapper = mount(ComponentUnderTest, {
  global: {
    plugins: [
      createTestingPinia({
        createSpy: vi.fn,
        initialState: {
          counter: { n: 10 },
          profile: { name: "Sherlock Holmes" },
        },
      }),
    ],
  },
});
```

## Use store in test and assert action call

```ts
const pinia = createTestingPinia({ createSpy: vi.fn });
const store = useCounterStore(pinia);

store.increment();
expect(store.increment).toHaveBeenCalledTimes(1);
```

## Add plugin under test

```ts
const wrapper = mount(ComponentUnderTest, {
  global: {
    plugins: [
      createTestingPinia({
        createSpy: vi.fn,
        plugins: [myPiniaPlugin],
      }),
    ],
  },
});
```

## Override and reset getters for edge tests

```ts
const pinia = createTestingPinia({ createSpy: vi.fn });
const store = useCounterStore(pinia);

store.double = 42;
expect(store.double).toBe(42);

// @ts-expect-error test-only reset
store.double = undefined;
```
