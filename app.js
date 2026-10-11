
const $ = id => document.getElementById(id);

const CATEGORIES = [
  { name: "General Knowledge", icon: "🌍" },
  { name: "Science", icon: "🔬" },
  { name: "Mathematics", icon: "➗" },
  { name: "HTML", icon: "🧱" },
  { name: "CSS", icon: "🎨" },
  { name: "JavaScript", icon: "⚡" },
  { name: "Python", icon: "🐍" },
  { name: "PHP", icon: "🐘" }
];

let saved = {};
try {
  saved = JSON.parse(localStorage.getItem("quizMasterData")) || {};
} catch (_) {
  saved = {};
}

let attempted = saved.attempted || {};
let history = saved.history || [];
let theme = saved.theme || "light";
let quiz = null;
let timerId = null;

function save() {
  try {
    localStorage.setItem("quizMasterData",
      JSON.stringify({ attempted, history, theme }));
  } catch (_) {
    console.warn("Progress could not be saved.");
  }
}

function uniqueQuestions(list) {
  const ids = new Set();
  return list.filter(q => {
    if (!q.id || ids.has(q.id)) return false;
    ids.add(q.id);
    return true;
  });
}

function questionsFor(category) {
  return uniqueQuestions(
    (window.QUIZ_QUESTIONS || []).filter(q => q.category === category)
  );
}

function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function showScreen(screen) {
  $("homeScreen").classList.toggle("hidden", screen !== "home");
  $("quizScreen").classList.toggle("hidden", screen !== "quiz");
  $("resultScreen").classList.toggle("hidden", screen !== "result");
  window.scrollTo(0, 0);
}

function renderCategories(search = "") {
  $("categoryGrid").innerHTML = "";

  CATEGORIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  ).forEach(category => {
    const bank = questionsFor(category.name);
    const used = new Set(attempted[category.name] || []);
    const unseen = bank.filter(q => !used.has(q.id)).length;

    const button = document.createElement("button");
    button.className = "category-card";

    const icon = document.createElement("div");
    icon.className = "category-icon";
    icon.textContent = category.icon;

    const title = document.createElement("h3");
    title.textContent = category.name;

    const description = document.createElement("p");
    description.textContent =
      `${bank.length} questions available. ${unseen} not yet attempted.`;

    const bottom = document.createElement("div");
    bottom.className = "category-bottom";

    const count = document.createElement("span");
    count.className = "question-count";
    count.textContent = `${unseen} unseen`;

    const start = document.createElement("span");
    start.className = "start-label";
    start.textContent = "Start →";

    bottom.append(count, start);
    button.append(icon, title, description, bottom);
    button.addEventListener("click", () => setupQuiz(category.name));
    $("categoryGrid").appendChild(button);
  });
}

function setupQuiz(category) {
  const bank = questionsFor(category);

  if (!bank.length) {
    alert("No questions in this category yet.");
    return;
  }

  const used = new Set(attempted[category] || []);
  let available = bank.filter(q => !used.has(q.id));

  if (!available.length) {
    if (!confirm("You attempted all questions. Review them again?")) return;
    available = bank;
  }

  const input = prompt(
    `Questions available: ${available.length}\nHow many questions?`,
    String(Math.min(5, available.length))
  );

  if (input === null) return;

  const count = Math.floor(Number(input));
  if (!Number.isFinite(count) || count < 1) {
    alert("Enter a valid positive number.");
    return;
  }

  startQuiz(category, shuffle(available).slice(0, count), false);
}

function startQuiz(category, questions, retry) {
  clearInterval(timerId);

  quiz = {
    category,
    questions: questions.map(q => ({
      ...q,
      displayOptions: shuffle(
        q.options.map((text, originalIndex) => ({ text, originalIndex }))
      )
    })),
    answers: {},
    marked: new Set(),
    index: 0,
    retry,
    started: Date.now(),
    secondsLeft: Math.max(60, questions.length * 60)
  };

  $("quizMeta").textContent = category + (retry ? " · Retry" : "");
  showScreen("quiz");
  renderQuestion();
  updateTimer();

  timerId = setInterval(() => {
    if (!quiz) return;

    quiz.secondsLeft--;
    updateTimer();

    if (quiz.secondsLeft <= 0) {
      clearInterval(timerId);
      finishQuiz(true);
    }
  }, 1000);
}

