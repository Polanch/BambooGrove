const carousel = document.getElementById('carousel');
const previousButton = document.querySelector('.carousel-previous button');
const nextButton = document.querySelector('.carousel-next button');
const shopGrid = document.getElementById('shop-grid');
const cartButton = document.getElementById('cart-button');
const cartSection = document.getElementById('cart-section');
const cartCloseButton = document.getElementById('cart-close');
const cartCheckoutButton = document.getElementById('cart-checkout');
const cartItemsContainer = document.getElementById('cart-items');
const cartEmptyState = document.getElementById('cart-empty');
const cartTotalPrice = document.getElementById('cart-total-price');
const cartBadge = document.getElementById('cart-badge');

const cartColorOptions = ['Sand Brown', 'Honey Brown', 'Caramel Brown', 'Walnut Brown', 'Cocoa Brown'];
const cartColorMeta = {
	'Sand Brown': { label: 'Sand Brown', className: 'is-sand-brown' },
	'Honey Brown': { label: 'Honey Brown', className: 'is-honey-brown' },
	'Caramel Brown': { label: 'Caramel Brown', className: 'is-caramel-brown' },
	'Walnut Brown': { label: 'Walnut Brown', className: 'is-walnut-brown' },
	'Cocoa Brown': { label: 'Cocoa Brown', className: 'is-cocoa-brown' }
};

let slides = [];
let currentSlide = 0;
let autoPlayTimer;
let touchStartX = 0;
let carouselInitialized = false;
let cart = loadCartFromStorage();
let allProducts = [];
let carouselItems = [];

function loadCartFromStorage() {
	try {
		const savedCart = localStorage.getItem('bamboo-grove-cart');
		return savedCart ? normalizeLoadedCart(JSON.parse(savedCart)) : [];
	} catch (error) {
		console.error('Error loading cart from storage:', error);
		return [];
	}
}

function saveCartToStorage() {
	try {
		localStorage.setItem('bamboo-grove-cart', JSON.stringify(cart));
	} catch (error) {
		console.error('Error saving cart to storage:', error);
	}
}

function normalizeCartItem(item) {
	return {
		...item,
		source: item.source || 'shop',
		sourceIndex: Number.isInteger(item.sourceIndex) ? item.sourceIndex : 0,
		color: cartColorOptions.includes(item.color) ? item.color : getDefaultCartColor()
	};
}

function normalizeLoadedCart(items) {
	if (!Array.isArray(items)) {
		return [];
	}

	return items.map(normalizeCartItem);
}

function getCartItemKey(item) {
	return `${item.source || 'shop'}:${item.sourceIndex ?? 0}:${item.color || cartColorOptions[0]}`;
}

function getDefaultCartColor() {
	return cartColorOptions[0];
}

function findMatchingCartItem(source, sourceIndex, color) {
	return cart.find((cartItem) => cartItem.source === source
		&& cartItem.sourceIndex === sourceIndex
		&& cartItem.color === color);
}

function formatPrice(value) {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return '0.00';
	}
	return value.toFixed(2);
}

