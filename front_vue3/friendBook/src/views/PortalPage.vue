<script setup>

</script>

<template>
  <div class="portal">
    <header class="header">
      <nav class="nav">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/login" class="nav-link">Login</router-link>
        <router-link to="/register" class="nav-link">Register</router-link>
        <router-link to="/profile" class="nav-link">Profile(测试)</router-link>
        <router-link to="/messages" class="nav-link">Messages</router-link>
        <router-link to="/notifications" class="nav-link">Notifications</router-link>
      </nav>
    </header>
    <main class="main-content">
      <section class="welcome-section">
        <h2>Welcome to FriendsBook</h2>
        <p>Connect with your friends and share your moments. Join us today to start your journey!</p>
        <img src="https://picsum.photos/1200/400" alt="Welcome Image" class="welcome-image">
      </section>
      <section class="feature-section">
        <div class="feature-card">
          <img src="https://picsum.photos/300/200?1" alt="Latest Updates" class="feature-image">
          <h3>Latest Updates</h3>
          <p>Stay updated with the latest news and activities from your friends.</p>
        </div>
        <div class="feature-card">
          <img src="https://picsum.photos/300/200?2" alt="Hot Topics" class="feature-image">
          <h3>Hot Topics</h3>
          <p>Explore the most popular discussions and join the conversation.</p>
        </div>
        <div class="feature-card">
          <img src="https://picsum.photos/300/200?3" alt="Events" class="feature-image">
          <h3>Events</h3>
          <p>Discover upcoming events and meet new people.</p>
        </div>
      </section>
    </main>
    <footer class="footer">
      <nav class="footer-nav">
        <a href="#" class="footer-link">About Us</a>
        <a href="#" class="footer-link">Help Center</a>
        <a href="#" class="footer-link">Privacy Policy</a>
        <a href="#" class="footer-link">Terms of Service</a>
      </nav>
      <p>&copy; 2025 FriendsBook. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
.portal {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
  margin: 0;
  padding: 0;
  width: 100%;
}

.header {
  width: 100%;
  padding: 1rem;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin: 0;
}

.header h1 {
  margin: 0;
  font-size: 2.5rem;
  color: #1877f2;
}

.nav {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  gap: 10rem;
}

.nav-link {
  text-decoration: none;
  color: #1c1e21;
  font-weight: bold;
  font-size: 1.4rem;
}

.nav-link:hover {
  color: #1877f2;
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 100%;
  padding: 2rem;
  background-color: #ffffff;
  margin-top: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.welcome-section {
  text-align: center;
  margin-bottom: 3rem;
}

.welcome-section h2 {
  font-size: 2rem;
  color: #1c1e21;
}

.welcome-section p {
  font-size: 1.2rem;
  color: #606770;
}

.welcome-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin-top: 1rem;
}

.feature-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-top: 2rem;
}

.feature-card {
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.feature-card h3 {
  font-size: 1.5rem;
  color: #1c1e21;
}

.feature-card p {
  font-size: 1.1rem;
  color: #606770;
}

.feature-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.footer {
  width: 100%;
  padding: 2rem;
  background-color: #ffffff;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-top: 5rem;
}

.footer-nav {
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  gap: 30vh;
}

.footer-link {
  text-decoration: none;
  color: #1c1e21;
  font-weight: bold;
  font-size: 1.1rem;
}

.footer-link:hover {
  color: #1877f2;
}
</style>
