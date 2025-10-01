// ====== GLOBAL VARIABLES ======
let currentUser = null;
let currentQuiz = null;
let currentQuestionIndex = 0;
let quizScore = 0;
let currentStreak = 0;
let bestStreakInQuiz = 0; // Track the best streak achieved in this quiz
let timeLeft = 30;
let timerInterval = null;
let quizStartTime = null;
let questionStartTime = null;
let userAnswers = [];
let questionsAnswered = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let usedQuestions = new Set(); // Track used questions to prevent repeats
let animationInProgress = false;

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadTheme();
});

function initializeApp() {
    console.log('Initializing app, current path:', window.location.pathname);
    const currentUserData = localStorage.getItem('currentUser');
    console.log('Current user data from localStorage:', currentUserData ? 'exists' : 'not found');
    
    const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
    
    if (currentUserData && isIndexPage) {
        currentUser = JSON.parse(currentUserData);
        console.log('Setting current user and showing dashboard:', {
            name: currentUser.name, 
            stats: currentUser.stats,
            justCompletedQuiz: localStorage.getItem('justCompletedQuiz')
        });
        showDashboard();
    } else if (!currentUserData && !isIndexPage) {
        console.log('No user data, redirecting to index');
        window.location.href = 'index.html';
    } else if (currentUserData && !isIndexPage) {
        // User is logged in but not on index page - this is fine
        currentUser = JSON.parse(currentUserData);
        console.log('User logged in on non-index page:', currentUser.name);
    }
}

// ====== THEME MANAGEMENT ======
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ====== EVENT LISTENERS ======
function setupEventListeners() {
    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Form switches
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    
    if (showSignup) {
        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms('signup');
        });
    }
    
    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForms('login');
        });
    }
    
    // Forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Category cards
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            startQuiz(category);
        });
    });
    
    // Quiz navigation
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', previousQuestion);
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', nextQuestion);
    }
    
    // Quiz controls
    const homeBtn = document.getElementById('home-btn');
    const quitBtn = document.getElementById('quit-btn');
    
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    if (quitBtn) {
        quitBtn.addEventListener('click', quitQuiz);
    }
    
    // Results page buttons
    const retryBtn = document.getElementById('retry-btn');
    const dashboardBtn = document.getElementById('dashboard-btn');
    const shareBtn = document.getElementById('share-btn');
    
    if (retryBtn) {
        retryBtn.addEventListener('click', retryQuiz);
    }
    
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            console.log('Dashboard button clicked - setting flag and redirecting');
            // Mark that we're returning from a completed quiz
            localStorage.setItem('justCompletedQuiz', 'true');
            
            // Also ensure current user data is fresh
            const currentUserData = localStorage.getItem('currentUser');
            if (currentUserData) {
                console.log('Current user data exists, redirecting to dashboard');
            } else {
                console.error('No current user data found when returning to dashboard');
            }
            
            window.location.href = 'index.html';
        });
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', shareScore);
    }
}

// ====== AUTHENTICATION ======
function toggleForms(form) {
    const loginContainer = document.getElementById('login-container');
    const signupContainer = document.getElementById('signup-container');
    
    if (form === 'signup') {
        loginContainer.style.display = 'none';
        signupContainer.style.display = 'block';
    } else {
        signupContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    }
}

function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    
    if (!name || !email || !password) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'warning');
        return;
    }
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const existingUser = users.find(user => user.email === email);
    
    if (existingUser) {
        showNotification('User with this email already exists', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password, // In a real app, this should be hashed
        joinDate: new Date().toISOString(),
        stats: {
            highestScore: 0,
            lastScore: 0,
            currentStreak: 0,
            bestStreak: 0,
            totalQuizzes: 0,
            categoryBests: {
                communication: 0,
                aptitude: 0,
                coding: 0,
                general: 0
            }
        },
        history: []
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    currentUser = newUser;
    showNotification(`Welcome ${newUser.name}! Account created successfully.`, 'success', 4000);
    showDashboard();
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'warning');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        showNotification('Invalid email or password', 'error');
        return;
    }
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    currentUser = user;
    showNotification(`Welcome back, ${user.name}!`, 'success', 3000);
    showDashboard();
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentUser');
        currentUser = null;
        window.location.reload();
    }
}

