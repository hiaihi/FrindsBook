# FriendsBook 前端应用

## 项目概述

FriendsBook前端应用是基于Vue 3和Vite构建的现代化单页应用，为用户提供友好的社交平台界面，支持朋友圈发布、好友互动、私信聊天等功能，并集成了AI图像描述生成功能。

## 技术栈

- **框架**：Vue 3
- **构建工具**：Vite
- **状态管理**：Pinia
- **路由**：Vue Router
- **UI组件库**：Element Plus
- **HTTP客户端**：Axios

## 功能特点

- 用户注册与登录
- 个人资料管理
- 朋友圈发布与浏览
- 图片上传与AI文案生成
- 好友关系管理
- 私信聊天系统
- 通知与提醒
- 响应式设计，支持多种设备

## 开发环境设置

### 推荐的IDE配置

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (并禁用Vetur)。

### 项目设置

```sh
npm install
```

### 开发模式编译和热重载

```sh
npm run dev
```

### 生产环境编译和压缩

```sh
npm run build
```

## 项目结构

```
src/
├── assets/          # 静态资源文件
├── components/      # 可复用组件
├── router/          # 路由配置
├── stores/          # Pinia状态管理
├── views/           # 页面视图组件
├── services/        # API服务和请求
├── utils/           # 工具函数
├── App.vue          # 根组件
└── main.js          # 应用入口
```

## 与后端和AI服务集成

本前端应用通过API与Node.js后端服务和Python AI服务进行通信：

- **后端服务**：处理用户认证、数据存储和业务逻辑
- **AI服务**：提供图像描述生成功能

### API集成示例

```javascript
// 图片描述生成
async function generateTextFromImage(imageData) {
  try {
    const response = await axios.post('http://localhost:5000/api/generate-text', {
      imageData: imageData
    });
    return response.data;
  } catch (error) {
    console.error('生成文案失败:', error);
    throw error;
  }
}
```

## 自定义配置

有关Vite配置的更多信息，请参阅[Vite配置参考](https://vitejs.dev/config/)。
