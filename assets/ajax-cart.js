/* Critical Kit - AJAX Cart */

class AjaxCart {
  constructor() {
    this.cart = null;
    this.isUpdating = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.initializeCart();
  }

  bindEvents() {
    // Add to cart buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn-add-to-cart, .btn-add-to-cart *')) {
        e.preventDefault();
        const button = e.target.closest('.btn-add-to-cart');
        this.addToCart(button);
      }
    });

    // Cart drawer events
    document.addEventListener('click', (e) => {
      // Open cart drawer
      if (e.target.matches('.header__cart, .header__cart *')) {
        e.preventDefault();
        this.openDrawer();
      }

      // Close cart drawer
      if (e.target.matches('.cart-drawer__close, .cart-drawer__overlay')) {
        this.closeDrawer();
      }

      // Update quantity
      if (e.target.matches('.cart-item__quantity-btn')) {
        e.preventDefault();
        this.updateQuantity(e.target);
      }

      // Remove item
      if (e.target.matches('.cart-item__remove, .cart-item__remove *')) {
        e.preventDefault();
        const button = e.target.closest('.cart-item__remove');
        this.removeItem(button);
      }
    });

    // Quantity input changes
    document.addEventListener('change', (e) => {
      if (e.target.matches('.cart-item__quantity-input')) {
        this.updateQuantityFromInput(e.target);
      }
    });

    // Form submissions for product forms
    document.addEventListener('submit', (e) => {
      if (e.target.matches('.product-form')) {
        e.preventDefault();
        this.addToCartFromForm(e.target);
      }
    });
  }

  async initializeCart() {
    try {
      this.cart = await this.getCart();
      this.updateCartUI();
      this.updateCartCount();
    } catch (error) {
      console.error('Error initializing cart:', error);
    }
  }

  async getCart() {
    try {
      const response = await fetch('/cart.js');
      if (!response.ok) throw new Error('Failed to fetch cart');
      return await response.json();
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  }

  async addToCart(button) {
    if (this.isUpdating) return;

    const form = button.closest('form') || button.closest('[data-product-form]');
    const formData = new FormData(form);
    
    // Get quantity and variant ID
    const quantity = parseInt(formData.get('quantity') || '1');
    const variantId = formData.get('id');

    if (!variantId) {
      ck.showNotification('Please select a product variant.', 'error');
      return;
    }

    this.isUpdating = true;
    ck.showLoading(button);

    try {
      // Add item to cart
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          id: variantId,
          quantity: quantity,
          properties: this.getLineItemProperties(formData)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.description || 'Failed to add item to cart');
      }

      const item = await response.json();
      
      // Refresh cart data
      this.cart = await this.getCart();
      this.updateCartUI();
      this.updateCartCount();
      
      // Show success message
      ck.showNotification(`${item.product_title} was added to your cart!`, 'success');
      
      // Open cart drawer if setting is enabled
      if (window.settings?.cart_type === 'drawer') {
        this.openDrawer();
      }

      // Trigger cart update event
      this.triggerCartUpdate(item);

    } catch (error) {
      console.error('Error adding to cart:', error);
      ck.showNotification(error.message || 'Failed to add item to cart. Please try again.', 'error');
    } finally {
      this.isUpdating = false;
      ck.hideLoading(button);
    }
  }

  async addToCartFromForm(form) {
    const formData = new FormData(form);
    const addButton = form.querySelector('.btn-add-to-cart');
    
    if (addButton) {
      await this.addToCart(addButton);
    }
  }

  getLineItemProperties(formData) {
    const properties = {};
    
    // Get any custom properties from the form
    for (let [key, value] of formData.entries()) {
      if (key.startsWith('properties[') && key.endsWith(']')) {
        const propName = key.slice(11, -1); // Remove 'properties[' and ']'
        properties[propName] = value;
      }
    }
    
    return Object.keys(properties).length > 0 ? properties : undefined;
  }

  async updateQuantity(button) {
    if (this.isUpdating) return;

    const action = button.dataset.action;
    const cartItem = button.closest('.cart-item');
    const variantId = cartItem.dataset.variantId;
    const currentQuantity = parseInt(cartItem.querySelector('.cart-item__quantity-input').value);
    
    let newQuantity = currentQuantity;
    if (action === 'increase') {
      newQuantity += 1;
    } else if (action === 'decrease') {
      newQuantity = Math.max(0, currentQuantity - 1);
    }

    await this.changeItemQuantity(variantId, newQuantity);
  }

  async updateQuantityFromInput(input) {
    if (this.isUpdating) return;

    const cartItem = input.closest('.cart-item');
    const variantId = cartItem.dataset.variantId;
    const newQuantity = Math.max(0, parseInt(input.value) || 0);

    await this.changeItemQuantity(variantId, newQuantity);
  }

  async changeItemQuantity(variantId, quantity) {
    if (this.isUpdating) return;

    this.isUpdating = true;
    const cartItem = document.querySelector(`[data-variant-id="${variantId}"]`);
    
    if (cartItem) {
      ck.showLoading(cartItem);
    }

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          id: variantId,
          quantity: quantity
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update cart');
      }

      this.cart = await response.json();
      this.updateCartUI();
      this.updateCartCount();

      // Show notification for removals
      if (quantity === 0) {
        ck.showNotification('Item removed from cart', 'info');
      }

      this.triggerCartUpdate();

    } catch (error) {
      console.error('Error updating cart:', error);
      ck.showNotification(error.message || 'Failed to update cart. Please try again.', 'error');
    } finally {
      this.isUpdating = false;
      if (cartItem) {
        ck.hideLoading(cartItem);
      }
    }
  }

  async removeItem(button) {
    const cartItem = button.closest('.cart-item');
    const variantId = cartItem.dataset.variantId;
    
    await this.changeItemQuantity(variantId, 0);
  }

  updateCartUI() {
    const cartDrawer = document.querySelector('.cart-drawer');
    if (!cartDrawer) return;

    const cartContent = cartDrawer.querySelector('.cart-drawer__content');
    const cartFooter = cartDrawer.querySelector('.cart-drawer__footer');

    if (this.cart.item_count === 0) {
      cartContent.innerHTML = '<div class="cart-drawer__empty">Your cart is empty</div>';
      cartFooter.style.display = 'none';
    } else {
      cartContent.innerHTML = this.renderCartItems();
      cartFooter.style.display = 'block';
      this.updateCartSubtotal();
    }
  }

  renderCartItems() {
    return this.cart.items.map(item => `
      <div class="cart-item" data-variant-id="${item.variant_id}">
        <div class="cart-item__image">
          <img src="${item.featured_image?.url || ''}" alt="${item.product_title}" loading="lazy">
        </div>
        <div class="cart-item__details">
          <div class="cart-item__title">${item.product_title}</div>
          ${item.variant_title && item.variant_title !== 'Default Title' ? `<div class="cart-item__variant">${item.variant_title}</div>` : ''}
          <div class="cart-item__price">${ck.formatPrice(item.final_line_price)}</div>
          <div class="cart-item__quantity">
            <button class="cart-item__quantity-btn" data-action="decrease" aria-label="Decrease quantity">−</button>
            <input type="number" class="cart-item__quantity-input" value="${item.quantity}" min="0" aria-label="Quantity">
            <button class="cart-item__quantity-btn" data-action="increase" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="cart-item__remove" aria-label="Remove ${item.product_title}">×</button>
      </div>
    `).join('');
  }

  updateCartSubtotal() {
    const subtotalElement = document.querySelector('.cart-drawer__subtotal .price');
    if (subtotalElement && this.cart) {
      subtotalElement.textContent = ck.formatPrice(this.cart.total_price);
    }
  }

  updateCartCount() {
    const countElements = document.querySelectorAll('.header__cart-count, [data-cart-count]');
    const count = this.cart ? this.cart.item_count : 0;
    
    countElements.forEach(element => {
      element.textContent = count;
      element.style.display = count > 0 ? 'block' : 'none';
    });

    // Update cart button text
    const cartButtons = document.querySelectorAll('[data-cart-text]');
    cartButtons.forEach(button => {
      const text = count > 0 ? `Cart (${count})` : 'Cart';
      button.textContent = text;
    });
  }

  openDrawer() {
    const drawer = document.querySelector('.cart-drawer');
    const overlay = document.querySelector('.cart-drawer__overlay');
    
    if (drawer && overlay) {
      drawer.classList.add('active');
      overlay.classList.add('active');
      document.body.classList.add('modal-open');
      
      // Focus first focusable element
      const firstButton = drawer.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstButton) {
        firstButton.focus();
      }
    }
  }

  closeDrawer() {
    const drawer = document.querySelector('.cart-drawer');
    const overlay = document.querySelector('.cart-drawer__overlay');
    
    if (drawer && overlay) {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
      document.body.classList.remove('modal-open');
    }
  }

  triggerCartUpdate(item = null) {
    // Dispatch custom event for other components to listen to
    const event = new CustomEvent('cart:updated', {
      detail: {
        cart: this.cart,
        item: item
      }
    });
    document.dispatchEvent(event);
  }

  // Public API methods
  getCartData() {
    return this.cart;
  }

  async refreshCart() {
    try {
      this.cart = await this.getCart();
      this.updateCartUI();
      this.updateCartCount();
      this.triggerCartUpdate();
    } catch (error) {
      console.error('Error refreshing cart:', error);
    }
  }

  isCartEmpty() {
    return !this.cart || this.cart.item_count === 0;
  }

  getItemCount() {
    return this.cart ? this.cart.item_count : 0;
  }

  getTotalPrice() {
    return this.cart ? this.cart.total_price : 0;
  }

  // Utility method to add multiple items at once
  async addMultipleItems(items) {
    if (this.isUpdating) return;

    this.isUpdating = true;

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add items to cart');
      }

      this.cart = await this.getCart();
      this.updateCartUI();
      this.updateCartCount();
      this.triggerCartUpdate();

      ck.showNotification('Items added to cart successfully!', 'success');

    } catch (error) {
      console.error('Error adding multiple items:', error);
      ck.showNotification(error.message || 'Failed to add items to cart.', 'error');
    } finally {
      this.isUpdating = false;
    }
  }

  // Clear entire cart
  async clearCart() {
    if (this.isUpdating) return;
    
    this.isUpdating = true;

    try {
      const response = await fetch('/cart/clear.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      this.cart = await response.json();
      this.updateCartUI();
      this.updateCartCount();
      this.triggerCartUpdate();

      ck.showNotification('Cart cleared', 'info');

    } catch (error) {
      console.error('Error clearing cart:', error);
      ck.showNotification('Failed to clear cart. Please try again.', 'error');
    } finally {
      this.isUpdating = false;
    }
  }
}

// Initialize AJAX Cart
window.ajaxCart = new AjaxCart();

// Make it available globally
window.ck.cart = {
  add: window.ajaxCart.addToCart.bind(window.ajaxCart),
  update: window.ajaxCart.changeItemQuantity.bind(window.ajaxCart),
  remove: window.ajaxCart.removeItem.bind(window.ajaxCart),
  clear: window.ajaxCart.clearCart.bind(window.ajaxCart),
  open: window.ajaxCart.openDrawer.bind(window.ajaxCart),
  close: window.ajaxCart.closeDrawer.bind(window.ajaxCart),
  refresh: window.ajaxCart.refreshCart.bind(window.ajaxCart),
  getData: window.ajaxCart.getCartData.bind(window.ajaxCart),
  isEmpty: window.ajaxCart.isCartEmpty.bind(window.ajaxCart),
  getCount: window.ajaxCart.getItemCount.bind(window.ajaxCart),
  getTotal: window.ajaxCart.getTotalPrice.bind(window.ajaxCart)
};