// ====== DASHBOARD ======
function showDashboard() {
    console.log('showDashboard called');
    
    // Hide login/signup forms and show dashboard
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('signup-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';
    
    // ALWAYS refresh current user from localStorage to get latest stats
    const currentUserData = localStorage.getItem('currentUser');
    if (currentUserData) {
        const userData = JSON.parse(currentUserData);
        currentUser = userData;
        console.log('Dashboard: Current user refreshed', {
            name: currentUser.name,
            stats: currentUser.stats
        });
    } else {
        console.error('No current user data found in localStorage');
        return;
    }
    
    // Check if returning from a completed quiz
    const justCompleted = localStorage.getItem('justCompletedQuiz');
    const animate = justCompleted === 'true';
    
    if (animate) {
        localStorage.removeItem('justCompletedQuiz');
        showNotification('🎉 Dashboard updated with your latest quiz results!', 'success', 4000);
        console.log('Dashboard: Animating updates after quiz completion');
    }
    
    // Force update dashboard with latest stats
    updateDashboard(animate);
}

function updateDashboard(animate = false) {
    console.log('=== UPDATE DASHBOARD START ===');
    
    if (!currentUser) {
        console.error('updateDashboard: No current user found');
        return;
    }
    
    if (!currentUser.stats) {
        console.error('updateDashboard: No stats found for current user');
        currentUser.stats = {
            highestScore: 0,
            lastScore: 0,
            currentStreak: 0,
            totalQuizzes: 0,
            bestStreak: 0,
            categoryBests: { communication: 0, aptitude: 0, coding: 0, general: 0 }
        };
    }
    
    console.log('updateDashboard called with animation:', animate, 'User stats:', currentUser.stats);
    
    // Update user name
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = currentUser.name;
        console.log('Updated user name to:', currentUser.name);
    }
    
    // Update stats with proper values and null checks
    const statsElements = [
        { id: 'highest-score', value: currentUser.stats.highestScore || 0 },
        { id: 'last-score', value: currentUser.stats.lastScore || 0 },
        { id: 'current-streak', value: currentUser.stats.currentStreak || 0 },
        { id: 'total-quizzes', value: currentUser.stats.totalQuizzes || 0 }
    ];
    
    console.log('Stats to update:', statsElements);
    
    statsElements.forEach(({ id, value }) => {
        const element = document.getElementById(id);
        console.log(`Updating stat ${id}:`, { elementFound: !!element, value, currentText: element?.textContent });
        
        if (element) {
            // Ensure value is a number and set it
            const numValue = Number(value) || 0;
            element.textContent = numValue.toString();
            console.log(`✅ Set ${id} to: ${numValue}, element now shows: "${element.textContent}"`);
            
            if (animate) {
                element.classList.add('stats-update');
                setTimeout(() => element.classList.remove('stats-update'), 600);
            }
        } else {
            console.error(`❌ Element with id '${id}' not found!`);
        }
    });
    
    console.log('=== UPDATE DASHBOARD END ===');
    
    // Update category bests with animation
    const categoryElements = [
        { id: 'comm-best', value: currentUser.stats.categoryBests.communication },
        { id: 'apt-best', value: currentUser.stats.categoryBests.aptitude },
        { id: 'code-best', value: currentUser.stats.categoryBests.coding },
        { id: 'gen-best', value: currentUser.stats.categoryBests.general }
    ];
    
    categoryElements.forEach(({ id, value }) => {
        const element = document.getElementById(id);
        if (element) {
            const oldValue = parseInt(element.textContent) || 0;
            element.textContent = value;
            if (animate && value > oldValue) {
                element.classList.add('new-record');
                setTimeout(() => element.classList.remove('new-record'), 800);
            }
        }
    });
    
    // Update history
    updateQuizHistory();
}

function updateQuizHistory() {
    const historyContainer = document.getElementById('quiz-history');
    if (!historyContainer) return;
    
    if (!currentUser.history || currentUser.history.length === 0) {
        historyContainer.innerHTML = '<p class="no-history">No quiz history yet. Start your first quiz!</p>';
        return;
    }
    
    const recentHistory = currentUser.history.slice(-5).reverse();
    historyContainer.innerHTML = recentHistory.map(quiz => `
        <div class="history-item">
            <div class="history-info">
                <h4>${getCategoryDisplayName(quiz.category)}</h4>
                <p>${new Date(quiz.date).toLocaleDateString()} • ${quiz.correctAnswers}/${quiz.totalQuestions} correct</p>
            </div>
            <div class="history-score">${quiz.score}</div>
        </div>
    `).join('');
}

// ====== QUIZ FUNCTIONALITY ======
function startQuiz(category) {
    window.location.href = `quiz.html?category=${category}`;
}

