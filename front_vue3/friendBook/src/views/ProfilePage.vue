<template>
  <div class="profile-page">
    <nav class="profile-nav">
      <router-link to="/" class="nav-link"><i class="fas fa-home"></i> 首页</router-link>
      <router-link v-if="isSelf" to="/friend-circle" class="nav-link"><i class="fas fa-users"></i> 朋友圈</router-link>
      <router-link v-if="isSelf" to="/friend-list" class="nav-link"><i class="fas fa-user-friends"></i> 好友列表</router-link>
      <router-link v-else to="/profile" class="nav-link back-link"><i class="fas fa-arrow-left"></i> 返回个人主页</router-link>
      <div class="search-container">
        <input  
          type="text" 
          v-model="searchQuery" 
          @input="handleSearch"
          placeholder="搜索用户名或昵称" 
          class="search-input"
        />
        <i class="fas fa-search search-icon"></i>
        <div class="search-results" v-if="searchResults.length > 0 && showResults">
          <div 
            v-for="user in searchResults" 
            :key="user._id"
            class="search-result-item"
            @click="goToUserProfile(user._id)"
          >
            <img :src="getUserAvatar(user.avatar)" alt="avatar" class="result-avatar">
            <div class="result-info">
              <div class="result-name">{{ user.nickname || user.username }}</div>
              <div class="result-username">@{{ user.username }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="user-info">
        <span>{{ username }}</span>
        <img :src="userAvatar" alt="avatar" class="avatar" @click="goToEditProfile">
      </div>
    </nav>
    
    <!-- 添加用户标识横幅，仅在访问他人主页时显示 -->
    <div v-if="!isSelf" class="user-banner">
      <div class="banner-content">
        <i class="fas fa-user-circle"></i>
        <span>您正在访问 <strong>{{ nickname || username }}</strong> 的个人主页</span>
      </div>
    </div>
    
    <div class="profile-content">
      <div class="profile-header">
        <div class="profile-avatar-container" @click="isSelf ? goToEditProfile : null" :class="{clickable: isSelf}">
          <img :src="userAvatar" alt="avatar" class="profile-avatar">
          <div class="edit-overlay" v-if="isSelf">
            <i class="fas fa-edit"></i>
            <span>编辑资料</span>
          </div>
        </div>
        <div class="profile-info-container">
          <div class="profile-info">
            <h2>{{ nickname || username }}</h2>
            <div class="profile-details">
              <div class="profile-info-row">
                <p v-if="location" class="profile-info-item">
                  <i class="fas fa-map-marker-alt"></i> {{ location }}
                </p>
                <p v-if="gender" class="profile-info-item">
                  <i class="fas fa-user"></i> 
                  {{ genderText }}
                </p>
              </div>
              <div class="profile-info-row">
                <!-- 根据隐私设置显示生日 -->
                <p v-if="birthday && (isSelf || privacy.showBirthday)" class="profile-info-item" :class="{'private-info': !privacy.showBirthday && isSelf}">
                  <i class="fas fa-birthday-cake"></i> {{ formattedBirthday }}
                  <span v-if="!privacy.showBirthday && isSelf" class="privacy-indicator"><i class="fas fa-lock"></i></span>
                </p>
                <!-- 根据隐私设置显示邮箱 -->
                <p v-if="email && (isSelf || privacy.showEmail)" class="profile-info-item" :class="{'private-info': !privacy.showEmail && isSelf}">
                  <i class="fas fa-envelope"></i> {{ email }}
                  <span v-if="!privacy.showEmail && isSelf" class="privacy-indicator"><i class="fas fa-lock"></i></span>
                </p>
              </div>
            </div>
            <div class="profile-stats-container">
              <div class="profile-stats">
                <div class="stat-item" @click="goToFriends">
                  <div class="stat-count">{{ friendsCount }}</div>
                  <div class="stat-label">好友</div>
                </div>
                <div class="stat-item" @click="goToFollowers">
                  <div class="stat-count">{{ followersCount }}</div>
                  <div class="stat-label">粉丝</div>
                </div>
                <div class="stat-item" @click="goToFollowing">
                  <div class="stat-count">{{ followingCount }}</div>
                  <div class="stat-label">关注</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="profile-bio" v-if="bio">
        <h3>个人简介</h3>
        <p>{{ bio }}</p>
      </div>
      <div class="profile-privacy" v-if="isSelf">
        <h3>隐私设置</h3>
        <ul class="privacy-list">
          <li>
            <i class="fas" :class="privacy.searchByUsername ? 'fa-check-circle' : 'fa-times-circle'"></i>
            {{ privacy.searchByUsername ? '允许' : '不允许' }}通过用户名搜索
          </li>
          <li>
            <i class="fas" :class="privacy.searchByNickname ? 'fa-check-circle' : 'fa-times-circle'"></i>
            {{ privacy.searchByNickname ? '允许' : '不允许' }}通过昵称搜索
          </li>
          <li>
            <i class="fas" :class="privacy.showBirthday ? 'fa-check-circle' : 'fa-times-circle'"></i>
            {{ privacy.showBirthday ? '公开' : '不公开' }}生日信息
          </li>
          <li>
            <i class="fas" :class="privacy.showEmail ? 'fa-check-circle' : 'fa-times-circle'"></i>
            {{ privacy.showEmail ? '公开' : '不公开' }}邮箱信息
          </li>
        </ul>
      </div>
      <div class="profile-actions">
        <button v-if="isSelf" class="btn btn-primary" @click="goToEditProfile"><i class="fas fa-edit"></i> 编辑个人资料</button>
        <button v-if="!isSelf" class="btn btn-success add-friend-btn" @click="addFriend" :disabled="addFriendLoading">
          <i class="fas" :class="addFriendLoading ? 'fa-spinner fa-spin' : 'fa-user-plus'"></i>
          {{ addFriendLoading ? '请求中...' : '加好友' }}
        </button>
        <div v-if="message" class="message-toast" :class="{success: !message.includes('失败')}">{{ message }}</div>
      </div>
      
      <!-- 用户发布的帖子区域 -->
      <div class="user-posts-section">
        <h3 class="section-title">
          <i class="fas fa-file-alt"></i>
          {{ isSelf ? '我的动态' : `${nickname || username}的动态` }}
        </h3>
        
        <div v-if="isLoadingPosts" class="loading-posts">
          <i class="fas fa-spinner fa-spin"></i>
          <span>加载中...</span>
        </div>
        
        <div v-else-if="userPosts.length === 0" class="no-posts">
          <i class="fas fa-inbox"></i>
          <p>{{ isSelf ? '你还没有发布任何动态' : '该用户还没有发布任何动态' }}</p>
          <button v-if="isSelf" class="btn btn-primary" @click="goToCreatePost">
            <i class="fas fa-plus"></i> 发布新动态
          </button>
        </div>
        
        <div v-else class="posts-container">
          <div v-for="post in userPosts" :key="post._id" class="post-card">
            <div class="post-header">
              <img :src="getUserAvatar(post.authorAvatar)" alt="avatar" class="post-avatar">
              <div class="post-info">
                <div class="post-author">{{ post.authorName }}</div>
                <div class="post-time">{{ formatPostTime(post.createdAt) }}</div>
              </div>
              <div v-if="isSelf" class="post-actions">
                <button class="btn-icon" @click="deleteUserPost(post._id)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            <div class="post-content">
              <p>{{ post.content }}</p>
              <div v-if="post.images && post.images.length > 0" class="post-images">
                <img 
                  v-for="(image, index) in post.images" 
                  :key="index" 
                  :src="image" 
                  alt="post image" 
                  class="post-image"
                  @click="showImagePreview(image)"
                >
              </div>
              
              <div v-if="post.tags && post.tags.length > 0" class="post-tags">
                <span v-for="(tag, index) in post.tags" :key="index" class="post-tag">
                  #{{ tag }}
                </span>
              </div>
            </div>
            
            <div class="post-footer">
              <div class="post-stats">
                <div class="stat">
                  <i class="fas fa-heart" :class="{ 'liked': isPostLiked(post) }" @click="toggleLike(post)"></i>
                  <span>{{ post.likes ? post.likes.length : 0 }}</span>
                </div>
                <div class="stat">
                  <i class="fas fa-comment"></i>
                  <span>{{ post.comments ? post.comments.length : 0 }}</span>
                </div>
              </div>
              
              <!-- 评论区 -->
              <div v-if="post.showComments" class="post-comments">
                <div v-for="comment in post.comments" :key="comment._id" class="comment">
                  <div class="comment-author">{{ comment.authorName || '用户' }}:</div>
                  <div class="comment-content">{{ comment.content }}</div>
                  <div v-if="comment.userId && localStorage?.getItem('userId') && comment.userId === localStorage.getItem('userId')" class="comment-actions">
                    <button class="btn-icon small" @click="deleteComment(post._id, comment._id)">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                
                <div class="comment-form">
                  <input 
                    type="text" 
                    v-model="post.newComment" 
                    placeholder="发表评论..." 
                    @keyup.enter="addComment(post._id, post.newComment, post)"
                  >
                  <button class="btn-icon" @click="addComment(post._id, post.newComment, post)">
                    <i class="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
              
              <button class="btn-text" @click="toggleComments(post)">
                {{ post.showComments ? '收起评论' : '查看评论' }}
              </button>
            </div>
          </div>
          
          <div v-if="hasMorePosts" class="load-more">
            <button class="btn btn-secondary" @click="loadMorePosts" :disabled="isLoadingMore">
              <i v-if="isLoadingMore" class="fas fa-spinner fa-spin"></i>
              <span>{{ isLoadingMore ? '加载中...' : '加载更多' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="theme-switch" @click="toggleTheme" :title="isDarkMode ? '切换到浅色模式' : '切换到深色模式'">
      <i class="fas" :class="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getUserInfo, getUserInfoById, sendFriendRequest, searchUsers, getUserPosts, likePost, unlikePost, addComment as apiAddComment, deleteComment as apiDeleteComment, deletePost } from '../api';

// 用户数据相关响应式变量
const username = ref(localStorage?.getItem('username') || '未登录用户');
const nickname = ref('');
const email = ref('');
const userAvatar = ref('');
const gender = ref('');
const birthday = ref('');
const location = ref('');
const bio = ref('');
const privacy = ref({
  searchByUsername: true,
  searchByNickname: true,
  showBirthday: true,
  showEmail: false
});

const router = useRouter();
const route = useRoute();

// 社交相关数据
const friendsCount = ref(0);
const followersCount = ref(0);
const followingCount = ref(0);

// 搜索相关变量
const searchQuery = ref('');
const searchResults = ref([]);
const searchTimeout = ref(null);
const showResults = ref(false);

// 状态变量
const addFriendLoading = ref(false);
const message = ref('');
const isLoading = ref(false);

// 帖子相关变量
const userPosts = ref([]);
const isLoadingPosts = ref(false);
const hasMorePosts = ref(false);
const isLoadingMore = ref(false);
const currentPage = ref(1);
const postsPerPage = ref(5);

// 计算属性
const isSelf = computed(() => {
  return !route.params.userId || route.params.userId === localStorage?.getItem('userId');
});

const genderText = computed(() => {
  switch(gender.value) {
    case 'male': return '男';
    case 'female': return '女';
    case 'other': return '其他';
    default: return '';
  }
});

const formattedBirthday = computed(() => {
  if (!birthday.value) return '';
  const date = new Date(birthday.value);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
});

// 主要数据加载函数
const loadUserData = async (userId) => {
  isLoading.value = true;
  try {
    let userData;
    if (userId && userId !== 'undefined') {
      userData = await getUserInfoById(userId);
    } else {
      userData = await getUserInfo();
    }
    
    // 更新响应式数据
    username.value = userData.username;
    nickname.value = userData.nickname || '';
    email.value = userData.email || '';
    userAvatar.value = userData.avatar 
      ? `http://localhost:3000${userData.avatar}?t=${Date.now()}` 
      : 'https://picsum.photos/50/50';
    gender.value = userData.gender || '';
    birthday.value = userData.birthday || '';
    location.value = userData.location || '';
    bio.value = userData.bio || '';
    
    // 更新隐私设置
    if (userData.privacy) {
      privacy.value = {
        searchByUsername: userData.privacy.searchByUsername ?? true,
        searchByNickname: userData.privacy.searchByNickname ?? true,
        showBirthday: userData.privacy.showBirthday ?? true,
        showEmail: userData.privacy.showEmail ?? false
      };
    }
    
    // 更新社交数据
    friendsCount.value = userData.friendsCount || 0;
    followersCount.value = userData.followersCount || 0;
    followingCount.value = userData.followingCount || 0;
    
    // 加载用户帖子
    loadUserPosts(userId || userData._id);
    
  } catch (error) {
    console.error('获取用户信息失败:', error);
    message.value = '加载用户信息失败，请重试';
  } finally {
    isLoading.value = false;
  }
};

// 加载用户帖子
const loadUserPosts = async (userId) => {
  isLoadingPosts.value = true;
  try {
    const posts = await getUserPosts(userId);
    // 为每个帖子添加UI状态属性
    userPosts.value = posts.map(post => ({
      ...post,
      showComments: false,
      newComment: ''
    }));
  } catch (error) {
    console.error('获取用户帖子失败:', error);
    message.value = '加载用户帖子失败，请重试';
    setTimeout(() => message.value = '', 3000);
  } finally {
    isLoadingPosts.value = false;
  }
};

// 加载更多帖子
const loadMorePosts = async () => {
  if (isLoadingMore.value) return;
  
  isLoadingMore.value = true;
  currentPage.value++;
  
  try {
    // 这里应该实现分页加载逻辑
    // 目前后端API还没有实现分页，这里只是UI展示
    setTimeout(() => {
      isLoadingMore.value = false;
      hasMorePosts.value = false; // 假设没有更多帖子了
    }, 1000);
  } catch (error) {
    console.error('加载更多帖子失败:', error);
    isLoadingMore.value = false;
  }
};

// 切换评论显示状态
const toggleComments = (post) => {
  post.showComments = !post.showComments;
};

// 添加评论
const addComment = async (postId, content, post) => {
  if (!content.trim()) return;
  
  try {
    const result = await apiAddComment(postId, content);
    // 更新评论列表
    if (result && result.comment) {
      if (!post.comments) post.comments = [];
      post.comments.push(result.comment);
      post.newComment = ''; // 清空评论输入框
    }
  } catch (error) {
    console.error('添加评论失败:', error);
    message.value = '添加评论失败，请重试';
    setTimeout(() => message.value = '', 3000);
  }
};

// 删除评论
const deleteComment = async (postId, commentId) => {
  try {
    await apiDeleteComment(postId, commentId);
    // 更新UI
    const postIndex = userPosts.value.findIndex(p => p._id === postId);
    if (postIndex !== -1) {
      userPosts.value[postIndex].comments = userPosts.value[postIndex].comments.filter(
        comment => comment._id !== commentId
      );
    }
  } catch (error) {
    console.error('删除评论失败:', error);
    message.value = '删除评论失败，请重试';
    setTimeout(() => message.value = '', 3000);
  }
};

// 检查帖子是否已点赞
const isPostLiked = (post) => {
  const userId = localStorage?.getItem('userId');
  return post.likes && post.likes.some(like => like.userId === userId);
};

// 切换点赞状态
const toggleLike = async (post) => {
  try {
    if (isPostLiked(post)) {
      await unlikePost(post._id);
      // 更新UI
      const userId = localStorage?.getItem('userId');
      post.likes = post.likes.filter(like => like.userId !== userId);
    } else {
      const result = await likePost(post._id);
      // 更新UI
      if (!post.likes) post.likes = [];
      post.likes.push({ userId: localStorage?.getItem('userId') });
    }
  } catch (error) {
    console.error('操作点赞失败:', error);
    message.value = '操作失败，请重试';
    setTimeout(() => message.value = '', 3000);
  }
};

// 删除帖子
const deleteUserPost = async (postId) => {
  if (!confirm('确定要删除这条动态吗？')) return;
  
  try {
    await deletePost(postId);
    // 更新UI
    userPosts.value = userPosts.value.filter(post => post._id !== postId);
    message.value = '删除成功';
    setTimeout(() => message.value = '', 3000);
  } catch (error) {
    console.error('删除帖子失败:', error);
    message.value = '删除失败，请重试';
    setTimeout(() => message.value = '', 3000);
  }
};

// 格式化帖子时间
const formatPostTime = (timestamp) => {
  if (!timestamp) return '';
  
  const postDate = new Date(timestamp);
  const now = new Date();
  const diffMs = now - postDate;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 30) return `${diffDay}天前`;
  
  return `${postDate.getFullYear()}-${postDate.getMonth() + 1}-${postDate.getDate()}`;
};

// 跳转到发布新动态页面
const goToCreatePost = () => {
  router.push('/friend-circle');
};

// 监听路由变化
watch(
  () => route.params.userId,
  (newUserId) => {
    loadUserData(newUserId);
  },
  { immediate: true }
);

// 组件挂载时检查登录状态
onMounted(() => {
  if (!localStorage?.getItem('token')) {
    router.push('/login');
  }
});

// 导航到编辑资料页面
const goToEditProfile = () => {
  router.push('/edit-profile');
};

// 添加好友功能
const addFriend = async () => {
  addFriendLoading.value = true;
  message.value = '';
  try {
    const receiverId = route.params.userId;
    await sendFriendRequest(receiverId);
    message.value = '好友请求已发送';
    setTimeout(() => message.value = '', 3000);
  } catch (e) {
    message.value = e.message || '发送好友请求失败';
    setTimeout(() => message.value = '', 3000);
  } finally {
    addFriendLoading.value = false;
  }
};

// 搜索处理函数
const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    showResults.value = false;
    return;
  }
  
  searchTimeout.value = setTimeout(async () => {
    try {
      const results = await searchUsers(searchQuery.value.trim());
      searchResults.value = results;
      showResults.value = true;
    } catch (error) {
      console.error('搜索失败:', error);
      message.value = '搜索失败，请重试';
      setTimeout(() => message.value = '', 3000);
    }
  }, 300);
};

