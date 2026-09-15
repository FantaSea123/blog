#!/usr/bin/env node
/**
 * 笔记发布脚本
 * 用法: npm run publish
 *
 * 流程:
 * 1. 读取 _notes/ 收件目录里的所有 .md 文件（从 Trilium 导出的 Markdown 直接丢进来）
 * 2. 自动补充/修正 front-matter（标题、日期、分类）
 * 3. 移动到 source/_posts/ 并清空收件目录
 * 4. hexo clean && hexo generate && hexo deploy
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const NOTES_DIR = path.join(ROOT, '..', '_notes');
const POSTS_DIR = path.join(ROOT, '..', 'source', '_posts');
const DEFAULT_CATEGORY = '学习笔记';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

// 从 Markdown 内容中取标题：优先第一个 "# 标题"，否则用文件名
function extractTitle(content, filename) {
  const match = content.match(/^#\s+(.+?)\s*$/m);
  if (match) return match[1].trim();
  return filename.replace(/\.md$/i, '').trim();
}

function slugify(filename) {
  return filename
    .replace(/\.md$/i, '')
    .replace(/[\\/:*?"<>|#%&{}$!'@+`=\s]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'untitled';
}

// 补充 front-matter；已有完整 front-matter 的文件原样保留
function buildPost(filename, raw) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  let content = raw.replace(/\r\n/g, '\n').trimStart();

  // 已有 front-matter：确保 title/date 存在
  if (content.startsWith('---\n')) {
    const end = content.indexOf('\n---', 4);
    if (end !== -1) {
      const fm = content.slice(4, end);
      const body = content.slice(end + 4).replace(/^\n+/, '');
      const has = (key) => new RegExp(`^${key}:`, 'm').test(fm);
      let newFm = fm;
      if (!has('title')) newFm = `title: "${extractTitle(body, filename).replace(/"/g, '\\"')}"\n` + newFm;
      if (!has('date')) newFm = newFm + `\ndate: ${date}`;
      return `---\n${newFm.trim()}\n---\n\n${body}`;
    }
  }

  // 去掉正文开头与 front-matter 重复的 "# 标题" 行
  const title = extractTitle(content, filename);
  content = content.replace(/^#\s+.+?\s*\n/, (m) => (m.trim() === `# ${title}` ? '' : m));

  const fm = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: ${date}`,
    'categories:',
    `  - ${DEFAULT_CATEGORY}`,
    'tags: []',
    '---',
    '',
  ].join('\n');
  return fm + '\n' + content;
}

function main() {
  ensureDir(NOTES_DIR);
  ensureDir(POSTS_DIR);

  const files = fs.readdirSync(NOTES_DIR).filter((f) => f.toLowerCase().endsWith('.md'));
  if (files.length === 0) {
    console.log('📭 _notes/ 收件目录里没有新笔记，无需发布。');
    process.exit(0);
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const datePrefix = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

  const moved = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(NOTES_DIR, file), 'utf8');
    if (!raw.trim()) {
      console.log(`⚠️  跳过空文件: ${file}`);
      continue;
    }
    const postName = `${datePrefix}-${slugify(file)}.md`;
    fs.writeFileSync(path.join(POSTS_DIR, postName), buildPost(file, raw));
    fs.unlinkSync(path.join(NOTES_DIR, file));
    moved.push(`${file} -> source/_posts/${postName}`);
  }

  if (moved.length === 0) {
    console.log('⚠️  没有可发布的笔记。');
    process.exit(1);
  }
  console.log('📝 已整理以下笔记:\n  ' + moved.join('\n  '));

  console.log('\n🧹 hexo clean');
  execSync('npx hexo clean', { cwd: path.join(ROOT, '..'), stdio: 'inherit' });
  console.log('\n🔨 hexo generate');
  execSync('npx hexo generate', { cwd: path.join(ROOT, '..'), stdio: 'inherit' });

  if (process.argv.includes('--local')) {
    console.log('\n✅ 本地构建完成（--local 跳过部署）。运行 `npm run server` 可在 http://localhost:4000 预览。');
    return;
  }

  console.log('\n🚀 hexo deploy');
  execSync('npx hexo deploy', { cwd: path.join(ROOT, '..'), stdio: 'inherit' });

  console.log('\n✅ 发布完成！');
}

main();