async function initializeQuiz(category) {
    console.log('Initializing quiz for category:', category);
    
    currentQuiz = {
        category,
        questions: [],
        currentIndex: 0,
        score: 0,
        streak: 0,
        startTime: Date.now()
    };
    
    currentQuestionIndex = 0;
    quizScore = 0;
    currentStreak = 0;
    bestStreakInQuiz = 0; // Reset best streak for new quiz
    userAnswers = [];
    questionsAnswered = 0;
    correctAnswers = 0;
    wrongAnswers = 0;
    
    // Update category title
    document.getElementById('category-title').textContent = getCategoryDisplayName(category);
    
    try {
        // Load questions first
        console.log('Loading questions...');
        await loadQuestions(category);
        
        console.log('Questions loaded, checking:', {
            questionsArray: currentQuiz.questions,
            length: currentQuiz.questions?.length,
            firstQuestion: currentQuiz.questions?.[0]
        });
        
        // Verify questions are loaded
        if (!currentQuiz.questions || currentQuiz.questions.length === 0) {
            throw new Error('No questions loaded after loadQuestions call');
        }
        
        // Small delay to ensure UI is ready
        setTimeout(() => {
            console.log('Starting quiz with', currentQuiz.questions.length, 'questions');
            quizStartTime = Date.now();
            showQuestion();
            startQuestionTimer();
        }, 100);
        
    } catch (error) {
        console.error('Error initializing quiz:', error);
        showNotification('Failed to load quiz. Please try again.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

async function loadQuestions(category) {
    try {
        // Show loading screen
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('question-card').style.display = 'none';
        
        let questions = [];
        
        // Try to load from API first, then fallback to local questions
        try {
            questions = await loadQuestionsFromAPI(category);
        } catch (error) {
            console.log('API failed, loading local questions:', error);
            questions = await loadLocalQuestions(category);
        }
        
        if (questions.length === 0) {
            throw new Error('No questions available');
        }
        
        // Get current user safely
        const currentUserData = localStorage.getItem('currentUser');
        let currentUserObj = null;
        try {
            currentUserObj = JSON.parse(currentUserData);
        } catch (e) {
            console.error('Error parsing current user data:', e);
        }
        
        let availableQuestions = questions;
        
        // Only filter used questions if we have a valid user
        if (currentUserObj && currentUserObj.id) {
            // Filter out previously used questions for this category
            const categoryUsedKey = `used_${category}_${currentUserObj.id}`;
            const categoryUsedQuestions = JSON.parse(localStorage.getItem(categoryUsedKey)) || [];
            
            // Filter out used questions
            availableQuestions = questions.filter(q => 
                !categoryUsedQuestions.some(used => used.question === q.question)
            );
            
            // If we don't have enough fresh questions, reset the used questions for this category
            if (availableQuestions.length < 20) {
                localStorage.removeItem(categoryUsedKey);
                availableQuestions = questions;
            }
        }
        
        // Shuffle and take 20 unique questions
        const selectedQuestions = shuffleArray(availableQuestions).slice(0, 20);
        
        // Ensure we have questions
        if (selectedQuestions.length === 0) {
            throw new Error('No questions available after filtering');
        }
        
        currentQuiz.questions = selectedQuestions;
        
        console.log('Selected questions:', {
            length: selectedQuestions.length,
            firstQuestion: selectedQuestions[0],
            categorySource: category,
            availableBeforeFilter: questions.length,
            availableAfterFilter: availableQuestions.length
        });
        
        // Update total questions display
        const totalQuestionsElement = document.getElementById('total-questions');
        if (totalQuestionsElement) {
            totalQuestionsElement.textContent = currentQuiz.questions.length;
        }
        
        // Hide loading screen with animation
        const loadingScreen = document.getElementById('loading-screen');
        const questionCard = document.getElementById('question-card');
        
        console.log('Hiding loading screen, showing question card');
        
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                if (questionCard) {
                    questionCard.style.display = 'block';
                    questionCard.classList.add('fade-in');
                }
                console.log('UI transition complete');
            }, 300);
        }
        
    } catch (error) {
        console.error('Error loading questions:', error);
        showNotification('Failed to load questions. Please try again.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

async function loadQuestionsFromAPI(category) {
    // Map categories to Open Trivia DB categories
    const apiCategories = {
        general: 9, // General Knowledge
        communication: 25, // Art
        aptitude: 19, // Mathematics
        coding: 18 // Computer Science
    };
    
    const categoryId = apiCategories[category] || 9;
    const response = await fetch(`https://opentdb.com/api.php?amount=30&category=${categoryId}&type=multiple`);
    
    if (!response.ok) {
        throw new Error('API request failed');
    }
    
    const data = await response.json();
    
    if (data.response_code !== 0) {
        throw new Error('No questions available from API');
    }
    
    return data.results.map(q => ({
        question: decodeHTMLEntities(q.question),
        correct_answer: decodeHTMLEntities(q.correct_answer),
        incorrect_answers: q.incorrect_answers.map(a => decodeHTMLEntities(a)),
        difficulty: q.difficulty
    }));
}

async function loadLocalQuestions(category) {
    console.log('Loading local questions for category:', category);
    const localQuestions = {
        communication: [
            {
                question: "What is the most important element of effective communication?",
                correct_answer: "Active listening",
                incorrect_answers: ["Speaking loudly", "Using complex words", "Talking fast"],
                difficulty: "easy"
            },
            {
                question: "Which communication style is most effective in professional settings?",
                correct_answer: "Assertive",
                incorrect_answers: ["Aggressive", "Passive", "Passive-aggressive"],
                difficulty: "medium"
            },
            {
                question: "What percentage of communication is non-verbal according to Albert Mehrabian?",
                correct_answer: "55%",
                incorrect_answers: ["25%", "75%", "85%"],
                difficulty: "hard"
            },
            {
                question: "What is the primary purpose of feedback in communication?",
                correct_answer: "To ensure understanding",
                incorrect_answers: ["To criticize", "To dominate", "To confuse"],
                difficulty: "easy"
            },
            {
                question: "Which is NOT a barrier to effective communication?",
                correct_answer: "Empathy",
                incorrect_answers: ["Noise", "Language differences", "Preconceptions"],
                difficulty: "medium"
            },
            {
                question: "What does 'CC' stand for in email communication?",
                correct_answer: "Carbon Copy",
                incorrect_answers: ["Courtesy Copy", "Complete Copy", "Confidential Copy"],
                difficulty: "easy"
            },
            {
                question: "Which communication channel is best for complex information?",
                correct_answer: "Face-to-face",
                incorrect_answers: ["Email", "Text message", "Phone call"],
                difficulty: "medium"
            },
            {
                question: "What is active listening?",
                correct_answer: "Fully concentrating on the speaker",
                incorrect_answers: ["Waiting to respond", "Thinking of counterarguments", "Planning your next words"],
                difficulty: "easy"
            },
            {
                question: "Which gesture typically indicates openness in body language?",
                correct_answer: "Open palms",
                incorrect_answers: ["Crossed arms", "Clenched fists", "Pointing finger"],
                difficulty: "medium"
            },
            {
                question: "What is the 7-38-55 rule in communication?",
                correct_answer: "Words-Tone-Body language impact",
                incorrect_answers: ["Time-Place-Message rule", "Sender-Medium-Receiver rule", "Past-Present-Future rule"],
                difficulty: "hard"
            }
        ],
        aptitude: [
            {
                question: "If 5 machines can produce 5 widgets in 5 minutes, how many machines are needed to produce 100 widgets in 100 minutes?",
                correct_answer: "5",
                incorrect_answers: ["20", "100", "10"],
                difficulty: "medium"
            },
            {
                question: "What comes next in the sequence: 2, 6, 12, 20, 30, ?",
                correct_answer: "42",
                incorrect_answers: ["40", "38", "44"],
                difficulty: "medium"
            },
            {
                question: "If all Bloops are Razzles and all Razzles are Lazzles, then all Bloops are definitely Lazzles?",
                correct_answer: "True",
                incorrect_answers: ["False", "Cannot be determined", "Sometimes"],
                difficulty: "easy"
            },
            {
                question: "A train travels 60 mph for 2 hours, then 80 mph for 3 hours. What is its average speed?",
                correct_answer: "72 mph",
                incorrect_answers: ["70 mph", "75 mph", "68 mph"],
                difficulty: "hard"
            },
            {
                question: "Which number should replace the question mark: 3, 7, 15, 31, ?",
                correct_answer: "63",
                incorrect_answers: ["47", "55", "71"],
                difficulty: "medium"
            },
            {
                question: "If you rearrange the letters 'LISTEN', you get which word?",
                correct_answer: "SILENT",
                incorrect_answers: ["TENSIL", "ENLIST", "TINSEL"],
                difficulty: "easy"
            },
            {
                question: "What is 15% of 200?",
                correct_answer: "30",
                incorrect_answers: ["25", "35", "40"],
                difficulty: "easy"
            },
            {
                question: "If a clock shows 3:15, what is the angle between the hour and minute hands?",
                correct_answer: "7.5 degrees",
                incorrect_answers: ["15 degrees", "22.5 degrees", "0 degrees"],
                difficulty: "hard"
            },
            {
                question: "Complete the analogy: Book is to Reading as Fork is to ?",
                correct_answer: "Eating",
                incorrect_answers: ["Kitchen", "Spoon", "Food"],
                difficulty: "easy"
            },
            {
                question: "If 3x + 7 = 22, what is x?",
                correct_answer: "5",
                incorrect_answers: ["4", "6", "7"],
                difficulty: "medium"
            }
        ],
        coding: [
            {
                question: "Which programming language is known as the 'mother of all languages'?",
                correct_answer: "C",
                incorrect_answers: ["Java", "Python", "Assembly"],
                difficulty: "easy"
            },
            {
                question: "What does HTML stand for?",
                correct_answer: "HyperText Markup Language",
                incorrect_answers: ["Home Tool Markup Language", "Hyperlinks and Text Markup Language", "HyperText Modern Language"],
                difficulty: "easy"
            },
            {
                question: "Which data structure follows LIFO (Last In First Out) principle?",
                correct_answer: "Stack",
                incorrect_answers: ["Queue", "Array", "Linked List"],
                difficulty: "medium"
            },
            {
                question: "What is the time complexity of binary search?",
                correct_answer: "O(log n)",
                incorrect_answers: ["O(n)", "O(n²)", "O(1)"],
                difficulty: "medium"
            },
            {
                question: "Which sorting algorithm has the best average-case time complexity?",
                correct_answer: "Quick Sort",
                incorrect_answers: ["Bubble Sort", "Selection Sort", "Insertion Sort"],
                difficulty: "hard"
            },
            {
                question: "What does CSS stand for?",
                correct_answer: "Cascading Style Sheets",
                incorrect_answers: ["Computer Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"],
                difficulty: "easy"
            },
            {
                question: "Which HTTP status code indicates 'Not Found'?",
                correct_answer: "404",
                incorrect_answers: ["200", "500", "301"],
                difficulty: "easy"
            },
            {
                question: "What is polymorphism in OOP?",
                correct_answer: "Objects taking multiple forms",
                incorrect_answers: ["Data hiding", "Code reusability", "Object creation"],
                difficulty: "medium"
            },
            {
                question: "Which database operation is used to retrieve data?",
                correct_answer: "SELECT",
                incorrect_answers: ["INSERT", "UPDATE", "DELETE"],
                difficulty: "easy"
            },
            {
                question: "What is the maximum number of characters in a tweet?",
                correct_answer: "280",
                incorrect_answers: ["140", "200", "300"],
                difficulty: "medium"
            }
        ],
        general: [
            {
                question: "What is the capital of Australia?",
                correct_answer: "Canberra",
                incorrect_answers: ["Sydney", "Melbourne", "Perth"],
                difficulty: "easy"
            },
            {
                question: "Who painted the Mona Lisa?",
                correct_answer: "Leonardo da Vinci",
                incorrect_answers: ["Pablo Picasso", "Vincent van Gogh", "Michelangelo"],
                difficulty: "easy"
            },
            {
                question: "What is the largest planet in our solar system?",
                correct_answer: "Jupiter",
                incorrect_answers: ["Saturn", "Neptune", "Earth"],
                difficulty: "easy"
            },
            {
                question: "In which year did World War II end?",
                correct_answer: "1945",
                incorrect_answers: ["1944", "1946", "1943"],
                difficulty: "medium"
            },
            {
                question: "What is the chemical symbol for gold?",
                correct_answer: "Au",
                incorrect_answers: ["Go", "Gd", "Ag"],
                difficulty: "medium"
            },
            {
                question: "Which ocean is the largest?",
                correct_answer: "Pacific Ocean",
                incorrect_answers: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean"],
                difficulty: "easy"
            },
            {
                question: "Who wrote 'Romeo and Juliet'?",
                correct_answer: "William Shakespeare",
                incorrect_answers: ["Charles Dickens", "Jane Austen", "Mark Twain"],
                difficulty: "easy"
            },
            {
                question: "What is the speed of light?",
                correct_answer: "299,792,458 m/s",
                incorrect_answers: ["300,000,000 m/s", "186,000 mph", "299,792 km/s"],
                difficulty: "hard"
            },
            {
                question: "Which country has the most time zones?",
                correct_answer: "France",
                incorrect_answers: ["Russia", "United States", "China"],
                difficulty: "hard"
            },
            {
                question: "What is the smallest country in the world?",
                correct_answer: "Vatican City",
                incorrect_answers: ["Monaco", "San Marino", "Liechtenstein"],
                difficulty: "medium"
            }
        ]
    };
    
    const questions = localQuestions[category] || localQuestions.general;
    console.log('Local questions loaded:', questions.length);
    return questions;
}

function showQuestion() {
    console.log('showQuestion called', {
        currentQuiz: !!currentQuiz,
        questions: currentQuiz?.questions?.length,
        currentIndex: currentQuestionIndex
    });
    
    if (!currentQuiz || !currentQuiz.questions || currentQuiz.questions.length === 0) {
        console.error('No questions available!');
        showNotification('No questions available. Please try again.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    if (currentQuestionIndex >= currentQuiz.questions.length) {
        finishQuiz();
        return;
    }
    
    const question = currentQuiz.questions[currentQuestionIndex];
    
    // Update question number and progress
    document.getElementById('question-number').textContent = currentQuestionIndex + 1;
    updateProgressBar();
    
    // Display question
    document.getElementById('question-text').textContent = question.question;
    
    // Prepare and shuffle answers
    const answers = [...question.incorrect_answers, question.correct_answer];
    const shuffledAnswers = shuffleArray(answers);
    
    // Display answers
    const answersContainer = document.getElementById('answers-container');
    answersContainer.innerHTML = '';
    
    shuffledAnswers.forEach((answer, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'answer-option';
        optionElement.setAttribute('data-answer', answer);
        
        optionElement.innerHTML = `
            <div class="option-letter">${String.fromCharCode(65 + index)}</div>
            <div class="option-text">${answer}</div>
        `;
        
        optionElement.addEventListener('click', () => selectAnswer(answer, optionElement));
        answersContainer.appendChild(optionElement);
    });
    
    // Reset timer
    timeLeft = 30;
    questionStartTime = Date.now();
    updateTimer();
    
    // Update navigation buttons
    updateNavigationButtons();
}

function selectAnswer(selectedAnswer, optionElement) {
    if (animationInProgress) return;
    animationInProgress = true;
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    const question = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correct_answer;
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
    
    // Disable all options
    const allOptions = document.querySelectorAll('.answer-option');
    allOptions.forEach(option => {
        option.classList.add('disabled');
        option.style.pointerEvents = 'none';
    });
    
    // Show correct/wrong styling with animations
    allOptions.forEach(option => {
        const answerText = option.getAttribute('data-answer');
        if (answerText === question.correct_answer) {
            option.classList.add('correct');
        } else if (answerText === selectedAnswer && !isCorrect) {
            option.classList.add('wrong');
        }
    });
    
    // Update score and streak - only add points for correct answers, no deduction for wrong
    if (isCorrect) {
        quizScore += 2;
        currentStreak++;
        correctAnswers++;
        
        // Update best streak if current streak is better
        if (currentStreak > bestStreakInQuiz) {
            bestStreakInQuiz = currentStreak;
            console.log('New best streak in quiz:', bestStreakInQuiz);
        }
    } else {
        // No score reduction for wrong answers, but reset current streak
        currentStreak = 0;
        wrongAnswers++;
    }
    
    questionsAnswered++;
    
    // Store answer
    userAnswers.push({
        questionIndex: currentQuestionIndex,
        question: question.question,
        selectedAnswer,
        correctAnswer: question.correct_answer,
        isCorrect,
        timeSpent
    });
    
    // Update display with animation
    animateScoreUpdate();
    
    // Auto-advance after 1.5 seconds (no popup)
    setTimeout(() => {
        animationInProgress = false;
        nextQuestion();
    }, 1500);
}

function animateScoreUpdate() {
    const scoreElement = document.getElementById('current-score');
    const streakElement = document.getElementById('quiz-streak');
    
    scoreElement.textContent = quizScore;
    streakElement.textContent = currentStreak;
    
    scoreElement.classList.add('stats-update');
    streakElement.classList.add('stats-update');
    
    // Special effects for streak milestones
    if (currentStreak > 0) {
        if (currentStreak === 5) {
            showNotification('🔥 5 in a row! You\'re on fire!', 'success', 2000);
            streakElement.classList.add('streak-fire');
        } else if (currentStreak === 10) {
            showNotification('⚡ 10 streak! Unstoppable!', 'success', 2000);
            streakElement.classList.add('streak-lightning');
        } else if (currentStreak >= 15) {
            showNotification('🏆 Amazing streak! You\'re a quiz master!', 'success', 3000);
            streakElement.classList.add('streak-master');
        }
        
        // Update best streak during quiz
        if (currentStreak > bestStreakInQuiz) {
            bestStreakInQuiz = currentStreak;
        }
    }
    
    setTimeout(() => {
        scoreElement.classList.remove('stats-update');
        streakElement.classList.remove('stats-update', 'streak-fire', 'streak-lightning', 'streak-master');
    }, 600);
}

// ====== NOTIFICATION SYSTEM ======
function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container') || 
                     document.querySelector('.notification-container') || 
                     createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <div class="notification-text">${message}</div>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        notification.style.animation = 'slideOutNotification 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    container.id = 'notification-container';
    document.body.appendChild(container);
    return container;
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        
        // Add slide out animation
        const questionCard = document.getElementById('question-card');
        questionCard.style.transform = 'translateX(-100%)';
        questionCard.style.opacity = '0';
        
        setTimeout(() => {
            showQuestion();
            questionCard.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                questionCard.style.transform = 'translateX(0)';
                questionCard.style.opacity = '1';
            }, 50);
            
            setTimeout(() => {
                startQuestionTimer();
            }, 400);
        }, 300);
    } else {
        finishQuiz();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
        startQuestionTimer();
    }
}