function updateCarouselPosition() {
	if (!carousel || slides.length === 0) {
		return;
	}

	carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function moveToSlide(index) {
	const total = slides.length;
	if (total === 0) {
		return;
	}

	currentSlide = (index + total) % total;
	updateCarouselPosition();
}

function startAutoPlay() {
	stopAutoPlay();
	autoPlayTimer = window.setInterval(() => {
		moveToSlide(currentSlide + 1);
	}, 5000);
}

function stopAutoPlay() {
	if (!autoPlayTimer) {
		return;
	}
	window.clearInterval(autoPlayTimer);
	autoPlayTimer = null;
}

function renderCarousel(items) {
	if (!carousel) {
		return;
	}

	if (!Array.isArray(items) || items.length === 0) {
		carousel.innerHTML = '';
		slides = [];
		return;
	}

	carousel.innerHTML = items.map((item, index) => {
		const slideLayout = item.layout === 'right' ? 'slide-right' : 'slide-left';

		return `
			<li class="${slideLayout}">
				<img src="${item.image}" class="carousel-image" alt="${item.alt || item.name}">
				<div class="carousel-info">
					<h2 class="carousel-title">${item.nameJa || item.name}</h2>
					<h3 class="carousel-subtitle">${item.name}</h3>
					<p class="carousel-description">${item.description}</p>
					<div class="carousel-buttons">
						<button class="carousel-button carousel-buy-btn" type="button" data-carousel-index="${index}"><img src="resources/images/cart.png" class="buy-cart"> Buy now</button>
						<button class="carousel-button" type="button">More info</button>
					</div>
				</div>
			</li>
		`;
	}).join('');

	slides = Array.from(carousel.querySelectorAll('li'));
	currentSlide = 0;
	updateCarouselPosition();
	initializeCarouselControls();
	initializeCarouselBuyButtons();
}

function initializeCarouselControls() {
	if (!carousel || slides.length === 0 || carouselInitialized) {
		return;
	}

	carouselInitialized = true;

	previousButton?.addEventListener('click', () => {
		moveToSlide(currentSlide - 1);
		startAutoPlay();
	});

	nextButton?.addEventListener('click', () => {
		moveToSlide(currentSlide + 1);
		startAutoPlay();
	});

	carousel.addEventListener('mouseenter', stopAutoPlay);
	carousel.addEventListener('mouseleave', startAutoPlay);

	carousel.addEventListener('touchstart', (event) => {
		touchStartX = event.touches[0].clientX;
	}, { passive: true });

	carousel.addEventListener('touchend', (event) => {
		const touchEndX = event.changedTouches[0].clientX;
		const deltaX = touchEndX - touchStartX;

		if (Math.abs(deltaX) < 45) {
			return;
		}

		if (deltaX < 0) {
			moveToSlide(currentSlide + 1);
		} else {
			moveToSlide(currentSlide - 1);
		}

		startAutoPlay();
	}, { passive: true });

	window.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowLeft') {
			moveToSlide(currentSlide - 1);
			startAutoPlay();
		}

		if (event.key === 'ArrowRight') {
			moveToSlide(currentSlide + 1);
			startAutoPlay();
		}
	});

	startAutoPlay();
}

function renderShopProducts(products) {
	if (!shopGrid) {
		return;
	}

	if (!Array.isArray(products) || products.length === 0) {
		shopGrid.innerHTML = '<p class="shop-empty">No products available yet.</p>';
		return;
	}

	shopGrid.innerHTML = products.map((product, index) => `
		<article class="product-card">
			<div class="product-image-wrap">
				<img class="product-image" src="${product.image}" alt="${product.alt || product.name}">
			</div>
			<div class="product-body">
				<p class="product-brand">${product.nameJa || product.brand || product.name}</p>
				<h3 class="product-title">${product.name}</h3>
				<p class="product-description">${product.description}</p>
				<div class="product-footer">
					<span class="product-price"><span class="currency-symbol">₱</span>${formatPrice(product.price)}</span>
					<button class="product-button" type="button" data-product-index="${index}">Add to cart</button>
				</div>
			</div>
		</article>
	`).join('');

	initializeShopAddToCartButtons();
}

function showCartAlert(productName) {
	alert(`✓ ${productName} added to cart`);
}

function addCarouselItemToCart(carouselIndex) {
	if (!Array.isArray(carouselItems) || !carouselItems[carouselIndex]) {
		console.warn('Carousel item not found');
		return;
	}

	const item = carouselItems[carouselIndex];
	const selectedColor = getDefaultCartColor();
	const existingItem = findMatchingCartItem('carousel', carouselIndex, selectedColor);

	if (existingItem) {
		existingItem.quantity += 1;
	} else {
		cart.push({
			name: item.name,
			image: item.image,
			price: item.price,
			source: 'carousel',
			sourceIndex: carouselIndex,
			color: selectedColor,
			quantity: 1
		});
	}

	showCartAlert(item.name);
	updateCartDisplay();
	saveCartToStorage();
}

