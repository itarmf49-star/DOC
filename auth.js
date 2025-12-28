// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check for saved session
        const savedUser = localStorage.getItem('hadrami_user');
        const rememberMe = localStorage.getItem('hadrami_remember');
        
        if (savedUser && rememberMe === 'true') {
            this.currentUser = JSON.parse(savedUser);
            this.showMainApp();
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        // Hide main app and footer
        const mainApp = document.getElementById('mainApp');
        const footer = document.getElementById('appFooter');
        if (mainApp) mainApp.style.display = 'none';
        if (footer) footer.style.display = 'none';
        
        // Check if auth container already exists
        let authContainer = document.getElementById('authContainer');
        if (!authContainer) {
            authContainer = document.createElement('div');
            authContainer.id = 'authContainer';
            authContainer.className = 'auth-container';
            authContainer.innerHTML = `
                <div class="auth-box">
                    <div class="auth-header">
                        <div class="auth-logo">🌐</div>
                        <h1>IT Hadrami Packet Tracker</h1>
                        <p>RAK Network Learning Portal</p>
                    </div>
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">Login</button>
                        <button class="auth-tab" data-tab="register">Register</button>
                    </div>
                    <div id="loginForm" class="auth-form active">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="loginEmail" placeholder="your.email@example.com" required>
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="loginPassword" placeholder="Enter your password" required>
                        </div>
                        <div class="form-group checkbox-group">
                            <input type="checkbox" id="rememberMe">
                            <label for="rememberMe">Remember me</label>
                        </div>
                        <button class="btn btn-primary btn-block" id="loginBtn">Login</button>
                    </div>
                    <div id="registerForm" class="auth-form">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" id="registerName" placeholder="Your full name" required>
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="registerEmail" placeholder="your.email@example.com" required>
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="registerPassword" placeholder="Create a password" required>
                        </div>
                        <div class="form-group">
                            <label>Confirm Password</label>
                            <input type="password" id="registerConfirm" placeholder="Confirm password" required>
                        </div>
                        <button class="btn btn-primary btn-block" id="registerBtn">Create Account</button>
                    </div>
                </div>
            `;
            document.body.appendChild(authContainer);
        }
        
        authContainer.style.display = 'flex';
        this.attachAuthListeners();
    }

    attachAuthListeners() {
        // Remove existing listeners by cloning
        const authContainer = document.getElementById('authContainer');
        if (!authContainer) return;
        
        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.replaceWith(tab.cloneNode(true));
        });
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                tab.classList.add('active');
                const form = document.getElementById(`${tabName}Form`);
                if (form) form.classList.add('active');
            });
        });
        
        // Login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.replaceWith(loginBtn.cloneNode(true));
            document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        }
        
        // Register button
        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.replaceWith(registerBtn.cloneNode(true));
            document.getElementById('registerBtn').addEventListener('click', () => this.handleRegister());
        }
    }

    handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Check if user exists
        const users = JSON.parse(localStorage.getItem('hadrami_users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = user;
            if (rememberMe) {
                localStorage.setItem('hadrami_user', JSON.stringify(user));
                localStorage.setItem('hadrami_remember', 'true');
            }
            this.showMainApp();
        } else {
            alert('Invalid email or password');
        }
    }

    handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirm = document.getElementById('registerConfirm').value;

        if (!name || !email || !password || !confirm) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirm) {
            alert('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        // Save user
        const users = JSON.parse(localStorage.getItem('hadrami_users') || '[]');
        
        if (users.find(u => u.email === email)) {
            alert('Email already registered');
            return;
        }

        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('hadrami_users', JSON.stringify(users));
        
        alert('Account created successfully! Please login.');
        document.querySelector('[data-tab="login"]').click();
    }

    showMainApp() {
        // Hide auth container
        const authContainer = document.getElementById('authContainer');
        if (authContainer) {
            authContainer.style.display = 'none';
        }
        
        // Show main app and footer
        const mainApp = document.getElementById('mainApp');
        const footer = document.getElementById('appFooter');
        if (mainApp) {
            mainApp.style.display = 'flex';
            // Force reflow to ensure display change is applied
            mainApp.offsetHeight;
        }
        if (footer) {
            footer.style.display = 'flex';
        }
        
        // Initialize network builder if not already initialized
        // Use a longer timeout to ensure DOM is fully ready and style is applied
        setTimeout(() => {
            // Force a reflow to ensure display style is applied
            if (mainApp) {
                void mainApp.offsetHeight;
            }
            
            if (typeof window.initializeApplication === 'function') {
                console.log('Calling window.initializeApplication...');
                window.initializeApplication();
            } else if (typeof NetworkBuilder !== 'undefined' && !window.networkBuilder) {
                // Fallback: directly initialize
                try {
                    console.log('Initializing NetworkBuilder directly...');
                    window.networkBuilder = new NetworkBuilder();
                    console.log('Network Builder initialized');
                } catch (error) {
                    console.error('Error initializing Network Builder:', error);
                    console.error(error.stack);
                }
            } else {
                console.warn('Cannot initialize: initializeApplication function not found and NetworkBuilder not available');
            }
        }, 300);
        
        // Initialize AI Assistant
        if (typeof AIAssistant !== 'undefined' && !window.aiAssistant) {
            setTimeout(() => {
                try {
                    window.aiAssistant = new AIAssistant();
                    console.log('AI Assistant initialized');
                } catch (error) {
                    console.warn('AI Assistant initialization failed:', error);
                }
            }, 600);
        }
    }

    logout() {
        localStorage.removeItem('hadrami_user');
        localStorage.removeItem('hadrami_remember');
        this.currentUser = null;
        this.showLogin();
    }
}