function updateProgressBar() {
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
    document.getElementById('progress-bar').style.width = progress + '%';
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
        prevBtn.disabled = currentQuestionIndex === 0;
    }
    
    if (nextBtn) {
        nextBtn.style.display = 'none'; // Hide next button as we auto-advance
    }
}

function startQuestionTimer() {
    timeLeft = 30;
    updateTimer();
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeUp();
        }
    }, 1000);
}

function updateTimer() {
    const timerElement = document.getElementById('timer');
    const timeDisplay = document.getElementById('time-left');
    
    if (timeDisplay) {
        timeDisplay.textContent = timeLeft;
    }
    
    if (timerElement) {
        timerElement.className = 'timer';
        if (timeLeft <= 5) {
            timerElement.classList.add('danger');
        } else if (timeLeft <= 10) {
            timerElement.classList.add('warning');
        }
    }
}

function handleTimeUp() {
    if (animationInProgress) return;
    animationInProgress = true;
    
    const question = currentQuiz.questions[currentQuestionIndex];
    
    // Mark as wrong answer - no score deduction for timeout
    wrongAnswers++;
    currentStreak = 0;
    // No score reduction for timeout
    questionsAnswered++;
    
    // Store answer
    userAnswers.push({
        questionIndex: currentQuestionIndex,
        question: question.question,
        selectedAnswer: null,
        correctAnswer: question.correct_answer,
        isCorrect: false,
        timeSpent: 30
    });
    
    // Show correct answer with animation
    const allOptions = document.querySelectorAll('.answer-option');
    allOptions.forEach(option => {
        option.classList.add('disabled');
        option.style.pointerEvents = 'none';
        
        const answerText = option.getAttribute('data-answer');
        if (answerText === question.correct_answer) {
            option.classList.add('correct');
        }
    });
    
    // Update display with animation
    animateScoreUpdate();
    
    // Show brief notification
    showNotification('Time\'s up!', 'warning', 1000);
    
    // Auto-advance after 1.5 seconds
    setTimeout(() => {
        animationInProgress = false;
        nextQuestion();
    }, 1500);
}

