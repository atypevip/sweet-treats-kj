/* ============ SWEET TREATS BY KJ — box builder build ============ */

/* Karlie's WhatsApp number — full international format, digits only.
   A UK mobile 07123 456789 becomes 447123456789 (drop the leading 0, prefix 44). */
const WHATSAPP_NUMBER = '447958558523';                 // Karlie's WhatsApp (07958 558523)
const WHATSAPP_READY = !/^4400000/.test(WHATSAPP_NUMBER);

/* ---------- Menu data (from the printed menu) ---------- */
const MENU = {
  classic: {
    label: 'Classic Cookies',
    sizes: { 4: 10, 6: 14, 8: 18, 10: 20 },
    note: "No centre filling · Galaxy, Cadbury's & Milky Bar",
    items: [
      { id: 'milk',   name: 'Milk Chocolate' },
      { id: 'white',  name: 'White Chocolate' },
      { id: 'triple', name: 'Triple Chocolate' },
    ],
  },
  signature: {
    label: 'Signature Cookies',
    sizes: { 2: 12, 4: 20, 6: 28, 8: 35 },
    note: 'With a creamy centre & toppings',
    items: [
      { id: 'biscoff',  name: 'Biscoff Bliss',          desc: 'Biscoff cream centre' },
      { id: 'bueno',    name: 'Kinder Bueno Heaven',    desc: 'Hazelnut cream centre' },
      { id: 'oreo',     name: 'Cookies & Cream',        desc: 'Oreo cream centre' },
      { id: 'milkybar', name: 'Milky Bar Magic',        desc: 'Milky Bar cream centre' },
      { id: 'fudge',    name: 'Triple Chocolate Fudge', desc: 'Nutella centre' },
      { id: 'nutty',    name: "Pistachio 'The Nutty One'", desc: 'Pistachio cream centre' },
    ],
  },
  cyo: {
    label: 'Create Your Own',
    sizes: { 2: 10, 4: 20, 6: 30, 8: 40 },
    note: 'One sauce & one topping included · extras +£1 each',
    bases: ['Milk Chocolate', 'White Chocolate', 'Triple Chocolate'],
    centres: ['None', 'Biscoff Cream', 'Cookies & Cream', 'Milky Bar Cream', 'Nutella', 'Pistachio Cream'],
    sauces: ['Nutella', 'Biscoff', 'Pistachio', 'Kinder', 'Milky Bar'],
    toppings: ['Milk Chocolate Chunks', 'White Chocolate Chunks', 'Biscoff Pieces', 'Oreo Pieces', 'Pistachio Nuts'],
    extraCost: 1,
  },
};

const gbp = n => '£' + n.toFixed(2);

/* ---------- Scroll engine: parallax + progress + craft steps ---------- */
const hero = document.getElementById('hero');
const heroContent = document.getElementById('heroContent');
const coins = [...document.querySelectorAll('.coin')];
const progressBar = document.getElementById('progress');
const craft = document.getElementById('craft');
const craftPanels = [...document.querySelectorAll('.craft-panel')];

let mouseX = 0, mouseY = 0;

window.addEventListener('pointermove', e => {
  mouseX = (e.clientX / innerWidth) * 2 - 1;
  mouseY = (e.clientY / innerHeight) * 2 - 1;
}, { passive: true });

function applyScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';

  const heroScrollable = Math.max(1, hero.offsetHeight - innerHeight);
  const p = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / heroScrollable));

  const z = p * 200;
  const fade = p < 0.7 ? 1 : Math.max(0, 1 - (p - 0.7) / 0.26);
  heroContent.style.transform = `translateZ(${z}px)`;
  heroContent.style.opacity = fade;

  coins.forEach(c => {
    const depth = parseFloat(c.dataset.depth);
    const ty = -p * 300 * depth;
    const tx = mouseX * 26 * depth;
    const my = mouseY * 18 * depth;
    c.style.transform = `translate3d(${tx}px, ${ty + my}px, 0) rotate(var(--r))`;
  });

  const cRect = craft.getBoundingClientRect();
  const cScrollable = craft.offsetHeight - innerHeight;
  const cp = Math.min(1, Math.max(0, -cRect.top / cScrollable));
  const step = cRect.top > 0 ? -1 : Math.min(craftPanels.length - 1, Math.floor(cp * craftPanels.length));
  craftPanels.forEach((panel, i) => panel.classList.toggle('active', i === step));
}
window.addEventListener('scroll', applyScroll, { passive: true });
applyScroll();

