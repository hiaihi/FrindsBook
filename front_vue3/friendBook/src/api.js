import axios from 'axios';

// 创建axios实例
// 配置基础URL、超时时间和默认请求头
const api = axios.create({
  baseURL: 'http://localhost:3000', // 后端API基础地址
  timeout: 10000, // 请求超时时间10秒
  headers: {
    'Content-Type': 'application/json' // 默认请求头为JSON格式
  }
});

// 请求拦截器 - 添加token到请求头
// 在每次请求发送前自动执行，用于添加认证信息
api.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    // 如果token存在，添加到请求头的Authorization字段
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    // 请求错误处理，直接拒绝Promise
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理常见错误
// 在每次响应返回后自动执行，用于统一错误处理
api.interceptors.response.use(
  response => response, // 成功响应直接返回
  error => {
    // 处理401未授权错误
    if (error.response && error.response.status === 401) {
      // 清除本地存储的token和用户名
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      // 重定向到登录页面
      window.location.href = '/login';
    }
    // 其他错误直接拒绝Promise
    return Promise.reject(error);
  }
);

// 用户注册
export const register = async (userData) => {
  try {
    const response = await api.post('/api/users/register', userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '网络错误，请稍后再试' };
  }
};

// 用户登录
export const login = async (credentials) => {
  try {
    const response = await api.post('/api/users/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '网络错误，请稍后再试' };
  }
};

// 获取用户信息
export const getUserInfo = async () => {
  try {
    const response = await api.get('/api/users/profile');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '获取用户信息失败' };
  }
};

// 搜索用户
export const searchUsers = async (query) => {
  try {
    const response = await api.get(`/api/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('搜索用户失败:', error);
    throw error.response ? error.response.data : { message: '搜索用户失败，请稍后再试' };
  }
};

// 根据ID获取用户信息
export const getUserInfoById = async (userId) => {
  try {
    const response = await api.get(`/api/users/profile/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '获取用户信息失败' };
  }
};

// 获取好友列表
export const getFriendsList = async () => {
  try {
    const response = await api.get('/api/users/friends');
    return response.data;
  } catch (error) {
    console.error('获取好友列表失败:', error);
    return [];
  }
};

// 发送好友请求
export const sendFriendRequest = async (receiverId) => {
  try {
    const response = await api.post('/api/users/friend-request', { receiverId });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '网络错误，请稍后再试' };
  }
};

// 获取收到的好友请求
export const getFriendRequests = async () => {
  try {
    const response = await api.get('/api/users/friend-requests');
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '网络错误，请稍后再试' };
  }
};

// 处理好友请求（同意/拒绝）
export const handleFriendRequest = async (requestId, action) => {
  try {
    const response = await api.post('/api/users/handle-friend-request', { requestId, action });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '网络错误，请稍后再试' };
  }
};

// 接受好友请求
export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await api.post('/api/users/acceptFriendRequest', { requestId });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '接受好友请求失败' };
  }
};

// 更新用户个人信息
export const updateUserProfile = async (formData) => {
  try {
    // 使用配置的api实例，方法改为POST，匹配后端路由定义
    // Axios会自动处理FormData的Content-Type
    const response = await api.post('/api/users/updateProfile', formData);
    return response.data;
  } catch (error) {
    // 添加与其他API调用一致的错误处理
    throw error.response ? error.response.data : { message: '更新用户信息失败，请稍后再试' };
  }
};

// 上传用户头像
export const uploadAvatar = async (avatarFile) => {
  try {
    const formData = new FormData();
    formData.append('avatarFile', avatarFile);
    
    const response = await api.post('/api/users/uploadAvatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '头像上传失败，请稍后再试' };
  }
};

// 获取帖子列表
export const getPosts = async () => {
  try {
    const response = await api.get('/api/posts');
    return response.data;
  } catch (error) {
    console.error('获取帖子失败:', error);
    throw error.response ? error.response.data : { message: '获取帖子失败，请稍后再试' };
  }
};

// 创建新帖子
export const createPost = async (postData) => {
  try {
    const response = await api.post('/api/posts', postData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '创建帖子失败，请稍后再试' };
  }
};

// 点赞帖子
// 点赞帖子
export const likePost = async (postId) => {
  try {
    // 从localStorage获取当前用户ID
    const userId = localStorage.getItem('userId');
    // 在请求体中包含userId
    const response = await api.post(`/api/posts/${postId}/like`, { userId });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '点赞失败，请稍后再试' };
  }
};

