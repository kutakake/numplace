<template>
  <div class="lottery-management">
    <h2>🎰 抽選管理</h2>
    
    <!-- Lottery Draw Section -->
    <div class="lottery-draw card">
      <h3>🎲 抽選を実行</h3>
      
      <div class="draw-form">
        <div class="form-group">
          <label for="winnerCount">当選者数:</label>
          <input 
            type="number" 
            id="winnerCount" 
            v-model.number="winnerCount" 
            min="1" 
            max="100"
            :disabled="drawing"
          />
        </div>
        
        <div class="eligible-info">
          <p>📊 応募口数1以上のユーザー: <strong>{{ eligibleUsersCount }}</strong>名</p>
          <p>🎟️ 総応募口数: <strong>{{ totalEntries }}</strong>口</p>
        </div>
        
        <button 
          @click="executeDraw" 
          class="btn btn-primary btn-draw"
          :disabled="drawing || eligibleUsersCount === 0"
        >
          <span v-if="drawing">抽選中...</span>
          <span v-else>🎰 抽選を実行</span>
        </button>
      </div>
      
      <!-- Latest Draw Result -->
      <div v-if="latestDraw" class="latest-result">
        <h4>✨ 最新の抽選結果</h4>
        <div class="result-info">
          <p><strong>日時:</strong> {{ formatDateTime(latestDraw.timestamp) }}</p>
          <p><strong>抽選ID:</strong> {{ latestDraw.id }}</p>
          <p><strong>当選者数:</strong> {{ latestDraw.actualWinners }}名 / {{ latestDraw.requestedWinners }}名</p>
        </div>
        
        <div class="winners-list">
          <h5>🏆 当選者:</h5>
          <div v-for="(winner, index) in latestDraw.winners" :key="index" class="winner-card">
            <div class="winner-rank">{{ index + 1 }}位</div>
            <div class="winner-details">
              <div class="winner-email">{{ winner.email }}</div>
              <div class="winner-stats">
                <span class="winner-entries">応募口数: {{ winner.entries }}口</span>
                <span class="winner-probability">当選確率: {{ (parseFloat(winner.probability) * 100).toFixed(2) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Lottery History Section -->
    <div class="lottery-history card">
      <h3>📜 抽選履歴</h3>
      
      <div v-if="loading" class="spinner"></div>
      
      <div v-else-if="history.length === 0" class="no-data">
        まだ抽選が実行されていません
      </div>
      
      <div v-else class="history-list">
        <div v-for="lottery in history" :key="lottery.id" class="history-item">
          <div class="history-header">
            <span class="history-date">📅 {{ formatDateTime(lottery.timestamp) }}</span>
            <span class="history-id">ID: {{ lottery.id.substring(0, 8) }}...</span>
          </div>
          
          <div class="history-stats">
            <span>当選者: {{ lottery.actualWinners }}名</span>
            <span>参加者: {{ lottery.totalParticipants }}名</span>
            <span>総口数: {{ lottery.totalEntries }}口</span>
          </div>
          
          <details class="history-details">
            <summary>当選者を表示</summary>
            <div class="winners-compact">
              <div v-for="(winner, index) in lottery.winners" :key="index" class="winner-compact">
                <span class="rank">{{ index + 1 }}.</span>
                <span class="email">{{ winner.email }}</span>
                <span class="entries">{{ winner.entries }}口</span>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { API_URL } from '../config.js'

export default {
  name: 'LotteryManagement',
  data() {
    return {
      winnerCount: 1,
      drawing: false,
      loading: true,
      history: [],
      latestDraw: null,
      eligibleUsersCount: 0,
      totalEntries: 0
    }
  },
  methods: {
    async loadHistory() {
      this.loading = true
      const token = localStorage.getItem('adminToken')
      
      try {
        const response = await fetch(`${API_URL}/api/admin/lottery/history`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to load history')
        }
        
        const data = await response.json()
        this.history = data.history
        
        if (this.history.length > 0) {
          this.latestDraw = this.history[0]
        }
      } catch (err) {
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    
    async loadEligibleUsers() {
      const token = localStorage.getItem('adminToken')
      
      try {
        const response = await fetch(`${API_URL}/api/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to load users')
        }
        
        const data = await response.json()
        const eligibleUsers = data.users.filter(user => user.entries > 0)
        
        this.eligibleUsersCount = eligibleUsers.length
        this.totalEntries = eligibleUsers.reduce((sum, user) => sum + user.entries, 0)
      } catch (err) {
        console.error(err)
      }
    },
    
    async executeDraw() {
      if (this.drawing || this.eligibleUsersCount === 0) return
      
      if (!confirm(`${this.winnerCount}名の当選者を抽選します。よろしいですか？`)) {
        return
      }
      
      this.drawing = true
      const token = localStorage.getItem('adminToken')
      
      try {
        const response = await fetch(`${API_URL}/api/admin/lottery/draw`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ winnerCount: this.winnerCount })
        })
        
        const data = await response.json()
        
        if (response.ok && data.success) {
          this.latestDraw = data.lottery
          alert(`🎉 抽選が完了しました！\n\n当選者数: ${data.lottery.actualWinners}名`)
          
          // Reload history and eligible users
          await this.loadHistory()
          await this.loadEligibleUsers()
        } else {
          alert(`❌ 抽選に失敗しました\n\n${data.error || '不明なエラー'}`)
        }
      } catch (err) {
        console.error(err)
        alert('❌ エラーが発生しました')
      } finally {
        this.drawing = false
      }
    },
    
    formatDateTime(timestamp) {
      const date = new Date(timestamp)
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
  },
  mounted() {
    this.loadHistory()
    this.loadEligibleUsers()
  }
}
</script>

<style scoped>
.lottery-management {
  max-width: 1200px;
  margin: 0 auto;
}

.lottery-management h2 {
  font-size: 1.75rem;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.lottery-draw,
.lottery-history {
  padding: 2rem;
  margin-bottom: 2rem;
}

.lottery-draw h3,
.lottery-history h3 {
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.draw-form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 600;
}

.form-group input {
  width: 100%;
  max-width: 200px;
  padding: 0.75rem;
  border: 2px solid var(--border);
  border-radius: 0.5rem;
  font-size: 1rem;
  background: var(--bg-dark);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.eligible-info {
  margin: 1.5rem 0;
  padding: 1rem;
  background: var(--bg-dark);
  border-radius: 0.5rem;
  border-left: 4px solid var(--accent);
}

.eligible-info p {
  margin: 0.5rem 0;
  color: var(--text-secondary);
}

.eligible-info strong {
  color: var(--primary);
  font-size: 1.1rem;
}

.btn-draw {
  width: 100%;
  max-width: 300px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.btn-draw:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.6);
}

.btn-draw:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.latest-result {
  margin-top: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.1));
  border-radius: 1rem;
  border: 2px solid var(--primary);
}

.latest-result h4 {
  margin-bottom: 1rem;
  color: var(--primary);
  font-size: 1.3rem;
}

.result-info p {
  margin: 0.5rem 0;
  color: var(--text-secondary);
}

.winners-list {
  margin-top: 1.5rem;
}

.winners-list h5 {
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.winner-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: var(--bg-dark);
  border-radius: 0.75rem;
  border-left: 4px solid var(--accent);
  transition: all 0.3s ease;
}

.winner-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.winner-rank {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--accent);
  min-width: 3rem;
  text-align: center;
}

.winner-details {
  flex: 1;
}

.winner-email {
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.winner-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.winner-entries {
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, var(--accent), #059669);
  color: white;
  border-radius: 1rem;
  font-weight: 600;
}

.winner-probability {
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, var(--primary), #7c3aed);
  color: white;
  border-radius: 1rem;
  font-weight: 600;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  padding: 1.5rem;
  background: var(--bg-dark);
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  transition: all 0.3s ease;
}

.history-item:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.history-date {
  font-weight: 700;
  color: var(--text-primary);
}

.history-id {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-family: monospace;
}

.history-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.history-details {
  margin-top: 1rem;
}

.history-details summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--primary);
  padding: 0.5rem;
  border-radius: 0.5rem;
  transition: background 0.3s ease;
  user-select: none;
}

.history-details summary:hover {
  background: rgba(139, 92, 246, 0.1);
}

.winners-compact {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 0.5rem;
}

.winner-compact {
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.winner-compact:last-child {
  border-bottom: none;
}

.winner-compact .rank {
  font-weight: 700;
  color: var(--accent);
  min-width: 2rem;
}

.winner-compact .email {
  flex: 1;
  color: var(--text-primary);
}

.winner-compact .entries {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .lottery-draw,
  .lottery-history {
    padding: 1rem;
  }
  
  .form-group input {
    max-width: 100%;
  }
  
  .winner-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .history-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