// 处理用户头像URL
const getUserAvatar = (avatar) => {
  return avatar 
    ? `http://localhost:3000${avatar}?t=${Date.now()}`
    : 'https://picsum.photos/50/50';
};

// 图片预览功能
const showImagePreview = (image) => {
  // 创建大图预览
  const previewContainer = document.createElement('div');
  previewContainer.style.position = 'fixed';
  previewContainer.style.top = '0';
  previewContainer.style.left = '0';
  previewContainer.style.width = '100%';
  previewContainer.style.height = '100%';
  previewContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
  previewContainer.style.display = 'flex';
  previewContainer.style.justifyContent = 'center';
  previewContainer.style.alignItems = 'center';
  previewContainer.style.zIndex = '1000';
  previewContainer.style.cursor = 'pointer';
  
  const previewImage = document.createElement('img');
  previewImage.src = `http://localhost:3000${image}`;
  previewImage.style.maxWidth = '90%';
  previewImage.style.maxHeight = '90%';
  previewImage.style.borderRadius = '8px';
  previewImage.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
  
  previewContainer.appendChild(previewImage);
  document.body.appendChild(previewContainer);
  
  // 点击关闭预览
  previewContainer.addEventListener('click', () => {
    document.body.removeChild(previewContainer);
  });
};

