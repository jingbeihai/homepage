INSERT OR IGNORE INTO notes (title, slug, category, date, content, tags) VALUES
('Cloudflare 全家桶搭建完全指南', 'cloudflare-guide', '技术', '2026-06-15',
'从零开始使用 Cloudflare Pages、R2、Workers 和 DNS 搭建个人网站生态，涵盖域名配置、存储桶设置、Pages 部署以及国内访问加速的完整流程。

## 整体架构

我的个人网站架构由以下部分组成：

- **主页**（7988798.xyz）：托管在 Cloudflare Pages
- **博客**（blog.7988798.xyz）：同样托管在 Cloudflare Pages
- **网盘**（drive.7988798.xyz）：基于 R2 存储
- **国内加速**：腾讯云 + Caddy 反向代理

## 为什么选 Cloudflare

Cloudflare 提供了一套完整的免费工具链：Pages、R2、Workers、DNS，对于个人开发者几乎零成本。

> Caddy 反向代理是解决国内访问 Cloudflare Pages 速度问题的最佳方案。',
'["cloudflare","部署","dns"]'),

('Caddy 反向代理实践', 'caddy-proxy', '技术', '2026-06-10',
'38元/年腾讯云 + Caddy 自动 HTTPS，解决 CF Pages 国内访问慢的问题。',
'["caddy","反向代理","腾讯云"]'),

('CSS 现代特性笔记', 'css-modern', '笔记', '2026-06-05',
'@layer 级联层、light-dark() 主题函数、color-mix() 颜色混合。',
'["css","样式"]'),

('R2 Web 文件管理器', 'r2-web', '技术', '2026-05-20',
'基于 aws4fetch 的纯客户端 R2 管理器，拖拽上传、暗色模式。',
'["r2","cloudflare","前端"]'),

('为什么选 Cloudflare', 'why-cloudflare', '随笔', '2026-05-28',
'Pages 免费 CDN + R2 免流量 + Workers 边缘计算。',
'["cloudflare","选型"]');