/* ---------- Reveal + tilt + hover videos ---------- */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('inview'); });
}, { threshold: 0.18 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* 3D tilt only for real hover devices — on touch it fights with scrolling */
const canTilt = matchMedia('(hover: hover) and (pointer: fine)').matches;
document.querySelectorAll('.card, .catalog-card').forEach(card => {
  const inner = card.querySelector('.card-inner');
  if (!canTilt) return;
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    inner.style.transform = `rotateY(${px * 14}deg) rotateX(${py * -12}deg) translateZ(12px)`;
  });
  card.addEventListener('pointerleave', () => { inner.style.transform = ''; });
});

/* ============================================================
   BOX BUILDER
   ============================================================ */
const builderScrim = document.getElementById('builderScrim');
const builderBody = document.getElementById('builderBody');
const builderTitle = document.getElementById('builderTitle');
const builderStepsEl = document.getElementById('builderSteps');
const builderPrice = document.getElementById('builderPrice');
const builderBack = document.getElementById('builderBack');
const builderNext = document.getElementById('builderNext');

let B = null; // builder state

function stepsFor(catalog) {
  return catalog === 'cyo'
    ? ['Box size', 'Cookie dough', 'Centre piece', 'Sauce', 'Topping', 'Review']
    : ['Box size', 'Fill your box', 'Review'];
}

function openBuilder(catalog) {
  const sizes = Object.keys(MENU[catalog].sizes);
  B = {
    catalog, step: 0,
    size: null,
    mix: {},                          // classic/signature: id -> count
    base: null, centre: 'None',       // cyo
    sauces: [], toppings: [],
  };
  builderTitle.textContent = MENU[catalog].label.toUpperCase();
  builderScrim.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderBuilder();
}

function closeBuilder() {
  builderScrim.classList.remove('open');
  document.body.style.overflow = '';
  B = null;
}

function boxPrice() {
  if (!B || !B.size) return 0;
  let p = MENU[B.catalog].sizes[B.size];
  if (B.catalog === 'cyo') {
    p += Math.max(0, B.sauces.length - 1) * MENU.cyo.extraCost;
    p += Math.max(0, B.toppings.length - 1) * MENU.cyo.extraCost;
  }
  return p;
}

function mixCount() { return Object.values(B.mix).reduce((s, n) => s + n, 0); }

function chip(label, cls, attrs = '') {
  return `<button type="button" class="chip ${cls}" ${attrs}>${label}</button>`;
}