// 跳转到用户主页
const goToUserProfile = (userId) => {
  showResults.value = false;
  searchQuery.value = '';
  
  if (userId === localStorage?.getItem('userId')) {
    // 如果是当前用户，使用replace避免历史记录堆积
    router.replace('/profile');
  } else {
    router.push(`/profile/${userId}`);
  }
};

// 点击页面其他地方时隐藏搜索结果
onMounted(() => {
  document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(e.target)) {
      showResults.value = false;
    }
  });
});
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

.profile-nav {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1.5rem;
  padding: 1rem 20px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border-radius: 8px;
  margin-bottom: 20px;
}

.nav-link {
  color: #555;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-link:hover {
  color: #1890ff;
  transform: translateY(-2px);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-left: auto;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid #f0f0f0;
  transition: all 0.3s;
}

.avatar:hover {
  border-color: #1890ff;
  transform: scale(1.05);
}

.profile-content {
  margin-top: 1.5rem; /* 调整上边距 */
  background: #fff;
  border-radius: 16px; /* 增加圆角 */
  padding: 2.5rem; /* 增加内边距 */
  box-shadow: 0 8px 24px rgba(0,0,0,0.1); /* 调整阴影 */
}

.profile-header {
  display: flex;
  gap: 2rem; /* 调整间距 */
  margin-bottom: 2rem; /* 调整下边距 */
  align-items: flex-start;
}

