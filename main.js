import './style.css'

/* ================================================================
   QuizMaster — Vanilla JS Quiz App
   Uses: HTML, CSS, Vanilla JS, JSON (quiz-data.json), localStorage
   ================================================================ */

const STORAGE_KEY = 'quizmaster_scores_v1'
const TIMER_PER_QUESTION = 20 // seconds

/* ---------- SVG Icons ---------- */
const ICONS = {
  earth: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6v5l4 9a3 3 0 0 1-3 4H8a3 3 0 0 1-3-4l4-9V3z"/><line x1="9" y1="3" x2="15" y2="3"/></svg>',
  scroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/><path d="M16 2h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H10"/><path d="M18 6h-6"/><path d="M18 10h-6"/><path d="M18 14h-4"/></svg>',
  film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M7 3v18M17 3v18M2 9h5M2 15h5M17 9h5M17 15h5M7 12h10"/></svg>',
  cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>',
  list: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
  star: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
}

/* ---------- State ---------- */
let quizData = null
let currentScreen = null
let quizState = null

/* ---------- localStorage Helpers ---------- */
function loadScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveScore(entry) {
  const scores = loadScores()
  scores.push(entry)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
}

function clearScores() {
  localStorage.removeItem(STORAGE_KEY)
}

function getBestScore(categoryId) {
  const scores = loadScores().filter((s) => s.categoryId === categoryId)
  if (scores.length === 0) return null
  return scores.reduce((best, s) => (s.score > best.score ? s : best))
}

function getTotalQuizzes() {
  return loadScores().length
}

function getAvgScore() {
  const scores = loadScores()
  if (scores.length === 0) return 0
  const total = scores.reduce((sum, s) => sum + s.score, 0)
  return Math.round(total / scores.length)
}

/* ---------- DOM Helpers ---------- */
const $ = (sel) => document.querySelector(sel)
const main = () => $('#app-main')
const headerStats = () => $('#header-stats')

function el(html) {
  const template = document.createElement('template')
  template.innerHTML = html.trim()
  return template.content.firstElementChild
}

/* ---------- Header Stats ---------- */
function renderHeaderStats() {
  const total = getTotalQuizzes()
  const avg = getAvgScore()
  headerStats().innerHTML = `
    <div class="header-stat">
      ${ICONS.list}
      <span class="header-stat-label">Quizzes:</span>
      <span class="header-stat-value">${total}</span>
    </div>
    <div class="header-stat">
      ${ICONS.trophy}
      <span class="header-stat-label">Avg:</span>
      <span class="header-stat-value">${avg}%</span>
    </div>
  `
}

/* ---------- Screen: Welcome / Home ---------- */
function renderWelcome() {
  currentScreen = 'welcome'
  renderHeaderStats()

  const categories = quizData.categories
  const scores = loadScores()

  const cardsHtml = categories.map((cat, i) => {
    const best = getBestScore(cat.id)
    const bestHtml = best
      ? `<div class="category-best-score">
           <span>Best Score</span>
           <span class="score-value">${best.score}%</span>
         </div>`
      : ''
    return `
      <div class="category-card" data-category-id="${cat.id}" style="--card-color: ${cat.color}; animation-delay: ${i * 60}ms">
        <div class="category-icon-wrap">${ICONS[cat.icon] || ICONS.earth}</div>
        <div class="category-name">${cat.name}</div>
        <div class="category-meta">
          <span class="category-meta-badge">${cat.questions.length} questions</span>
        </div>
        ${bestHtml}
      </div>
    `
  }).join('')

  const recentScores = [...scores].reverse().slice(0, 5)
  const scoresHtml = recentScores.length > 0
    ? recentScores.map((s) => {
        const cat = categories.find((c) => c.id === s.categoryId)
        const color = cat ? cat.color : '#64748b'
        return `
          <div class="score-row">
            <div class="score-row-left">
              <div class="score-dot" style="background: ${color}"></div>
              <span class="score-row-name">${cat ? cat.name : 'Unknown'}</span>
            </div>
            <div class="score-row-right">
              <span>${s.correct}/${s.total}</span>
              <span class="score-row-points">${s.score}%</span>
            </div>
          </div>
        `
      }).join('')
    : '<div class="no-scores">No quizzes completed yet. Pick a category above to get started!</div>'

  const clearBtnHtml = scores.length > 0
    ? '<button class="clear-scores-btn" id="clear-scores">Clear all saved scores</button>'
    : ''

  main().innerHTML = `
    <div class="welcome">
      <h1 class="welcome-title">Test Your Knowledge with <span class="gradient-text">QuizMaster</span></h1>
      <p class="welcome-subtitle">Pick a category, answer the questions, and track your progress. Your scores are saved automatically on this device.</p>
    </div>

    <div class="section-label">Choose a Category</div>
    <div class="category-grid">${cardsHtml}</div>

    <div class="section-label">Recent Results</div>
    <div class="scores-panel">
      <div class="scores-panel-title">${ICONS.trophy} High Scores</div>
      <div class="scores-list">${scoresHtml}</div>
      ${clearBtnHtml}
    </div>
  `

  main().querySelectorAll('.category-card').forEach((card) => {
    card.addEventListener('click', () => {
      const catId = card.dataset.categoryId
      startQuiz(catId)
    })
  })

  const clearBtn = $('#clear-scores')
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all saved scores? This cannot be undone.')) {
        clearScores()
        renderWelcome()
      }
    })
  }
}

