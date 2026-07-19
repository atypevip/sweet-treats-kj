/* ============ SWEET TREATS BY KJ — 3D scroll build ============ */

/* ---------- Scroll engine: scrub + parallax + progress + craft steps ---------- */
const hero = document.getElementById('hero');
const heroVideo = document.getElementById('heroVideo');
const heroContent = document.getElementById('heroContent');
const coins = [...document.querySelectorAll('.coin')];
const progressBar = document.getElementById('progress');
const craft = document.getElementById('craft');
const craftPanels = [...document.querySelectorAll('.craft-panel')];

let targetTime = 0;
let mouseX = 0, mouseY = 0;          // -1 .. 1

window.addEventListener('pointermove', e => {
  mouseX = (e.clientX / innerWidth) * 2 - 1;
  mouseY = (e.clientY / innerHeight) * 2 - 1;
}, { passive: true });

function applyScroll() {
  /* page progress bar */
  const max = document.documentElement.scrollHeight - innerHeight;
  progressBar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';

  /* hero scrub + parallax */
  const heroScrollable = hero.offsetHeight - innerHeight;
  const p = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / heroScrollable));
  if (heroVideo.duration) targetTime = p * (heroVideo.duration - 0.05);
  // rAF is paused in background tabs — snap directly so scrub never dies
  if (document.hidden && heroVideo.duration) heroVideo.currentTime = targetTime;

  // title pushes toward the viewer then fades as the scene ends
  const z = p * 260;
  const fade = p < 0.75 ? 1 : Math.max(0, 1 - (p - 0.75) / 0.22);
  heroContent.style.transform = `translateZ(${z}px)`;
  heroContent.style.opacity = fade;

  // cookie coins drift at their own depths (scroll + mouse)
  coins.forEach(c => {
    const depth = parseFloat(c.dataset.depth);
    const ty = -p * 420 * depth;
    const tx = mouseX * 26 * depth;
    const my = mouseY * 18 * depth;
    c.style.transform = `translate3d(${tx}px, ${ty + my}px, 0) rotate(var(--r))`;
  });

  /* craft: reveal panels in steps */
  const cRect = craft.getBoundingClientRect();
  const cScrollable = craft.offsetHeight - innerHeight;
  const cp = Math.min(1, Math.max(0, -cRect.top / cScrollable));
  const step = cRect.top > 0 ? -1 : Math.min(craftPanels.length - 1, Math.floor(cp * craftPanels.length));
  craftPanels.forEach((panel, i) => panel.classList.toggle('active', i === step));
}
window.addEventListener('scroll', applyScroll, { passive: true });
applyScroll();

(function raf() {
  if (heroVideo.duration && Math.abs(heroVideo.currentTime - targetTime) > 0.02) {
    heroVideo.currentTime += (targetTime - heroVideo.currentTime) * 0.22;
  }
  requestAnimationFrame(raf);
})();

/* ---------- Reveal on scroll (3D fly-in) ---------- */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('inview'); });
}, { threshold: 0.18 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ---------- Product cards: hover-to-play + 3D tilt + sizes ---------- */
document.querySelectorAll('.card').forEach(card => {
  const inner = card.querySelector('.card-inner');
  const video = card.querySelector('.spin-video');

  if (video) {
    card.addEventListener('mouseenter', () => { video.play().catch(() => {}); });
    card.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
  }

  /* pointer tilt */
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    inner.style.transform = `rotateY(${px * 14}deg) rotateX(${py * -12}deg) translateZ(12px)`;
  });
  card.addEventListener('pointerleave', () => { inner.style.transform = ''; });

  const price = card.querySelector('.price');
  const base = parseFloat(price.dataset.base);
  const sizes = card.querySelectorAll('.size');
  sizes[0].classList.add('active');
  sizes.forEach(btn => btn.addEventListener('click', () => {
    if (btn.disabled) return;
    sizes.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    price.textContent = '£' + (base * parseFloat(btn.dataset.mult)).toFixed(2);
  }));

  card.querySelector('.add-btn').addEventListener('click', () => {
    const active = card.querySelector('.size.active');
    addToCart({
      name: card.querySelector('h3').textContent,
      size: active.dataset.label,
      price: base * parseFloat(active.dataset.mult),
    });
  });
});

/* ---------- Cart ---------- */
const cart = [];
const drawer = document.getElementById('drawer');
const scrim = document.getElementById('drawerScrim');

function openDrawer() { drawer.classList.add('open'); scrim.classList.add('open'); }
function closeDrawer() { drawer.classList.remove('open'); scrim.classList.remove('open'); }
document.getElementById('cartBtn').addEventListener('click', openDrawer);
document.getElementById('drawerClose').addEventListener('click', closeDrawer);
scrim.addEventListener('click', closeDrawer);

function addToCart(item) {
  cart.push(item);
  renderCart();
  toast(`${item.name} · ${item.size} added to your box`);
}
function removeFromCart(i) { cart.splice(i, 1); renderCart(); }

function renderCart() {
  const wrap = document.getElementById('drawerItems');
  document.getElementById('cartCount').textContent = cart.length;
  if (!cart.length) {
    wrap.innerHTML = '<p class="drawer-empty">Your box is empty. Sad, really.</p>';
  } else {
    wrap.innerHTML = cart.map((it, i) => `
      <div class="drawer-item">
        <div class="di-info">
          <span class="di-name">${it.name}</span>
          <span class="di-size">${it.size}</span>
        </div>
        <div class="di-right">
          <span class="di-price">£${it.price.toFixed(2)}</span>
          <button class="di-remove" data-i="${i}" aria-label="Remove">✕</button>
        </div>
      </div>`).join('');
    wrap.querySelectorAll('.di-remove').forEach(b =>
      b.addEventListener('click', () => removeFromCart(+b.dataset.i)));
  }
  const total = cart.reduce((s, it) => s + it.price, 0);
  document.getElementById('drawerTotal').textContent = '£' + total.toFixed(2);
}

document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (!cart.length) { toast('Add a cookie first 🍪'); return; }
  toast('Demo checkout — order “placed”! Karlie will be in touch. ✨');
  cart.length = 0;
  renderCart();
  closeDrawer();
});

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- Notify forms ---------- */
document.getElementById('notifyForm').addEventListener('submit', e => {
  e.preventDefault();
  document.getElementById('notifyOk').classList.add('show');
  e.target.querySelector('input').value = '';
});

const modalScrim = document.getElementById('modalScrim');
document.querySelectorAll('.notify-link').forEach(btn =>
  btn.addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'GET NOTIFIED';
    document.getElementById('modalSub').textContent =
      `We'll email you the second ${btn.dataset.flavor} restocks.`;
    document.getElementById('modalOk').classList.remove('show');
    modalScrim.classList.add('open');
  }));
document.getElementById('modalClose').addEventListener('click', () => modalScrim.classList.remove('open'));
modalScrim.addEventListener('click', e => { if (e.target === modalScrim) modalScrim.classList.remove('open'); });
document.getElementById('modalForm').addEventListener('submit', e => {
  e.preventDefault();
  document.getElementById('modalOk').classList.add('show');
  e.target.querySelector('input').value = '';
});