.profile-avatar-container {
  position: relative;
  width: 150px; /* 稍微增大头像尺寸 */
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  box-shadow: 0 6px 18px rgba(0,0,0,0.18);
  border: 5px solid #fff;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
}

.profile-avatar-container:hover .edit-overlay {
  opacity: 1;
}

.profile-avatar-container:hover {
  transform: scale(1.03);
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fdfdfd; /* 稍微调整背景色 */
  border-radius: 16px; /* 增加圆角 */
  padding: 2rem; /* 增加内边距 */
  box-shadow: 0 5px 15px rgba(0,0,0,0.07);
  transition: all 0.3s ease-in-out;
}

.profile-info:hover {
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  transform: translateY(-3px);
}

.profile-info h2 {
  margin: 0 0 1.2rem; /* 调整下边距 */
  font-size: 2rem; /* 调整字体大小 */
  color: #1a1a1a; /* 调整字体颜色 */
  font-weight: 600;
}

.profile-info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem; /* 调整间距 */
  margin-bottom: 1.2rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid #e9e9e9; /* 调整边框颜色 */
}

.profile-info-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.profile-info-item {
  display: flex;
  align-items: center;
  gap: 0.6rem; /* 调整间距 */
  margin: 0;
  color: #555; /* 调整字体颜色 */
  font-size: 0.95rem; /* 调整字体大小 */
  background: #f0f2f5; /* 调整背景色 */
  padding: 8px 14px; /* 调整内边距 */
  border-radius: 25px;
  transition: all 0.3s ease-in-out;
}

