<template>
  <div class="admin-login">
    <div class="login-card card">
      <h2>🔐 管理者ログイン</h2>
      
      <div class="form-group">
        <label for="password">パスワード</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="input"
          placeholder="パスワードを入力"
          @keyup.enter="login"
        />
      </div>
      
      <button
        @click="login"
        :disabled="loading || !password"
        class="btn btn-primary"
      >
        <span v-if="loading">ログイン中...</span>
        <span v-else>🚀 ログイン</span>
      </button>
      
      <div v-if="error" class="alert alert-error">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import { API_URL } from '../config.js'

export default {
  name: 'AdminLogin',
  data() {
    return {
      password: '',
      loading: false,
      error: ''
    }
  },
  methods: {
    async login() {
      if (!this.password) {
        this.error = 'パスワードを入力してください'
        return
      }
      
      this.loading = true
      this.error = ''
      
      try {
        const response = await fetch(`${API_URL}/api/admin/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ password: this.password })
        })
        
        const data = await response.json()
        
        if (response.ok && data.success) {
          // Store token in localStorage
          localStorage.setItem('adminToken', data.token)
          this.$emit('login-success')
        } else {
          this.error = data.error || 'ログインに失敗しました'
        }
      } catch (err) {
        this.error = 'サーバーに接続できません'
        console.error(err)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.admin-login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}

.login-card {
  max-width: 400px;
  width: 100%;
  margin: 2rem;
}

.login-card h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.btn-primary {
  width: 100%;
}
</style>
