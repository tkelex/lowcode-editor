# Page lifecycle owns published snapshot integrity

页面写入、版本创建或删除、发布状态和审计由同一个 Page lifecycle module 在数据库事务内维护。当前发布快照不能直接删除；取消发布先清空 `publishedVersionId`，避免 `isPublished=true` 却无法读取快照。Next.js 缓存失效属于远程副作用，在数据库提交后执行，失败不得回滚已经提交的页面状态。
