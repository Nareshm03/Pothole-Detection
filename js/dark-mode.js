// Dark Mode Toggle with System Preference Detection
(function() {
    const STORAGE_KEY = 'theme-preference';
    
    // Get system preference
    const getSystemPreference = () => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };
    
    // Get stored preference or system preference
    const getTheme = () => {
        return localStorage.getItem(STORAGE_KEY) || getSystemPreference();
    };
    
    // Set theme
    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
    };
    
    // Initialize theme
    const initTheme = () => {
        const theme = getTheme();
        setTheme(theme);
    };
    
    // Toggle theme
    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
    
    // Initialize on load
    initTheme();
    
    // Create toggle button
    const createToggle = () => {
        const toggle = document.createElement('div');
        toggle.className = 'theme-toggle';
        toggle.innerHTML = `
            <button class="theme-toggle__btn" aria-label="Toggle dark mode">
                <span class="theme-toggle__slider"></span>
                <span class="theme-toggle__icon theme-toggle__icon--sun">☀️</span>
                <span class="theme-toggle__icon theme-toggle__icon--moon">🌙</span>
            </button>
        `;
        document.body.appendChild(toggle);
        
        toggle.querySelector('.theme-toggle__btn').addEventListener('click', toggleTheme);
    };
    
    // Create toggle when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createToggle);
    } else {
        createToggle();
    }
    
    // Expose toggle function globally
    window.toggleTheme = toggleTheme;
})();
