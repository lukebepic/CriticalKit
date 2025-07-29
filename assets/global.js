/* Critical Kit - Global JavaScript */

class CriticalKit {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeComponents();
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.onDOMReady();
      });
    } else {
      this.onDOMReady();
    }
  }

  onDOMReady() {
    this.initMobileMenu();
    this.initStickyHeader();
    this.setupAccessibility();
    this.initLazyLoading();
  }

  setupEventListeners() {
    // Handle escape key for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Handle clicks outside modals
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.closeAllModals();
      }
    });
  }

  initializeComponents() {
    // Initialize any components that need setup
    this.setupFormValidation();
    this.initTooltips();
  }

  initMobileMenu() {
    const mobileToggle = document.querySelector('.header__mobile-toggle');
    const mobileNav = document.querySelector('.header__nav');

    if (mobileToggle && mobileNav) {
      mobileToggle.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        mobileToggle.setAttribute('aria-expanded', 
          mobileNav.classList.contains('active') ? 'true' : 'false'
        );
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.header__nav') && !e.target.closest('.header__mobile-toggle')) {
          mobileNav.classList.remove('active');
          mobileToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  initStickyHeader() {
    const header = document.querySelector('.header');
    if (!header || !window.settings?.sticky_header) return;

    let lastScrollY = window.scrollY;
    let isSticky = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 100 && !isSticky) {
        header.classList.add('sticky');
        isSticky = true;
        document.body.style.paddingTop = header.offsetHeight + 'px';
      } else if (currentScrollY <= 100 && isSticky) {
        header.classList.remove('sticky');
        isSticky = false;
        document.body.style.paddingTop = '0';
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', this.throttle(handleScroll, 16));
  }

  setupAccessibility() {
    // Enhanced focus management
    this.setupFocusTrapping();
    this.setupSkipLinks();
    this.improveKeyboardNavigation();
  }

  setupFocusTrapping() {
    const modals = document.querySelectorAll('[role="dialog"]');
    
    modals.forEach(modal => {
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          this.trapFocus(e, modal);
        }
      });
    });
  }

  trapFocus(e, container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }

  setupSkipLinks() {
    const skipLinks = document.querySelectorAll('.skip-to-content-link');
    
    skipLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  improveKeyboardNavigation() {
    // Add keyboard support for dropdowns and custom elements
    const dropdownToggles = document.querySelectorAll('[aria-haspopup="true"]');
    
    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle.click();
        }
      });
    });
  }

  initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        img.src = img.dataset.src;
        img.classList.remove('lazy');
      });
    }
  }

  setupFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        if (!this.validateForm(form)) {
          e.preventDefault();
        }
      });

      // Real-time validation
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.addEventListener('blur', () => {
          this.validateField(input);
        });
      });
    });
  }

  validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  validateField(field) {
    const value = field.value.trim();
    const isRequired = field.hasAttribute('required');
    const type = field.getAttribute('type');
    let isValid = true;
    let message = '';

    // Remove existing error
    this.clearFieldError(field);

    // Required validation
    if (isRequired && !value) {
      isValid = false;
      message = 'This field is required.';
    }

    // Email validation
    if (type === 'email' && value && !this.isValidEmail(value)) {
      isValid = false;
      message = 'Please enter a valid email address.';
    }

    // Phone validation
    if (type === 'tel' && value && !this.isValidPhone(value)) {
      isValid = false;
      message = 'Please enter a valid phone number.';
    }

    if (!isValid) {
      this.showFieldError(field, message);
    }

    return isValid;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  showFieldError(field, message) {
    field.classList.add('error');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
  }

  clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  initTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    
    tooltipTriggers.forEach(trigger => {
      trigger.addEventListener('mouseenter', () => {
        this.showTooltip(trigger);
      });
      
      trigger.addEventListener('mouseleave', () => {
        this.hideTooltip(trigger);
      });
    });
  }

  showTooltip(element) {
    const text = element.getAttribute('data-tooltip');
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
    
    tooltip.classList.add('visible');
  }

  hideTooltip(element) {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  closeAllModals() {
    const modals = document.querySelectorAll('.modal.active, .cart-drawer.active, .search-modal.active');
    modals.forEach(modal => {
      modal.classList.remove('active');
    });
    
    const overlays = document.querySelectorAll('.modal-overlay.active, .cart-drawer__overlay.active');
    overlays.forEach(overlay => {
      overlay.classList.remove('active');
    });
    
    document.body.classList.remove('modal-open');
  }

  // Utility functions
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  debounce(func, wait, immediate) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  // Show loading state
  showLoading(element) {
    element.classList.add('loading');
    element.setAttribute('aria-busy', 'true');
  }

  hideLoading(element) {
    element.classList.remove('loading');
    element.setAttribute('aria-busy', 'false');
  }

  // Show notification
  showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    const container = document.querySelector('.notification-container') || this.createNotificationContainer();
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('visible'), 10);
    
    // Auto remove
    setTimeout(() => {
      notification.classList.remove('visible');
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
  }

  // Format price
  formatPrice(cents, currency = 'USD') {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Handle fetch errors
  async handleFetch(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Fetch error:', error);
      this.showNotification('Something went wrong. Please try again.', 'error');
      throw error;
    }
  }
}

// Initialize the Critical Kit app
window.CriticalKit = new CriticalKit();

// Make utilities available globally
window.ck = {
  throttle: window.CriticalKit.throttle.bind(window.CriticalKit),
  debounce: window.CriticalKit.debounce.bind(window.CriticalKit),
  showLoading: window.CriticalKit.showLoading.bind(window.CriticalKit),
  hideLoading: window.CriticalKit.hideLoading.bind(window.CriticalKit),
  showNotification: window.CriticalKit.showNotification.bind(window.CriticalKit),
  formatPrice: window.CriticalKit.formatPrice.bind(window.CriticalKit),
  handleFetch: window.CriticalKit.handleFetch.bind(window.CriticalKit)
};