function quitQuiz() {
    if (confirm('Are you sure you want to quit the quiz? Your progress will be lost.')) {
        window.location.href = 'index.html';
    }
}

function finishQuiz() {
    clearInterval(timerInterval);
    
    const quizEndTime = Date.now();
    const totalTime = Math.round((quizEndTime - currentQuiz.startTime) / 1000);
    const avgTimePerQuestion = Math.round(totalTime / currentQuiz.questions.length);
    
    // Calculate percentage
    const percentage = Math.round((correctAnswers / currentQuiz.questions.length) * 100);
    
    // Prepare results
    const results = {
        category: currentQuiz.category,
        score: quizScore,
        correctAnswers,
        wrongAnswers,
        totalQuestions: currentQuiz.questions.length,
        percentage,
        streak: bestStreakInQuiz, // Use the best streak achieved during the quiz
        totalTime,
        avgTimePerQuestion,
        date: new Date().toISOString(),
        userAnswers
    };
    
    console.log('Final quiz stats:', {
        score: quizScore,
        correct: correctAnswers,
        wrong: wrongAnswers,
        currentStreak: currentStreak,
        bestStreak: bestStreakInQuiz,
        percentage: percentage
    });
    
    // Save results
    localStorage.setItem('currentQuizResults', JSON.stringify(results));
    
    console.log('Quiz finished! Results:', results);
    
    // Update user stats BEFORE redirecting
    updateUserStats(results);
    
    console.log('Stats updated, redirecting to results page');
    
    // Redirect to results page
    window.location.href = 'result.html';
}

