<template>
  <div class="edit-profile-page">
    <nav class="profile-nav">
      <router-link to="/profile" class="nav-link back-link">
        <i class="fas fa-arrow-left"></i> 返回个人主页
      </router-link>
      <span class="nav-title">编辑个人信息</span>
    </nav>
    
    <!-- 消息提示组件 -->
    <div v-if="message.show" class="message-toast" :class="message.type">
      <i class="fas" :class="message.icon"></i>
      <span>{{ message.text }}</span>
    </div>
    
    <div class="edit-profile-content">
      <div class="avatar-section">
        <div class="avatar-container">
          <img :src="form.avatar" alt="avatar" class="avatar-preview">
          <div class="avatar-overlay" @click="triggerFileInput">
            <i class="fas fa-camera"></i>
            <span>更换头像</span>
          </div>
        </div>
        <input 
          type="file" 
          ref="fileInput" 
          style="display: none" 
          accept="image/*"
          @change="handleAvatarChange"
        >
      </div>
      
      <form @submit.prevent="saveProfile" class="profile-form">
        <h3>基本信息</h3>
        <div class="form-group">
          <label for="username">用户名</label>
          <input 
            type="text" 
            id="username" 
            v-model="form.username" 
            disabled
            class="form-control"
          >
          <small>用户名不可修改</small>
        </div>
        
        <div class="form-group">
          <label for="nickname">昵称</label>
          <input 
            type="text" 
            id="nickname" 
            v-model="form.nickname" 
            class="form-control"
            placeholder="请输入您的昵称"
          >
        </div>
        
        <div class="form-group">
          <label for="email">邮箱</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            class="form-control"
            placeholder="请输入您的邮箱"
          >
        </div>

        <div class="form-group">
          <label for="gender">性别</label>
          <select 
            id="gender" 
            v-model="form.gender" 
            class="form-control"
          >
            <option value="">不指定</option>
            <option value="male">男</option>
            <option value="female">女</option>
            <option value="other">其他</option>
          </select>
        </div>

        <div class="form-group">
          <label for="birthday">生日</label>
          <input 
            type="date" 
            id="birthday" 
            v-model="form.birthday" 
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label for="location">所在地</label>
          <input 
            type="text" 
            id="location" 
            v-model="form.location" 
            class="form-control"
            placeholder="请输入您的所在地"
          >
        </div>

        <div class="form-group">
          <label for="bio">个人简介</label>
          <textarea 
            id="bio" 
            v-model="form.bio" 
            class="form-control"
            rows="4"
            placeholder="请输入您的个人简介"
          ></textarea>
        </div>

        <h3>隐私设置</h3>
        <div class="privacy-settings">
          <div class="form-check">
            <input 
              type="checkbox" 
              id="searchByUsername" 
              v-model="form.privacy.searchByUsername" 
              class="form-check-input"
            >
            <label for="searchByUsername" class="form-check-label">允许通过用户名搜索到我</label>
          </div>

          <div class="form-check">
            <input 
              type="checkbox" 
              id="searchByNickname" 
              v-model="form.privacy.searchByNickname" 
              class="form-check-input"
            >
            <label for="searchByNickname" class="form-check-label">允许通过昵称搜索到我</label>
          </div>

          <div class="form-check">
            <input 
              type="checkbox" 
              id="showBirthday" 
              v-model="form.privacy.showBirthday" 
              class="form-check-input"
            >
            <label for="showBirthday" class="form-check-label">公开我的生日</label>
          </div>

          <div class="form-check">
            <input 
              type="checkbox" 
              id="showEmail" 
              v-model="form.privacy.showEmail" 
              class="form-check-input"
            >
            <label for="showEmail" class="form-check-label">公开我的邮箱</label>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$router.push('/profile')">取消</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">{{ loading ? '保存中...' : '保存修改' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getUserInfo } from '../api';
import { updateUserProfile } from '../api';
import {uploadAvatar} from '../api';
import api from '../api';

const router = useRouter();
const fileInput = ref(null);
const loading = ref(false);
const errorMessage = ref('');

// 消息提示状态
const message = reactive({
  show: false,
  text: '',
  type: 'success',
  icon: 'fa-check-circle',
  timer: null
});

// 显示消息提示
const showMessage = (text, type = 'success') => {
  // 清除之前的定时器
  if (message.timer) {
    clearTimeout(message.timer);
  }
  
  // 设置消息内容和类型
  message.text = text;
  message.type = type;
  message.icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  message.show = true;
  
  // 3秒后自动隐藏
  message.timer = setTimeout(() => {
    message.show = false;
  }, 3000);
};

const form = reactive({
  username: '',
  nickname: '',
  email: '',
  avatar: '',
  avatarFile: null,
  gender: '',
  birthday: '',
  location: '',
  bio: '',
  privacy: {
    searchByUsername: true,
    searchByNickname: true,
    showBirthday: true,
    showEmail: false
  }
});

// 获取用户信息
onMounted(async () => {
  try {
    const userData = await getUserInfo();
    form.username = userData.username;
    form.nickname = userData.nickname;
    form.email = userData.email;
    // 直接赋值为后端返回的图片URL
    form.avatar = userData.avatar ? `http://localhost:3000${userData.avatar}` : 'http://localhost:3000/images/default-avatar.jpg';
    form.gender = userData.gender || '';
    
    // 格式化生日日期，将ISO格式转换为yyyy-MM-dd格式
    if (userData.birthday) {
      const birthdayDate = new Date(userData.birthday);
      const year = birthdayDate.getFullYear();
      const month = String(birthdayDate.getMonth() + 1).padStart(2, '0');
      const day = String(birthdayDate.getDate()).padStart(2, '0');
      form.birthday = `${year}-${month}-${day}`;
    } else {
      form.birthday = '';
    }
    
    form.location = userData.location || '';
    form.bio = userData.bio || '';
    form.privacy = userData.privacy || {
      searchByUsername: true,
      searchByNickname: true,
      showBirthday: true,
      showEmail: false
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    showMessage('获取用户信息失败', 'error');
  }
});

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value.click();
};

// 处理头像变更
const handleAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    // 检查文件大小（限制为2MB）
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      showMessage('头像图片大小不能超过2MB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      form.avatar = e.target.result;
      form.avatarFile = file;
      console.log('头像File1:', form.avatarFile);
    };
    reader.readAsDataURL(file);
  }
};