function renderBuilder() {
  const steps = stepsFor(B.catalog);
  const stepName = steps[B.step];
  builderStepsEl.innerHTML = steps.map((s, i) =>
    `<span class="${i === B.step ? 'on' : i < B.step ? 'done' : ''}">${i + 1}. ${s}</span>`).join(' · ');
  builderPrice.textContent = gbp(boxPrice());
  builderBack.style.visibility = B.step === 0 ? 'hidden' : 'visible';

  const cat = MENU[B.catalog];
  let html = '';
  let canNext = false;

  if (stepName === 'Box size') {
    html = `<p class="builder-note">${cat.note}</p><div class="chip-row">` +
      Object.entries(cat.sizes).map(([n, p]) =>
        chip(`Box of ${n} — ${gbp(p)}`, B.size == n ? 'active' : '', `data-size="${n}"`)).join('') + '</div>';
    canNext = !!B.size;
  }

  else if (stepName === 'Fill your box') {
    const total = mixCount();
    html = `<p class="builder-note">Pick any mix — <strong id="fillCount">${total} of ${B.size}</strong> cookies chosen.</p>
      <div class="mix-list">` + cat.items.map(it => `
        <div class="mix-row">
          <div class="mix-info"><strong>${it.name}</strong>${it.desc ? `<span>${it.desc}</span>` : ''}</div>
          <div class="mix-ctrl">
            <button type="button" class="mix-btn" data-mix="${it.id}" data-d="-1" ${!B.mix[it.id] ? 'disabled' : ''}>−</button>
            <span class="mix-n">${B.mix[it.id] || 0}</span>
            <button type="button" class="mix-btn" data-mix="${it.id}" data-d="1" ${total >= B.size ? 'disabled' : ''}>+</button>
          </div>
        </div>`).join('') + '</div>';
    canNext = total === Number(B.size);
  }

  else if (stepName === 'Cookie dough') {
    html = `<p class="builder-note">All ${B.size} cookies share one dough.</p><div class="chip-row">` +
      cat.bases.map(b => chip(b, B.base === b ? 'active' : '', `data-base="${b}"`)).join('') + '</div>';
    canNext = !!B.base;
  }

  else if (stepName === 'Centre piece') {
    html = `<p class="builder-note">Optional creamy centre — or keep it classic with none.</p><div class="chip-row">` +
      cat.centres.map(c => chip(c, B.centre === c ? 'active' : '', `data-centre="${c}"`)).join('') + '</div>';
    canNext = true;
  }

  else if (stepName === 'Sauce') {
    html = `<p class="builder-note">Choose ONE sauce — each extra sauce +£1.</p><div class="chip-row">` +
      cat.sauces.map(s => chip(s, B.sauces.includes(s) ? 'active' : '', `data-sauce="${s}"`)).join('') + '</div>';
    canNext = B.sauces.length >= 1;
  }

  else if (stepName === 'Topping') {
    html = `<p class="builder-note">Choose ONE topping — each extra topping +£1.</p><div class="chip-row">` +
      cat.toppings.map(t => chip(t, B.toppings.includes(t) ? 'active' : '', `data-topping="${t}"`)).join('') + '</div>';
    canNext = B.toppings.length >= 1;
  }

  else if (stepName === 'Review') {
    html = `<div class="review"><h4>Box of ${B.size} · ${cat.label}</h4><ul>` +
      boxLines().map(l => `<li>${l}</li>`).join('') +
      `</ul><p class="builder-note">Classic and Signature cookies never share a box — this one's all ${cat.label.toLowerCase()}.</p></div>`;
    canNext = true;
  }

  builderBody.innerHTML = html;
  builderNext.textContent = stepName === 'Review' ? 'ADD BOX TO CART 🍪' : 'NEXT →';
  builderNext.disabled = !canNext;
}

function boxLines() {
  const cat = MENU[B.catalog];
  if (B.catalog === 'cyo') {
    const lines = [`${B.base} dough`];
    if (B.centre !== 'None') lines.push(`${B.centre} centre`);
    lines.push(`Sauce: ${B.sauces.join(', ')}${B.sauces.length > 1 ? ` (+${gbp((B.sauces.length - 1) * 1)})` : ''}`);
    lines.push(`Topping: ${B.toppings.join(', ')}${B.toppings.length > 1 ? ` (+${gbp((B.toppings.length - 1) * 1)})` : ''}`);
    return lines;
  }
  return cat.items.filter(it => B.mix[it.id]).map(it => `${B.mix[it.id]}× ${it.name}`);
}