.profile-info-item:hover {
  background: #e6e8eb;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.profile-info-item i {
  color: #007bff; /* 调整图标颜色 */
  font-size: 1rem;
}

.stat-item {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8f9fa; /* 调整背景色 */
  padding: 1rem 1.5rem; /* 调整内边距 */
  border-radius: 12px; /* 增加圆角 */
  transition: all 0.3s ease-in-out;
  min-width: 90px; /* 调整最小宽度 */
  border: 1px solid #e9ecef;
}

.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.12);
  background: #e9f5ff; /* 调整悬浮背景色 */
  border-color: #b3d7ff;
}

.stat-count {
  font-size: 1.8rem; /* 调整字体大小 */
  font-weight: 700; /* 调整字重 */
  color: #007bff; /* 调整字体颜色 */
}

.stat-label {
  font-size: 0.85rem; /* 调整字体大小 */
  color: #495057; /* 调整字体颜色 */
  margin-top: 6px;
}

.search-container {
  position: relative;
  width: 320px; /* 调整宽度 */
  margin-left: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 18px; /* 调整内边距 */
  border: 1px solid #e8e8e8;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.3s;
  background: #f9f9f9;
}

.search-input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24,144,255,0.2);
  background: #fff;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-results {
  position: absolute;
  top: calc(100% + 10px); /* 调整与输入框的距离 */
  left: 0;
  width: 100%;
  max-height: 350px; /* 调整最大高度 */
  overflow-y: auto;
  background: white;
  border-radius: 10px; /* 增加圆角 */
  box-shadow: 0 8px 20px rgba(0,0,0,0.15); /* 调整阴影 */
  z-index: 1000;
  margin-top: 0; /* 移除原有 margin-top */
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 14px 16px; /* 调整内边距 */
  cursor: pointer;
  border-bottom: 1px solid #eef0f2; /* 调整边框颜色 */
  transition: background-color 0.25s ease-in-out;
}

