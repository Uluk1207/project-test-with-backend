// Global Variables
let currentUser = null
let currentTest = null
let currentQuestionIndex = 0
let userAnswers = {}
let testTimer = null
let timeRemaining = 0
let questions = []
// Глобалдык өзгөрмөлөр
let editingTest = null
let editQuestions = []

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
  setupEventListeners()
  loadDemoData()
  updateUserToServer()
  updateTestToServer()
})

function updateUserToServer () {
  updateUsers().catch(((e) => console.log(e, 'Error')))
}
function updateTestToServer () {
  updateTests().catch(((e) => console.log(e, 'Error')))
}


// get users and tests
async function getUsers() {
  try {
    const users = await fetch("http://localhost:3000/users")
    const usersData = await users.json()

    const data = usersData?.length ? usersData[0].data : []

    if (!data.length) {
      const demoUsers = [
        {
          id: "1",
          name: "Админ Пайдаланучысы",
          email: "admin@test.com",
          password: "admin123",
          role: "admin",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Кардар Пайдаланучысы",
          email: "employee@test.com",
          password: "emp123",
          role: "employee",
          createdAt: new Date().toISOString(),
        },
      ]

      localStorage.setItem("users", JSON.stringify(demoUsers))
    } else {
      localStorage.setItem("users", data)
    }
  } catch (err) {
    console.log(err)
  }
}


async function getTests() {
  const tests = await fetch("http://localhost:3000/tests")
  const testsData = await tests.json()
  let data = testsData?.length ? testsData[0].data : []

  if (!data.length) {
    const demoTests = [
      {
        id: "1",
        title: "JavaScript Негиздери",
        description: "JavaScript программалоо тилинин негизги түшүнүктөрү",
        timeLimit: 30,
        passingScore: 70,
        isActive: true,
        createdBy: "1",
        createdAt: new Date().toISOString(),
        questions: [
          {
            id: "1",
            question: "JavaScript кандай тил?",
            type: "multiple-choice",
            options: ["Программалоо тили", "Маркап тили", "Стиль тили", "Маалымат базасы"],
            correctAnswer: 0,
            points: 1,
          },
          {
            id: "2",
            question: "JavaScript браузерде иштейби?",
            type: "true-false",
            correctAnswer: "true",
            points: 1,
          },
          {
            id: "3",
            question: "Өзгөрмөнү кантип жарыялайбыз?",
            type: "text",
            correctAnswer: "var",
            points: 1,
          },
        ],
      },
    ]
    let preparedTests = []

    demoTests.forEach(test => {
      preparedTests.push({ ...test, questions: JSON.stringify(test.questions) })
    })

    localStorage.setItem("tests", JSON.stringify(preparedTests))
  } else {
    localStorage.setItem("tests", data)
  }
}


async function updateUsers() {
  const userData = localStorage.getItem("users") || []

  await fetch('http://localhost:3000/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: userData
  })
}

async function updateTests() {
  const testsData = localStorage.getItem("tests") || []

  await fetch('http://localhost:3000/tests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: testsData
  })
}


// Initialize application
function initializeApp() {
  // Check if user is logged in
  const userData = localStorage.getItem("currentUser")
  if (userData) {
    currentUser = JSON.parse(userData)
    updateNavigation()

    // Redirect to appropriate dashboard
    if (currentUser.role === "admin") {
      showPage("adminDashboard")
      loadAdminStats()
    } else {
      showPage("employeeDashboard")
      loadEmployeeStats()
      loadAvailableTests()
      loadRecentResults()
    }
  } else {
    showPage("home")
  }
}

// Setup event listeners
function setupEventListeners() {
  // Login form
  document.getElementById("loginForm").addEventListener("submit", handleLogin)

  // Register form
  document.getElementById("registerForm").addEventListener("submit", handleRegister)

  // Question type change
  document.getElementById("questionType").addEventListener("change", updateQuestionOptions)

  // Initialize question options
  updateQuestionOptions()
}

// Load demo data
function loadDemoData() {
  // Create demo users if they don't exist
  getUsers().then(() => console.log('Users successfully fetched')).catch(err => console.log(err))

  // Create demo tests if they don't exist
  getTests().then(() => console.log('Tests successfully fetched')).catch(err => console.log(err))
}

// Navigation functions
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active")
  })

  // Show selected page
  const targetPage = document.getElementById(pageId + "Page") || document.getElementById(pageId)
  if (targetPage) {
    targetPage.classList.add("active")
  }

  // Update page-specific content
  switch (pageId) {
    case "adminDashboard":
      loadAdminStats()
      break
    case "employeeDashboard":
      loadEmployeeStats()
      loadAvailableTests()
      loadRecentResults()
      break
    case "manageTests":
      loadTestsManagement()
      break
    case "viewResults":
      loadAllResults()
      break
    case "createTest":
      resetTestCreation()
      break
    case "editTest":
      break
  }
}

function updateNavigation() {
  const navMenu = document.getElementById("navMenu")
  const userMenu = document.getElementById("userMenu")
  const userName = document.getElementById("userName")

  if (currentUser) {
    navMenu.style.display = "none"
    userMenu.style.display = "flex"
    userName.textContent = `Саламатсызбы, ${currentUser.name}`
  } else {
    navMenu.style.display = "flex"
    userMenu.style.display = "none"
  }
}

// Authentication functions
function handleLogin(e) {
  e.preventDefault()

  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  const users = JSON.parse(localStorage.getItem("users") || "[]")
  const user = users.find((u) => u.email === email && u.password === password)

  if (user) {
    currentUser = user
    localStorage.setItem("currentUser", JSON.stringify(user))
    updateNavigation()

    if (user.role === "admin") {
      showPage("adminDashboard")
    } else {
      showPage("employeeDashboard")
    }

    showAlert("Ийгиликтүү кирдиңиз!", "success")
  } else {
    showAlert("Электрондук почта же сырсөз туура эмес", "error")
  }
}

