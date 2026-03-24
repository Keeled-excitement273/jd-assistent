# JD Assistent Frontend

当前前端基于 Vue 3、Vite、Pinia、Vue Router 和 Tailwind CSS 构建，主要负责登录认证、任务创建、工作台总览、任务过程追踪以及简历结果预览。

## 当前版本

- `0.0.6`

## 本次更新说明

这次更新同时覆盖了展示安全性和视觉设计两部分，核心变化如下：

- 新增结果文本清洗链路，过滤 `【S】 / 【T】 / 【A】 / 【R】` 这类 STAR 标记残留、字面量 `\R`、零宽字符和常见控制字符，避免它们直接出现在预览和导出结果里。
- 简历预览改为更安全的文本渲染方式：先转义，再只对白名单内的 `**粗体**` 语法做最小格式化。
- 全局视觉系统从偏蓝色 SaaS 风格收敛为更克制的编辑台 / 纸面风格，强调更强的排版层级、更少的装饰噪音和更稳定的阅读体验。
- 首页上传流、任务过程页和简历预览页统一切换到新的设计语言，同时保留原有路由、鉴权、任务提交、SSE 追踪和导出逻辑。
- Dashboard、额度趋势、画像摘要、任务历史以及 Login / Register 页面已进一步统一到同一套视觉基线，避免页面之间出现风格断层。
- 新增前端管理员入口：管理员用户现在可以从顶部导航进入 Admin 页面，查看平台统计、用户列表和任务列表。
- Admin 页面现已支持更完整的管理能力：用户额度调整、用户与任务筛选、分页查看，以及更明确的无权限 / 失败反馈。

## 开发命令

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 主要目录

- `src/App.vue`：全局外壳、导航、主题切换入口
- `src/views/Home.vue`：任务创建首页
- `src/components/ResumeUploader.vue`：简历上传与 JD 输入
- `src/views/Dashboard.vue`：工作台总览
- `src/views/Login.vue`：登录 / 注册
- `src/views/TaskProcess.vue`：任务执行过程与结果预览
- `src/components/ResumePreview.vue`：结果清洗后的简历预览与安全格式化渲染
- `src/views/Admin.vue`：管理员页面，聚合平台统计、用户列表与任务列表
- `src/components/ProgressTracker.vue`：节点执行状态时间线
- `src/themes/*.js`：主题 token 定义
- `src/style.css`：全局设计 token 与共享样式基元
