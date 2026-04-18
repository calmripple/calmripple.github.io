declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, never>, Record<string, never>, any>
  export default component
}

// YAML/YML asset imports used by nolebase locales
declare module '*.yaml' {
  const content: Record<string, any>
  export default content
}

declare module '*.yml' {
  const content: Record<string, any>
  export default content
}