/* ---------- Screen: Quiz ---------- */
function startQuiz(categoryId) {
  const category = quizData.categories.find((c) => c.id === categoryId)
  if (!category) return

  const questions = [...category.questions]
    .sort(() => Math.random() - 0.5)

  quizState = {
    category,
    questions,
    currentIndex: 0,
    correctCount: 0,
    wrongCount: 0,
    answers: [],
    startTime: Date.now(),
    timerInterval: null,
    timeLeft: TIMER_PER_QUESTION,
    answered: false,
    totalTime: 0,
  }

  renderQuizQuestion()
}

function renderQuizQuestion() {
  currentScreen = 'quiz'
  const { category, questions, currentIndex, correctCount } = quizState
  const q = questions[currentIndex]
  const progress = ((currentIndex) / questions.length) * 100

  const optionsHtml = q.options.map((opt, i) => {
    const letter = String.fromCharCode(65 + i)
    return `
      <button class="option-btn" data-index="${i}">
        <span class="option-letter">${letter}</span>
        <span class="option-text">${opt}</span>
      </button>
    `
  }).join('')

  main().innerHTML = `
    <div class="quiz-screen">
      <div class="quiz-top-bar">
        <button class="quiz-back-btn" id="quiz-back">${ICONS.arrowLeft} Quit</button>
        <div class="quiz-progress-info">
          Question <span class="current-q">${currentIndex + 1}</span> of ${questions.length}
        </div>
        <div class="quiz-timer" id="quiz-timer">
          ${ICONS.clock}
          <span class="timer-num" id="timer-num">${TIMER_PER_QUESTION}</span>s
        </div>
      </div>

      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" style="width: ${progress}%"></div>
      </div>

      <div class="question-card">
        <div class="question-category-tag" style="background: ${category.color}22; color: ${category.color}">
          ${category.name}
        </div>
        <h2 class="question-text">${q.question}</h2>
        <div class="options-grid">${optionsHtml}</div>
      </div>

      <div class="quiz-footer">
        <div class="quiz-score-display">
          ${ICONS.check}
          <span>Correct: <span class="score-num">${correctCount}</span></span>
        </div>
      </div>
    </div>
  `

  main().querySelectorAll('.option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      handleAnswer(parseInt(btn.dataset.index, 10))
    })
  })

  $('#quiz-back').addEventListener('click', () => {
    if (confirm('Quit this quiz? Your progress will be lost.')) {
      stopTimer()
      renderWelcome()
    }
  })

  startTimer()
}

function startTimer() {
  stopTimer()
  quizState.timeLeft = TIMER_PER_QUESTION
  updateTimerDisplay()

  quizState.timerInterval = setInterval(() => {
    quizState.timeLeft--
    updateTimerDisplay()

    if (quizState.timeLeft <= 0) {
      stopTimer()
      handleAnswer(-1)
    }
  }, 1000)
}

function stopTimer() {
  if (quizState.timerInterval) {
    clearInterval(quizState.timerInterval)
    quizState.timerInterval = null
  }
}

function updateTimerDisplay() {
  const timerEl = $('#quiz-timer')
  const numEl = $('#timer-num')
  if (!timerEl || !numEl) return

  numEl.textContent = quizState.timeLeft
  timerEl.classList.remove('warning', 'danger')

  if (quizState.timeLeft <= 5) {
    timerEl.classList.add('danger')
  } else if (quizState.timeLeft <= 10) {
    timerEl.classList.add('warning')
  }
}

function handleAnswer(selectedIndex) {
  if (quizState.answered) return
  quizState.answered = true
  stopTimer()

  const q = quizState.questions[quizState.currentIndex]
  const isCorrect = selectedIndex === q.answer
  const timedOut = selectedIndex === -1

  if (isCorrect) {
    quizState.correctCount++
  } else {
    quizState.wrongCount++
  }

  quizState.answers.push({
    questionIndex: quizState.currentIndex,
    selected: selectedIndex,
    correct: q.answer,
    isCorrect,
    timedOut,
  })

  const buttons = main().querySelectorAll('.option-btn')
  buttons.forEach((btn) => {
    btn.disabled = true
    const idx = parseInt(btn.dataset.index, 10)
    if (idx === q.answer) {
      btn.classList.add('correct')
    } else if (idx === selectedIndex && !isCorrect) {
      btn.classList.add('incorrect')
    }
  })

  setTimeout(() => {
    quizState.currentIndex++
    quizState.answered = false

    if (quizState.currentIndex >= quizState.questions.length) {
      finishQuiz()
    } else {
      renderQuizQuestion()
    }
  }, 1200)
}

