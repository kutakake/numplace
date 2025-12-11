<template>
  <div class="sudoku-card card">
    <div class="card-header">
      <h2>🎯 今日のナンプレ</h2>
      <div v-if="todayDate" class="date-badge badge">{{ todayDate }}</div>
    </div>
    
    <div v-if="loading" class="spinner"></div>
    
    <div v-else-if="error" class="alert alert-error">
      {{ error }}
    </div>
    
    <div v-else-if="puzzle" class="puzzle-container">
      <div v-if="alreadySolved" class="alert alert-info">
        ✅ 今日の問題はすでに正解しています！明日また挑戦してね。
      </div>
      
      <div class="sudoku-grid">
        <div
          v-for="(row, i) in currentGrid"
          :key="i"
          class="sudoku-row"
        >
          <div
            v-for="(cell, j) in row"
            :key="j"
            class="sudoku-cell"
            :class="{
              'initial': isInitialCell(i, j),
              'selected': selectedRow === i && selectedCol === j,
              'box-border-right': (j + 1) % 3 === 0 && j !== 8,
              'box-border-bottom': (i + 1) % 3 === 0 && i !== 8
            }"
            @click="selectCell(i, j)"
          >
            <div class="cell-value">
              {{ currentGrid[i][j] || '' }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="numpad">
        <div class="numpad-title">✨ テンキー</div>
        <div class="numpad-grid">
          <button
            v-for="num in 9"
            :key="num"
            @click="inputNumber(num)"
            class="numpad-btn"
            :disabled="!hasSelectedCell"
          >
            {{ num }}
          </button>
          <button
            @click="clearSelected"
            class="numpad-btn numpad-clear"
            :disabled="!hasSelectedCell"
          >
            ❌
          </button>
        </div>
      </div>
      
      <div v-if="message" class="alert" :class="messageClass">
        {{ message }}
      </div>
      
      <button
        v-if="!alreadySolved"
        @click="submitAnswer"
        :disabled="submitting || !isGridComplete"
        class="btn btn-submit"
      >
        <span v-if="submitting">送信中...</span>
        <span v-else>🚀 回答を送信</span>
      </button>
      
      <button
        v-if="alreadySolved"
        @click="resetGrid"
        class="btn btn-secondary"
      >
        🔄 もう一度見る
      </button>
    </div>
    
    <div v-else class="no-puzzle">
      <p>今日の問題はまだ生成されていません。</p>
      <p class="hint">サーバーが起動するとすぐに問題が生成されます！</p>
    </div>
  </div>
</template>

<script>
import { API_URL } from '../config.js'

export default {
  name: 'SudokuGrid',
  props: {
    userEmail: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      puzzle: null,
      currentGrid: [],
      todayDate: '',
      loading: true,
      error: '',
      submitting: false,
      message: '',
      messageClass: '',
      alreadySolved: false,
      selectedRow: null,
      selectedCol: null
    }
  },
  computed: {
    isGridComplete() {
      if (!this.currentGrid.length) return false
      
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          const val = this.currentGrid[i][j]
          if (!val || val < 1 || val > 9) {
            return false
          }
        }
      }
      return true
    },
    hasSelectedCell() {
      return this.selectedRow !== null && this.selectedCol !== null &&
             !this.isInitialCell(this.selectedRow, this.selectedCol)
    }
  },
  methods: {
    isInitialCell(row, col) {
      if (!this.puzzle) return false
      return this.puzzle[row][col] !== 0
    },
    
    selectCell(row, col) {
      if (!this.isInitialCell(row, col)) {
        this.selectedRow = row
        this.selectedCol = col
      }
    },
    
    inputNumber(num) {
      if (this.hasSelectedCell) {
        this.currentGrid[this.selectedRow][this.selectedCol] = num
      }
    },
    
    clearSelected() {
      if (this.hasSelectedCell) {
        this.currentGrid[this.selectedRow][this.selectedCol] = 0
      }
    },
    
    async loadPuzzle() {
      this.loading = true
      this.error = ''
      
      try {
        const response = await fetch(`${API_URL}/api/puzzle/today`)
        const data = await response.json()
        
        if (response.ok) {
          this.puzzle = data.puzzle
          this.todayDate = data.date
          this.currentGrid = this.puzzle.map(row => [...row])
        } else {
          this.error = data.error || 'パズルの読み込みに失敗しました'
        }
      } catch (err) {
        this.error = 'サーバーに接続できません。バックエンドが起動しているか確認してください。'
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    
    async submitAnswer() {
      if (!this.isGridComplete) {
        this.message = 'すべてのマスを埋めてください'
        this.messageClass = 'alert-error'
        return
      }
      
      this.submitting = true
      this.message = ''
      
      try {
        const response = await fetch(`${API_URL}/api/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.userEmail,
            answer: this.currentGrid
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          this.message = data.message
          
          if (data.correct) {
            this.messageClass = 'alert-success'
            this.$emit('solved', data.entries)
          } else if (data.alreadySolved) {
            this.messageClass = 'alert-info'
            this.alreadySolved = true
          } else {
            this.messageClass = 'alert-error'
          }
        } else {
          this.message = data.error || '送信に失敗しました'
          this.messageClass = 'alert-error'
        }
      } catch (err) {
        this.message = 'サーバーエラーが発生しました'
        this.messageClass = 'alert-error'
        console.error(err)
      } finally {
        this.submitting = false
      }
    },
    
    resetGrid() {
      if (this.puzzle) {
        this.currentGrid = this.puzzle.map(row => [...row])
        this.message = ''
      }
    }
  },
  mounted() {
    this.loadPuzzle()
  },
  watch: {
    userEmail() {
      // Reload puzzle when user changes
      this.loadPuzzle()
    }
  }
}
</script>

<style scoped>
.sudoku-card {
  animation: fadeInUp 0.6s ease 0.1s both;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-header h2 {
  font-size: 1.75rem;
  color: var(--text-primary);
  margin: 0;
}

.date-badge {
  font-size: 0.875rem;
}

.puzzle-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sudoku-grid {
  display: inline-block;
  background: var(--bg-dark);
  padding: 1rem;
  border-radius: 1rem;
  border: 3px solid var(--primary);
  box-shadow: 0 0 30px rgba(124, 58, 237, 0.3);
  margin: 0 auto;
}

.sudoku-row {
  display: flex;
}

.sudoku-cell {
  width: 50px;
  height: 50px;
  border: 1px solid var(--border);
  position: relative;
}

.sudoku-cell.box-border-right {
  border-right: 3px solid var(--primary);
}

.sudoku-cell.box-border-bottom {
  border-bottom: 3px solid var(--primary);
}

.cell-value {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Noto Sans JP', monospace;
  transition: all 0.2s ease;
  user-select: none;
}

.sudoku-cell.initial .cell-value {
  background: var(--bg-card);
  color: var(--primary-light);
  font-weight: 900;
}

.sudoku-cell.selected {
  box-shadow: 0 0 0 3px var(--accent) inset;
  z-index: 10;
}

.sudoku-cell {
  cursor: pointer;
  transition: all 0.2s ease;
}

.sudoku-cell:not(.initial):hover {
  background: rgba(124, 58, 237, 0.1);
}

.btn-submit {
  width: 100%;
  font-size: 1.1rem;
  padding: 1rem 2rem;
}

.btn-secondary {
  width: 100%;
  background: linear-gradient(135deg, #64748b, #475569);
  box-shadow: 0 4px 15px rgba(100, 116, 139, 0.4);
}

.btn-secondary:hover {
  box-shadow: 0 8px 25px rgba(100, 116, 139, 0.6);
}

.no-puzzle {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-secondary);
}

.no-puzzle .hint {
  margin-top: 1rem;
  font-size: 0.9rem;
  font-style: italic;
  color: var(--text-secondary);
  opacity: 0.8;
}

.numpad {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: var(--bg-dark);
  border-radius: 1rem;
  border: 2px solid var(--border);
}

.numpad-title {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.numpad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  max-width: 300px;
  margin: 0 auto;
}

.numpad-btn {
  aspect-ratio: 1;
  font-size: 1.5rem;
  font-weight: 700;
  border: 2px solid var(--primary);
  background: linear-gradient(135deg, var(--bg-card), var(--bg-card-hover));
  color: var(--text-primary);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  font-family: 'Noto Sans JP', sans-serif;
}

.numpad-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(124, 58, 237, 0.4);
}

.numpad-btn:active:not(:disabled) {
  transform: translateY(0);
}

.numpad-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.numpad-clear {
  grid-column: span 3;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-color: #ef4444;
}

.numpad-clear:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  box-shadow: 0 6px 15px rgba(239, 68, 68, 0.4);
}

@media (max-width: 768px) {
  .sudoku-cell {
    width: 36px;
    height: 36px;
  }
  
  .cell-input {
    font-size: 1.2rem;
  }
  
  .sudoku-grid {
    padding: 0.5rem;
  }
}
</style>
