# 每日饮食记录

静态单页应用，由 Netlify 托管，并使用 Supabase Auth 和数据库同步用户数据。

## 本地预览

不要直接双击 `index.html`。在项目目录启动静态服务器：

```powershell
python -m http.server 8080
```

然后访问 <http://localhost:8080>。如果没有 Python，也可以使用 VS Code 的 Live Server。

单位换算和营养计算测试：

```powershell
node tests/nutrition.test.js
```

## ml 功能部署

首次部署支持 `ml` 的版本前，先在 Supabase SQL Editor 执行：

```text
supabase/migrations/20261021_add_ml.sql
```

迁移增加容量、包装标注数量和计量单位字段。可登记“每 30g”“每 250ml”等包装营养值，旧的 `g` 和“份”记录保持兼容。

## Netlify 预览

将 feature 分支推送到 GitHub，并在 Netlify 中创建 Deploy Preview。预览使用独立网址，不会覆盖生产站点。验证登录、食品登记、批量添加、云端刷新和导出后，再合并到 `main`。

## 营养成分表拍照识别

Netlify 会从仓库根目录的 `netlify.toml` 部署静态页面和 `netlify/functions`。在 Netlify 的环境变量中添加：

```text
OPENAI_API_KEY=你的 OpenAI API Key
```

可选配置：

```text
OPENAI_VISION_MODEL=gpt-4o-mini
SUPABASE_URL=https://dkdktlvesejghzcbeime.supabase.co
SUPABASE_ANON_KEY=项目的 publishable key
```

`OPENAI_API_KEY` 只能保存在 Netlify 环境变量中，不能写入前端文件或提交到 Git。设置后重新触发一次 Netlify 部署。登录网站，打开“登记新食品”，点击“拍摄营养成分表并自动填写”即可使用。

离线检查：

```powershell
node tests/analyze-nutrition.test.mjs
```
