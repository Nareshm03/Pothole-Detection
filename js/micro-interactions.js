// Micro-interactions JavaScript
(function() {
  'use strict';

  // Scroll Progress Bar
  function initScrollProgress() {
    let progressBar = document.querySelector('.scroll-progress');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'scroll-progress';
      document.body.appendChild(progressBar);
    }

    window.addEventListener('scroll', () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      progressBar.style.width = scrolled + '%';
    });
  }

  // Number Counter Animation
  function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = Math.round(target);
        clearInterval(timer);
      } else {
        element.textContent = Math.round(current);
      }
    }, 16);
  }

  // Observe stat values and animate on scroll
  function initCounterAnimation() {
    const statValues = document.querySelectorAll('.stat-value, .metric-value');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = 'true';
          const text = entry.target.textContent;
          const number = parseInt(text.replace(/[^0-9]/g, ''));
          
          if (!isNaN(number) && number > 0) {
            entry.target.textContent = '0';
            animateCounter(entry.target, number);
          }
        }
      });
    }, { threshold: 0.5 });

    statValues.forEach(stat => observer.observe(stat));
  }

  // Ripple Effect
  function addRippleEffect() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('.btn, .hero__cta--primary, .hero__cta--secondary');
      if (!target) return;

      const ripple = document.createElement('span');
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        animation: rippleEffect 0.6s ease-out;
      `;

      target.style.position = 'relative';
      target.style.overflow = 'hidden';
      target.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  }

  // Add ripple animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rippleEffect {
      from {
        transform: scale(0);
        opacity: 1;
      }
      to {
        transform: scale(2);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Drag and Drop Visual Feedback
  function initDragDropFeedback() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;

    ['dragenter', 'dragover'].forEach(event => {
      uploadArea.addEventListener(event, (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(event => {
      uploadArea.addEventListener(event, (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
      });
    });
  }

  // Smooth Reveal on Scroll
  function initScrollReveal() {
    const elements = document.querySelectorAll('.dashboard-card, .module__visual, .report-item');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  // Magnetic Button Effect
  function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn, .hero__cta--primary, .hero__cta--secondary');
    
    buttons.forEach(button => {
      button.addEventListener('mousemove', (e) => {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = '';
      });
    });
  }

  // Toast Notification System
  window.showToast = function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-weight: 600;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // Initialize all micro-interactions
  function init() {
    initScrollProgress();
    initCounterAnimation();
    addRippleEffect();
    initDragDropFeedback();
    initScrollReveal();
    initMagneticButtons();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