function addToCart(productIndex) {
	if (!Array.isArray(allProducts) || !allProducts[productIndex]) {
		console.warn('Product not found');
		return;
	}

	const product = allProducts[productIndex];
	const selectedColor = getDefaultCartColor();
	const existingItem = findMatchingCartItem('shop', productIndex, selectedColor);

	if (existingItem) {
		existingItem.quantity += 1;
	} else {
		cart.push({
			name: product.name,
			image: product.image,
			price: product.price,
			source: 'shop',
			sourceIndex: productIndex,
			color: selectedColor,
			quantity: 1
		});
	}

	showCartAlert(product.name);
	updateCartDisplay();
	saveCartToStorage();
}

function removeFromCart(itemKey) {
	cart = cart.filter((item) => getCartItemKey(item) !== itemKey);
	updateCartDisplay();
	saveCartToStorage();
}

function updateCartQuantity(itemKey, newQuantity) {
	const item = cart.find((cartItem) => getCartItemKey(cartItem) === itemKey);
	if (!item) {
		return;
	}

	if (newQuantity <= 0) {
		removeFromCart(itemKey);
	} else {
		item.quantity = newQuantity;
		updateCartDisplay();
		saveCartToStorage();
	}
}

function updateCartColor(itemKey, newColor) {
	const item = cart.find((cartItem) => getCartItemKey(cartItem) === itemKey);
	if (!item) {
		return;
	}

	const desiredColor = cartColorOptions.includes(newColor) ? newColor : getDefaultCartColor();
	const duplicateItem = cart.find((cartItem) => cartItem !== item
		&& cartItem.source === item.source
		&& cartItem.sourceIndex === item.sourceIndex
		&& cartItem.color === desiredColor);

	if (duplicateItem) {
		duplicateItem.quantity += item.quantity;
		cart = cart.filter((cartItem) => cartItem !== item);
	} else {
		item.color = desiredColor;
	}

	updateCartDisplay();
	saveCartToStorage();
}

function updateCartDisplay() {
	const hasItems = cart.length > 0;
	const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

	if (cartBadge) {
		cartBadge.textContent = totalQuantity;
		cartBadge.style.display = totalQuantity > 0 ? 'flex' : 'none';
	}

	if (!hasItems) {
		cartItemsContainer.innerHTML = '';
		cartEmptyState.style.display = 'flex';
		cartTotalPrice.innerHTML = '<span class="currency-symbol">₱</span>0.00';
		return;
	}

	cartEmptyState.style.display = 'none';

	cartItemsContainer.innerHTML = cart.map((item) => `
		<div class="cart-item">
			<img src="${item.image}" alt="${item.name}" class="cart-item-image">
			<div class="cart-item-details">
				<p class="cart-item-name">${item.name}</p>
				<div class="cart-color-label">
					<span class="cart-color-title">Color</span>
					<div class="cart-color-radios" role="radiogroup" aria-label="Choose color for ${item.name}">
						${cartColorOptions.map((color) => {
							const colorMeta = cartColorMeta[color];
							const itemKey = getCartItemKey(item);
							const radioId = `${itemKey}-${color.replace(/\s+/g, '-').toLowerCase()}`;

							return `
								<label class="cart-color-option ${colorMeta.className}" for="${radioId}" title="${colorMeta.label}">
									<input
										type="radio"
										name="color-${itemKey}"
										id="${radioId}"
										value="${color}"
										aria-label="${colorMeta.label}"
										${item.color === color ? 'checked' : ''}
									/>
									<span class="cart-color-swatch" aria-hidden="true"></span>
									<span class="sr-only">${colorMeta.label}</span>
								</label>
							`;
						}).join('')}
					</div>
				</div>
				<span class="cart-item-price"><span class="currency-symbol">₱</span>${formatPrice(item.price * item.quantity)}</span>
				<div class="cart-item-controls">
					<div class="cart-quantity">
						<button data-action="decrease" data-name="${getCartItemKey(item)}">−</button>
						<span>${item.quantity}</span>
						<button data-action="increase" data-name="${getCartItemKey(item)}">+</button>
					</div>
					<button class="cart-remove" data-action="remove" data-name="${getCartItemKey(item)}">Remove</button>
				</div>
			</div>
		</div>
	`).join('');

	const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
	cartTotalPrice.innerHTML = `<span class="currency-symbol">₱</span>${formatPrice(totalPrice)}`;

	cartItemsContainer.querySelectorAll('.cart-item-controls button').forEach((button) => {
		button.addEventListener('click', (event) => {
			event.stopPropagation();
			const action = event.target.dataset.action;
			const itemKey = event.target.dataset.name;
			const item = cart.find((cartItem) => getCartItemKey(cartItem) === itemKey);

			if (!item) {
				return;
			}

			if (action === 'increase') {
				updateCartQuantity(itemKey, item.quantity + 1);
			} else if (action === 'decrease') {
				updateCartQuantity(itemKey, item.quantity - 1);
			} else if (action === 'remove') {
				removeFromCart(itemKey);
			}
		});
	});

	cartItemsContainer.querySelectorAll('.cart-color-option input[type="radio"]').forEach((radio) => {
		radio.addEventListener('change', (event) => {
			event.stopPropagation();
			const itemKey = event.target.name.replace(/^color-/, '');
			updateCartColor(itemKey, event.target.value);
		});
	});
}

