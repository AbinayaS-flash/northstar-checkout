'use strict';

const PRODUCTS = Object.freeze({
  mug: Object.freeze({ id: 'mug', name: 'Studio Ceramic Mug', price: 499 }),
  tote: Object.freeze({ id: 'tote', name: 'Everyday Canvas Tote', price: 799 }),
});
const cart = new Map();
let orderPlaced = false;
let confirmationCount = 0;

const elements = {
  cartLines: document.querySelector('#cart-lines'),
  cartCount: document.querySelector('#cart-count'),
  subtotal: document.querySelector('#subtotal'),
  orderTotal: document.querySelector('#order-total'),
  form: document.querySelector('#checkout-form'),
  name: document.querySelector('#customer-name'),
  nameError: document.querySelector('#name-error'),
  formError: document.querySelector('#form-error'),
  placeOrder: document.querySelector('#place-order'),
  confirmation: document.querySelector('#confirmation'),
  confirmationCopy: document.querySelector('#confirmation-copy'),
  orderReference: document.querySelector('#order-reference'),
};
const money = amount => `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const quantityTotal = () => [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
const orderTotal = () => [...cart.values()].reduce((sum, item) => sum + item.quantity * item.price, 0);

function renderCart() {
  const entries = [...cart.values()];
  elements.cartCount.textContent = `${quantityTotal()} ${quantityTotal() === 1 ? 'item' : 'items'}`;
  elements.subtotal.textContent = money(orderTotal());
  elements.orderTotal.textContent = money(orderTotal());
  if (!entries.length) {
    elements.cartLines.innerHTML = '<p class="empty-cart">Your cart is taking a little breather.<br />Add something lovely to get started.</p>';
    return;
  }
  elements.cartLines.replaceChildren();
  entries.forEach(item => {
    const line = document.createElement('div');
    line.className = 'cart-line';
    const details = document.createElement('div');
    const title = document.createElement('div'); title.className = 'line-title'; title.textContent = item.name;
    const unit = document.createElement('div'); unit.className = 'line-unit'; unit.textContent = `${money(item.price)} each`;
    details.append(title, unit);
    const right = document.createElement('div'); right.className = 'line-right';
    const total = document.createElement('div'); total.className = 'line-total'; total.textContent = money(item.price * item.quantity);
    const controls = document.createElement('div'); controls.className = 'quantity-controls';
    const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Decrease ${item.name} quantity`); minus.dataset.change = item.id; minus.dataset.delta = '-1';
    const quantity = document.createElement('output'); quantity.textContent = item.quantity; quantity.setAttribute('aria-label', `${item.name} quantity`);
    const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Increase ${item.name} quantity`); plus.dataset.change = item.id; plus.dataset.delta = '1';
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-button'; remove.textContent = 'Remove'; remove.dataset.remove = item.id; remove.setAttribute('aria-label', `Remove ${item.name}`);
    controls.append(minus, quantity, plus, remove); right.append(total, controls); line.append(details, right); elements.cartLines.append(line);
  });
}

function addItem(id) {
  if (orderPlaced) return;
  const product = PRODUCTS[id];
  if (!product) return;
  const current = cart.get(id);
  cart.set(id, { ...product, quantity: current ? current.quantity + 1 : 1 });
  renderCart();
}

document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => addItem(button.dataset.add)));
elements.cartLines.addEventListener('click', event => {
  if (orderPlaced) return;
  const change = event.target.closest('[data-change]');
  const remove = event.target.closest('[data-remove]');
  if (remove) cart.delete(remove.dataset.remove);
  if (change) {
    const item = cart.get(change.dataset.change);
    if (item) {
      const next = item.quantity + Number(change.dataset.delta);
      if (next <= 0) cart.delete(item.id); else cart.set(item.id, { ...item, quantity: next });
    }
  }
  renderCart();
});

elements.name.addEventListener('input', () => {
  if (elements.name.value.trim()) {
    elements.nameError.hidden = true;
    elements.name.removeAttribute('aria-invalid');
  }
  elements.formError.hidden = true;
});

function createReference() {
  // Local demo reference; no server or external service is contacted.
  return `NS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

elements.form.addEventListener('submit', event => {
  event.preventDefault();
  if (orderPlaced) return;
  const name = elements.name.value.trim();
  const hasItems = cart.size > 0;
  elements.nameError.hidden = Boolean(name);
  elements.name.toggleAttribute('aria-invalid', !name);
  elements.formError.hidden = hasItems;
  if (!hasItems) elements.formError.textContent = 'Your cart is empty. Add at least one item before placing your order.';
  if (!hasItems || !name) {
    if (!name) elements.name.focus();
    return;
  }

  // Set the guard before showing confirmation so rapid repeat submits cannot duplicate it.
  orderPlaced = true;
  confirmationCount += 1;
  elements.placeOrder.disabled = true;
  elements.placeOrder.textContent = 'Order placed';
  elements.confirmationCopy.textContent = `Thank you, ${name}. Your order has been received.`;
  elements.orderReference.textContent = createReference();
  elements.confirmation.hidden = false;
  elements.confirmation.dataset.confirmationCount = String(confirmationCount);
  document.querySelectorAll('[data-add]').forEach(button => { button.disabled = true; });
  elements.cartLines.querySelectorAll('button').forEach(button => { button.disabled = true; });
});

renderCart();