builderBody.addEventListener('click', e => {
  const el = e.target.closest('button');
  if (!el) return;
  if (el.dataset.size) B.size = el.dataset.size;
  else if (el.dataset.mix) {
    const id = el.dataset.mix, d = Number(el.dataset.d);
    B.mix[id] = Math.max(0, (B.mix[id] || 0) + d);
    if (!B.mix[id]) delete B.mix[id];
  }
  else if (el.dataset.base) B.base = el.dataset.base;
  else if (el.dataset.centre) B.centre = el.dataset.centre;
  else if (el.dataset.sauce) {
    const s = el.dataset.sauce;
    B.sauces = B.sauces.includes(s) ? B.sauces.filter(x => x !== s) : [...B.sauces, s];
  }
  else if (el.dataset.topping) {
    const t = el.dataset.topping;
    B.toppings = B.toppings.includes(t) ? B.toppings.filter(x => x !== t) : [...B.toppings, t];
  }
  else return;
  renderBuilder();
});

builderNext.addEventListener('click', () => {
  const steps = stepsFor(B.catalog);
  if (steps[B.step] === 'Review') {
    addToCart({
      catalog: MENU[B.catalog].label,
      size: B.size,
      price: boxPrice(),
      lines: boxLines(),
    });
    closeBuilder();
    return;
  }
  // when size changes invalidate overfull mix
  if (steps[B.step] === 'Box size' && mixCount() > Number(B.size)) B.mix = {};
  B.step++;
  renderBuilder();
});
builderBack.addEventListener('click', () => { if (B.step > 0) { B.step--; renderBuilder(); } });
document.getElementById('builderClose').addEventListener('click', closeBuilder);
builderScrim.addEventListener('click', e => { if (e.target === builderScrim) closeBuilder(); });

document.querySelectorAll('.start-box').forEach(btn =>
  btn.addEventListener('click', () => openBuilder(btn.dataset.catalog)));

/* ============================================================
   CART + CHECKOUT
   ============================================================ */
const cart = [];
const drawer = document.getElementById('drawer');
const scrim = document.getElementById('drawerScrim');
const views = { cart: document.getElementById('viewCart'), checkout: document.getElementById('viewCheckout'), success: document.getElementById('viewSuccess') };

function showView(name) {
  Object.entries(views).forEach(([k, el]) => el.hidden = k !== name);
  document.getElementById('drawerTitle').innerHTML =
    name === 'cart' ? 'YOUR&nbsp;BOXES' : name === 'checkout' ? 'CHECKOUT' : 'ORDER&nbsp;PLACED';
}

function openDrawer(view = 'cart') { showView(view); drawer.classList.add('open'); scrim.classList.add('open'); }
function closeDrawer() { drawer.classList.remove('open'); scrim.classList.remove('open'); }
document.getElementById('cartBtn').addEventListener('click', () => openDrawer('cart'));
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
scrim.addEventListener('click', closeDrawer);

function addToCart(box) {
  cart.push(box);
  renderCart();
  toast(`Box of ${box.size} ${box.catalog} added 🍪`);
  openDrawer('cart');
}
function removeFromCart(i) { cart.splice(i, 1); renderCart(); }

function cartTotal() { return cart.reduce((s, b) => s + b.price, 0); }

function renderCart() {
  const wrap = document.getElementById('drawerItems');
  document.getElementById('cartCount').textContent = cart.length;
  if (!cart.length) {
    wrap.innerHTML = '<p class="drawer-empty">No boxes yet. Go build one — the cookies are waiting.</p>';
  } else {
    wrap.innerHTML = cart.map((b, i) => `
      <div class="drawer-item box-item">
        <div class="di-info">
          <span class="di-name">BOX OF ${b.size} · ${b.catalog.toUpperCase()}</span>
          <span class="di-size">${b.lines.join(' · ')}</span>
        </div>
        <div class="di-right">
          <span class="di-price">${gbp(b.price)}</span>
          <button class="di-remove" data-i="${i}" aria-label="Remove box">✕</button>
        </div>
      </div>`).join('');
    wrap.querySelectorAll('.di-remove').forEach(b =>
      b.addEventListener('click', () => removeFromCart(+b.dataset.i)));
  }
  document.getElementById('drawerTotal').textContent = gbp(cartTotal());
  document.getElementById('checkoutTotal').textContent = gbp(cartTotal());
}

