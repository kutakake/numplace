<template>
  <div id="app">
    <!-- Admin Page -->
    <div v-if="currentPage === 'admin'">
      <div class="container">
        <header class="header">
          <h1>🔐 管理者ページ</h1>
          <button v-if="!isAdminLoggedIn" @click="goToHome" class="btn btn-secondary">🏠 ホームへ</button>
        </header>
        
        <AdminLogin
          v-if="!isAdminLoggedIn"
          @login-success="handleAdminLogin"
        />
        
        <AdminDashboard
          v-else
          @logout="handleAdminLogout"
        />
      </div>
    </div>
    
    <!-- Main Page -->
    <div v-else class="container">
      <header class="header">
        <h1>🎲 ナンプレ懸賞</h1>
        <p>毎日挑戦して応募口数を増やそう！</p>
      </header>
      
      <div v-if="!userEmail" class="single-column">
        <UserRegistration
          @registered="handleUserRegistered"
        />
      </div>
      
      <div v-else class="grid-2">
        <UserRegistration
          :initial-email="userEmail"
          :initial-entries="userEntries"
        />
        
        <SudokuGrid
          :user-email="userEmail"
          @solved="handlePuzzleSolved"
        />
      </div>
      
      <footer class="footer">
        <p>💡 ヒント: 正解すると応募口数が1つ増えます。毎日挑戦してチャンスを増やそう！</p>
      </footer>
    </div>
  </div>
</template>

<script>
import { API_URL } from './config.js'
import UserRegistration from './components/UserRegistration.vue'
import SudokuGrid from './components/SudokuGrid.vue'
import AdminLogin from './components/AdminLogin.vue'
import AdminDashboard from './components/AdminDashboard.vue'

export default {
  name: 'App',
  components: {
    UserRegistration,
    SudokuGrid,
    AdminLogin,
    AdminDashboard
  },
  data() {
    return {
      userEmail: '',
      userEntries: 0,
      currentPage: 'home', // 'home' or 'admin'
      isAdminLoggedIn: false
    }
  },
  methods: {
    handleUserRegistered(userData) {
      this.userEmail = userData.email
      this.userEntries = userData.entries
    },
    
    handlePuzzleSolved(newEntries) {
      this.userEntries = newEntries
      this.$forceUpdate()
    },
    
    goToAdmin() {
      this.currentPage = 'admin'
      this.checkAdminLogin()
    },
    
    goToHome() {
      this.currentPage = 'home'
    },
    
    handleAdminLogin() {
      this.isAdminLoggedIn = true
    },
    
    handleAdminLogout() {
      this.isAdminLoggedIn = false
      localStorage.removeItem('adminToken')
    },
    
    checkAdminLogin() {
      const token = localStorage.getItem('adminToken')
      this.isAdminLoggedIn = !!token
    }
  },
  mounted() {
    // Try to restore user from localStorage
    const savedEmail = localStorage.getItem('userEmail')
    if (savedEmail) {
      fetch(`${API_URL}/api/entries/${savedEmail}`)
        .then(res => res.json())
        .then(data => {
          if (data.email) {
            this.userEmail = data.email
            this.userEntries = data.entries
          }
        })
        .catch(err => {
          console.error('Failed to load user data:', err)
        })
    }
    
    // Check URL hash for admin page
    if (window.location.hash === '#admin') {
      this.goToAdmin()
    }
    
    // Listen to hash changes
    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#admin') {
        this.goToAdmin()
      } else {
        this.goToHome()
      }
    })
  }
}
</script>

<style>
.single-column {
  max-width: 600px;
  margin: 0 auto;
}

.footer {
  margin-top: 3rem;
  text-align: center;
  padding: 2rem;
  background: rgba(124, 58, 237, 0.1);
  border-radius: 1rem;
  border: 1px solid var(--border);
  animation: fadeInUp 0.6s ease 0.2s both;
}

.footer p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}
</style>
