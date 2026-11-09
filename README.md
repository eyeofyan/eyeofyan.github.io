# yan — 个人网站

一个**零依赖、零构建**的深色霓虹个人主页。纯手写 HTML / CSS / JavaScript，打开就能用。

- 单页结构：首页 Hero / 关于我 / 技能树 / 经历 / 联系方式
- 终端打字机介绍、鼠标光晕、卡片聚光、滚动显现
- 完整响应式：桌面、平板、手机
- 支持键盘导航、`prefers-reduced-motion`、无 JS 降级
- 小彩蛋：在页面任意处键入 `sudo`

![桌面端预览](preview/desktop.png)

![移动端预览](preview/mobile.png)

---

## 本地打开

直接双击 `index.html` 即可。所有资源都是相对路径，不需要编译或安装依赖。

如果想用本地服务器预览（推荐，字体和路径行为更接近线上）：

```powershell
# 在 personal-site 目录下
python -m http.server 8000
# 然后打开 http://127.0.0.1:8000
```

---

## 文件结构

```
personal-site/
├─ index.html            # 页面结构与全部文案
├─ assets/
│  ├─ styles.css         # 设计变量、布局、动效、响应式
│  ├─ main.js            # 终端动画、导航、复制邮箱、彩蛋
│  └─ favicon.svg        # 站点图标（终端提示符）
├─ preview/
│  ├─ desktop.png        # 桌面端截图
│  └─ mobile.png         # 移动端截图
└─ README.md
```

---

## 必须替换的占位内容

目前的人设文案是围绕「信息技术安全在读 / 缓存垃圾」写的示例，发布前请按实际情况改一遍。

| 内容 | 当前位置 | 说明 |
| --- | --- | --- |
| 邮箱 `hi@yan.dev` | `index.html` 的 `mailto:`、`data-email`、侧边栏；`main.js` 的兜底值 | 改成你自己的邮箱，建议全部替换 |
| GitHub / X 链接 | `index.html` 底部 `social-row` | 目前指向官网首页，换成你的主页 |
| 名字 `yan` | 标题、logo、Hero、终端、页脚 | 全局搜索替换 |
| 学校 / 经历 / 技能 | `index.html` 的 About、Skills、Experience | 已按「广西机电职业技术学院 · 信息技术安全 · 专科在读」填写，如有变化请修改 |
| 缓存命中率 `6%` | `index.html` 中 3 处 `6%` | 彩蛋数字，可改成任意值 |
| 标题与描述 | `index.html` 的 `<title>`、`meta description`、`og:*` | 影响分享卡片与搜索摘要 |

> `hi@yan.dev` 只是示例域名。发布前一定要换成你能收信的地址，否则访客会发到不存在的地方。

---

## 改成你自己的

### 改文案

所有文字都在 `index.html` 里，按注释中的 `HERO` / `ABOUT` / `SKILLS` / `EXPERIENCE` / `CONTACT` 分区查找即可。技能标签、经历卡片、联系方式都是普通 HTML，直接增删。

### 改配色

在 `assets/styles.css` 顶部的 `:root` 里改设计变量：

```css
--bg: #05060a;        /* 页面底色 */
--cyan: #22d3ee;      /* 主霓虹色 */
--violet: #a78bfa;    /* 辅助霓虹色 */
--text: #eef1f8;      /* 主文字 */
--muted: #98a2b8;     /* 次要文字 */
--grad: linear-gradient(105deg, #22d3ee, #7dd3fc, #a78bfa);
```

改 `--cyan` / `--violet` 两个色值，全站的按钮、标签、光晕、终端提示符会一起变化。

### 改终端内容

打开 `assets/main.js`，找到 `terminalScript` 数组：

```js
const terminalScript = [
  { type: "cmd", text: "whoami" },
  { type: "out", html: '<span class="t-name">yan</span>' },
  // ...
];
```

`cmd` 是一行会逐字打出的命令，`out` 是命令输出（可写 HTML），最后 `{ type: "prompt" }` 会留下闪烁光标。改完保存刷新即可。

### 改字体

字体通过 Google Fonts 引入：Space Grotesk（拉丁标题）、JetBrains Mono（等宽）、Noto Sans SC（中文）。离线时会自动回退到系统字体（PingFang / 微软雅黑 / Consolas），不影响使用。

如果不想依赖 Google Fonts，删除 `index.html` 里的三行 `<link>`（preconnect 与 fonts.googleapis.com）即可，站点会完全离线可用。

### 改图标

`assets/favicon.svg` 是一个 `>_` 终端图标，直接编辑 SVG 即可；也可以换成自己的 `.ico` / `.png`，同时修改 `<link rel="icon">`。

---

## 部署

这是纯静态站点，把 `personal-site` 目录里的文件传到任意静态托管即可，无需构建命令。

**GitHub Pages**

1. 新建仓库，把文件推到仓库根目录。
2. Settings → Pages → Source 选择 `Deploy from a branch`，分支选 `main` / 根目录。
3. 等一分钟，访问 `https://<用户名>.github.io/<仓库名>/`。

**Netlify / Vercel / Cloudflare Pages**

- 直接把 `personal-site` 文件夹拖进 Netlify Drop，或导入仓库。
- Build command 留空，Output directory 填 `personal-site`（如果仓库根目录就是站点，则填 `/`）。
- 绑定自定义域名后，记得把 `index.html` 里的邮箱和链接再核对一遍。

---

## 一些实现说明

- **无框架**：没有 React / Vue / 构建工具，全部是浏览器原生能力，部署体积小。
- **动效**：使用 CSS animation / transition 与 IntersectionObserver；`prefers-reduced-motion: reduce` 下会自动关闭动画与终端逐字效果。
- **移动端菜单**：打开时锁定页面滚动，`Esc` 关闭，焦点会移入菜单；关闭后回到菜单按钮。
- **复制邮箱**：优先使用 Clipboard API，失败时回退到 `execCommand("copy")`，并给出 toast 提示。
- **无后端**：联系方式是 `mailto:`，没有表单、没有数据库、没有 Cookie 与统计脚本。

---

## 可以继续加的东西

- 项目 / 作品集卡片（当前按你的选择没有放）
- 文章列表或接入 RSS
- 中英双语切换
- 真正的 PGP 公钥与指纹（安全方向可以加分）
- 接入 Plausible / Umami 之类的隐私友好统计

需要的话，直接在这个页面上继续告诉我就行。
