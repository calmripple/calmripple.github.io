<!--
🧪 【中文注释】
  工具名称: Pinia测试模式
  功能分类: 测试辅助
  功能说明: 提供 Pinia 状态管理相关的测试代码片段和最佳实践。
  使用方式: 由单元测试工具自动加载，或在编写 Pinia 测试时参考。
  关键标签: 测试、Pinia、代码片段、最佳实践
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