function updateUserStats(results) {
    console.log('Updating user stats with results:', results);
    
    if (!currentUser) {
        console.error('No current user found when updating stats');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) {
        console.error('User not found in users array');
        return;
    }
    
    console.log('User found at index:', userIndex, 'Current stats:', users[userIndex].stats);
    
    // Update stats
    const stats = users[userIndex].stats;
    
    // Update basic stats
    stats.lastScore = results.score;
    stats.totalQuizzes = (stats.totalQuizzes || 0) + 1;
    
    // Update highest score if this is better
    if (results.score > (stats.highestScore || 0)) {
        stats.highestScore = results.score;
        console.log('New highest score!', results.score);
    }
    
    // Update best streak if this quiz's best streak is better
    if (results.streak > (stats.bestStreak || 0)) {
        stats.bestStreak = results.streak;
        console.log('New all-time best streak!', results.streak);
    }
    
    // Update current streak logic:
    // If the quiz ended with a streak (last answers were correct), continue/update the ongoing streak
    // If the quiz ended with wrong answers (currentStreak = 0), reset the ongoing streak
    if (currentStreak > 0) {
        // Quiz ended on a high note, update the ongoing streak
        stats.currentStreak = Math.max(stats.currentStreak || 0, results.streak);
    } else {
        // Quiz ended with wrong answer(s), but we still show the best streak achieved in this quiz
        stats.currentStreak = results.streak;
    }
    
    console.log('Streak update:', {
        quizBestStreak: results.streak,
        quizEndingStreak: currentStreak,
        newCurrentStreak: stats.currentStreak,
        allTimeBestStreak: stats.bestStreak
    });
    
    console.log('Stats after update:', {
        lastScore: stats.lastScore,
        totalQuizzes: stats.totalQuizzes,
        highestScore: stats.highestScore,
        currentStreak: stats.currentStreak
    });
    
    // Update category best
    const categoryKey = results.category;
    if (results.score > stats.categoryBests[categoryKey]) {
        stats.categoryBests[categoryKey] = results.score;
    }
    
    // Add to history
    users[userIndex].history.push(results);
    
    // Keep only last 50 quiz attempts
    if (users[userIndex].history.length > 50) {
        users[userIndex].history = users[userIndex].history.slice(-50);
    }
    
    // Store used questions for this category to prevent repeats
    const categoryUsedKey = `used_${results.category}_${currentUser.id}`;
    const existingUsed = JSON.parse(localStorage.getItem(categoryUsedKey)) || [];
    const newUsedQuestions = results.userAnswers.map(answer => ({
        question: answer.question,
        correctAnswer: answer.correctAnswer
    }));
    
    const updatedUsed = [...existingUsed, ...newUsedQuestions];
    localStorage.setItem(categoryUsedKey, JSON.stringify(updatedUsed));
    
    // Save back to localStorage
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
    
    currentUser = users[userIndex];
    
    console.log('User stats updated successfully:', {
        newStats: users[userIndex].stats,
        historyLength: users[userIndex].history.length
    });
}

