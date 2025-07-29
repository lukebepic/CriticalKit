/* Critical Kit - Magical Effects */

class MagicalEffects {
  constructor() {
    this.enabled = document.documentElement.classList.contains('magical-effects-enabled');
    this.particles = [];
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    
    if (this.enabled) {
      this.init();
    }
  }

  init() {
    this.createCanvas();
    this.bindEvents();
    this.startAnimation();
    this.addSparkleEffects();
    this.initializeDiceAnimations();
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'magical-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 1;
      opacity: 0.6;
    `;
    
    this.ctx = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    // Add sparkle effects on hover
    document.addEventListener('mouseover', (e) => {
      if (e.target.matches('.magical-glow, .btn-primary, .product-card')) {
        this.createSparkle(e.pageX, e.pageY);
      }
    });

    // Add particles on click
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn-primary, .magical-glow')) {
        this.createBurst(e.pageX, e.pageY);
      }
    });

    // Dice roll animation on add to cart
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn-add-to-cart, .btn-add-to-cart *')) {
        const button = e.target.closest('.btn-add-to-cart');
        this.animateDiceRoll(button);
      }
    });
  }

  createSparkle(x, y) {
    for (let i = 0; i < 3; i++) {
      const particle = {
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1,
        decay: 0.02,
        size: Math.random() * 3 + 1,
        color: this.getRandomColor(),
        type: 'sparkle'
      };
      this.particles.push(particle);
    }
  }

  createBurst(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      
      const particle = {
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.015,
        size: Math.random() * 4 + 2,
        color: this.getRandomColor(),
        type: 'burst'
      };
      this.particles.push(particle);
    }
  }

  getRandomColor() {
    const colors = [
      '#d4af37', // Gold
      '#1a365d', // Deep Blue
      '#a0aec0', // Silver
      '#ffffff', // White
      '#ffd700'  // Bright Gold
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Apply gravity
      particle.vy += 0.1;
      
      // Fade out
      particle.life -= particle.decay;
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawParticles() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles.forEach(particle => {
      this.ctx.save();
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = particle.color;
      
      if (particle.type === 'sparkle') {
        // Draw star shape
        this.drawStar(particle.x, particle.y, particle.size);
      } else {
        // Draw circle
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    });
  }

  drawStar(x, y, size) {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    
    this.ctx.beginPath();
    
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i / (spikes * 2)) * Math.PI * 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      
      if (i === 0) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }
    
    this.ctx.closePath();
    this.ctx.fill();
  }

  startAnimation() {
    const animate = () => {
      this.updateParticles();
      this.drawParticles();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  addSparkleEffects() {
    // Add random ambient sparkles
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every interval
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        this.createSparkle(x, y);
      }
    }, 2000);
  }

  animateDiceRoll(button) {
    // Create dice icon and animate it
    const dice = document.createElement('div');
    dice.className = 'dice-roll-animation';
    dice.innerHTML = '⚀'; // Dice character
    
    dice.style.cssText = `
      position: absolute;
      font-size: 2rem;
      color: var(--color-accent);
      pointer-events: none;
      z-index: 1000;
      animation: diceRoll 1s ease-out forwards;
    `;
    
    const rect = button.getBoundingClientRect();
    dice.style.left = rect.left + rect.width / 2 - 16 + 'px';
    dice.style.top = rect.top + rect.height / 2 - 16 + 'px';
    
    document.body.appendChild(dice);
    
    // Animate through different dice faces
    const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    let currentFace = 0;
    
    const faceInterval = setInterval(() => {
      dice.innerHTML = diceFaces[currentFace];
      currentFace = (currentFace + 1) % diceFaces.length;
    }, 100);
    
    // Clean up after animation
    setTimeout(() => {
      clearInterval(faceInterval);
      dice.innerHTML = diceFaces[Math.floor(Math.random() * diceFaces.length)];
      
      setTimeout(() => {
        if (dice.parentNode) {
          dice.parentNode.removeChild(dice);
        }
      }, 500);
    }, 800);
  }

  initializeDiceAnimations() {
    // Add CSS for dice animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes diceRoll {
        0% {
          transform: scale(1) rotate(0deg);
          opacity: 1;
        }
        50% {
          transform: scale(1.5) rotate(180deg);
          opacity: 0.8;
        }
        100% {
          transform: scale(1) rotate(360deg) translateY(-50px);
          opacity: 0;
        }
      }
      
      .dice-roll-animation {
        text-shadow: 0 0 10px var(--color-accent);
      }
    `;
    document.head.appendChild(style);
  }

