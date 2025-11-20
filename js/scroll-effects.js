// Scroll Progress Bar
const updateScrollProgress = () => {
    const winScroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    
    let progressBar = document.querySelector('.scroll-progress');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.appendChild(progressBar);
    }
    progressBar.style.width = scrolled + '%';
};

window.addEventListener('scroll', updateScrollProgress);

// Intersection Observer for Fade In
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in, .scale-in').forEach(el => observer.observe(el));

// Number Counter Animation
const animateCounter = (element, target, duration = 2000) => {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
};

// Parallax Effect
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            document.querySelectorAll('.parallax').forEach(el => {
                const speed = el.dataset.speed || 0.5;
                const yPos = -(window.pageYOffset * speed);
                el.style.transform = `translateY(${yPos}px)`;
            });
            ticking = false;
        });
        ticking = true;
    }
});

// Smooth Reveal on Scroll
const revealOnScroll = () => {
    const reveals = document.querySelectorAll('.module__visual, .module__content');
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('fade-in', 'visible');
        }
    });
};

window.addEventListener('scroll', revealOnScroll);
revealOnScroll();