// 取消点赞帖子
// 取消点赞帖子
export const unlikePost = async (postId) => {
  try {
    // 从localStorage获取当前用户ID
    const userId = localStorage.getItem('userId');
    // 在请求体中包含userId
    const response = await api.post(`/api/posts/${postId}/unlike`, { userId });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '取消点赞失败，请稍后再试' };
  }
};

// 添加评论
export const addComment = async (postId, content) => {
  try {
    // 从localStorage获取当前用户ID
    const userId = localStorage.getItem('userId');
    // 在请求体中包含userId
    const response = await api.post(`/api/posts/${postId}/comment`, { content, userId });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '评论失败，请稍后再试' };
  }
};

// 删除评论
export const deleteComment = async (postId, commentId) => {
  try {
    // 从localStorage获取当前用户ID
    const userId = localStorage.getItem('userId');
    // 在请求体中包含userId
    const response = await api.delete(`/api/posts/${postId}/comment/${commentId}`, { data: { userId } });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '删除评论失败，请稍后再试' };
  }
};

// 删除帖子
export const deletePost = async (postId) => {
  try {
    // 从localStorage获取当前用户ID
    const userId = localStorage.getItem('userId');
    // 在请求体中包含userId
    const response = await api.delete(`/api/posts/${postId}`, { data: { userId } });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: '删除帖子失败，请稍后再试' };
  }
};

// AI功能：图片生成文案
export const generateTextFromImageAPI = async (imageData) => {
  try {
    // 创建加载状态提示
    const loadingToast = document.createElement('div');
    loadingToast.className = 'ai-loading-toast';
    loadingToast.innerHTML = '<div class="ai-loading-spinner"></div><span>AI正在分析图片...</span>';
    document.body.appendChild(loadingToast);
    
    // 发送请求到后端API
    const response = await api.post('/api/ai/generate-text', { imageData });
    
    // 移除加载提示
    document.body.removeChild(loadingToast);
    
    return response.data;
  } catch (error) {
    console.error('图片生成文案失败:', error);
    
    // 显示错误提示
    const errorToast = document.createElement('div');
    errorToast.className = 'ai-loading-toast error';
    errorToast.innerHTML = '<span class="ai-error-icon">!</span><span>图片分析失败，请稍后再试</span>';
    document.body.appendChild(errorToast);
    
    // 3秒后移除错误提示
    setTimeout(() => {
      if (document.body.contains(errorToast)) {
        document.body.removeChild(errorToast);
      }
    }, 3000);
    
    throw error.response ? error.response.data : { message: '图片生成文案失败，请稍后再试' };
  }
};

// AI功能：文案生成图片
export const generateImageFromTextAPI = async (textContent) => {
  try {
    // 创建加载状态提示
    const loadingToast = document.createElement('div');
    loadingToast.className = 'ai-loading-toast';
    loadingToast.innerHTML = '<div class="ai-loading-spinner"></div><span>AI正在生成图片...</span>';
    document.body.appendChild(loadingToast);
    
    // 发送请求到后端API
    const response = await api.post('/api/ai/generate-image', { textContent });
    
    // 移除加载提示
    document.body.removeChild(loadingToast);
    
    return response.data;
  } catch (error) {
    console.error('文案生成图片失败:', error);
    
    // 显示错误提示
    const errorToast = document.createElement('div');
    errorToast.className = 'ai-loading-toast error';
    errorToast.innerHTML = '<span class="ai-error-icon">!</span><span>图片生成失败，请稍后再试</span>';
    document.body.appendChild(errorToast);
    
    // 3秒后移除错误提示
    setTimeout(() => {
      if (document.body.contains(errorToast)) {
        document.body.removeChild(errorToast);
      }
    }, 3000);
    
    throw error.response ? error.response.data : { message: '文案生成图片失败，请稍后再试' };
  }
};

export default api;