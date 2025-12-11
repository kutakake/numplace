<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>📊 管理者ダッシュボード</h1>
      <div class="header-actions">
        <button @click="confirmReset" class="btn btn-danger">🔄 応募口数リセット</button>
        <button @click="logout" class="btn btn-secondary">🚪 ログアウト</button>
      </div>
    </div>
    
    <div v-if="loading" class="spinner"></div>
    
    <div v-else>
      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-icon">👥</div>
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">総ユーザー数</div>
        </div>
        
        <div class="stat-card card">
          <div class="stat-icon">🎟️</div>
          <div class="stat-value">{{ stats.totalEntries }}</div>
          <div class="stat-label">総応募口数</div>
        </div>
        
        <div class="stat-card card">
          <div class="stat-icon">✅</div>
          <div class="stat-value">{{ stats.totalPuzzlesSolved }}</div>
          <div class="stat-label">総解答数</div>
        </div>
        
        <div class="stat-card card">
          <div class="stat-icon">📅</div>
          <div class="stat-value">{{ stats.todaySolvers }}</div>
          <div class="stat-label">今日の解答者</div>
        </div>
      </div>
      
      <!-- Users Table -->
      <div class="users-section card">
        <h2>📋 ユーザー一覧</h2>
        
        <div class="table-container">
          <table class="users-table">
            <thead>
              <tr>
                <th>メールアドレス</th>
                <th>応募口数</th>
                <th>解答数</th>
                <th>最終解答日</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.email">
                <td>{{ user.email }}</td>
                <td><span class="badge-entries">{{ user.entries }}</span></td>
                <td>{{ user.totalSolved }}</td>
                <td>{{ user.solvedDates.length > 0 ? user.solvedDates[user.solvedDates.length - 1] : '-' }}</td>
              </tr>
            </tbody>
          </table>
          
          <div v-if="users.length === 0" class="no-data">
            まだユーザーがいません
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { API_URL } from '../config.js'

export default {
  name: 'AdminDashboard',
  data() {
    return {
      loading: true,
      users: [],
      stats: {
        totalUsers: 0,
        totalEntries: 0,
        totalPuzzlesSolved: 0,
        totalPuzzles: 0,
        todaySolvers: 0,
        averageEntriesPerUser: 0
      },
      resetting: false
    }
  },
  methods: {
    async loadData() {
      this.loading = true
      const token = localStorage.getItem('adminToken')
      
      if (!token) {
        this.$emit('logout')
        return
      }
      
      try {
        // Load users
        const usersResponse = await fetch(`${API_URL}/api/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!usersResponse.ok) {
          throw new Error('Unauthorized')
        }
        
        const usersData = await usersResponse.json()
        this.users = usersData.users
        
        // Load stats
        const statsResponse = await fetch(`${API_URL}/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const statsData = await statsResponse.json()
        this.stats = statsData.stats
        
      } catch (err) {
        console.error(err)
        this.$emit('logout')
      } finally {
        this.loading = false
      }
    },
    
    async logout() {
      const token = localStorage.getItem('adminToken')
      
      if (token) {
        try {
          await fetch(`${API_URL}/api/admin/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        } catch (err) {
          console.error(err)
        }
      }
      
      localStorage.removeItem('adminToken')
      this.$emit('logout')
    },
    
    confirmReset() {
      if (confirm('⚠️ 警告: 全てのユーザーの応募口数を0にリセットします。\n\nこの操作は取り消せません。本当に実行しますか？')) {
        this.resetEntries()
      }
    },
    
    async resetEntries() {
      if (this.resetting) return
      
      this.resetting = true
      const token = localStorage.getItem('adminToken')
      
      try {
        const response = await fetch(`${API_URL}/api/admin/reset-entries`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (response.ok && data.success) {
          alert(`✅ ${data.message}\n\n影響を受けたユーザー: ${data.totalUsers}名`)
          // Reload data to reflect changes
          await this.loadData()
        } else {
          alert('❌ リセットに失敗しました')
        }
      } catch (err) {
        console.error(err)
        alert('❌ エラーが発生しました')
      } finally {
        this.resetting = false
      }
    }
  },
  mounted() {
    this.loadData()
  }
}
</script>

<style scoped>
.admin-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-header h1 {
  font-size: 2rem;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 600;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.6);
}

.btn-danger:active {
  transform: translateY(0);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  text-align: center;
  padding: 1.5rem;
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
}

.users-section {
  padding: 2rem;
}

.users-section h2 {
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background: var(--bg-dark);
}

.users-table th {
  padding: 1rem;
  text-align: left;
  color: var(--text-primary);
  font-weight: 700;
  border-bottom: 2px solid var(--border);
}

.users-table td {
  padding: 1rem;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}

.users-table tbody tr:hover {
  background: var(--bg-dark);
}

.badge-entries {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, var(--accent), #059669);
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
}

.no-data {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  font-style: italic;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .users-table {
    font-size: 0.875rem;
  }
  
  .users-table th,
  .users-table td {
    padding: 0.5rem;
  }
}
</style>
