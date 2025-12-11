<template>
  <div class="registration-card card">
    <h2>👤 ユーザー登録</h2>
    
    <div v-if="!isRegistered" class="registration-form">
      <p class="description">メールアドレスを登録して、ナンプレ懸賞に参加しよう！　当選するとアマゾンギフト券がもらえるよ！</p>
      
      <div class="form-group">
        <input
          v-model="email"
          type="email"
          class="input"
          placeholder="your@email.com"
          @keyup.enter="register"
        />
      </div>
      
      <button
        @click="register"
        :disabled="loading || !isValidEmail"
        class="btn btn-primary"
      >
        <span v-if="loading">登録中...</span>
        <span v-else>✨ 登録する</span>
      </button>
      
      <div v-if="error" class="alert alert-error">
        {{ error }}
      </div>
    </div>
    
    <div v-else class="user-info">
      <div class="success-message">
        <div class="icon">🎉</div>
        <h3>登録完了！</h3>
        <p class="email">{{ userEmail }}</p>
      </div>
      
      <div class="entries-display">
        <div class="entries-number">{{ entries }}</div>
        <div class="entries-label">応募口数</div>
      </div>
      
      <p class="hint">正解するごとに応募口数が増えるよ！</p>
    </div>
  </div>
</template>

<script>
import { API_URL } from '../config.js'

export default {
  name: 'UserRegistration',
  props: {
    initialEmail: String,
    initialEntries: Number
  },
  data() {
    return {
      email: '',
      userEmail: this.initialEmail || '',
      entries: this.initialEntries || 0,
      loading: false,
      error: ''
    }
  },
  computed: {
    isRegistered() {
      return !!this.userEmail
    },
    isValidEmail() {
      return this.email.includes('@') && this.email.includes('.')
    }
  },
  methods: {
    async register() {
      if (!this.isValidEmail) {
        this.error = '有効なメールアドレスを入力してください'
        return
      }
      
      this.loading = true
      this.error = ''
      
      try {
        const response = await fetch(`${API_URL}/api/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: this.email })
        })
        
        const data = await response.json()
        
        if (data.success) {
          this.userEmail = data.email
          this.entries = data.entries
          this.$emit('registered', { email: data.email, entries: data.entries })
          
          // Store in localStorage
          localStorage.setItem('userEmail', data.email)
        } else {
          this.error = data.error || '登録に失敗しました'
        }
      } catch (err) {
        this.error = 'サーバーに接続できません。バックエンドが起動しているか確認してください。'
        console.error(err)
      } finally {
        this.loading = false
      }
    }
  },
  mounted() {
    // Try to load from localStorage
    const savedEmail = localStorage.getItem('userEmail')
    if (savedEmail && !this.userEmail) {
      this.email = savedEmail
      this.register()
    }
  }
}
</script>

<style scoped>
.registration-card {
  animation: fadeInUp 0.6s ease;
}

.registration-card h2 {
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 1rem;
}

.btn-primary {
  width: 100%;
  margin-top: 0.5rem;
}

.user-info {
  text-align: center;
}

.success-message {
  margin-bottom: 2rem;
}

.success-message .icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: pulse 2s ease infinite;
}

.success-message h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--accent);
}

.success-message .email {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.entries-display {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  padding: 2rem;
  border-radius: 1rem;
  margin: 1.5rem 0;
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.3);
}

.entries-number {
  font-size: 3.5rem;
  font-weight: 900;
  color: white;
  line-height: 1;
}

.entries-label {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 0.5rem;
  font-weight: 500;
}

.hint {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-style: italic;
}
</style>