/* ---- checkout ---- */
let fulfilMode = 'collection';
document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (!cart.length) { toast('Build a box first 🍪'); return; }
  showView('checkout');
});

document.querySelectorAll('.fulfil-opt').forEach(btn => btn.addEventListener('click', () => {
  fulfilMode = btn.dataset.mode;
  document.querySelectorAll('.fulfil-opt').forEach(b => b.classList.toggle('active', b === btn));
  document.getElementById('deliveryFields').hidden = fulfilMode !== 'delivery';
  document.getElementById('fulfilNote').textContent = fulfilMode === 'delivery'
    ? 'Local delivery within a 3-mile radius of Bexleyheath, subject to availability.'
    : 'Collection from Bexleyheath — exact address shared when your box is confirmed.';
}));

function buildOrderMessage(ref) {
  const g = id => document.getElementById(id).value.trim();
  const L = [];
  L.push('Hi Karlie! I’d like to place an order with Sweet Treats by KJ 🍪');
  L.push('');
  L.push(`*Order ${ref}*`);
  L.push('');
  cart.forEach(b => {
    L.push(`📦 Box of ${b.size} — ${b.catalog} (${gbp(b.price)})`);
    b.lines.forEach(line => L.push(`• ${line}`));
    L.push('');
  });
  L.push(`*Total: ${gbp(cartTotal())}*`);
  L.push('');
  L.push(fulfilMode === 'delivery' ? '🚗 Delivery' : '🏠 Collection');
  L.push(`Name: ${g('coName')}`);
  L.push(`Phone: ${g('coPhone')}`);
  if (g('coEmail')) L.push(`Email: ${g('coEmail')}`);
  L.push(`Preferred date: ${g('coDate')}`);
  if (fulfilMode === 'delivery') {
    L.push(`Address: ${g('coAddress')}`);
    L.push(`Postcode: ${g('coPostcode')}`);
  }
  if (g('coNotes')) L.push(`Notes: ${g('coNotes')}`);
  return L.join('\n');
}

document.getElementById('placeOrderBtn').addEventListener('click', () => {
  const form = document.getElementById('checkoutForm');
  const need = [document.getElementById('coName'), document.getElementById('coPhone'), document.getElementById('coDate')];
  if (fulfilMode === 'delivery') need.push(document.getElementById('coAddress'), document.getElementById('coPostcode'));
  const missing = need.filter(el => !el.value.trim());
  if (missing.length) {
    missing.forEach(el => el.classList.add('invalid'));
    toast('Fill in the required fields ✍️');
    setTimeout(() => missing.forEach(el => el.classList.remove('invalid')), 1600);
    return;
  }
  const ref = 'ST-' + String(Math.floor(1000 + Math.random() * 9000));
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildOrderMessage(ref))}`;

  document.getElementById('orderRef').textContent = 'ORDER ' + ref;
  document.getElementById('orderSummary').textContent =
    `${cart.length} box${cart.length > 1 ? 'es' : ''} · ${gbp(cartTotal())} · ${fulfilMode === 'delivery' ? 'Delivery' : 'Collection'} on ${document.getElementById('coDate').value} for ${document.getElementById('coName').value}.`;

  // Real in-place links (not window.open) so they work inside the Instagram/Facebook in-app browser too.
  document.getElementById('waSend').href = waUrl;
  document.getElementById('waFallback').href = waUrl;

  cart.length = 0;
  renderCart();
  form.reset();
  showView('success');
});
document.getElementById('successClose').addEventListener('click', closeDrawer);

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- Notify form ---------- */
document.getElementById('notifyForm').addEventListener('submit', e => {
  e.preventDefault();
  document.getElementById('notifyOk').classList.add('show');
  e.target.querySelector('input').value = '';
});