.search-result-item:hover {
  background: #f0f8ff; /* 调整悬浮背景色 */
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-avatar {
  width: 40px; /* 调整头像大小 */
  height: 40px;
  border-radius: 50%;
  margin-right: 14px; /* 调整右边距 */
  object-fit: cover;
  border: 2px solid #e9ecef; /* 调整边框颜色 */
}

.result-info {
  display: flex;
  flex-direction: column;
  line-height: 1.4; /* 调整行高 */
}

.result-name {
  font-weight: 600; /* 调整字重 */
  color: #212529; /* 调整字体颜色 */
  font-size: 0.95rem;
}

.result-username {
  font-size: 0.8rem; /* 调整字体大小 */
  color: #6c757d; /* 调整字体颜色 */
}

.btn {
  padding: 0.7rem 1.4rem; /* 调整内边距 */
  border: none;
  border-radius: 8px; /* 增加圆角 */
  cursor: pointer;
  font-weight: 500;
  transition: all 0.25s ease-in-out;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  font-size: 0.95rem;
}

.btn-primary {
  background: linear-gradient(135deg, #1890ff, #007bff); /* 添加渐变背景 */
  color: white;
  box-shadow: 0 4px 10px rgba(0, 123, 255, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #007bff, #1890ff);
  box-shadow: 0 6px 14px rgba(0, 123, 255, 0.4);
  transform: translateY(-1px);
}

.btn-success {
  background: #52c41a;
  color: white;
}

.btn-success:hover {
  background: #73d13d;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(82,196,26,0.3);
}

.btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.profile-bio {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  transition: all 0.3s;
}

.profile-bio:hover {
  background: #f0f7ff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.profile-bio h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.profile-bio h3::before {
  content: '📝';
  font-size: 1.2rem;
}

.profile-bio p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.privacy-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.privacy-list li {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 10px 15px;
  background: #f9f9f9;
  border-radius: 8px;
  transition: all 0.3s;
}

.privacy-list li:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

.fa-check-circle {
  color: #52c41a;
  font-size: 1.1rem;
}

.fa-times-circle {
  color: #f5222d;
  font-size: 1.1rem;
}

.profile-privacy {
  margin-bottom: 2rem;
}

.profile-privacy h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
  font-size: 1.2rem;
}

.profile-privacy h3::before {
  content: '🔒';
  font-size: 1.2rem;
}

.profile-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.profile-stats-container {
  margin-top: 1.5rem;
}

.profile-stats {
  display: flex;
  gap: 1rem;
}

.user-posts-section {
  margin-top: 2rem;
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: all 0.3s;
}

.user-posts-section:hover {
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.3rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
  padding-bottom: 0.8rem;
  border-bottom: 2px solid #f0f0f0;
  color: #333;
}

.section-title i {
  color: #1890ff;
}

.loading-posts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: #999;
  gap: 1rem;
}

.loading-posts i {
  font-size: 2rem;
  color: #1890ff;
}

.no-posts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: #999;
  gap: 1rem;
}

