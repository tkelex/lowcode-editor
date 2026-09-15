# Page lifecycle owns published snapshot integrity

页面写入、版本创建或删除、发布状态和审计由同一个 Page lifecycle module 在数据库事务内维护。页面草稿通过 `Page.revision` 做乐观并发控制：PATCH 原子比较 `expectedRevision` 并递增 revision，比较失败时不覆盖草稿、不创建版本；回滚替换 schema 后同样递增 revision。发布和取消发布只改变发布状态，不改变草稿 revision。

当前发布快照不能直接删除；取消发布先清空 `publishedVersionId`，避免 `isPublished=true` 却无法读取快照。Next.js 缓存失效属于远程副作用，在数据库提交后执行，失败不得回滚已经提交的页面状态。
