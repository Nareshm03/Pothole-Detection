document.addEventListener('DOMContentLoaded', function() {
    // Add animation classes to elements
    animateElementsOnLoad();
    
    // Mobile navigation toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // Add animation to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.classList.add('animate-pulse');
        });
        button.addEventListener('mouseleave', function() {
            this.classList.remove('animate-pulse');
        });
    });
    
    // Highlight current page in navigation
    highlightCurrentPage();
    
    // Smooth scrolling for navigation links
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('active');
                }
                
                // Smooth scroll to target
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Offset for fixed header
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Function to add animations to elements on page load
    function animateElementsOnLoad() {
        // Add staggered animation to sections
        document.querySelectorAll('section, .card, .hero-content').forEach(section => {
            section.classList.add('animate-fadeIn');
        });
        
        // Add stagger animation to lists
        const lists = document.querySelectorAll('.feature-list, .stats-list');
        lists.forEach(list => {
            list.classList.add('stagger-animation');
        });
    }
    
    // Function to highlight current page in navigation
    function highlightCurrentPage() {
        const currentPage = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || 
                (currentPage === '' && href === 'index.html') ||
                (currentPage === 'index.html' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    }

    // Animate elements when they come into view
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.feature-card, .hero-content, .timeline-step, .tech-badge, .form-group, .contact-form button');
        
        elements.forEach((element, index) => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.3;
            
            if (elementPosition < screenPosition) {
                // Set animation order for feature cards
                if (element.classList.contains('feature-card')) {
                    element.style.setProperty('--animation-order', index % 6);
                }
                element.classList.add('animate');
            }
        });
    };
    
    // Run animation check on load and scroll
    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Run once on page load
    
    // Add animation class to hero content on page load
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        setTimeout(() => {
            heroContent.classList.add('animate');
        }, 300);
    }
    
    // Create animated background lines for hero section
    const createAnimatedBackground = function() {
        const animatedLines = document.querySelector('.animated-lines');
        if (!animatedLines) return;
        
        // Clear existing lines
        animatedLines.innerHTML = '';
        
        // Create new lines
        for (let i = 0; i < 10; i++) {
            const line = document.createElement('div');
            line.classList.add('animated-line');
            
            // Randomize line properties
            const startX = Math.random() * 100;
            const startY = Math.random() * 100;
            const length = 20 + Math.random() * 30;
            const angle = Math.random() * 360;
            const delay = Math.random() * 5;
            const duration = 3 + Math.random() * 7;
            
            // Apply styles
            line.style.left = `${startX}%`;
            line.style.top = `${startY}%`;
            line.style.width = `${length}px`;
            line.style.transform = `rotate(${angle}deg)`;
            line.style.animationDelay = `${delay}s`;
            line.style.animationDuration = `${duration}s`;
            
            animatedLines.appendChild(line);
        }
    };
    
    // Initialize animated background
    createAnimatedBackground();
    
    // Update animated background on window resize
    window.addEventListener('resize', createAnimatedBackground);
});

// Add CSS class when scrolling down to change navbar appearance
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});