// ====== RESULTS PAGE ======
function displayResults(results) {
    // Update basic info
    document.getElementById('final-score').textContent = results.score;
    document.getElementById('correct-count').textContent = results.correctAnswers;
    document.getElementById('wrong-count').textContent = results.wrongAnswers;
    document.getElementById('percentage').textContent = results.percentage + '%';
    
    // Update performance stats
    document.getElementById('quiz-streak-count').textContent = results.streak;
    document.getElementById('best-streak-count').textContent = currentUser.stats.bestStreak;
    document.getElementById('category-best-score').textContent = currentUser.stats.categoryBests[results.category];
    
    // Update quiz summary
    document.getElementById('quiz-category').textContent = getCategoryDisplayName(results.category);
    document.getElementById('total-questions-taken').textContent = results.totalQuestions;
    document.getElementById('time-taken').textContent = formatTime(results.totalTime);
    document.getElementById('avg-time').textContent = results.avgTimePerQuestion + 's';
    
    // Update results header based on performance
    updateResultsHeader(results.percentage);
    
    // Show performance message
    showPerformanceMessage(results.percentage);
    
    // Check for achievements
    checkAchievements(results);
}

function updateResultsHeader(percentage) {
    const resultsIcon = document.getElementById('results-icon');
    const resultsTitle = document.getElementById('results-title');
    const resultsSubtitle = document.getElementById('results-subtitle');
    
    if (percentage >= 90) {
        resultsIcon.className = 'results-icon excellent';
        resultsIcon.innerHTML = '<i class="fas fa-trophy"></i>';
        resultsTitle.textContent = 'Excellent!';
        resultsSubtitle.textContent = 'Outstanding performance!';
    } else if (percentage >= 70) {
        resultsIcon.className = 'results-icon good';
        resultsIcon.innerHTML = '<i class="fas fa-star"></i>';
        resultsTitle.textContent = 'Great Job!';
        resultsSubtitle.textContent = 'You did really well!';
    } else if (percentage >= 50) {
        resultsIcon.className = 'results-icon average';
        resultsIcon.innerHTML = '<i class="fas fa-thumbs-up"></i>';
        resultsTitle.textContent = 'Good Effort!';
        resultsSubtitle.textContent = 'Keep practicing to improve!';
    } else {
        resultsIcon.className = 'results-icon poor';
        resultsIcon.innerHTML = '<i class="fas fa-redo"></i>';
        resultsTitle.textContent = 'Try Again!';
        resultsSubtitle.textContent = "Don't give up, you can do better!";
    }
}