// 保存个人信息
const saveProfile = async () => {
  loading.value = true;
  try {
    // 先上传头像文件（如果有）
    if (form.avatarFile) {
      const avatarFormData = new FormData();
      avatarFormData.append('avatarFile', form.avatarFile);
      
      const avatarResult = await uploadAvatar(form.avatarFile);
      
      if (!avatarResult.success) {
        throw new Error(avatarResult.message || '头像上传失败');
      }
    }
    
    // 然后更新其他个人信息
    const profileData = {
      nickname: form.nickname,
      email: form.email,
      gender: form.gender,
      birthday: form.birthday,
      location: form.location,
      bio: form.bio,
      privacy: JSON.stringify(form.privacy)
    };
    
    const profileResult = await updateUserProfile(profileData);
    
    if (profileResult.success) {
      showMessage('个人信息更新成功', 'success');
      router.push('/edit-profile');
    } else {
      showMessage(profileResult?.data?.message || '更新个人信息失败', 'error');
    }
  } catch (error) {
    console.error('更新个人信息错误:', error);
    showMessage('更新个人信息失败', 'error');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.edit-profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
}

/* 消息提示样式 */
.message-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 3px 6px rgba(0,0,0,0.16);
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, -20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

.message-toast.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message-toast.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.profile-nav {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1877f2;
  text-decoration: none;
}

.nav-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-left: 1rem;
  color: #222;
}

.edit-profile-content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 2rem;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.avatar-container {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.profile-form {
  max-width: 500px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-control:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

small {
  display: block;
  color: #666;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #1877f2;
  color: white;
}

.btn-primary:hover {
  background-color: #166fe5;
}

.btn-primary:disabled {
  background-color: #8bb9f8;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #e4e6eb;
  color: #333;
}

.btn-secondary:hover {
  background-color: #d8dadf;
}

h3 {
  margin: 2rem 0 1rem;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.privacy-settings {
  margin-bottom: 1.5rem;
}

.form-check {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
}

.form-check-input {
  margin-right: 0.5rem;
}

.form-check-label {
  font-weight: normal;
}
</style>