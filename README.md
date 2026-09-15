#（hexo 博客）

个人学习笔记博客，基于 [Hexo](https://hexo.io/) + [Butterfly 主题](https://github.com/jerryc127/hexo-theme-butterfly)，部署在 GitHub Pages。

## 目录结构

```
blog/
├── _notes/            # 📥 笔记收件目录（从 Trilium 导出的 Markdown 丢这里）
├── source/_posts/     # 正式文章（由发布脚本自动生成，一般不用手动改）
├── bin/sync-notes.js  # 发布脚本
├── _config.yml        # 站点配置
└── _config.butterfly.yml  # 主题配置
```

## 日常发布流程（三步）

1. **导出笔记**：在 Trilium 里选中要发布的笔记 → 右键 → Export as Markdown，把导出的 `.md` 文件放进 `blog/_notes/` 目录
2. **发布**：在 `blog/` 目录下运行：
   ```bash
   npm run publish          # 整理笔记 + 生成 + 部署上线
   npm run publish -- --local  # 只整理和本地生成，不部署（先本地看看效果）
   ```
3. 脚本会自动：补充文章标题/日期/分类（默认"学习笔记"）→ 移入 `source/_posts/` → 生成静态页 → 推送到 GitHub Page
## 本地预览

```bash
npm run server    # 打开 http://localhost:4000/blog/
```
## GitHub 部署配置（首次需完成）

1. 配置 git 身份：
   ```bash
   git config --global user.name "你的GitHub用户名"
   git config --global user.email "你的GitHub noreply邮箱"
   ```
2. 在 GitHub 上创建仓库 `blog`（公开）
3. 把 `_config.yml` 底部 `deploy.repo` 改成 `https://github.com/<你的用户名>/blog.git`
4. 配置认证（任选其一）：
   - `gh auth login`（装了 GitHub CLI 的话）
   - 配置 SSH key 并把 repo 改成 `git@github.com:<用户名>/blog.git`
   - 使用 Personal Access Token：`https://<用户名>:<token>@github.com/<用户名>/blog.git`
5. 推送博客源码：`git push -u origin main`
6. 在仓库 Settings → Pages → Source 选 `gh-pages` 分支，之后访问 `https://<用户名>.github.io/blog/`

> 注意：`_config.yml` 里当前的 URL 和 repo 地址写的是占位用户名，部署前记得改成你自己的。
