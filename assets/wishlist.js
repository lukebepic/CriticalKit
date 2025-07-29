/* Critical Kit - Wishlist Functionality */

class Wishlist {
  constructor() {
    this.storageKey = 'criticalkit_wishlist';
    this.items = this.getStoredWishlist();
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateUI();
    this.setupHeartbeatSync();
  }

  bindEvents() {
    // Wishlist toggle buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.wishlist-btn, .wishlist-btn *')) {
        e.preventDefault();
        const button = e.target.closest('.wishlist-btn');
        this.toggleItem(button);
      }

      if (e.target.matches('.add-to-wishlist, .add-to-wishlist *')) {
        e.preventDefault();
        const button = e.target.closest('.add-to-wishlist');
        this.toggleItem(button);
      }

      // Wishlist modal toggle
      if (e.target.matches('[data-wishlist-toggle]')) {
        e.preventDefault();
        this.toggleModal();
      }

      // Remove from wishlist
      if (e.target.matches('.wishlist-remove, .wishlist-remove *')) {
        e.preventDefault();
        const button = e.target.closest('.wishlist-remove');
        const productId = button.dataset.productId;
        this.removeItem(productId);
      }

      // Close wishlist modal
      if (e.target.matches('.wishlist-modal__close, .wishlist-modal__overlay')) {
        this.closeModal();
      }
    });

    // Listen for cart updates to sync data
    document.addEventListener('cart:updated', () => {
      this.updateUI();
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  getStoredWishlist() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading wishlist:', error);
      return [];
    }
  }

  saveWishlist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
      this.dispatchWishlistEvent();
    } catch (error) {
      console.error('Error saving wishlist:', error);
    }
  }

  async toggleItem(button) {
    const productId = button.dataset.productId;
    if (!productId) return;

    const isInWishlist = this.hasItem(productId);
    
    if (isInWishlist) {
      this.removeItem(productId);
    } else {
      await this.addItem(productId, button);
    }
  }

  async addItem(productId, button = null) {
    if (this.hasItem(productId)) return;

    try {
      // Show loading state
      if (button) {
        ck.showLoading(button);
      }

      // Fetch product data
      const productData = await this.fetchProductData(productId);
      
      if (productData) {
        this.items.push({
          id: productId,
          title: productData.title,
          handle: productData.handle,
          price: productData.price,
          compare_at_price: productData.compare_at_price,
          available: productData.available,
          featured_image: productData.featured_image,
          vendor: productData.vendor,
          tags: productData.tags,
          created_at: Date.now()
        });

        this.saveWishlist();
        this.updateUI();
        
        ck.showNotification(`${productData.title} added to wishlist!`, 'success');
      }

    } catch (error) {
      console.error('Error adding to wishlist:', error);
      ck.showNotification('Failed to add item to wishlist. Please try again.', 'error');
    } finally {
      if (button) {
        ck.hideLoading(button);
      }
    }
  }

  removeItem(productId) {
    const itemIndex = this.items.findIndex(item => item.id === productId);
    
    if (itemIndex > -1) {
      const item = this.items[itemIndex];
      this.items.splice(itemIndex, 1);
      this.saveWishlist();
      this.updateUI();
      
      ck.showNotification(`${item.title} removed from wishlist`, 'info');
    }
  }

  hasItem(productId) {
    return this.items.some(item => item.id === productId);
  }

  async fetchProductData(productId) {
    try {
      const response = await fetch(`/products/${productId}.js`);
      if (!response.ok) throw new Error('Product not found');
      return await response.json();
    } catch (error) {
      console.error('Error fetching product data:', error);
      return null;
    }
  }

  updateUI() {
    this.updateWishlistButtons();
    this.updateWishlistCount();
    this.updateWishlistModal();
  }

  updateWishlistButtons() {
    const buttons = document.querySelectorAll('.wishlist-btn, .add-to-wishlist');
    
    buttons.forEach(button => {
      const productId = button.dataset.productId;
      const isInWishlist = this.hasItem(productId);
      
      button.classList.toggle('active', isInWishlist);
      button.setAttribute('aria-pressed', isInWishlist.toString());
      
      // Update button text for add-to-wishlist buttons
      if (button.classList.contains('add-to-wishlist')) {
        const textSpan = button.querySelector('.btn-text') || button;
        textSpan.textContent = isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist';
      }
      
      // Update aria-label
      const productTitle = button.closest('[data-product-title]')?.dataset.productTitle || 'item';
      const action = isInWishlist ? 'Remove from' : 'Add to';
      button.setAttribute('aria-label', `${action} wishlist: ${productTitle}`);
    });
  }

  updateWishlistCount() {
    const countElements = document.querySelectorAll('[data-wishlist-count]');
    const count = this.items.length;
    
    countElements.forEach(element => {
      element.textContent = count;
      element.style.display = count > 0 ? 'block' : 'none';
    });
  }

  updateWishlistModal() {
    const modal = document.querySelector('.wishlist-modal');
    if (!modal) return;

    const content = modal.querySelector('.wishlist-modal__content');
    if (!content) return;

    if (this.items.length === 0) {
      content.innerHTML = this.renderEmptyWishlist();
    } else {
      content.innerHTML = this.renderWishlistItems();
    }
  }

  renderEmptyWishlist() {
    return `
      <div class="wishlist-empty">
        <div class="wishlist-empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </div>
        <h3 class="wishlist-empty-title">Your wishlist is empty</h3>
        <p class="wishlist-empty-description">Start adding items you love to your wishlist so you can easily find them later!</p>
        <a href="/collections/all" class="btn btn-primary">Discover Products</a>
      </div>
    `;
  }

  renderWishlistItems() {
    const itemsHtml = this.items.map(item => `
      <div class="wishlist-item" data-product-id="${item.id}">
        <div class="wishlist-item__image">
          ${item.featured_image 
            ? `<img src="${item.featured_image}" alt="${item.title}" loading="lazy">`
            : `<div class="wishlist-item__placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </div>`
          }
        </div>
        <div class="wishlist-item__details">
          <h4 class="wishlist-item__title">
            <a href="/products/${item.handle}">${item.title}</a>
          </h4>
          ${item.vendor ? `<div class="wishlist-item__vendor">${item.vendor}</div>` : ''}
          <div class="wishlist-item__price">
            ${item.compare_at_price && item.compare_at_price > item.price 
              ? `<span class="price-sale">${ck.formatPrice(item.price)}</span>
                 <span class="price-original">${ck.formatPrice(item.compare_at_price)}</span>`
              : `<span class="price-current">${ck.formatPrice(item.price)}</span>`
            }
          </div>
          <div class="wishlist-item__actions">
            ${item.available 
              ? `<button class="btn btn-primary btn-sm add-to-cart-from-wishlist" data-product-id="${item.id}">
                   Add to Cart
                 </button>`
              : `<button class="btn btn-secondary btn-sm" disabled>Sold Out</button>`
            }
            <button class="btn btn-secondary btn-sm wishlist-remove" data-product-id="${item.id}">
              Remove
            </button>
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="wishlist-header">
        <h3>My Wishlist (${this.items.length})</h3>
        <button class="btn btn-secondary btn-sm clear-wishlist">Clear All</button>
      </div>
      <div class="wishlist-items">
        ${itemsHtml}
      </div>
    `;
  }

  toggleModal() {
    const modal = document.querySelector('.wishlist-modal');
    const overlay = document.querySelector('.wishlist-modal__overlay');
    
    if (modal && overlay) {
      const isOpen = modal.classList.contains('active');
      
      if (isOpen) {
        this.closeModal();
      } else {
        this.openModal();
      }
    } else {
      this.createModal();
      this.openModal();
    }
  }

  openModal() {
    const modal = document.querySelector('.wishlist-modal');
    const overlay = document.querySelector('.wishlist-modal__overlay');
    
    if (modal && overlay) {
      modal.classList.add('active');
      overlay.classList.add('active');
      document.body.classList.add('modal-open');
      
      // Focus first focusable element
      const firstButton = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstButton) {
        firstButton.focus();
      }
    }
  }

  closeModal() {
    const modal = document.querySelector('.wishlist-modal');
    const overlay = document.querySelector('.wishlist-modal__overlay');
    
    if (modal && overlay) {
      modal.classList.remove('active');
      overlay.classList.remove('active');
      document.body.classList.remove('modal-open');
    }
  }

  createModal() {
    if (document.querySelector('.wishlist-modal')) return;

    const modalHtml = `
      <div class="wishlist-modal" role="dialog" aria-labelledby="wishlist-modal-title" aria-modal="true">
        <div class="wishlist-modal__header">
          <h2 id="wishlist-modal-title">Wishlist</h2>
          <button class="wishlist-modal__close" aria-label="Close wishlist">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="wishlist-modal__content"></div>
      </div>
      <div class="wishlist-modal__overlay"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.updateWishlistModal();
  }

  async addToCartFromWishlist(productId) {
    try {
      // Find the product in wishlist
      const item = this.items.find(item => item.id === productId);
      if (!item) return;

      // Fetch current product data to get variants
      const productData = await this.fetchProductData(productId);
      if (!productData || !productData.available) {
        ck.showNotification('This item is no longer available', 'error');
        return;
      }

      // Add to cart using the first available variant
      const firstAvailableVariant = productData.variants.find(variant => variant.available);
      if (!firstAvailableVariant) {
        ck.showNotification('This item is currently out of stock', 'error');
        return;
      }

      // Use the global cart functionality
      await ck.cart.add(firstAvailableVariant.id, 1);
      
    } catch (error) {
      console.error('Error adding to cart from wishlist:', error);
      ck.showNotification('Failed to add item to cart', 'error');
    }
  }

  clearWishlist() {
    if (this.items.length === 0) return;
    
    if (confirm('Are you sure you want to clear your entire wishlist?')) {
      this.items = [];
      this.saveWishlist();
      this.updateUI();
      ck.showNotification('Wishlist cleared', 'info');
    }
  }

  setupHeartbeatSync() {
    // Sync wishlist data across tabs
    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey) {
        this.items = this.getStoredWishlist();
        this.updateUI();
      }
    });
  }

  dispatchWishlistEvent() {
    const event = new CustomEvent('wishlist:updated', {
      detail: {
        items: this.items,
        count: this.items.length
      }
    });
    document.dispatchEvent(event);
  }

  // Public API methods
  getItems() {
    return this.items;
  }

  getCount() {
    return this.items.length;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  exportWishlist() {
    const data = {
      items: this.items,
      exported_at: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `critical-kit-wishlist-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Initialize wishlist
window.wishlist = new Wishlist();

// Make it available globally
window.ck.wishlist = {
  add: window.wishlist.addItem.bind(window.wishlist),
  remove: window.wishlist.removeItem.bind(window.wishlist),
  toggle: window.wishlist.toggleItem.bind(window.wishlist),
  has: window.wishlist.hasItem.bind(window.wishlist),
  clear: window.wishlist.clearWishlist.bind(window.wishlist),
  open: window.wishlist.openModal.bind(window.wishlist),
  close: window.wishlist.closeModal.bind(window.wishlist),
  getItems: window.wishlist.getItems.bind(window.wishlist),
  getCount: window.wishlist.getCount.bind(window.wishlist),
  isEmpty: window.wishlist.isEmpty.bind(window.wishlist),
  export: window.wishlist.exportWishlist.bind(window.wishlist)
};

// Handle additional events after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Handle add to cart from wishlist
  document.addEventListener('click', (e) => {
    if (e.target.matches('.add-to-cart-from-wishlist')) {
      e.preventDefault();
      const productId = e.target.dataset.productId;
      window.wishlist.addToCartFromWishlist(productId);
    }

    if (e.target.matches('.clear-wishlist')) {
      e.preventDefault();
      window.wishlist.clearWishlist();
    }
  });
});