function updateTimer() {
  const seconds = Math.max(0, quiz.secondsLeft);
  $("timer").textContent =
    `⏱ ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function renderQuestion() {
  const q = quiz.questions[quiz.index];

  $("questionCounter").textContent =
    `QUESTION ${quiz.index + 1} OF ${quiz.questions.length}`;
  $("questionText").textContent = q.question;
  $("progressBar").style.width =
    `${(quiz.index + 1) / quiz.questions.length * 100}%`;

  $("optionsList").innerHTML = "";

  q.displayOptions.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option-btn" +
      (quiz.answers[q.id] === option.originalIndex ? " selected" : "");

    const letter = document.createElement("span");
    letter.className = "option-letter";
    letter.textContent = String.fromCharCode(65 + index);

    const text = document.createElement("span");
    text.textContent = option.text;

    button.append(letter, text);
    button.addEventListener("click", () => {
      quiz.answers[q.id] = option.originalIndex;
      renderQuestion();
    });

    $("optionsList").appendChild(button);
  });

  $("prevQuestion").disabled = quiz.index === 0;
  $("nextQuestion").textContent =
    quiz.index === quiz.questions.length - 1 ? "Review answers →" : "Next →";

  $("answeredCount").textContent =
    `${Object.keys(quiz.answers).length} answered`;

  $("markReview").textContent =
    quiz.marked.has(q.id) ? "★ Marked for review" : "☆ Mark for review";

  renderNavigator();
}

function renderNavigator() {
  $("questionNav").innerHTML = "";

  quiz.questions.forEach((q, index) => {
    const button = document.createElement("button");
    button.className = "nav-number" +
      (quiz.answers[q.id] !== undefined ? " answered" : "") +
      (index === quiz.index ? " current" : "") +
      (quiz.marked.has(q.id) ? " marked" : "");

    button.textContent = index + 1;
    button.addEventListener("click", () => {
      quiz.index = index;
      renderQuestion();
    });

    $("questionNav").appendChild(button);
  });
}

function finishQuiz(timeUp = false) {
  if (!quiz) return;

  if (!timeUp) {
    const unanswered = quiz.questions.filter(
      q => quiz.answers[q.id] === undefined
    ).length;

    if (unanswered &&
        !confirm(`${unanswered} questions are unanswered. Submit anyway?`)) {
      return;
    }
  }

  clearInterval(timerId);

  const completed = quiz;
  const correct = completed.questions.filter(
    q => completed.answers[q.id] === q.correctIndex
  ).length;

  const wrong = completed.questions.filter(
    q => completed.answers[q.id] !== undefined &&
         completed.answers[q.id] !== q.correctIndex
  ).length;

  const skipped = completed.questions.length - correct - wrong;
  const percent = Math.round(correct / completed.questions.length * 100);
  const seconds = Math.floor((Date.now() - completed.started) / 1000);

  const used = new Set(attempted[completed.category] || []);
  completed.questions.forEach(q => used.add(q.id));
  attempted[completed.category] = [...used];

  history.push({
    category: completed.category,
    total: completed.questions.length,
    correct,
    percent,
    date: new Date().toLocaleString()
  });

  if (history.length > 100) history = history.slice(-100);
  save();

  $("resultPercent").textContent = `${percent}%`;
  $("resultTitle").textContent =
    percent >= 80 ? "Excellent work!" :
    percent >= 50 ? "Good effort!" : "Keep practising!";

  $("resultSubtitle").textContent = completed.category;
  $("resultCorrect").textContent = correct;
  $("resultWrong").textContent = wrong;
  $("resultSkipped").textContent = skipped;
  $("resultTime").textContent =
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  $("reviewList").innerHTML = "";

  completed.questions.forEach((q, index) => {
    const picked = completed.answers[q.id];
    const isCorrect = picked === q.correctIndex;
    const card = document.createElement("article");
    card.className = "review-card";

    const title = document.createElement("h3");
    title.textContent = `${index + 1}. ${q.question}`;

    const answer = document.createElement("p");
    answer.className = "review-answer " +
      (isCorrect ? "correct-text" : "wrong-text");
    answer.textContent = "Your answer: " +
      (picked === undefined ? "Not answered" : q.options[picked]);

    const correctAnswer = document.createElement("p");
    correctAnswer.className = "review-answer correct-text";
    correctAnswer.textContent = "Correct answer: " + q.options[q.correctIndex];

    const explanation = document.createElement("div");
    explanation.className = "explanation";
    explanation.textContent = "Explanation: " + (q.explanation || "No explanation added.");

    card.append(title, answer, correctAnswer, explanation);
    $("reviewList").appendChild(card);
  });

  $("retryWrong").disabled = wrong === 0;
  $("retryWrong").onclick = () => {
    const incorrect = completed.questions.filter(
      q => completed.answers[q.id] !== undefined &&
           completed.answers[q.id] !== q.correctIndex
    );

    if (incorrect.length) {
      startQuiz(completed.category, incorrect, true);
    }
  };

  $("newQuiz").onclick = () => {
    showScreen("home");
    setupQuiz(completed.category);
  };

  quiz = null;
  renderDashboard();
  showScreen("result");

  if (timeUp) alert("Time is up. Your quiz has been submitted.");
}

function renderDashboard() {
  $("statAttempts").textContent = history.length;

  const totalCorrect = history.reduce((sum, h) => sum + h.correct, 0);
  const totalQuestions = history.reduce((sum, h) => sum + h.total, 0);

  $("statAccuracy").textContent = totalQuestions
    ? Math.round(totalCorrect / totalQuestions * 100) + "%"
    : "0%";

  $("statBest").textContent = history.length
    ? Math.max(...history.map(h => h.percent)) + "%"
    : "—";

  renderCategories($("categorySearch").value);
  $("historyList").innerHTML = "";

  history.slice(-5).reverse().forEach(h => {
    const item = document.createElement("div");
    item.className = "history-item";

    const title = document.createElement("strong");
    title.textContent = h.category;

    const detail = document.createElement("small");
    detail.textContent = `${h.correct}/${h.total} correct · ${h.date}`;

    const score = document.createElement("span");
    score.className = "history-score";
    score.textContent = `${h.percent}%`;

    const left = document.createElement("div");
    left.append(title, detail);
    item.append(left, score);
    $("historyList").appendChild(item);
  });

  if (!history.length) {
    $("historyList").innerHTML =
      '<div class="empty-state">No attempts yet. Start a quiz!</div>';
  }
}

$("categorySearch").addEventListener("input", e => {
  renderCategories(e.target.value);
});

$("themeToggle").addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  save();
});

$("backHome").addEventListener("click", () => {
  if (confirm("Leave this quiz? Current answers will be lost.")) {
    clearInterval(timerId);
    quiz = null;
    showScreen("home");
    renderDashboard();
  }
});

$("resultHome").addEventListener("click", () => {
  showScreen("home");
  renderDashboard();
});

$("prevQuestion").addEventListener("click", () => {
  if (quiz && quiz.index > 0) {
    quiz.index--;
    renderQuestion();
  }
});

$("nextQuestion").addEventListener("click", () => {
  if (!quiz) return;

  if (quiz.index < quiz.questions.length - 1) {
    quiz.index++;
    renderQuestion();
  } else {
    finishQuiz(false);
  }
});

$("markReview").addEventListener("click", () => {
  if (!quiz) return;
  const id = quiz.questions[quiz.index].id;

  if (quiz.marked.has(id)) quiz.marked.delete(id);
  else quiz.marked.add(id);

  renderQuestion();
});

$("submitQuiz").addEventListener("click", () => finishQuiz(false));

$("clearHistory").addEventListener("click", () => {
  if (confirm("Reset all quiz progress on this browser?")) {
    attempted = {};
    history = [];
    save();
    renderDashboard();
  }
});

document.documentElement.dataset.theme = theme;
renderDashboard();