.no-posts i {
  font-size: 3rem;
  color: #d9d9d9;
}

.no-posts p {
  margin: 0.5rem 0 1.5rem;
  font-size: 1.1rem;
}

.posts-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* 响应式网格布局 */
  gap: 20px; /* 增加网格间距 */
}

.post-card {
  background: #fff;
  border-radius: 12px; /* 增加圆角 */
  box-shadow: 0 6px 18px rgba(0,0,0,0.1); /* 调整阴影 */
  padding: 20px; /* 增加内边距 */
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
}

.post-card:hover {
  transform: translateY(-5px); /* 添加悬停效果 */
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px; /* 调整下边距 */
}

.post-avatar {
  width: 45px; /* 调整头像大小 */
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px; /* 调整右边距 */
  border: 2px solid #eee;
}

.post-info {
  flex-grow: 1;
}

.post-author {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem; /* 调整字体大小 */
}

.post-time {
  font-size: 0.85rem; /* 调整字体大小 */
  color: #777;
}

.post-actions {
  margin-left: auto;
}

.post-content {
  margin-bottom: 15px; /* 调整下边距 */
}

.post-content p {
  margin: 0 0 10px; /* 调整段落下边距 */
  line-height: 1.6; /* 调整行高 */
  color: #444;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); /* 响应式图片网格 */
  gap: 10px; /* 图片间距 */
  margin-top: 10px;
}