/* ---------- Screen: Results ---------- */
function finishQuiz() {
  currentScreen = 'results'
  stopTimer()

  const { category, questions, correctCount, answers } = quizState
  const total = questions.length
  const score = Math.round((correctCount / total) * 100)
  const totalTime = Math.round((Date.now() - quizState.startTime) / 1000)
  const minutes = Math.floor(totalTime / 60)
  const seconds = totalTime % 60

  const previousBest = getBestScore(category.id)
  const isBest = !previousBest || score > previousBest.score

  saveScore({
    categoryId: category.id,
    categoryName: category.name,
    correct: correctCount,
    total,
    score,
    date: new Date().toISOString(),
    time: totalTime,
  })

  renderHeaderStats()

  let title, message, emoji
  if (score === 100) {
    title = 'Perfect Score!'
    message = 'You answered every question correctly. Outstanding!'
    emoji = '🏆'
  } else if (score >= 80) {
    title = 'Excellent Work!'
    message = 'You really know your stuff. Almost perfect!'
    emoji = '🎉'
  } else if (score >= 60) {
    title = 'Good Job!'
    message = "Nice work! A little more practice and you'll ace it."
    emoji = '👍'
  } else if (score >= 40) {
    title = 'Not Bad!'
    message = "You're getting there. Try again to improve your score."
    emoji = '💪'
  } else {
    title = 'Keep Practicing!'
    message = "Don't give up — every expert was once a beginner."
    emoji = '📚'
  }

  const ringRadius = 70
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (score / 100) * ringCircumference
  const ringColor = score >= 60 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'

  const bestBadgeHtml = isBest
    ? `<div class="results-is-best">${ICONS.star} New Personal Best!</div>`
    : ''

  main().innerHTML = `
    <div class="results-screen">
      <div class="results-emoji">${emoji}</div>
      <h2 class="results-title">${title}</h2>
      <p class="results-message">${message}</p>

      <div class="results-score-circle">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle class="score-bg-ring" cx="80" cy="80" r="${ringRadius}"/>
          <circle class="score-fill-ring" cx="80" cy="80" r="${ringRadius}"
            stroke="${ringColor}"
            stroke-dasharray="${ringCircumference}"
            stroke-dashoffset="${ringCircumference}"
          />
        </svg>
        <div class="results-score-text">
          <div class="big-num" style="color: ${ringColor}">${score}%</div>
          <div class="small-label">Score</div>
        </div>
      </div>

      ${bestBadgeHtml}

      <div class="results-breakdown">
        <div class="breakdown-item correct">
          <div class="item-value">${correctCount}</div>
          <div class="item-label">Correct</div>
        </div>
        <div class="breakdown-item wrong">
          <div class="item-value">${total - correctCount}</div>
          <div class="item-label">Wrong</div>
        </div>
        <div class="breakdown-item time">
          <div class="item-value">${minutes}:${seconds.toString().padStart(2, '0')}</div>
          <div class="item-label">Time</div>
        </div>
      </div>

      <div class="results-actions">
        <button class="btn btn-primary" id="retry-btn">Try Again</button>
        <button class="btn btn-secondary" id="home-btn">Back to Home</button>
      </div>
    </div>
  `

  requestAnimationFrame(() => {
    const ring = main().querySelector('.score-fill-ring')
    if (ring) {
      ring.style.strokeDashoffset = ringOffset
    }
  })

  $('#retry-btn').addEventListener('click', () => {
    startQuiz(category.id)
  })

  $('#home-btn').addEventListener('click', () => {
    renderWelcome()
  })
}

/* ---------- Init ---------- */
async function init() {
  $('#brand').addEventListener('click', () => {
    if (currentScreen !== 'welcome') {
      stopTimer()
      renderWelcome()
    }
  })

  try {
    const res = await fetch('/quiz-data.json')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    quizData = await res.json()
  } catch (err) {
    main().innerHTML = `
      <div class="welcome">
        <h1 class="welcome-title">Unable to Load Quiz Data</h1>
        <p class="welcome-subtitle">There was a problem loading the quiz questions. Please make sure quiz-data.json exists and try refreshing the page.</p>
      </div>
    `
    return
  }

  renderWelcome()
}

init()