function handleRegister(e) {
  e.preventDefault()

  const name = document.getElementById("registerName").value
  const email = document.getElementById("registerEmail").value
  const role = document.getElementById("registerRole").value
  const password = document.getElementById("registerPassword").value
  const confirmPassword = document.getElementById("confirmPassword").value

  if (password !== confirmPassword) {
    showAlert("Сырсөздөр дал келбейт", "error")
    return
  }

  if (password.length < 6) {
    showAlert("Сырсөз кеминде 6 символдон турушу керек", "error")
    return
  }

  const users = JSON.parse(localStorage.getItem("users") || "[]")

  if (users.find((u) => u.email === email)) {
    showAlert("Бул электрондук почта менен аккаунт мурда катталган", "error")
    return
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    role,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  localStorage.setItem("users", JSON.stringify(users))
  updateUserToServer()

  currentUser = newUser
  localStorage.setItem("currentUser", JSON.stringify(newUser))
  updateNavigation()

  if (newUser.role === "admin") {
    showPage("adminDashboard")
  } else {
    showPage("employeeDashboard")
  }

  showAlert("Ийгиликтүү катталдыңыз!", "success")
}

function logout() {
  currentUser = null
  localStorage.removeItem("currentUser")
  updateNavigation()
  showPage("home")
  showAlert("Ийгиликтүү чыктыңыз!", "success")
}

// ========== ӨЗГӨРТҮЛГӨН ФУНКЦИЯЛАР ==========

// Admin Dashboard functions - ӨЗГӨРТҮЛДҮ
function loadAdminStats() {
  const tests = JSON.parse(localStorage.getItem("tests") || "[]")
  const users = JSON.parse(localStorage.getItem("users") || "[]")
  const results = JSON.parse(localStorage.getItem("testResults") || "[]")

  // Учурдагы админ түзгөн тесттерди гана эсептөө
  const userTests = tests.filter((test) => test.createdBy === currentUser.id)
  const employees = users.filter((u) => u.role === "employee")

  // Учурдагы админдин тесттери боюнча жыйынтыктар
  const userTestIds = userTests.map((test) => test.id)
  const userTestResults = results.filter((result) => userTestIds.includes(result.testId))

  const avgScore =
    userTestResults.length > 0
      ? Math.round(userTestResults.reduce((sum, r) => sum + r.score, 0) / userTestResults.length)
      : 0

  const statsContainer = document.getElementById("adminStats")
  statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${userTests.length}</div>
            <div class="stat-label">Бардык тесттер</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${employees.length}</div>
            <div class="stat-label">Тест тапшырган кардарлар саны</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${userTestResults.length}</div>
            <div class="stat-label">Тесттердин сеанстарынын саны</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${avgScore}%</div>
            <div class="stat-label">Орточо упай</div>
        </div>
    `
}

// Employee Dashboard functions
function loadEmployeeStats() {
  const tests = JSON.parse(localStorage.getItem("tests") || "[]")
  const results = JSON.parse(localStorage.getItem("testResults") || "[]")

  const activeTests = tests.filter((t) => t.isActive)
  const userResults = results.filter((r) => r.userId === currentUser.id)
  const avgScore =
    userResults.length > 0 ? Math.round(userResults.reduce((sum, r) => sum + r.score, 0) / userResults.length) : 0

  const statsContainer = document.getElementById("employeeStats")
  statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${activeTests.length}</div>
            <div class="stat-label">Жеткиликтүү тесттер</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${userResults.length}</div>
            <div class="stat-label">Аткарылган тесттер</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${avgScore}%</div>
            <div class="stat-label">Орточо упай</div>
        </div>
    `
}

function loadAvailableTests() {
  const tests = JSON.parse(localStorage.getItem("tests") || "[]")
  const results = JSON.parse(localStorage.getItem("testResults") || "[]")

  const activeTests = tests.filter((t) => t.isActive)
  const testsContainer = document.getElementById("testsList")

  if (activeTests.length === 0) {
    testsContainer.innerHTML = `
            <div class="test-card">
                <h3>Жеткиликтүү тесттер жок</h3>
                <p>Учурда тапшыруу үчүн тесттер жок</p>
            </div>
        `
    return
  }

  testsContainer.innerHTML = activeTests
    .map((test) => {
      const userResult = results.find((r) => r.testId === test.id && r.userId === currentUser.id)
      const hasCompleted = !!userResult

      return `
            <div class="test-card">
                <div class="test-card-header">
                    <div>
                        <div class="test-card-title">${test.title}</div>
                        <div class="test-card-description">${test.description || "Сүрөттөмө жок"}</div>
                    </div>
                    ${
                      hasCompleted
                        ? `
                        <span class="status-badge ${userResult.score >= test.passingScore ? "passed" : "failed"}">
                            ${userResult.score >= test.passingScore ? "Өттүңүз" : "Өткөн жоксуз"}
                        </span>
                    `
                        : ""
                    }
                </div>
                <div class="test-card-meta">
                    <div><i class="fas fa-clock"></i> ${test.timeLimit} мүнөт</div>
                    <div><i class="fas fa-file-alt"></i> ${test.questions?.length || 0} суроо</div>
                    <div><i class="fas fa-check-circle"></i> Өтүү упайы: ${test.passingScore}%</div>
                    ${hasCompleted ? `<div><i class="fas fa-star"></i> Сиздин упайыңыз: ${userResult.score}%</div>` : ""}
                </div>
                <div class="test-card-actions">
                    ${
                      !hasCompleted
                        ? `
                        <button onclick="startTest('${test.id}')" class="btn btn-primary">Тестти баштоо</button>
                    `
                        : `
                        <button onclick="viewResult('${userResult.id}')" class="btn btn-outline">Жыйынтыкты көрүү</button>
                        <button onclick="startTest('${test.id}')" class="btn btn-primary">Кайра тапшыруу</button>
                    `
                    }
                </div>
            </div>
        `
    })
    .join("")
}

function loadRecentResults() {
  const results = JSON.parse(localStorage.getItem("testResults") || "[]")
  const tests = JSON.parse(localStorage.getItem("tests") || "[]")

  const userResults = results
    .filter((r) => r.userId === currentUser.id)
    .slice(-5)
    .reverse()

  const resultsContainer = document.getElementById("recentResults")

  if (userResults.length === 0) {
    resultsContainer.innerHTML = "<p>Акыркы жыйынтыктар жок</p>"
    return
  }

  resultsContainer.innerHTML = userResults
    .map((result) => {
      const test = tests.find((t) => t.id === result.testId)
      return `
            <div class="result-management-item">
                <div class="result-management-header">
                    <div>
                        <div class="result-management-title">${test?.title || "Белгисиз тест"}</div>
                        <div class="result-management-meta">
                            ${new Date(result.completedAt).toLocaleDateString("ky-KG")}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.2rem; font-weight: bold;">${result.score}%</div>
                        <span class="status-badge ${result.score >= (test?.passingScore || 70) ? "passed" : "failed"}">
                            ${result.score >= (test?.passingScore || 70) ? "Өттүңүз" : "Өткөн жоксуз"}
                        </span>
                    </div>
                </div>
            </div>
        `
    })
    .join("")
}

// Test Creation functions
function resetTestCreation() {
  document.getElementById("testTitle").value = ""
  document.getElementById("testDescription").value = ""
  document.getElementById("timeLimit").value = "30"
  document.getElementById("passingScore").value = "70"

  questions = []
  updateQuestionsList()
  updateQuestionOptions()
}

function updateQuestionOptions() {
  const questionType = document.getElementById("questionType").value
  const optionsContainer = document.getElementById("optionsContainer")

  if (questionType === "multiple-choice") {
    optionsContainer.innerHTML = `
            <div class="options-container">
                <label>Жооп варианттары</label>
                <div class="option-input">
                    <input type="text" id="option1" placeholder="Вариант 1" required>
                    <input type="radio" name="correctOption" value="0" checked>
                    <label>Туура</label>
                </div>
                <div class="option-input">
                    <input type="text" id="option2" placeholder="Вариант 2" required>
                    <input type="radio" name="correctOption" value="1">
                    <label>Туура</label>
                </div>
                <div class="option-input">
                    <input type="text" id="option3" placeholder="Вариант 3" required>
                    <input type="radio" name="correctOption" value="2">
                    <label>Туура</label>
                </div>
                <div class="option-input">
                    <input type="text" id="option4" placeholder="Вариант 4" required>
                    <input type="radio" name="correctOption" value="3">
                    <label>Туура</label>
                </div>
            </div>
        `
  } else if (questionType === "true-false") {
    optionsContainer.innerHTML = `
            <div class="form-group">
                <label>Туура жооп</label>
                <select id="trueFalseAnswer">
                    <option value="true">Туура</option>
                    <option value="false">Туура эмес</option>
                </select>
            </div>
        `
  } else if (questionType === "text") {
    optionsContainer.innerHTML = `
            <div class="form-group">
                <label for="textAnswer">Туура жооп</label>
                <input type="text" id="textAnswer" placeholder="Туура жоопту киргизиңиз" required>
            </div>
        `
  }
}

function addQuestion() {
  const questionText = document.getElementById("questionText").value.trim()
  const questionType = document.getElementById("questionType").value
  const questionPoints = Number.parseInt(document.getElementById("questionPoints").value)

  if (!questionText) {
    showAlert("Суроону киргизиңиз", "error")
    return
  }

  let correctAnswer
  let options = null

  if (questionType === "multiple-choice") {
    const option1 = document.getElementById("option1").value.trim()
    const option2 = document.getElementById("option2").value.trim()
    const option3 = document.getElementById("option3").value.trim()
    const option4 = document.getElementById("option4").value.trim()

    if (!option1 || !option2 || !option3 || !option4) {
      showAlert("Бардык варианттарды толтуруңуз", "error")
      return
    }

    options = [option1, option2, option3, option4]
    correctAnswer = Number.parseInt(document.querySelector('input[name="correctOption"]:checked').value)
  } else if (questionType === "true-false") {
    correctAnswer = document.getElementById("trueFalseAnswer").value
  } else if (questionType === "text") {
    correctAnswer = document.getElementById("textAnswer").value.trim()
    if (!correctAnswer) {
      showAlert("Туура жоопту киргизиңиз", "error")
      return
    }
  }

  const newQuestion = {
    id: Date.now().toString(),
    question: questionText,
    type: questionType,
    options: options,
    correctAnswer: correctAnswer,
    points: questionPoints,
  }

  questions.push(newQuestion)
  updateQuestionsList()

  // Reset form
  document.getElementById("questionText").value = ""
  document.getElementById("questionPoints").value = "1"
  updateQuestionOptions()

  showAlert("Суроо ийгиликтүү кошулду!", "success")
}

function updateQuestionsList() {
  const questionsList = document.getElementById("questionsList")

  if (questions.length === 0) {
    questionsList.innerHTML = "<p>Суроолор кошулган жок</p>"
    return
  }

  questionsList.innerHTML = questions
    .map(
      (question, index) => `
        <div class="question-item">
            <div class="question-header">
                <div class="question-title">${index + 1}. ${question.question}</div>
                <button onclick="removeQuestion('${question.id}')" class="btn btn-danger" style="padding: 5px 10px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="question-meta">
                Түрү: ${getQuestionTypeText(question.type)} | Упай: ${question.points}
            </div>
            ${
              question.options
                ? `
                <div class="question-options">
                    ${question.options
                      .map(
                        (option, optIndex) => `
                        <div class="${optIndex === question.correctAnswer ? "correct-answer" : ""}">
                            ${optIndex + 1}. ${option}
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `
                : question.type === "true-false"
                  ? `
                <div class="question-options">
                    Туура жооп: <span class="correct-answer">${question.correctAnswer === "true" ? "Туура" : "Туура эмес"}</span>
                </div>
            `
                  : `
                <div class="question-options">
                    Туура жооп: <span class="correct-answer">${question.correctAnswer}</span>
                </div>
            `
            }
        </div>
    `,
    )
    .join("")
}

function getQuestionTypeText(type) {
  switch (type) {
    case "multiple-choice":
      return "Көп тандоолуу"
    case "true-false":
      return "Туура/Туура эмес"
    case "text":
      return "Текст"
    default:
      return "Белгисиз"
  }
}

function removeQuestion(questionId) {
  questions = questions.filter((q) => q.id !== questionId)
  updateQuestionsList()
  showAlert("Суроо өчүрүлдү", "success")
}

function saveTest() {
  const title = document.getElementById("testTitle").value.trim()
  const description = document.getElementById("testDescription").value.trim()
  const timeLimit = Number.parseInt(document.getElementById("timeLimit").value)
  const passingScore = Number.parseInt(document.getElementById("passingScore").value)

  if (!title) {
    showAlert("Тест аталышын киргизиңиз", "error")
    return
  }

  if (questions.length === 0) {
    showAlert("Кеминде бир суроо кошуңуз", "error")
    return
  }
  

  const newTest = {
    id: Date.now().toString(),
    title,
    description,
    timeLimit,
    passingScore,
    questions: [...questions],
    isActive: true,
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
  }

  const tests = JSON.parse(localStorage.getItem("tests") || "[]")
  tests.push(newTest)
  localStorage.setItem("tests", JSON.stringify(tests))
  updateTestToServer()

  showAlert("Тест ийгиликтүү сакталды!", "success")

  setTimeout(() => {
    showPage("manageTests")
  }, 2000)
}

// Test Taking functions
function startTest(testId) {
  const tests = JSON.parse(localStorage.getItem("tests") || "[]")
  currentTest = tests.find((t) => t.id === testId)

  if (!currentTest) {
    showAlert("Тест табылган жок", "error")
    return
  }

  // Initialize test taking
  currentQuestionIndex = 0
  userAnswers = {}
  timeRemaining = currentTest.timeLimit * 60 // Convert to seconds

  showPage("takeTest")
  displayCurrentQuestion()
  startTimer()
  updateProgress()
  updateQuestionOverview()
}

function displayCurrentQuestion() {
  const question = currentTest.questions[currentQuestionIndex]
  const questionContainer = document.getElementById("currentQuestion")

  document.getElementById("testTitleDisplay").textContent = currentTest.title

  let questionHTML = `
        <div class="question-text">${question.question}</div>
        <div class="question-points">Упай: ${question.points}</div>
    `

  if (question.type === "multiple-choice") {
    questionHTML += `
            <div class="answer-options">
                ${question.options
                  .map(
                    (option, index) => `
                    <div class="answer-option ${userAnswers[question.id] === index ? "selected" : ""}" 
                         onclick="selectAnswer('${question.id}', ${index})">
                        <input type="radio" name="answer" value="${index}" 
                               ${userAnswers[question.id] === index ? "checked" : ""}>
                        <label>${option}</label>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        `
  } else if (question.type === "true-false") {
    questionHTML += `
            <div class="answer-options">
                <div class="answer-option ${userAnswers[question.id] === "true" ? "selected" : ""}" 
                     onclick="selectAnswer('${question.id}', 'true')">
                    <input type="radio" name="answer" value="true" 
                           ${userAnswers[question.id] === "true" ? "checked" : ""}>
                    <label>Туура</label>
                </div>
                <div class="answer-option ${userAnswers[question.id] === "false" ? "selected" : ""}" 
                     onclick="selectAnswer('${question.id}', 'false')">
                    <input type="radio" name="answer" value="false" 
                           ${userAnswers[question.id] === "false" ? "checked" : ""}>
                    <label>Туура эмес</label>
                </div>
            </div>
        `
  } else if (question.type === "text") {
    questionHTML += `
            <input type="text" class="text-answer" placeholder="Жообуңузду киргизиңиз" 
                   value="${userAnswers[question.id] || ""}" 
                   onchange="selectAnswer('${question.id}', this.value)">
        `
  }

  questionContainer.innerHTML = questionHTML

  // Update navigation buttons
  document.getElementById("prevBtn").style.display = currentQuestionIndex === 0 ? "none" : "inline-flex"
  document.getElementById("nextBtn").style.display =
    currentQuestionIndex === currentTest.questions.length - 1 ? "none" : "inline-flex"
  document.getElementById("submitBtn").style.display =
    currentQuestionIndex === currentTest.questions.length - 1 ? "inline-flex" : "none"
}

function selectAnswer(questionId, answer) {
  userAnswers[questionId] = answer
  displayCurrentQuestion()
  updateQuestionOverview()
}

function nextQuestion() {
  if (currentQuestionIndex < currentTest.questions.length - 1) {
    currentQuestionIndex++
    displayCurrentQuestion()
    updateProgress()
  }
}

function previousQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--
    displayCurrentQuestion()
    updateProgress()
  }
}

function jumpToQuestion(index) {
  currentQuestionIndex = index
  displayCurrentQuestion()
  updateProgress()
}

function updateProgress() {
  const progress = ((currentQuestionIndex + 1) / currentTest.questions.length) * 100
  document.getElementById("progressFill").style.width = progress + "%"
  document.getElementById("questionCounter").textContent =
    `Суроо ${currentQuestionIndex + 1} / ${currentTest.questions.length}`
}

function updateQuestionOverview() {
  const overviewContainer = document.getElementById("questionOverview")

  overviewContainer.innerHTML = currentTest.questions
    .map((question, index) => {
      let className = "question-number"
      if (index === currentQuestionIndex) {
        className += " current"
      } else if (userAnswers[question.id] !== undefined) {
        className += " answered"
      }

      return `
            <div class="${className}" onclick="jumpToQuestion(${index})">
                ${index + 1}
            </div>
        `
    })
    .join("")
}

function startTimer() {
  testTimer = setInterval(() => {
    timeRemaining--
    updateTimerDisplay()

    if (timeRemaining <= 0) {
      clearInterval(testTimer)
      submitTest()
    }
  }, 1000)
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  document.getElementById("timeRemaining").textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function submitTest() {
  if (testTimer) {
    clearInterval(testTimer)
  }

  const score = calculateScore()
  const result = {
    id: Date.now().toString(),
    userId: currentUser.id,
    testId: currentTest.id,
    answers: { ...userAnswers },
    score: score,
    completedAt: new Date().toISOString(),
    timeSpent: currentTest.timeLimit * 60 - timeRemaining,
  }

  // Save result
  const results = JSON.parse(localStorage.getItem("testResults") || "[]")
  results.push(result)
  localStorage.setItem("testResults", JSON.stringify(results))

  // Show results
  showTestResults(result)
}

function calculateScore() {
  let totalPoints = 0
  let earnedPoints = 0

  currentTest.questions.forEach((question) => {
    totalPoints += question.points
    const userAnswer = userAnswers[question.id]

    if (question.type === "multiple-choice") {
      if (userAnswer === question.correctAnswer) {
        earnedPoints += question.points
      }
    } else if (question.type === "true-false") {
      if (userAnswer === question.correctAnswer) {
        earnedPoints += question.points
      }
    } else if (question.type === "text") {
      if (userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
        earnedPoints += question.points
      }
    }
  })

  return Math.round((earnedPoints / totalPoints) * 100)
}

// MODIFIED: Enhanced showTestResults function to include customer name
function showTestResults(result) {
  showPage("testResults")

  const passed = result.score >= currentTest.passingScore
  const correctAnswers = currentTest.questions.filter((q) => isAnswerCorrect(q, result.answers[q.id])).length

  // Get user information
  const users = JSON.parse(localStorage.getItem("users") || "[]")
  const testUser = users.find((u) => u.id === result.userId) || currentUser

  // Update result display
  document.getElementById("resultIcon").innerHTML = passed
    ? '<i class="fas fa-check-circle result-icon pass"></i>'
    : '<i class="fas fa-times-circle result-icon fail"></i>'

  document.getElementById("resultTitle").textContent = currentTest.title
  document.getElementById("resultDate").textContent =
    `${new Date(result.completedAt).toLocaleDateString("ky-KG")} күнү аткарылган`

  document.getElementById("finalScore").textContent = result.score + "%"
  document.getElementById("correctAnswers").textContent = correctAnswers
  document.getElementById("wrongAnswers").textContent = currentTest.questions.length - correctAnswers
  document.getElementById("timeSpent").textContent = formatTime(result.timeSpent)

  const passStatus = document.getElementById("passStatus")
  passStatus.className = `pass-status ${passed ? "passed" : "failed"}`

  // MODIFIED: Add customer name under the pass/fail status
  passStatus.innerHTML = `
  <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">
    ${passed ? "ӨТТҮҢҮЗ!" : "ӨТКӨН ЖОКСУЗ"}
  </div>
  <div style="font-size: 1rem; font-weight: 500; opacity: 0.9;">
    ${testUser.name}
  </div>
`

  // Show detailed answers
  showDetailedAnswers(result)
}

function showDetailedAnswers(result) {
  const detailedContainer = document.getElementById("detailedAnswers")

  detailedContainer.innerHTML = currentTest.questions
    .map((question, index) => {
      const userAnswer = result.answers[question.id]
      const isCorrect = isAnswerCorrect(question, userAnswer)

      return `
            <div class="answer-review ${isCorrect ? "correct" : "incorrect"}">
                <div class="answer-review-header">
                    <div class="answer-review-question">${index + 1}. ${question.question}</div>
                    <div class="answer-review-icon ${isCorrect ? "correct" : "incorrect"}">
                        <i class="fas fa-${isCorrect ? "check" : "times"}-circle"></i>
                    </div>
                </div>
                <div class="answer-comparison">
                    <div class="user-answer">
                        <div class="answer-label">Сиздин жообуңуз:</div>
                        <div>${getAnswerText(question, userAnswer)}</div>
                    </div>
                    <div class="correct-answer">
                        <div class="answer-label">Туура жооп:</div>
                        <div>${getCorrectAnswerText(question)}</div>
                    </div>
                </div>
            </div>
        `
    })
    .join("")
}

function isAnswerCorrect(question, userAnswer) {
  if (question.type === "multiple-choice") {
    return userAnswer === question.correctAnswer
  } else if (question.type === "true-false") {
    return userAnswer === question.correctAnswer
  } else if (question.type === "text") {
    return userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
  }
  return false
}

function getAnswerText(question, userAnswer) {
  if (userAnswer === undefined || userAnswer === null) {
    return "Жооп берилбеген"
  }

  if (question.type === "multiple-choice") {
    return question.options[userAnswer] || "Жооп берилбеген"
  } else if (question.type === "true-false") {
    return userAnswer === "true" ? "Туура" : "Туура эмес"
  } else if (question.type === "text") {
    return userAnswer || "Жооп берилбеген"
  }
  return "Белгисиз"
}

function getCorrectAnswerText(question) {
  if (question.type === "multiple-choice") {
    return question.options[question.correctAnswer]
  } else if (question.type === "true-false") {
    return question.correctAnswer === "true" ? "Туура" : "Туура эмес"
  } else if (question.type === "text") {
    return question.correctAnswer
  }
  return "Белгисиз"
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

function goToEmployeeDashboard() {
  // Пайдаланучунун ролуна жараша туура дашбордго багыттоо
  if (currentUser.role === "admin") {
    showPage("adminDashboard")
    loadAdminStats()
  } else {
    showPage("employeeDashboard")
    loadEmployeeStats()
    loadAvailableTests()
    loadRecentResults()
  }
}

function retakeTest() {
  startTest(currentTest.id)
}

function viewResult(resultId) {
  const results = JSON.parse(localStorage.getItem("testResults") || "[]")
  const result = results.find((r) => r.id === resultId)

  if (!result) {
    showAlert("Жыйынтык табылган жок", "error")
    return
  }

  const tests = JSON.parse(localStorage.getItem("tests") || "[]")
  currentTest = tests.find((t) => t.id === result.testId)

  if (!currentTest) {
    showAlert("Тест табылган жок", "error")
    return
  }

  showTestResults(result)
}

// ========== ӨЗГӨРТҮЛГӨН ФУНКЦИЯЛАР ==========

// Tests Management functions - ӨЗГӨРТҮЛДҮ
function loadTestsManagement() {
  const tests = JSON.parse(localStorage.getItem("tests") || "[]")
  // Учурдагы админ түзгөн тесттерди гана көрсөтүү
  const userTests = tests.filter((test) => test.createdBy === currentUser.id)
  const testsContainer = document.getElementById("testsManagementList")

  if (userTests.length === 0) {
    testsContainer.innerHTML = `
            <div class="test-management-item">
                <h3>Тесттер табылган жок</h3>
                <p>Биринчи тестиңизди түзүп баштаңыз</p>
                <button onclick="showPage('createTest')" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Жаңы тест түзүү
                </button>
            </div>
        `
    return
  }

  testsContainer.innerHTML = userTests
    .map(
      (test) => `
        <div class="test-management-item">
            <div class="test-management-header">
                <div>
                    <div class="test-management-title">${test.title}</div>
                    <div class="test-management-meta">
                        ${test.questions?.length || 0} суроо • ${test.timeLimit} мүнөт • 
                        ${new Date(test.createdAt).toLocaleDateString("ky-KG")}
                    </div>
                    <p>${test.description || "Сүрөттөмө жок"}</p>
                </div>
                <span class="status-badge ${test.isActive ? "active" : "inactive"}">
                    ${test.isActive ? "Активдүү" : "Активдүү эмес"}
                </span>
            </div>
            <div class="test-management-actions">
                <button onclick="toggleTestStatus('${test.id}')" class="btn ${test.isActive ? "btn-outline" : "btn-primary"}">
                    ${test.isActive ? "Тестти убактылуу токтотуу" : "Тестти кайра жүргүзүү"}
                </button>
                <button onclick="editTest('${test.id}')" class="btn btn-outline">
                    <i class="fas fa-edit"></i> Өзгөртүү
                </button>
                <button onclick="deleteTest('${test.id}')" class="btn btn-danger">
                    <i class="fas fa-trash"></i> Өчүрүү
                </button>
            </div>
        </div>
    `,
    )
    .join("")
}

function toggleTestStatus(testId) {
  const tests = JSON.parse(localStorage.getItem("tests") || "[]")
  const testIndex = tests.findIndex((t) => t.id === testId)

  if (testIndex !== -1) {
    // Тестти түзгөн адам экенин текшерүү
    if (tests[testIndex].createdBy !== currentUser.id) {
      showAlert("Сиз бул тестти өзгөртө албайсыз", "error")
      return
    }

    tests[testIndex].isActive = !tests[testIndex].isActive
    localStorage.setItem("tests", JSON.stringify(tests))
    updateTestToServer()
    loadTestsManagement()
    showAlert("Тест статусу өзгөртүлдү", "success")
  }
}

function deleteTest(testId) {
  const tests = JSON.parse(localStorage.getItem("tests") || "[]")
  const test = tests.find((t) => t.id === testId)

  if (!test) {
    showAlert("Тест табылган жок", "error")
    return
  }

  // Тестти түзгөн адам экенин текшерүү
  if (test.createdBy !== currentUser.id) {
    showAlert("Сиз бул тестти өчүрө албайсыз", "error")
    return
  }

  if (confirm("Бул тестти чынында эле өчүрөсүзбү?")) {
    const updatedTests = tests.filter((t) => t.id !== testId)
    localStorage.setItem("tests", JSON.stringify(updatedTests))
    updateTestToServer()
    loadTestsManagement()
    showAlert("Тест өчүрүлдү", "success")
  }
}

// Тестти өзгөртүү функциясы
function editTest(testId) {
  const tests = JSON.parse(localStorage.getItem("tests") || "[]")
  const test = tests.find((t) => t.id === testId)

  if (!test) {
    showAlert("Тест табылган жок", "error")
    return
  }

  // Тестти түзгөн адам экенин текшерүү
  if (test.createdBy !== currentUser.id) {
    showAlert("Сиз бул тестти өзгөртө албайсыз", "error")
    return
  }

  // Тестти глобалдык өзгөрмөгө сактоо
  editingTest = test
  editQuestions = [...test.questions]

  // Форманы толтуруу
  document.getElementById("editTestTitle").value = test.title
  document.getElementById("editTestDescription").value = test.description || ""
  document.getElementById("editTimeLimit").value = test.timeLimit
  document.getElementById("editPassingScore").value = test.passingScore
  document.getElementById("editTestId").value = test.id

  // Суроолорду көрсөтүү
  updateEditQuestionsList()

  // Суроо кошуу формасын даярдоо
  document.getElementById("editQuestionText").value = ""
  document.getElementById("editQuestionPoints").value = "1"
  document.getElementById("editQuestionType").value = "multiple-choice"
  updateEditQuestionOptions()

  // Бетти көрсөтүү
  showPage("editTest")
}

// Суроолор тизмесин жаңыртуу
function updateEditQuestionsList() {
  const questionsList = document.getElementById("editQuestionsList")

  if (editQuestions.length === 0) {
    questionsList.innerHTML = "<p>Суроолор кошулган жок</p>"
    return
  }

  questionsList.innerHTML = editQuestions
    .map(
      (question, index) => `
        <div class="question-item">
            <div class="question-header">
                <div class="question-title">${index + 1}. ${question.question}</div>
                <div>
                    <button onclick="editExistingQuestion(${index})" class="btn btn-outline" style="padding: 5px 10px; margin-right: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="removeEditQuestion(${index})" class="btn btn-danger" style="padding: 5px 10px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="question-meta">
                Түрү: ${getQuestionTypeText(question.type)} | Упай: ${question.points}
            </div>
            ${
              question.options
                ? `
                <div class="question-options">
                    ${question.options
                      .map(
                        (option, optIndex) => `
                        <div class="${optIndex === question.correctAnswer ? "correct-answer" : ""}">
                            ${optIndex + 1}. ${option}
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `
                : question.type === "true-false"
                  ? `
                <div class="question-options">
                    Туура жооп: <span class="correct-answer">${question.correctAnswer === "true" ? "Туура" : "Туура эмес"}</span>
                </div>
            `
                  : `
                <div class="question-options">
                    Туура жооп: <span class="correct-answer">${question.correctAnswer}</span>
                </div>
            `
            }
        </div>
    `,
    )
    .join("")
}

// Суроо түрүнө жараша опцияларды жаңыртуу
function updateEditQuestionOptions() {
  const questionType = document.getElementById("editQuestionType").value
  const optionsContainer = document.getElementById("editOptionsContainer")

  if (questionType === "multiple-choice") {
    optionsContainer.innerHTML = `
            <div class="options-container">
                <label>Жооп варианттары</label>
                <div class="option-input">
                    <input type="text" id="editOption1" placeholder="Вариант 1" required>
                    <input type="radio" name="editCorrectOption" value="0" checked>
                    <label>Туура</label>
                </div>
                <div class="option-input">
                    <input type="text" id="editOption2" placeholder="Вариант 2" required>
                    <input type="radio" name="editCorrectOption" value="1">
                    <label>Туура</label>
                </div>
                <div class="option-input">
                    <input type="text" id="editOption3" placeholder="Вариант 3" required>
                    <input type="radio" name="editCorrectOption" value="2">
                    <label>Туура</label>
                </div>
                <div class="option-input">
                    <input type="text" id="editOption4" placeholder="Вариант 4" required>
                    <label>Туура</label>
                </div>
            </div>
        `
  } else if (questionType === "true-false") {
    optionsContainer.innerHTML = `
            <div class="form-group">
                <label>Туура жооп</label>
                <select id="editTrueFalseAnswer">
                    <option value="true">Туура</option>
                    <option value="false">Туура эмес</option>
                </select>
            </div>
        `
  } else if (questionType === "text") {
    optionsContainer.innerHTML = `
            <div class="form-group">
                <label for="editTextAnswer">Туура жооп</label>
                <input type="text" id="editTextAnswer" placeholder="Туура жоопту киргизиңиз" required>
            </div>
        `
  }
}

// Суроону өзгөртүү үчүн форманы толтуруу
function editExistingQuestion(index) {
  const question = editQuestions[index]

  document.getElementById("editQuestionText").value = question.question
  document.getElementById("editQuestionPoints").value = question.points
  document.getElementById("editQuestionType").value = question.type

  updateEditQuestionOptions()

  if (question.type === "multiple-choice") {
    setTimeout(() => {
      document.getElementById("editOption1").value = question.options[0] || ""
      document.getElementById("editOption2").value = question.options[1] || ""
      document.getElementById("editOption3").value = question.options[2] || ""
      document.getElementById("editOption4").value = question.options[3] || ""

      const radioButtons = document.getElementsByName("editCorrectOption")
      for (let i = 0; i < radioButtons.length; i++) {
        if (Number.parseInt(radioButtons[i].value) === question.correctAnswer) {
          radioButtons[i].checked = true
          break
        }
      }
    }, 100)
  } else if (question.type === "true-false") {
    setTimeout(() => {
      document.getElementById("editTrueFalseAnswer").value = question.correctAnswer
    }, 100)
  } else if (question.type === "text") {
    setTimeout(() => {
      document.getElementById("editTextAnswer").value = question.correctAnswer
    }, 100)
  }

  // Суроону өчүрүү
  removeEditQuestion(index)

  // Форманы көрсөтүү үчүн скролл
  document.getElementById("editQuestionForm").scrollIntoView({ behavior: "smooth" })
}

// Суроону өчүрүү
function removeEditQuestion(index) {
  editQuestions.splice(index, 1)
  updateEditQuestionsList()
}

// Жаңы суроо кошуу
function addQuestionToEdit() {
  const questionText = document.getElementById("editQuestionText").value.trim()
  const questionType = document.getElementById("editQuestionType").value
  const questionPoints = Number.parseInt(document.getElementById("editQuestionPoints").value)

  if (!questionText) {
    showAlert("Суроону киргизиңиз", "error")
    return
  }

  let correctAnswer
  let options = null

  if (questionType === "multiple-choice") {
    const option1 = document.getElementById("editOption1").value.trim()
    const option2 = document.getElementById("editOption2").value.trim()
    const option3 = document.getElementById("editOption3").value.trim()
    const option4 = document.getElementById("editOption4").value.trim()

    if (!option1 || !option2 || !option3 || !option4) {
      showAlert("��ардык варианттарды толтуруңуз", "error")
      return
    }

    options = [option1, option2, option3, option4]
    correctAnswer = Number.parseInt(document.querySelector('input[name="editCorrectOption"]:checked').value)
  } else if (questionType === "true-false") {
    correctAnswer = document.getElementById("editTrueFalseAnswer").value
  } else if (questionType === "text") {
    correctAnswer = document.getElementById("editTextAnswer").value.trim()
    if (!correctAnswer) {
      showAlert("Туура жоопту киргизиңиз", "error")
      return
    }
  }

  const newQuestion = {
    id: Date.now().toString(),
    question: questionText,
    type: questionType,
    options: options,
    correctAnswer: correctAnswer,
    points: questionPoints,
  }

  editQuestions.push(newQuestion)
  updateEditQuestionsList()

  // Reset form
  document.getElementById("editQuestionText").value = ""
  document.getElementById("editQuestionPoints").value = "1"
  document.getElementById("editQuestionType").value = "multiple-choice"
  updateEditQuestionOptions()

  showAlert("Суроо ийгиликтүү кошулду!", "success")
}

// Өзгөртүлгөн тестти сактоо
function saveEditedTest() {
  const title = document.getElementById("editTestTitle").value.trim()
  const description = document.getElementById("editTestDescription").value.trim()
  const timeLimit = Number.parseInt(document.getElementById("editTimeLimit").value)
  const passingScore = Number.parseInt(document.getElementById("editPassingScore").value)
  const testId = document.getElementById("editTestId").value

  if (!title) {
    showAlert("Тест аталышын киргизиңиз", "error")
    return
  }

  if (editQuestions.length === 0) {
    showAlert("Кеминде бир суроо кошуңуз", "error")
    return
  }

  const tests = JSON.parse(localStorage.getItem("tests") || "[]")
  const testIndex = tests.findIndex((t) => t.id === testId)

  if (testIndex === -1) {
    showAlert("Тест табылган жок", "error")
    return
  }

  // Тестти жаңыртуу
  tests[testIndex] = {
    ...tests[testIndex],
    title,
    description,
    timeLimit,
    passingScore,
    questions: [...editQuestions],
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem("tests", JSON.stringify(tests))
  updateTestToServer()

  showAlert("Тест ийгиликтүү сакталды!", "success")

  setTimeout(() => {
    showPage("manageTests")
  }, 2000)
}

// Results Management functions - ӨЗГӨРТҮЛДҮ
function loadAllResults() {
  const results = JSON.parse(localStorage.getItem("testResults") || "[]")
  const tests = JSON.parse(localStorage.getItem("tests") || "[]")
  const users = JSON.parse(localStorage.getItem("users") || "[]")

  // Учурдагы админ түзгөн тесттердин жыйынтыктарын гана көрсөтүү
  const userTests = tests.filter((test) => test.createdBy === currentUser.id)
  const userTestIds = userTests.map((test) => test.id)
  const userResults = results.filter((result) => userTestIds.includes(result.testId))

  const resultsContainer = document.getElementById("allResultsList")

  if (userResults.length === 0) {
    resultsContainer.innerHTML = `
            <div class="result-management-item">
                <h3>Жыйынтыктар табылган жок</h3>
                <p>Кардарлар сиздин тесттериңизди тапшырганда жыйынтыктар бул жерде көрүнөт</p>
            </div>
        `
    return
  }

  // Жыйынтыктарды тест боюнча топтоо
  const resultsByTest = {}
  userResults.forEach((result) => {
    if (!resultsByTest[result.testId]) {
      resultsByTest[result.testId] = []
    }
    resultsByTest[result.testId].push(result)
  })

  // Ар бир тест үчүн секция түзүү
  let htmlContent = ""

  Object.keys(resultsByTest).forEach((testId) => {
    const test = tests.find((t) => t.id === testId)
    const testResults = resultsByTest[testId].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))

    // Тест статистикалары
    const totalAttempts = testResults.length
    const passedAttempts = testResults.filter((r) => r.score >= (test?.passingScore || 70)).length
    const averageScore = Math.round(testResults.reduce((sum, r) => sum + r.score, 0) / totalAttempts)
    const passRate = Math.round((passedAttempts / totalAttempts) * 100)

    htmlContent += `
            <div class="test-results-section">
                <div class="test-results-header">
                    <div class="test-results-title">
                        <h2><i class="fas fa-file-alt"></i> ${test?.title || "Белгисиз тест"}</h2>
                        <p class="test-description">${test?.description || "Сүрөттөмө жок"}</p>
                    </div>
                    <div class="test-results-stats">
                        <div class="test-stat-item">
                            <div class="test-stat-value">${totalAttempts}</div>
                            <div class="test-stat-label">Жалпы аракеттер</div>
                        </div>
                        <div class="test-stat-item">
                            <div class="test-stat-value">${passedAttempts}</div>
                            <div class="test-stat-label">Өткөндөр</div>
                        </div>
                        <div class="test-stat-item">
                            <div class="test-stat-value">${averageScore}%</div>
                            <div class="test-stat-label">Орточо упай</div>
                        </div>
                        <div class="test-stat-item">
                            <div class="test-stat-value">${passRate}%</div>
                            <div class="test-stat-label">Өтүү көрсөткүчү</div>
                        </div>
                    </div>
                </div>
                
                <div class="test-results-list">
                    ${testResults
                      .map((result) => {
                        const user = users.find((u) => u.id === result.userId)

                        return `
                            <div class="result-management-item">
                                <div class="result-management-header">
                                    <div>
                                        <div class="result-management-title">
                                            <i class="fas fa-user"></i> ${user?.name || "Белгисиз кардар"}
                                        </div>
                                        <div class="result-management-meta">
                                            <i class="fas fa-calendar"></i> ${new Date(result.completedAt).toLocaleDateString("ky-KG")} • 
                                            <i class="fas fa-clock"></i> ${formatTime(result.timeSpent)} сарпталган
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 1.2rem; font-weight: bold;">${result.score}%</div>
                                        <span class="status-badge ${result.score >= (test?.passingScore || 70) ? "passed" : "failed"}">
                                            ${result.score >= (test?.passingScore || 70) ? "Өттү" : "Өткөн жок"}
                                        </span>
                                    </div>
                                </div>
                                <div class="result-management-actions">
                                    <button onclick="viewDetailedResult('${result.id}')" class="btn btn-outline">
                                        <i class="fas fa-eye"></i> Толук көрүү
                                    </button>
                                    <button onclick="deleteResult('${result.id}')" class="btn btn-danger">
                                        <i class="fas fa-trash"></i> Өчүрүү
                                    </button>
                                </div>
                            </div>
                        `
                      })
                      .join("")}
                </div>
            </div>
        `
  })

  resultsContainer.innerHTML = htmlContent
}

function viewDetailedResult(resultId) {
  const results = JSON.parse(localStorage.getItem("testResults") || "[]")
  const result = results.find((r) => r.id === resultId)

  if (!result) {
    showAlert("Жыйынтык табылган жок", "error")
    return
  }

  const tests = JSON.parse(localStorage.getItem("tests") || "[]")
  currentTest = tests.find((t) => t.id === result.testId)

  if (!currentTest) {
    showAlert("Тест табылган жок", "error")
    return
  }

  showTestResults(result)
}

function deleteResult(resultId) {
  if (confirm("Бул жыйынтыкты чынында эле өчүрөсүзбү?")) {
    const results = JSON.parse(localStorage.getItem("testResults") || "[]")
    const updatedResults = results.filter((r) => r.id !== resultId)
    localStorage.setItem("testResults", JSON.stringify(updatedResults))
    loadAllResults()
    showAlert("Жыйынтык өчүрүлдү", "success")
  }
}

// Utility functions
function showAlert(message, type = "info") {
  const modal = document.getElementById("alertModal")
  const content = document.getElementById("alertContent")

  const iconClass =
    type === "success"
      ? "fa-check-circle"
      : type === "error"
        ? "fa-times-circle"
        : type === "warning"
          ? "fa-exclamation-triangle"
          : "fa-info-circle"

  const colorClass =
    type === "success"
      ? "text-green-600"
      : type === "error"
        ? "text-red-600"
        : type === "warning"
          ? "text-yellow-600"
          : "text-blue-600"

  content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <i class="fas ${iconClass} ${colorClass}" style="font-size: 3rem; margin-bottom: 15px;"></i>
            <p style="font-size: 1.1rem; margin: 0;">${message}</p>
        </div>
    `

  modal.style.display = "block"

  // Auto close after 3 seconds
  setTimeout(() => {
    closeAlert()
  }, 3000)
}

function closeAlert() {
  document.getElementById("alertModal").style.display = "none"
}

// Close modal when clicking outside
window.onclick = (event) => {
  const modal = document.getElementById("alertModal")
  if (event.target === modal) {
    closeAlert()
  }
}

// Simplified Word Export Functions using HTML to Word conversion
function exportResultsToWord() {
  if (!currentTest || !currentUser) {
    showAlert("Маалымат жеткиликсиз", "error")
    return
  }

  try {
    const results = JSON.parse(localStorage.getItem("testResults") || "[]")
    const result = results.find(
      (r) => r.testId === currentTest.id && (r.userId === currentUser.id || currentUser.role === "admin"),
    )

    if (!result) {
      showAlert("Жыйынтык табылган жок", "error")
      return
    }

    // Колдонуучу маалыматын алуу
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const testUser = users.find((u) => u.id === result.userId) || currentUser

    const passed = result.score >= currentTest.passingScore
    const correctAnswers = currentTest.questions.filter((q) => isAnswerCorrect(q, result.answers[q.id])).length

    // Word документи үчүн HTML контент түзүү
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Тест жыйынтыгы</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            .info { margin: 10px 0; font-size: 16px; }
            .score { font-size: 20px; font-weight: bold; color: ${passed ? "#00AA00" : "#FF0000"}; }
            .status { font-size: 18px; font-weight: bold; color: ${passed ? "#00AA00" : "#FF0000"}; }
            .question { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .question-title { font-weight: bold; margin-bottom: 10px; }
            .answer { margin: 5px 0; }
            .correct { color: #00AA00; font-weight: bold; }
            .incorrect { color: #FF0000; font-weight: bold; }
            .user-answer { background-color: #f5f5f5; padding: 5px; }
            .correct-answer { background-color: #e8f5e8; padding: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">ТЕСТ ЖЫЙЫНТЫГЫ</div>
          </div>
          
          <div class="info"><strong>Тест аталышы:</strong> ${currentTest.title}</div>
          <div class="info"><strong>Кардар:</strong> ${testUser.name}</div>
          <div class="info"><strong>Күнү:</strong> ${new Date(result.completedAt).toLocaleDateString("ky-KG")}</div>
          <div class="info score"><strong>Жалпы упай:</strong> ${result.score}%</div>
          <div class="info status"><strong>Статус:</strong> ${passed ? "ӨТТҮ" : "ӨТКӨН ЖОК"}</div>
          
          <h2>СУРООЛОР БОЮНЧА ДЕТАЛЬДУУ ЖЫЙЫНТЫК</h2>
          
          ${currentTest.questions
            .map((question, index) => {
              const userAnswer = result.answers[question.id]
              const isCorrect = isAnswerCorrect(question, userAnswer)

              return `
              <div class="question">
                <div class="question-title">${index + 1}. ${question.question}</div>
                <div class="answer user-answer">
                  <strong>Сиздин жообуңуз:</strong> 
                  <span class="${isCorrect ? "correct" : "incorrect"}">${getAnswerText(question, userAnswer)}</span>
                </div>
                <div class="answer correct-answer">
                  <strong>Туура жооп:</strong> 
                  <span class="correct">${getCorrectAnswerText(question)}</span>
                </div>
                <div class="answer">
                  <strong>Статус:</strong> 
                  <span class="${isCorrect ? "correct" : "incorrect"}">${isCorrect ? "✓ Туура" : "✗ Туура эмес"}</span>
                </div>
              </div>
            `
            })
            .join("")}
        </body>
      </html>
    `

    // Файлды түзүү жана жүктөп алуу
    const blob = new Blob(["\ufeff", htmlContent], { type: "application/msword;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${currentTest.title}_${testUser.name}_жыйынтык.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)

    showAlert("Word файлы ийгиликтүү түзүлдү!", "success")
  } catch (error) {
    console.error("Word export error:", error)
    showAlert("Word файлын түзүүдө ката кетти: " + error.message, "error")
  }
}

function exportAllResultsToWord() {
  if (!currentUser || currentUser.role !== "admin") {
    showAlert("Бул функция админдер үчүн гана", "error")
    return
  }

  try {
    const results = JSON.parse(localStorage.getItem("testResults") || "[]")
    const tests = JSON.parse(localStorage.getItem("tests") || "[]")
    const users = JSON.parse(localStorage.getItem("users") || "[]")

    // Get only results for tests created by current admin
    const userTests = tests.filter((test) => test.createdBy === currentUser.id)
    const userTestIds = userTests.map((test) => test.id)
    const userResults = results.filter((result) => userTestIds.includes(result.testId))

    if (userResults.length === 0) {
      showAlert("Экспорттоо үчүн жыйынтыктар жок", "error")
      return
    }

    // Group results by test
    const resultsByTest = {}
    userResults.forEach((result) => {
      if (!resultsByTest[result.testId]) {
        resultsByTest[result.testId] = []
      }
      resultsByTest[result.testId].push(result)
    })

    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Тест жыйынтыктарынын жалпы отчету</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            .info { margin: 10px 0; font-size: 16px; }
            .test-section { margin: 30px 0; border: 2px solid #ddd; padding: 20px; border-radius: 10px; }
            .test-title { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 15px; }
            .stats { margin: 15px 0; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .passed { color: #00AA00; font-weight: bold; }
            .failed { color: #FF0000; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">ТЕСТ ЖЫЙЫНТЫКТАРЫНЫН ЖАЛПЫ ОТЧЕТУ</div>
          </div>
          
          <div class="info"><strong>Администратор:</strong> ${currentUser.name}</div>
          <div class="info"><strong>Отчет түзүлгөн күнү:</strong> ${new Date().toLocaleDateString("ky-KG")}</div>
          
          ${Object.keys(resultsByTest)
            .map((testId) => {
              const test = tests.find((t) => t.id === testId)
              const testResults = resultsByTest[testId].sort(
                (a, b) => new Date(b.completedAt) - new Date(a.completedAt),
              )

              const totalAttempts = testResults.length
              const passedAttempts = testResults.filter((r) => r.score >= (test?.passingScore || 70)).length
              const averageScore = Math.round(testResults.reduce((sum, r) => sum + r.score, 0) / totalAttempts)

              return `
              <div class="test-section">
                <div class="test-title">ТЕСТ: ${test?.title || "Белгисиз тест"}</div>
                ${test?.description ? `<div class="info"><strong>Сүрөттөмө:</strong> ${test.description}</div>` : ""}
                <div class="stats">
                  Жалпы аракеттер: ${totalAttempts} | 
                  Өткөндөр: ${passedAttempts} | 
                  Орточо упай: ${averageScore}%
                </div>
                
                <table>
                  <tr>
                    <th>Кардар</th>
                    <th>Күнү</th>
                    <th>Упай</th>
                    <th>Статус</th>
                    <th>Убакыт</th>
                  </tr>
                  ${testResults
                    .map((result) => {
                      const user = users.find((u) => u.id === result.userId)
                      const passed = result.score >= (test?.passingScore || 70)

                      return `
                      <tr>
                        <td>${user?.name || "Белгисиз"}</td>
                        <td>${new Date(result.completedAt).toLocaleDateString("ky-KG")}</td>
                        <td class="${passed ? "passed" : "failed"}">${result.score}%</td>
                        <td class="${passed ? "passed" : "failed"}">${passed ? "Өттү" : "Өткөн жок"}</td>
                        <td>${formatTime(result.timeSpent)}</td>
                      </tr>
                    `
                    })
                    .join("")}
                </table>
              </div>
            `
            })
            .join("")}
        </body>
      </html>
    `

    // Create and download the file
    const blob = new Blob([htmlContent], { type: "application/msword" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Тест_жыйынтыктары_${new Date().toLocaleDateString("ky-KG").replace(/\//g, "_")}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showAlert("Word файлы ийгиликтүү түзүлдү!", "success")
  } catch (error) {
    console.error("Word export error:", error)
    showAlert("Word файлын түзүүдө ката кетти", "error")
  }
}

// Print functions
function printResults() {
  if (!currentTest || !currentUser) {
    showAlert("Маалымат жеткиликсиз", "error")
    return
  }

  const results = JSON.parse(localStorage.getItem("testResults") || "[]")
  const result = results.find((r) => r.userId === currentUser.id && r.testId === currentTest.id)

  if (!result) {
    showAlert("Жыйынтык табылган жок", "error")
    return
  }

  const passed = result.score >= currentTest.passingScore
  const correctAnswers = currentTest.questions.filter((q) => isAnswerCorrect(q, result.answers[q.id])).length

  const printWindow = window.open("", "_blank")
  printWindow.document.write(`
    <html>
      <head>
        <title>Тест жыйынтыгы</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; }
          .info { margin: 10px 0; }
          .score { font-size: 20px; font-weight: bold; color: ${passed ? "#00AA00" : "#FF0000"}; }
          .question { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
          .question-title { font-weight: bold; margin-bottom: 10px; }
          .correct { color: #00AA00; }
          .incorrect { color: #FF0000; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ТЕСТ ЖЫЙЫНТЫГЫ</div>
        </div>
        
        <div class="info"><strong>Тест аталышы:</strong> ${currentTest.title}</div>
        <div class="info"><strong>Кардар:</strong> ${currentUser.name}</div>
        <div class="info"><strong>Күнү:</strong> ${new Date(result.completedAt).toLocaleDateString("ky-KG")}</div>
        <div class="info score"><strong>Жалпы упай:</strong> ${result.score}%</div>
        <div class="info"><strong>Статус:</strong> ${passed ? "ӨТТҮ" : "ӨТКӨН ЖОК"}</div>
        
        <h2>СУРООЛОР БОЮНЧА ДЕТАЛЬДУУ ЖЫЙЫНТЫК</h2>
        
        ${currentTest.questions
          .map((question, index) => {
            const userAnswer = result.answers[question.id]
            const isCorrect = isAnswerCorrect(question, userAnswer)

            return `
            <div class="question">
              <div class="question-title">${index + 1}. ${question.question}</div>
              <div><strong>Сиздин жообуңуз:</strong> <span class="${isCorrect ? "correct" : "incorrect"}">${getAnswerText(question, userAnswer)}</span></div>
              <div><strong>Туура жооп:</strong> <span class="correct">${getCorrectAnswerText(question)}</span></div>
              <div><strong>Статус:</strong> <span class="${isCorrect ? "correct" : "incorrect"}">${isCorrect ? "✓ Туура" : "✗ Туура эмес"}</span></div>
            </div>
          `
          })
          .join("")}
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.print()
}

function printAllResults() {
  if (!currentUser || currentUser.role !== "admin") {
    showAlert("Бул функция админдер үчүн гана", "error")
    return
  }

  const printWindow = window.open("", "_blank")
  printWindow.document.write(`
    <html>
      <head>
        <title>Тест жыйынтыктары</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .passed { color: #00AA00; font-weight: bold; }
          .failed { color: #FF0000; font-weight: bold; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ТЕСТ ЖЫЙЫНТЫКТАРЫНЫН ЖАЛПЫ ОТЧЕТУ</div>
        </div>
        
        <div><strong>Администратор:</strong> ${currentUser.name}</div>
        <div><strong>Отчет түзүлгөн күнү:</strong> ${new Date().toLocaleDateString("ky-KG")}</div>
        
        ${document.getElementById("allResultsList").innerHTML}
      </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.print()
}

function showEmployees() {
    showPage('manageEmployeesPage');

    const container = document.getElementById('employeeListContainer');
    container.innerHTML = ''; // Тазалоо

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const results = JSON.parse(localStorage.getItem('results')) || [];
    const tests = JSON.parse(localStorage.getItem('tests')) || [];

    // Текшерүү: Админ киргенби
    if (!currentUser || currentUser.role !== 'admin') {
        container.innerHTML = '<p>Бул баракчага уруксатыңыз жок.</p>';
        return;
    }

    // Админ түзгөн тесттердин IDлерин алуу
    const adminTestIds = tests
        .filter(test => test.createdBy === currentUser.id)
        .map(test => test.id);

    // Тест тапшырган кардарлардын тизмеси (тек гана өзүнүн тесттери боюнча)
    const relatedResults = results.filter(r => adminTestIds.includes(r.testId));

    if (relatedResults.length === 0) {
        container.innerHTML = '<p>Сиз түзгөн тесттер боюнча эч кандай жыйынтык жок.</p>';
        return;
    }

    // Ар бир кардарды бир эле жолу көрсөтүү үчүн
    const shownUserIds = new Set();

    relatedResults.forEach(result => {
        if (shownUserIds.has(result.userId)) return;
        shownUserIds.add(result.userId);

        const user = users.find(u => u.id === result.userId);
        if (!user || user.role !== 'employee') return;

        // Эгер акыркы жыйынтык ошол тест боюнча болсо
        const userTestResults = relatedResults.filter(r => r.userId === user.id);
        const lastResult = userTestResults[userTestResults.length - 1];

        const failed = lastResult && lastResult.score < lastResult.passingScore;

        const card = document.createElement('div');
        card.className = 'result-management-item';

        card.innerHTML = `
            <div class="result-management-header">
                <div>
                    <div class="result-management-title">${user.name}</div>
                    <div class="result-management-meta">${user.email}</div>
                    <div class="result-management-meta">Тест: <strong>${getTestTitleById(lastResult.testId)}</strong></div>
                    <div class="result-management-meta">Упай: ${lastResult.score}%</div>
                </div>
                <div class="result-management-actions">
                    ${failed ? `<button class="btn btn-primary" onclick="allowRetake('${user.id}', '${lastResult.testId}')">Кайра тапшырууга уруксат берүү</button>` : `<span class="status-badge passed">Өткөн</span>`}
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// Упайды өчүрүп кайра тапшырууга уруксат берүү
function allowRetake(userId, testId) {
    let results = JSON.parse(localStorage.getItem('results')) || [];
    results = results.filter(r => !(r.userId === userId && r.testId === testId));
    localStorage.setItem('results', JSON.stringify(results));
    alert('Кардар кайра тапшыра алат!');
    showEmployees(); // Жаңылоо
}

// Тест атын алуу
function getTestTitleById(testId) {
    const tests = JSON.parse(localStorage.getItem('tests')) || [];
    const test = tests.find(t => t.id === testId);
    return test ? test.title : 'Аталышы табылган жок';
}



function showEmployees() {
    showPage('manageEmployeesPage');

    const container = document.getElementById('employeeListContainer');
    container.innerHTML = ''; // Тазалоо

    const employees = JSON.parse(localStorage.getItem('users')) || [];
    const results = JSON.parse(localStorage.getItem('results')) || [];

    const employeeUsers = employees.filter(u => u.role === 'employee');

    if (employeeUsers.length === 0) {
        container.innerHTML = '<p>Кардарлар табылган жок.</p>';
        return;
    }

    employeeUsers.forEach(user => {
        const userResults = results.filter(r => r.userId === user.id);
        const lastResult = userResults[userResults.length - 1];
        const failed = lastResult && lastResult.score < lastResult.passingScore;

        const card = document.createElement('div');
        card.className = 'result-management-item';

        card.innerHTML = `
            <div class="result-management-header">
                <div>
                    <div class="result-management-title">${user.name}</div>
                    <div class="result-management-meta">${user.email}</div>
                </div>
                <div class="result-management-actions">
                    ${failed ? `<button class="btn btn-primary" onclick="allowRetake('${user.id}')">Кайра тапшырууга уруксат берүү</button>` : `<span class="status-badge passed">Өткөн</span>`}
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

function allowRetake(userId) {
    let results = JSON.parse(localStorage.getItem('results')) || [];
    results = results.filter(r => r.userId !== userId); // Эски жыйынтыктарды өчүрүү
    localStorage.setItem('results', JSON.stringify(results));
    alert('Кардар кайра тапшыра алат!');
    showEmployees(); // Тизмени жаңыртуу
}




// Тест атын алуу
function getTestTitleById(testId) {
    const tests = JSON.parse(localStorage.getItem('tests')) || [];
    const test = tests.find(t => t.id === testId);
    return test ? test.title : 'Аталышы табылган жок';
}
