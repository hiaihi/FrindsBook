# FriendsBook 社交平台

## 项目概述

FriendsBook是一个现代化社交平台，集成了AI图像描述生成功能，让用户分享生活更加便捷。本项目包含前端、后端和AI服务三个主要组件，提供完整的社交网络体验。

## 系统架构

项目由以下三个主要部分组成：

1. **前端应用 (front_vue3)**
   - 基于Vue 3和Vite构建的现代化单页应用
   - 提供用户友好的界面和交互体验
   - 支持图片上传、朋友圈发布、社交互动等功能

2. **后端服务 (friendBook_node)**
   - 基于Node.js的RESTful API服务
   - 处理用户认证、数据存储和业务逻辑
   - 与MongoDB数据库集成

3. **AI服务 (ai_service)**
   - 基于Python和Flask的AI图像处理服务
   - 使用BLIP模型和MarianMT翻译模型生成图像描述
   - 提供朋友圈风格的文案生成功能

## 功能特点

- 用户注册与登录
- 朋友圈发布与浏览
- 好友关系管理
- 私信聊天
- AI图像描述生成
- 多语言支持

## 快速开始

### 环境要求

- Node.js 14+
- Python 3.8+
- MongoDB
- CUDA支持（可选，用于AI服务GPU加速）

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/yourusername/FriendsBook.git
cd FriendsBook
```

2. **启动后端服务**

```bash
cd friendBook_node
npm install
npm start
```

3. **启动前端应用**

```bash
cd front_vue3/friendBook
npm install
npm run dev
```

4. **启动AI服务**

```bash
cd ai_service
pip install -r requirements.txt
python app.py
```

## 项目结构

```
.
├── ai_service/         # AI图像描述服务
├── data/               # 数据存储目录
├── friendBook_node/    # Node.js后端服务
└── front_vue3/         # Vue 3前端应用
```

## AI图像描述功能

本项目集成了先进的AI图像描述生成功能，可以自动为用户上传的图片生成朋友圈风格的文案。该功能基于BLIP图像理解模型和MarianMT翻译模型，支持多种风格的文本生成。

详细信息请参阅 [AI服务使用指南](./ai_service/README.md)。

## 贡献指南

欢迎贡献代码、报告问题或提出新功能建议。请遵循以下步骤：

1. Fork本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建一个Pull Request

## 许可证

本项目采用MIT许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 联系方式

如有任何问题或建议，请通过以下方式联系我们：

- 电子邮件：example@friendsbook.com
- 项目Issues：[GitHub Issues](https://github.com/yourusername/FriendsBook/issues)