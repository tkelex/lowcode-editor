export type AppView =
  | { name: 'auth' }
  | { name: 'dashboard' }
  | { name: 'editor'; pageId: number };
