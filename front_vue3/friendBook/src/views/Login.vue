<template>
  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">Username</label>
        <input type="text" id="username" v-model="username" required />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" v-model="password" required autocomplete="current-password" />
      </div>
      <button type="submit">Login</button>
      <p v-if="error" class="error-message">{{ error }}</p>
    </form>
    <p>Don't have an account? <router-link to="/register">Register</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

const handleLogin = async () => {
  try {
    error.value = '';
    const response = await fetch('http://localhost:3000/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '登录失败');
    }

    // 保存token到localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    
    // 登录成功后跳转到个人主页
    router.push('/profile');
  } catch (err) {
    error.value = err.message;
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}

button:hover {
  background-color: #45a049;
}

.error-message {
  color: #ff0000;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

p {
  margin-top: 1rem;
  text-align: center;
}

a {
  color: #4CAF50;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>