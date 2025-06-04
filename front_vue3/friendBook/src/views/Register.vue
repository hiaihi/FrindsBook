<template>
  <div class="register-container">
    <h2>Register</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" v-model="username" required />
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" v-model="password" required autocomplete="current-password" />
      </div>
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input type="password" id="confirmPassword" v-model="confirmPassword" required />
      </div>
      <button type="submit">Register</button>
      <p v-if="error" class="error-message">{{ error }}</p>
    </form>
    <p>Already have an account? <router-link to="/login">Login</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const router = useRouter();

const error = ref('');

const handleRegister = async () => {
  try {
    if (password.value !== confirmPassword.value) {
      error.value = '两次输入的密码不一致';
      return;
    }

    if (!username.value.trim()) {
      error.value = '用户名不能为空';
      return;
    }

    if (!email.value.trim()) {
      error.value = '邮箱不能为空';
      return;
    }

    if (password.value.length < 6) {
      error.value = '密码长度不能少于6位';
      return;
    }

    const response = await fetch('http://localhost:3000/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: password.value
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      error.value = data.message || '注册失败';
      return;
    }

    // 注册成功后跳转到登录页
    router.push('/login');
  } catch (err) {
    error.value = err.message || '注册过程中发生错误';
  }
};
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #1c1e21;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #1c1e21;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 0.5rem;
  background-color: #1877f2;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #166fe5;
}

p {
  text-align: center;
  margin-top: 1rem;
}

a {
  color: #1877f2;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.error-message {
  color: #ff3860;
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}
</style>