.post-image {
  width: 100%;
  height: auto; /* 保持图片比例 */
  border-radius: 8px; /* 增加圆角 */
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease-in-out;
}

.post-image:hover {
  transform: scale(1.02); /* 添加悬停放大效果 */
}

.post-tags {
  margin-top: 10px;
}

.post-tag {
  display: inline-block;
  background: #e9ecef; /* 调整背景色 */
  color: #495057; /* 调整字体颜色 */
  padding: 4px 8px;
  border-radius: 15px;
  font-size: 0.8rem;
  margin-right: 5px;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #eee; /* 添加顶部边框 */
  padding-top: 15px; /* 调整内边距 */
  margin-top: auto; /* 将 footer 推到底部 */
}

.post-stats {
  display: flex;
  gap: 20px; /* 调整统计数据间距 */
}

.stat {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #555;
  cursor: pointer;
  transition: color 0.3s ease-in-out;
}

.stat i {
  font-size: 1.1rem;
}

.stat .liked {
  color: #ff4d4f; /* 点赞后的颜色 */
}

.stat:hover {
  color: #1890ff; /* 悬停颜色 */
}

.post-comments {
  margin-top: 15px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.comment {
  display: flex;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.comment-author {
  font-weight: 600;
  margin-right: 5px;
  color: #333;
}

.comment-content {
  flex-grow: 1;
  color: #555;
}

.comment-actions {
  margin-left: 10px;
}

.comment-form {
  display: flex;
  margin-top: 15px;
}

.comment-form input {
  flex-grow: 1;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 20px;
  margin-right: 10px;
  font-size: 0.9rem;
}

.comment-form button {
  background: none;
  border: none;
  cursor: pointer;
  color: #1890ff;
  font-size: 1.2rem;
  transition: color 0.3s ease-in-out;
}

.comment-form button:hover {
  color: #007bff;
}

.btn-text {
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  font-size: 0.9rem;
  transition: color 0.3s ease-in-out;
}

.btn-text:hover {
  color: #007bff;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}

.loading-posts, .no-posts {
  text-align: center;
  padding: 40px 0;
  color: #777;
}

.loading-posts i, .no-posts i {
  font-size: 2rem;
  margin-bottom: 10px;
}

.no-posts button {
  margin-top: 20px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .posts-container {
    grid-template-columns: 1fr; /* 在小屏幕上堆叠 */
  }
}
</style>