function showPerformanceMessage(percentage) {
    const messageTitle = document.getElementById('message-title');
    const messageText = document.getElementById('message-text');
    
    if (percentage >= 90) {
        messageTitle.textContent = 'Outstanding! 🏆';
        messageText.textContent = 'You are a true quiz master! Your knowledge is impressive.';
    } else if (percentage >= 70) {
        messageTitle.textContent = 'Well Done! 🌟';
        messageText.textContent = 'Great performance! You have a solid understanding of the topic.';
    } else if (percentage >= 50) {
        messageTitle.textContent = 'Good Job! 👍';
        messageText.textContent = 'You are on the right track. A bit more practice will make you even better!';
    } else {
        messageTitle.textContent = 'Keep Learning! 📚';
        messageText.textContent = 'Every expert was once a beginner. Keep practicing and you will improve!';
    }
}

function checkAchievements(results) {
    const achievements = [];
    
    // First quiz achievement
    if (currentUser.stats.totalQuizzes === 1) {
        achievements.push('🎯 First Quiz Completed!');
    }
    
    // Perfect score achievement
    if (results.percentage === 100) {
        achievements.push('💯 Perfect Score!');
    }
    
    // High score achievement
    if (results.score >= 50) {
        achievements.push('🚀 High Scorer!');
    }
    
    // Streak achievements
    if (results.streak >= 10) {
        achievements.push('🔥 Hot Streak!');
    }
    
    // Speed achievement
    if (results.avgTimePerQuestion <= 10) {
        achievements.push('⚡ Speed Demon!');
    }
    
    // Category master
    if (results.percentage >= 80) {
        achievements.push(`🎓 ${getCategoryDisplayName(results.category)} Expert!`);
    }
    
    if (achievements.length > 0) {
        const achievementsContainer = document.getElementById('achievements');
        const achievementsList = document.getElementById('achievement-list');
        
        achievementsList.innerHTML = achievements.map(achievement => 
            `<div class="achievement-item">${achievement}</div>`
        ).join('');
        
        achievementsContainer.style.display = 'block';
    }
}

function retryQuiz() {
    const results = JSON.parse(localStorage.getItem('currentQuizResults'));
    if (results) {
        window.location.href = `quiz.html?category=${results.category}`;
    }
}

function shareScore() {
    const results = JSON.parse(localStorage.getItem('currentQuizResults'));
    if (results && navigator.share) {
        navigator.share({
            title: 'Quiz Master - My Score',
            text: `I just scored ${results.score} points in ${getCategoryDisplayName(results.category)} quiz! ${results.percentage}% accuracy. Can you beat my score?`,
            url: window.location.origin
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        const shareText = `I just scored ${results.score} points in ${getCategoryDisplayName(results.category)} quiz! ${results.percentage}% accuracy. Can you beat my score?`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('Score copied to clipboard!');
            });
        } else {
            alert('Share feature not supported. Your score: ' + shareText);
        }
    }
}

// ====== UTILITY FUNCTIONS ======
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getCategoryDisplayName(category) {
    const displayNames = {
        communication: 'Communication',
        aptitude: 'Aptitude',
        coding: 'Coding',
        general: 'General Knowledge'
    };
    return displayNames[category] || category;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function decodeHTMLEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
}

function startQuizTimer() {
    quizStartTime = Date.now();
}

// Test function to manually update dashboard - for debugging
function testDashboardUpdate() {
    console.log('=== MANUAL DASHBOARD TEST ===');
    
    if (!currentUser) {
        console.error('No current user to test with');
        return;
    }
    
    console.log('Before test - current user stats:', currentUser.stats);
    
    // Set some test values
    currentUser.stats.highestScore = 25;
    currentUser.stats.lastScore = 20;
    currentUser.stats.currentStreak = 5;
    currentUser.stats.totalQuizzes = 3;
    
    console.log('After setting test values:', currentUser.stats);
    
    // Update localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    console.log('Updated localStorage with test values');
    
    // Update dashboard with animation
    updateDashboard(true);
    
    console.log('=== MANUAL DASHBOARD TEST COMPLETED ===');
}

// Function to simulate a completed quiz for testing
function simulateQuizCompletion() {
    console.log('=== SIMULATING QUIZ COMPLETION ===');
    
    if (!currentUser) {
        console.error('No current user found');
        return;
    }
    
    // Create fake quiz results with a good streak
    const fakeResults = {
        category: 'general',
        score: 36, // 18 correct answers * 2 points
        correctAnswers: 18,
        wrongAnswers: 2,
        totalQuestions: 20,
        percentage: 90,
        streak: 12, // Good streak for testing
        totalTime: 300,
        avgTimePerQuestion: 15,
        date: new Date().toISOString(),
        userAnswers: []
    };
    
    console.log('Fake results created:', fakeResults);
    
    // Update user stats
    updateUserStats(fakeResults);
    
    // Set the flag for dashboard animation
    localStorage.setItem('justCompletedQuiz', 'true');
    
    // Show dashboard with animation
    showDashboard();
    
    console.log('=== QUIZ SIMULATION COMPLETED ===');
}

// Function to test streak effects during quiz
function testStreakEffects() {
    console.log('=== TESTING STREAK EFFECTS ===');
    
    // Simulate building streaks
    currentStreak = 0;
    bestStreakInQuiz = 0;
    
    const streakTests = [3, 5, 7, 10, 12, 15];
    let delay = 0;
    
    streakTests.forEach((streak) => {
        setTimeout(() => {
            currentStreak = streak;
            console.log(`Testing streak: ${streak}`);
            animateScoreUpdate();
        }, delay);
        delay += 2000;
    });
    
    console.log('=== STREAK EFFECTS TEST STARTED ===');
}