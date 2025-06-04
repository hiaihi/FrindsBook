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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getUserInfo, getUserInfoById, sendFriendRequest, searchUsers } from '../api';

// 用户数据相关响应式变量
const username = ref(localStorage.getItem('username') || '未登录用户');
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

// 计算属性
const isSelf = computed(() => {
  return !route.params.userId || route.params.userId === localStorage.getItem('userId');
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
    
  } catch (error) {
    console.error('获取用户信息失败:', error);
    message.value = '加载用户信息失败，请重试';
  } finally {
    isLoading.value = false;
  }
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
  if (!localStorage.getItem('token')) {
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

// 跳转到用户主页
const goToUserProfile = (userId) => {
  showResults.value = false;
  searchQuery.value = '';
  
  if (userId === localStorage.getItem('userId')) {
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
  margin-top: 1rem;
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}

.profile-header {
  display: flex;
  gap: 2.5rem;
  margin-bottom: 2.5rem;
  align-items: flex-start;
}

.profile-avatar-container {
  position: relative;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  border: 4px solid #fff;
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
}

.profile-info h2 {
  margin: 0 0 1rem;
  font-size: 1.8rem;
  color: #222;
}

.profile-info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 0.8rem;
}

.profile-info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: #666;
  font-size: 14px;
  background: #f9f9f9;
  padding: 6px 12px;
  border-radius: 20px;
  transition: all 0.3s;
}

.profile-info-item:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

.profile-info-item i {
  color: #1890ff;
}

.stat-item {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f9f9f9;
  padding: 12px 20px;
  border-radius: 8px;
  transition: all 0.3s;
  min-width: 80px;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  background: #f0f7ff;
}

.stat-count {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1890ff;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 4px;
}

.search-container {
  position: relative;
  width: 300px;
  margin-left: 20px;
}

.search-input {
  width: 100%;
  padding: 10px 35px 10px 15px;
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
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  z-index: 1000;
  margin-top: 8px;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.search-result-item:hover {
  background: #f5f5f5;
}

.search-result-item:last-child {
  border-bottom: none;
}

.result-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
  border: 2px solid #f0f0f0;
}

.result-info {
  display: flex;
  flex-direction: column;
}

.result-name {
  font-weight: 500;
  color: #333;
}

.result-username {
  font-size: 12px;
  color: #999;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(24,144,255,0.3);
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

/* 响应式处理 */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .profile-info-container {
    width: 100%;
  }
  
  .profile-info-row {
    justify-content: center;
  }
  
  .profile-stats {
    justify-content: center;
  }
  
  .profile-nav {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .search-container {
    order: 3;
    width: 100%;
    margin: 1rem 0 0;
  }
  
  .user-info {
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .profile-stats {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .privacy-list {
    grid-template-columns: 1fr;
  }
}

/* 新增样式 */
.back-link {
  color: #1890ff;
  font-weight: 600;
  background: rgba(24, 144, 255, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  transition: all 0.3s;
}

.back-link:hover {
  background: rgba(24, 144, 255, 0.2);
  transform: translateX(-5px);
}

.user-banner {
  background: linear-gradient(to right, #e6f7ff, #f0f5ff);
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border-left: 4px solid #1890ff;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1890ff;
  font-size: 15px;
}

.banner-content i {
  font-size: 18px;
}

.banner-content strong {
  font-weight: 600;
  color: #333;
}

.private-info {
  border: 1px dashed #d9d9d9;
  background: #fafafa;
}

.privacy-indicator {
  margin-left: 8px;
  color: #999;
  font-size: 12px;
}

.add-friend-btn {
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.add-friend-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: all 0.6s;
}

.add-friend-btn:hover::before {
  left: 100%;
}

.message-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  background: #f5222d;
  color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.message-toast.success {
  background: #52c41a;
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* 响应式优化 */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .profile-info-container {
    width: 100%;
  }
  
  .profile-info-row {
    justify-content: center;
  }
  
  .profile-stats {
    justify-content: center;
  }
  
  .profile-nav {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .search-container {
    order: 3;
    width: 100%;
    margin: 1rem 0 0;
  }
  
  .user-info {
    margin-left: 0;
  }
  
  .user-banner {
    margin: 0 10px 20px;
  }
  
  .back-link {
    width: 100%;
    text-align: center;
    margin-bottom: 10px;
  }
}
</style>