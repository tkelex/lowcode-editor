# 示例远程物料包

示例远程物料包用于证明物料可以独立构建、发布并通过宿主全局协议注册，而不进入编辑器或页面运行时的主 bundle。

## Language

**远程物料产物**：
由独立 Vite library build 生成的 IIFE entry 与 `manifest.json`；manifest 中的 SHA-384 integrity 必须与最终 entry 文件字节一致。
_Avoid_：编辑器主 bundle、服务端模块、运行时 `latest`

**编辑态定义**：
远程包随 bundle 提供的 dev/prod 映射、默认属性、setter、事件、方法和子节点能力描述；M5 只生成和验证该定义，编辑器注册由后续 loader 完成。
_Avoid_：当前编辑器 registry、已安装远程物料

**宿主共享依赖**：
物料运行时从 `window.__LOWCODE_MATERIAL_HOST__.shared` 取得 React、ReactDOM 和 Ant Design；这些库只能是 peer dependency，不能打进 IIFE。
_Avoid_：第二份 React、包内 Ant Design 副本

## Boundaries

- `src/index.ts` 只在浏览器执行，通过全局宿主注册，不访问 NestJS、Next.js 或数据库。
- `scripts/serve.mjs` 只用于本地模拟 OSS/CDN，提供静态文件和 CORS，不是生产 loader。
- 当前包不负责下载远程脚本、浏览器 SRI 校验、CSP/allowlist 或失败降级。
