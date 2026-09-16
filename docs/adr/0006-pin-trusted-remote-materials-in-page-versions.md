# 可信远程物料由页面版本固定并仅在客户端注册

远程物料采用 owner 管理的可信 manifest、IIFE 产物和宿主全局注册协议，不在 NestJS 或 Next.js 服务端执行远程 JavaScript，也不在渲染时解析 `latest`。页面保存只使用持久化 manifest 元数据构建动态 schema registry，`Page` 与每个 `PageVersion` 固定实际使用的包版本、entry 和 integrity；因此项目升级不会改写既有发布快照，代价是重新发布或回滚前必须确认对应固定版本仍处于项目启用状态。

宿主提供唯一的 React、ReactDOM 和 Ant Design 实例，注册时校验协议、schema、共享依赖版本、manifest 声明和组件名冲突。M6 客户端 loader 进一步执行 HTTPS/本地协议限制、origin allowlist、manifest 固定快照复核、entry 字节级 SRI、浏览器 `<script integrity>`、超时、去重和失败降级；CSP 仍由部署响应头配置。本决策不把可信远程代码包装成任意第三方代码沙箱。

`apps/remote-material-example` 是该决策的独立产物样例：Vite 输出 IIFE 和 manifest，SHA-384 integrity 按最终 entry 生成，React/ReactDOM/Ant Design 保持 peer dependency，并通过本地 CORS 静态服务模拟 OSS/CDN。编辑器加载项目当前启用版本，Publisher 加载发布快照固定版本；两者都只在浏览器执行 IIFE。
