(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } };
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const listingsKey = 'pawlink-market-listings';
  const cartKey = 'pawlink-market-cart';
  const ordersKey = 'pawlink-market-orders';
  const productImages = {
    food: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc?auto=format&fit=crop&w=900&q=85',
    toy: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=900&q=85',
    carrier: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=900&q=85',
    bowl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc?auto=format&fit=crop&w=900&q=85'
  };
  const dialogs = [...document.querySelectorAll('.shop-dialog')];
  const listingForm = $('#listing-form');
  let editingId = null;
  let previewProduct = null;
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money = (value) => `$${Number(value).toFixed(2)}`;
  const openDialog = (dialog) => { if (!dialog.open) dialog.showModal(); };
  const closeDialog = (dialog) => { if (dialog.open) dialog.close(); };
  const allProducts = () => {
    const products = [...document.querySelectorAll('.shop-card')].map((card) => ({
      id: card.dataset.id, name: card.dataset.name, price: Number(card.dataset.price), description: card.dataset.description,
      image: $('.shop-image', card)?.src || '', category: $('.shop-category', card)?.textContent || 'PET ESSENTIALS',
      rating: $('.shop-rating', card)?.textContent.trim() || '', userCreated: card.dataset.userCreated === 'true'
    }));
    return products;
  };
  const cart = () => read(cartKey, []);
  const updateCartCount = () => {
    const count = cart().reduce((sum, item) => sum + item.quantity, 0);
    $('#cart-count').textContent = count;
    document.querySelectorAll('.cart-count-copy').forEach((el) => { el.textContent = count; });
  };
  const showCart = () => {
    const items = cart();
    const container = $('#cart-items');
    container.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p'); empty.className = 'empty-cart'; empty.textContent = 'Your cart is empty. Browse the shop and add something your pet will love.'; container.append(empty);
    } else {
      const products = allProducts();
      items.forEach((item) => {
        const product = products.find((entry) => entry.id === item.id);
        if (!product || product.userCreated) return;
        const row = document.createElement('article'); row.className = 'cart-item';
        const image = document.createElement('img'); image.src = product.image; image.alt = ''; image.loading = 'lazy';
        const info = document.createElement('div'); info.className = 'cart-item-info';
        const title = document.createElement('strong'); title.textContent = product.name;
        const price = document.createElement('span'); price.textContent = `${money(product.price)} each`;
        const quantity = document.createElement('div'); quantity.className = 'quantity-control';
        const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Decrease ${product.name} quantity`);
        const number = document.createElement('span'); number.textContent = item.quantity;
        const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Increase ${product.name} quantity`);
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'cart-remove'; remove.textContent = 'Remove';
        const change = (delta) => { const next = cart().map((entry) => entry.id === item.id ? {...entry, quantity: entry.quantity + delta} : entry).filter((entry) => entry.quantity > 0); save(cartKey, next); showCart(); updateCartCount(); };
        minus.addEventListener('click', () => change(-1)); plus.addEventListener('click', () => change(1)); remove.addEventListener('click', () => { save(cartKey, cart().filter((entry) => entry.id !== item.id)); showCart(); updateCartCount(); });
        quantity.append(minus, number, plus, remove); info.append(title, price, quantity); row.append(image, info); container.append(row);
      });
    }
    const subtotal = items.reduce((sum, item) => { const product = allProducts().find((entry) => entry.id === item.id && !entry.userCreated); return sum + (product ? product.price * item.quantity : 0); }, 0);
    $('#cart-total').textContent = money(subtotal);
    $('#checkout-open').disabled = !items.length;
  };
  const addToCart = (product) => {
    if (!product || product.userCreated) return;
    const current = cart();
    const existing = current.find((item) => item.id === product.id);
    if (existing) existing.quantity += 1; else current.push({id: product.id, quantity: 1});
    save(cartKey, current); updateCartCount();
  };
  const showPreview = (product) => {
    previewProduct = product;
    $('#preview-image').src = product.image || productImages.food;
    $('#preview-image').alt = product.name;
    $('#preview-category').textContent = product.category;
    $('#preview-name').textContent = product.name;
    $('#preview-rating').textContent = product.rating;
    $('#preview-description').textContent = product.description;
    $('#preview-price').textContent = money(product.price);
    const button = $('#preview-add');
    button.hidden = product.userCreated;
    button.onclick = () => { addToCart(previewProduct); closeDialog($('#preview-dialog')); };
    openDialog($('#preview-dialog'));
  };
  const makeCard = (product) => {
    const card = document.createElement('article'); card.className = 'shop-card';
    card.dataset.id = product.id; card.dataset.name = product.name; card.dataset.price = String(product.price); card.dataset.description = product.description;
    card.dataset.userCreated = product.userCreated ? 'true' : 'false';
    const image = document.createElement('img'); image.className = 'shop-image'; image.src = product.image || productImages.food; image.alt = product.name; image.loading = 'lazy';
    const body = document.createElement('div'); body.className = 'shop-card-body';
    const category = document.createElement('span'); category.className = 'shop-category'; category.textContent = product.category || (product.userCreated ? 'COMMUNITY LISTING' : 'PET ESSENTIALS');
    const heading = document.createElement('h3'); heading.textContent = product.name;
    const price = document.createElement('p'); price.className = 'shop-price'; price.textContent = money(product.price);
    const description = document.createElement('p'); description.className = 'shop-card-description'; description.textContent = product.description;
    const actions = document.createElement('div'); actions.className = 'shop-card-actions';
    const preview = document.createElement('button'); preview.type = 'button'; preview.className = 'button button-secondary preview-button'; preview.textContent = 'View details'; preview.addEventListener('click', () => showPreview(product));
    actions.append(preview);
    if (product.userCreated) {
      const owner = document.createElement('span'); owner.className = 'owner-label'; owner.textContent = 'Your listing';
      const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'button button-secondary edit-listing'; edit.textContent = 'Edit'; edit.addEventListener('click', () => beginEdit(product));
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'button button-danger remove-listing'; remove.textContent = 'Remove'; remove.addEventListener('click', () => {
        if (!window.confirm(`Remove “${product.name}” from your listings? This cannot be undone.`)) return;
        save(listingsKey, read(listingsKey, []).filter((entry) => entry.id !== product.id)); renderListings();
      });
      actions.append(owner, edit, remove);
    } else {
      const add = document.createElement('button'); add.type = 'button'; add.className = 'icon-button add-cart-button'; add.setAttribute('aria-label', `Add ${product.name} to cart`); add.innerHTML = '<i class="fa-solid fa-cart-plus" aria-hidden="true"></i>'; add.addEventListener('click', () => addToCart(product)); actions.append(add);
    }
    body.append(category, heading);
    if (!product.userCreated && product.rating) { const rating = document.createElement('div'); rating.className = 'shop-rating'; const star = document.createElement('i'); star.className = 'fa-solid fa-star'; rating.append(star, document.createTextNode(` ${product.rating}`)); body.append(rating); }
    body.append(price, description, actions); card.append(image, body); return card;
  };
  const renderListings = () => {
    const grid = $('#market-listings');
    const catalog = [...grid.querySelectorAll('.shop-card:not([data-user-created="true"])')].map((card) => ({
      id: card.dataset.id, name: card.dataset.name, price: Number(card.dataset.price), description: card.dataset.description,
      image: $('.shop-image', card)?.src || productImages[card.dataset.photo] || productImages.food,
      category: $('.shop-category', card)?.textContent || 'PET ESSENTIALS',
      rating: $('.shop-rating', card)?.textContent.replace(/^\s*★?\s*/, '').trim() || '', userCreated: false
    }));
    const users = read(listingsKey, []).map((product) => ({...product, userCreated: true}));
    grid.replaceChildren(...[...users, ...catalog].map(makeCard));
  };
  function beginEdit(product) {
    editingId = product.id;
    $('#listing-title').textContent = 'Edit your listing';
    $('.dialog-lead', listingForm).textContent = 'Update your item details. Choose a new photo only if you want to replace the current one.';
    listingForm.elements.name.value = product.name;
    listingForm.elements.price.value = product.price;
    listingForm.elements.description.value = product.description;
    listingForm.elements.image.value = '';
    $('#listing-error').textContent = '';
    $('.dialog-submit', listingForm).textContent = 'Save changes';
    openDialog($('#listing-dialog'));
  }
  const startNewListing = () => {
    editingId = null; listingForm.reset(); $('#listing-title').textContent = 'List an item';
    $('.dialog-lead', listingForm).textContent = 'Add a photo and a few details to share your item.';
    $('.dialog-submit', listingForm).textContent = 'Publish listing'; $('#listing-error').textContent = '';
    openDialog($('#listing-dialog'));
  };
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
  dialogs.forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(dialog); }));
  document.querySelectorAll('.add-listing-open').forEach((button) => button.addEventListener('click', startNewListing));
  document.querySelectorAll('.cart-open').forEach((button) => button.addEventListener('click', () => { showCart(); openDialog($('#cart-dialog')); }));
  $('#checkout-open').addEventListener('click', () => { closeDialog($('#cart-dialog')); $('#checkout-form').reset(); $('#checkout-error').textContent = ''; openDialog($('#checkout-dialog')); });
  listingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const error = $('#listing-error'); error.textContent = '';
    const values = new FormData(listingForm); const file = values.get('image');
    if (file.size && (!file.type.startsWith('image/') || file.size > 900000)) { error.textContent = 'Choose an image smaller than 900 KB.'; return; }
    const finish = (image) => {
      const listings = read(listingsKey, []);
      const old = listings.find((entry) => entry.id === editingId);
      const item = {id: editingId || `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: String(values.get('name')).trim(), price: Number(values.get('price')), description: String(values.get('description')).trim(), image: image || old?.image || '', category: 'COMMUNITY LISTING', userCreated: true};
      if (editingId) save(listingsKey, listings.map((entry) => entry.id === editingId ? item : entry)); else save(listingsKey, [item, ...listings]);
      closeDialog($('#listing-dialog')); renderListings();
    };
    if (file.size) { const reader = new FileReader(); reader.onload = () => finish(String(reader.result)); reader.onerror = () => { error.textContent = 'Could not read that image. Please try another.'; }; reader.readAsDataURL(file); }
    else finish('');
  });
  $('#checkout-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget; const error = $('#checkout-error'); error.textContent = '';
    const cardNumber = form.elements.card.value.replace(/\s/g, '');
    if (!/^\d{12,19}$/.test(cardNumber)) { error.textContent = 'Enter a fictional card number using 12–19 digits.'; return; }
    const items = cart(); if (!items.length) { error.textContent = 'Your cart is empty.'; return; }
    const products = allProducts();
    const orderItems = items.map((item) => { const product = products.find((entry) => entry.id === item.id && !entry.userCreated); return product ? {id: product.id, name: product.name, price: product.price, quantity: item.quantity} : null; }).filter(Boolean);
    if (!orderItems.length) { error.textContent = 'There are no shop items in your cart.'; return; }
    const now = new Date(); const delivery = new Date(now); delivery.setDate(delivery.getDate() + 4);
    const order = {id: `PL-${Date.now().toString().slice(-8)}`, recipient: String(form.elements.recipient.value).trim(), address: String(form.elements.address.value).trim(), items: orderItems, total: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0), placedAt: now.toISOString(), deliveryDate: delivery.toISOString()};
    save(ordersKey, [order, ...read(ordersKey, [])]); save(cartKey, []); updateCartCount(); renderOrders();
    closeDialog($('#checkout-dialog')); $('#success-message').textContent = `Order ${order.id} is confirmed. Your package is scheduled to arrive by ${delivery.toLocaleDateString(undefined, {month: 'long', day: 'numeric'})}.`; openDialog($('#success-dialog'));
    form.reset();
  });
  const renderOrders = () => {
    const orders = read(ordersKey, []); const section = $('#orders-section'); section.hidden = !orders.length;
    const list = $('#orders-list'); list.replaceChildren();
    orders.forEach((order) => {
      const card = document.createElement('article'); card.className = 'order-card';
      const head = document.createElement('div'); head.className = 'order-head'; const title = document.createElement('strong'); title.textContent = `Order ${order.id}`;
      const status = document.createElement('span'); status.className = 'delivery-status'; status.innerHTML = '<i class="fa-solid fa-truck"></i> On the way'; head.append(title, status);
      const detail = document.createElement('p'); detail.textContent = `Delivering to ${order.recipient} · ${order.address}`;
      const contents = document.createElement('p'); contents.textContent = order.items.map((item) => `${item.name} × ${item.quantity}`).join(' · ');
      const delivery = document.createElement('p'); delivery.className = 'delivery-date'; delivery.textContent = `Estimated delivery: ${new Date(order.deliveryDate).toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}`;
      const total = document.createElement('strong'); total.className = 'order-total'; total.textContent = `Order total: ${money(order.total)}`;
      card.append(head, detail, contents, delivery, total); list.append(card);
    });
  };
  $('#theme-toggle').addEventListener('change', (event) => {
    const theme = event.target.checked ? 'dark' : 'light'; document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; localStorage.setItem('pawlink-theme', theme);
  });
  const theme = localStorage.getItem('pawlink-theme') || 'light'; document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; $('#theme-toggle').checked = theme === 'dark';
  renderListings(); updateCartCount(); renderOrders();
})();