function initializeShopAddToCartButtons() {
	const addToCartButtons = shopGrid.querySelectorAll('.product-button');
	addToCartButtons.forEach((button) => {
		button.addEventListener('click', (event) => {
			const productIndex = parseInt(event.currentTarget.dataset.productIndex, 10);
			addToCart(productIndex);
		});
	});
}

function initializeCarouselBuyButtons() {
	const carouselBuyButtons = carousel.querySelectorAll('.carousel-buy-btn');
	carouselBuyButtons.forEach((button) => {
		button.addEventListener('click', (event) => {
			event.stopPropagation();
			const carouselIndex = parseInt(event.currentTarget.dataset.carouselIndex, 10);
			addCarouselItemToCart(carouselIndex);
		});
	});
}

function toggleCart() {
	cartSection.classList.toggle('active');
}

function closeCart() {
	cartSection.classList.remove('active');
}

async function loadPageData() {
	try {
		const response = await fetch('products.json');
		if (!response.ok) {
			throw new Error(`Failed to load products: ${response.status}`);
		}

		const data = await response.json();
		carouselItems = Array.isArray(data.carousel) ? data.carousel : [];
		const shopProducts = Array.isArray(data.shopItems) ? data.shopItems : [];

		allProducts = shopProducts;
		renderCarousel(carouselItems);
		renderShopProducts(shopProducts);
		updateCartDisplay();
	} catch (error) {
		renderCarousel([]);
		renderShopProducts([]);
		console.error(error);
	}
}

loadPageData();

if (cartButton) {
	cartButton.addEventListener('click', toggleCart);
}

if (cartCloseButton) {
	cartCloseButton.addEventListener('click', closeCart);
}

if (cartCheckoutButton) {
	cartCheckoutButton.addEventListener('click', () => {
		if (cart.length === 0) {
			alert('Your cart is empty!');
			return;
		}

		const orderTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
		alert(`Order placed successfully.\n\nTotal: ₱${formatPrice(orderTotal)}`);
		cart = [];
		saveCartToStorage();
		updateCartDisplay();
		closeCart();
	});
}

document.addEventListener('click', (event) => {
	if (!cartSection || !cartButton) {
		return;
	}

	if (!cartSection.contains(event.target) && !cartButton.contains(event.target)) {
		if (cartSection.classList.contains('active')) {
			closeCart();
		}
	}
});