  // Floating elements effect
  createFloatingElements() {
    const elements = document.querySelectorAll('.product-card, .collection-card');
    
    elements.forEach((element, index) => {
      // Add subtle floating animation with different delays
      element.style.animation = `float 6s ease-in-out infinite`;
      element.style.animationDelay = `${index * 0.5}s`;
    });
  }

  // Page transition effects
  addPageTransitions() {
    // Fade in effect for main content
    const mainContent = document.getElementById('MainContent');
    if (mainContent) {
      mainContent.style.opacity = '0';
      mainContent.style.transform = 'translateY(20px)';
      mainContent.style.transition = 'all 0.6s ease-out';
      
      setTimeout(() => {
        mainContent.style.opacity = '1';
        mainContent.style.transform = 'translateY(0)';
      }, 100);
    }
  }

  // Glow effect for buttons
  addGlowEffects() {
    const buttons = document.querySelectorAll('.btn-primary, .magical-glow');
    
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        if (Math.random() < 0.3) { // 30% chance
          this.createGlowPulse(button);
        }
      });
    });
  }

  createGlowPulse(element) {
    const rect = element.getBoundingClientRect();
    const glow = document.createElement('div');
    
    glow.style.cssText = `
      position: absolute;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      border-radius: inherit;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%);
      pointer-events: none;
      z-index: -1;
      animation: glowPulse 1s ease-out forwards;
    `;
    
    document.body.appendChild(glow);
    
    setTimeout(() => {
      if (glow.parentNode) {
        glow.parentNode.removeChild(glow);
      }
    }, 1000);
  }

  // Scroll reveal effects
  initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          
          // Add sparkle effect when element is revealed
          if (Math.random() < 0.2) { // 20% chance
            const rect = entry.target.getBoundingClientRect();
            this.createSparkle(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2
            );
          }
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe elements that should have reveal effects
    const revealElements = document.querySelectorAll(
      '.product-card, .collection-card, .blog-card, .section-title'
    );
    
    revealElements.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'all 0.6s ease-out';
      observer.observe(el);
    });

    // Add CSS for revealed state
    const style = document.createElement('style');
    style.textContent = `
      .revealed {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
      
      @keyframes glowPulse {
        0% {
          opacity: 0;
          transform: scale(0.8);
        }
        50% {
          opacity: 1;
          transform: scale(1.1);
        }
        100% {
          opacity: 0;
          transform: scale(1);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Cursor trail effect
  initCursorTrail() {
    let trail = [];
    const trailLength = 5;

    document.addEventListener('mousemove', (e) => {
      trail.push({ x: e.clientX, y: e.clientY, time: Date.now() });
      
      if (trail.length > trailLength) {
        trail.shift();
      }
      
      // Occasionally create sparkle at cursor
      if (Math.random() < 0.02) { // 2% chance
        this.createSparkle(e.clientX, e.clientY);
      }
    });
  }

  // Cleanup method
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Initialize magical effects
document.addEventListener('DOMContentLoaded', function() {
  window.magicalEffects = new MagicalEffects();
});

// Additional magical enhancements
document.addEventListener('DOMContentLoaded', function() {
  // Add magical hover effects to product cards
  const productCards = document.querySelectorAll('.product-card');
  
  productCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      if (window.magicalEffects && window.magicalEffects.enabled) {
        // Add subtle glow animation
        this.style.boxShadow = '0 10px 30px rgba(212, 175, 55, 0.3)';
        this.style.transform = 'translateY(-8px) scale(1.02)';
      }
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.boxShadow = '';
      this.style.transform = '';
    });
  });

  // Animate section titles on scroll
  const titles = document.querySelectorAll('.section-title, h1, h2');
  titles.forEach(title => {
    title.style.backgroundImage = 'linear-gradient(45deg, var(--color-primary), var(--color-accent))';
    title.style.backgroundClip = 'text';
    title.style.webkitBackgroundClip = 'text';
    title.style.color = 'transparent';
    title.style.backgroundSize = '200% 200%';
    title.style.animation = 'gradientShift 4s ease infinite';
  });

  // Add gradient animation CSS
  const gradientStyle = document.createElement('style');
  gradientStyle.textContent = `
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;
  document.head.appendChild(gradientStyle);
});

// Export for use in other modules
window.MagicalEffects = MagicalEffects;