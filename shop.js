/* =========================================================
   Javedan Online Shop — storefront logic (index.html)
   ========================================================= */

const DELIVERY_CHARGE = 200;
const FREE_DELIVERY_THRESHOLD = 5000;
const DEFAULT_CATEGORIES = ['Long Coats','Long Dress with Tops','Long Dresses','Skirts','Blazers','Cute Tops'];

// Named colors shown to shoppers as a small dot next to the color name.
// Anything not in this list (custom "Other" names the admin typed in)
// simply shows no dot, just the text.
const COLOR_SWATCHES = {
  'black':'#111111','white':'#ffffff','ivory':'#F4EDE1','cream':'#F3E7CE','beige':'#D8C3A5',
  'red':'#B23A2E','maroon':'#7A2739','pink':'#E8A6B8','blush pink':'#E8C4C4','rose':'#C97A88',
  'orange':'#D9772E','peach':'#F0B48A','rust':'#A6521F','mustard':'#C9A227','gold':'#B8863B',
  'yellow':'#E6C24A','olive':'#7C7A3A','green':'#3E7A4C','emerald':'#1F4B44','emerald green':'#1F4B44',
  'sage':'#9CAE8C','mint':'#B7E0C9','teal':'#256B68','navy':'#1B2A4A','navy blue':'#1B2A4A',
  'blue':'#2E5FA3','sky blue':'#8FC7E8','denim blue':'#3E5C76','lavender':'#B7A6D9','purple':'#6C3E82',
  'plum':'#5C3A52','brown':'#5A3B2A','chocolate':'#3B2419','charcoal':'#3A3436','charcoal grey':'#3A3436',
  'grey':'#8A8A8A','gray':'#8A8A8A','silver':'#C6C6C6','multicolor':'#B8863B'
};

const NAMED_COLOR_OPTIONS = [
  'Black','White','Ivory','Cream','Beige','Red','Maroon','Blush Pink','Rose',
  'Orange','Peach','Rust','Mustard','Gold','Yellow','Olive','Green','Emerald Green',
  'Sage','Mint','Teal','Navy Blue','Blue','Sky Blue','Denim Blue','Lavender','Purple',
  'Plum','Brown','Chocolate','Charcoal Grey','Grey','Silver','Multicolor'
];

let PRODUCTS = [];
let CATEGORIES = [...DEFAULT_CATEGORIES];
let CART = [];
let activeCategory = 'all';
let checkoutMode = null; // {type:'single', productId} | {type:'cart'}

/* ---------- cart persistence (plain localStorage — this is a real site) ---------- */
function loadCart(){
  try{ CART = JSON.parse(localStorage.getItem('javedan_cart') || '[]'); }catch(e){ CART = []; }
}
function saveCart(){
  localStorage.setItem('javedan_cart', JSON.stringify(CART));
  updateCartCount();
}

/* ---------- icon set (fallback when a product has no photo) ---------- */
function categoryIcon(cat){
  const key = (cat||'').toLowerCase();
  const icons = {
    'long coats': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 8l8 6 8-6"/><path d="M20 14L10 22l4 8 4-4v30h28V26l4 4 4-8-10-8"/><path d="M32 14v42"/><path d="M20 30h10M34 30h10"/></svg>`,
    'long dress with tops': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10l10 6 10-6"/><path d="M20 12l-6 10 5 5 3-4v10c-4 2-6 8-6 16v8h32v-8c0-8-2-14-6-16V23l3 4 5-5-6-10"/><path d="M26 33c2 2 10 2 12 0"/></svg>`,
    'long dresses': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M26 8h12l4 12-8-4v6c10 4 14 14 14 32H16c0-18 4-28 14-32v-6l-8 4z"/></svg>`,
    'skirts': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14h24l2 8h-28z"/><path d="M18 22h28l8 30H10z"/><path d="M24 22l-6 30M32 22v30M40 22l6 30"/></svg>`,
    'blazers': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M24 10l8 5 8-5"/><path d="M20 13l-9 9 4 7 5-5-4 30h32l-4-30 5 5 4-7-9-9"/><path d="M28 20l4 34M36 20l-4 34"/></svg>`,
    'cute tops': `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 11l9 5 9-5"/><path d="M20 13l-8 8 5 6 3-3v28h24V24l3 3 5-6-8-8"/></svg>`,
  };
  return icons[key] || `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 11l9 5 9-5"/><path d="M20 13l-8 8 5 6 3-3v28h24V24l3 3 5-6-8-8"/></svg>`;
}
function swatchHex(colorName){
  if(!colorName) return null;
  return COLOR_SWATCHES[colorName.trim().toLowerCase()] || null;
}
function escapeHtml(s){ const d=document.createElement('div'); d.textContent = s==null?'':String(s); return d.innerHTML; }

/* ============================================================
   LOAD DATA FROM FIRESTORE
   ============================================================ */
async function loadCategories(){
  try{
    const snap = await db.collection('categories').orderBy('name').get();
    if(snap.empty){
      CATEGORIES = [...DEFAULT_CATEGORIES];
    } else {
      CATEGORIES = snap.docs.map(d=>d.data().name);
    }
  }catch(e){
    console.error('Could not load categories, using defaults', e);
    CATEGORIES = [...DEFAULT_CATEGORIES];
  }
  renderCategoryStrip();
}

async function loadProducts(){
  const grid = document.getElementById('productGrid');
  grid.innerHTML = `<div class="empty-note" style="grid-column:1/-1"><span class="spinner" style="border-color:rgba(122,39,57,0.3); border-top-color:var(--maroon);"></span>Loading the collection…</div>`;
  try{
    const snap = await db.collection('products').orderBy('createdAt','desc').get();
    PRODUCTS = snap.docs.map(d=>({id:d.id, ...d.data()}));
  }catch(e){
    console.error('Could not load products', e);
    PRODUCTS = [];
    grid.innerHTML = `<div class="empty-note" style="grid-column:1/-1">Couldn't load the collection right now. Please refresh the page.</div>`;
    return;
  }
  renderProducts();
}

/* ============================================================
   RENDER: category strip + product grid
   ============================================================ */
function renderCategoryStrip(){
  const strip = document.getElementById('catStrip');
  let html = `<button class="cat-chip ${activeCategory==='all'?'active':''}" onclick="filterCat('all')">All items</button>`;
  CATEGORIES.forEach(c=>{
    html += `<button class="cat-chip ${activeCategory===c?'active':''}" onclick="filterCat('${escapeHtml(c).replace(/'/g,"\\'")}')">${categoryIcon(c)} ${escapeHtml(c)}</button>`;
  });
  strip.innerHTML = html;
}
function filterCat(cat){ activeCategory = cat; renderCategoryStrip(); renderProducts(); }

function renderProducts(){
  const list = activeCategory==='all' ? PRODUCTS : PRODUCTS.filter(p=>p.category===activeCategory);
  const title = activeCategory==='all' ? 'The Collection' : activeCategory;
  document.getElementById('sectionTitle').textContent = title;
  document.getElementById('sectionCount').textContent = list.length + ' item' + (list.length===1?'':'s');
  const grid = document.getElementById('productGrid');
  if(list.length===0){
    grid.innerHTML = `<div class="empty-note" style="grid-column:1/-1">No items here yet — check back soon.</div>`;
    return;
  }
  grid.innerHTML = list.map(p=>{
    const hex = swatchHex(p.colorName);
    const artInner = p.imageUrl
      ? `<img src="${p.imageUrl}" alt="${escapeHtml(p.name)}" loading="lazy">`
      : `<div style="color:var(--emerald)">${categoryIcon(p.category)}</div>`;
    return `
    <div class="card">
      <div class="card-art" style="${p.imageUrl? '' : 'background:#EFE6DC'}">
        ${artInner}
        <div class="price-tag mono">Rs ${Number(p.price).toLocaleString()}</div>
      </div>
      <div class="card-body">
        <div class="card-cat">${escapeHtml(p.category||'')}</div>
        <div class="card-name">${escapeHtml(p.name)}</div>
        ${p.colorName ? `<div class="card-color">${hex?`<span class="swatch-dot" style="background:${hex}"></span>`:''}${escapeHtml(p.colorName)}</div>` : ''}
        <div class="card-desc">${escapeHtml(p.desc||'')}</div>
        <div class="card-foot">
          <button class="btn-add" onclick="addToCart('${p.id}')">Add to cart</button>
          <button class="btn-buy" onclick="buyNow('${p.id}')">Buy now</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ============================================================
   CART
   ============================================================ */
function addToCart(id){
  const existing = CART.find(c=>c.productId===id);
  if(existing) existing.qty++;
  else CART.push({productId:id, qty:1});
  saveCart();
  showToast('Added to cart');
}
function buyNow(id){
  checkoutMode = {type:'single', productId:id, qty:1};
  openCheckout();
}
function updateCartCount(){
  const count = CART.reduce((s,c)=>s+c.qty,0);
  const el = document.getElementById('cartCount');
  if(el) el.textContent = count;
}
function openCart(){
  renderCartDrawer();
  document.getElementById('overlay').classList.add('open');
  document.getElementById('cartDrawer').classList.add('open');
}
function closeCart(){
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('cartDrawer').classList.remove('open');
}
function cartLineTotal(){
  return CART.reduce((sum,c)=>{
    const p = PRODUCTS.find(pp=>pp.id===c.productId);
    return sum + (p? Number(p.price)*c.qty : 0);
  },0);
}
function renderCartDrawer(){
  const body = document.getElementById('cartBody');
  const foot = document.getElementById('cartFoot');
  if(CART.length===0){
    body.innerHTML = `<div class="drawer-empty">Your cart is empty.<br>Browse the collection to add something lovely.</div>`;
    foot.innerHTML = '';
    return;
  }
  body.innerHTML = CART.map(c=>{
    const p = PRODUCTS.find(pp=>pp.id===c.productId);
    if(!p) return '';
    const artInner = p.imageUrl ? `<img src="${p.imageUrl}" alt="">` : `<div style="color:var(--emerald)">${categoryIcon(p.category)}</div>`;
    return `
    <div class="cart-item">
      <div class="cart-item-art">${artInner}</div>
      <div class="cart-item-info">
        <div class="cat-mini">${escapeHtml(p.category||'')}</div>
        <h4>${escapeHtml(p.name)}</h4>
        <div class="qty-row">
          <button class="qty-btn" onclick="changeQty('${p.id}',-1)">−</button>
          <span class="qty-val">${c.qty}</span>
          <button class="qty-btn" onclick="changeQty('${p.id}',1)">+</button>
          <span class="remove-link" onclick="removeFromCart('${p.id}')">Remove</span>
        </div>
      </div>
      <div class="cart-item-price mono">Rs ${(Number(p.price)*c.qty).toLocaleString()}</div>
    </div>`;
  }).join('');

  const subtotal = cartLineTotal();
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  foot.innerHTML = `
    <div class="sum-row"><span>Subtotal</span><span class="mono">Rs ${subtotal.toLocaleString()}</span></div>
    <div class="sum-row"><span>Delivery (Quetta / Hazara Town)</span><span class="mono">${delivery===0?'Free':'Rs '+delivery}</span></div>
    <div class="sum-row total"><span>Total</span><span>Rs ${(subtotal+delivery).toLocaleString()}</span></div>
    <button class="checkout-btn" onclick="startCartCheckout()">Confirm order</button>
  `;
}
function changeQty(id, delta){
  const item = CART.find(c=>c.productId===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty<=0) CART = CART.filter(c=>c.productId!==id);
  saveCart();
  renderCartDrawer();
}
function removeFromCart(id){
  CART = CART.filter(c=>c.productId!==id);
  saveCart();
  renderCartDrawer();
}
function startCartCheckout(){
  if(CART.length===0) return;
  checkoutMode = {type:'cart'};
  closeCart();
  openCheckout();
}

/* ============================================================
   CHECKOUT MODAL
   ============================================================ */
function getCheckoutItems(){
  if(checkoutMode.type==='single'){
    const p = PRODUCTS.find(pp=>pp.id===checkoutMode.productId);
    return p ? [{product:p, qty:checkoutMode.qty}] : [];
  }
  return CART.map(c=>({product: PRODUCTS.find(p=>p.id===c.productId), qty:c.qty})).filter(x=>x.product);
}
function openCheckout(){
  const items = getCheckoutItems();
  if(items.length===0){ showToast('That item is no longer available'); return; }
  document.getElementById('checkoutContent').innerHTML = checkoutFormHtml(items);
  document.getElementById('checkoutOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  bindDeliveryOptionEvents();
}
function closeCheckout(){
  document.getElementById('checkoutOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
function checkoutFormHtml(items){
  const itemsHtml = items.map(i=>`
    <div class="oi-row"><span>${escapeHtml(i.product.name)} × ${i.qty}</span><span class="mono">Rs ${(Number(i.product.price)*i.qty).toLocaleString()}</span></div>
  `).join('');
  return `
    <div class="modal-head">
      <h3>Confirm your order</h3>
      <p>Fill in your details — we'll call you to confirm before shipping.</p>
    </div>
    <div class="modal-body">
      <div class="order-items-list" style="margin-bottom:18px;">${itemsHtml}</div>

      <div class="field"><label>Full name</label><input id="ckName" placeholder="Your full name"></div>
      <div class="field"><label>Phone number</label><input id="ckPhone" type="tel" placeholder="03xx-xxxxxxx"></div>
      <div class="field-row">
        <div class="field"><label>House address</label><input id="ckAddress" placeholder="Street, mohalla / area"></div>
        <div class="field"><label>House number</label><input id="ckHouseNo" placeholder="e.g. H.No 12"></div>
      </div>

      <label style="display:block; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:0.03em; text-transform:uppercase; color:var(--ink-soft); margin:18px 0 8px;">Delivery or pickup</label>
      <div class="delivery-opts" id="deliveryOpts">
        <label class="opt-card selected" data-opt="delivery">
          <input type="radio" name="deliveryOpt" value="delivery" checked>
          <div><div class="opt-title">Home delivery — Quetta city / Hazara Town</div>
          <div class="opt-sub" id="deliverySub">Rs 200 delivery charge · free above Rs 5,000</div></div>
        </label>
        <label class="opt-card" data-opt="pickup">
          <input type="radio" name="deliveryOpt" value="pickup">
          <div><div class="opt-title">Pick up from the shop</div>
          <div class="opt-sub">No delivery charge — collect at your convenience</div></div>
        </label>
      </div>

      <div id="ckTotals"></div>

      <label class="check-row">
        <input type="checkbox" id="ckPayment">
        <span>I confirm I will complete payment for this order as agreed, and understand a Javedan team member will call me to confirm before it ships.</span>
      </label>

      <div class="note-box">📞 After placing your order, you'll receive a phone call from us for final confirmation before it's shipped or prepared for pickup.</div>

      <div id="ckError" class="error-text" style="display:none;"></div>
      <button class="submit-order-btn" id="submitOrderBtn" onclick="submitOrder()">Place order</button>
    </div>
  `;
}
function bindDeliveryOptionEvents(){
  updateCheckoutTotals();
  document.querySelectorAll('input[name="deliveryOpt"]').forEach(r=>{
    r.addEventListener('change', ()=>{
      document.querySelectorAll('.opt-card').forEach(o=>o.classList.remove('selected'));
      r.closest('.opt-card').classList.add('selected');
      updateCheckoutTotals();
    });
  });
}
function currentSubtotal(){
  const items = getCheckoutItems();
  return items.reduce((s,i)=>s+Number(i.product.price)*i.qty,0);
}
function updateCheckoutTotals(){
  const subtotal = currentSubtotal();
  const opt = document.querySelector('input[name="deliveryOpt"]:checked')?.value || 'delivery';
  let delivery = 0;
  if(opt==='delivery'){ delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE; }
  const sub = document.getElementById('deliverySub');
  if(sub) sub.textContent = subtotal >= FREE_DELIVERY_THRESHOLD ? 'Free delivery — order qualifies (above Rs 5,000)' : 'Rs 200 delivery charge · free above Rs 5,000';
  const totalsEl = document.getElementById('ckTotals');
  if(totalsEl){
    totalsEl.innerHTML = `
      <div class="sum-row"><span>Subtotal</span><span class="mono">Rs ${subtotal.toLocaleString()}</span></div>
      <div class="sum-row"><span>Delivery</span><span class="mono">${delivery===0?'Free':'Rs '+delivery}</span></div>
      <div class="sum-row total"><span>Total due</span><span>Rs ${(subtotal+delivery).toLocaleString()}</span></div>
    `;
  }
}
async function submitOrder(){
  const errEl = document.getElementById('ckError');
  errEl.style.display='none';
  const name = document.getElementById('ckName').value.trim();
  const phone = document.getElementById('ckPhone').value.trim();
  const address = document.getElementById('ckAddress').value.trim();
  const houseNo = document.getElementById('ckHouseNo').value.trim();
  const payConfirmed = document.getElementById('ckPayment').checked;
  const deliveryOpt = document.querySelector('input[name="deliveryOpt"]:checked')?.value || 'delivery';

  if(!name || !phone || !address || !houseNo){
    errEl.textContent = 'Please fill in all your details.';
    errEl.style.display='block';
    return;
  }
  if(!payConfirmed){
    errEl.textContent = 'Please confirm the payment checkbox.';
    errEl.style.display='block';
    return;
  }

  const items = getCheckoutItems();
  const subtotal = items.reduce((s,i)=>s+Number(i.product.price)*i.qty,0);
  const delivery = deliveryOpt==='delivery' ? (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE) : 0;

  const btn = document.getElementById('submitOrderBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Placing order…';

  const order = {
    customer: {name, phone, address, houseNo},
    deliveryOption: deliveryOpt,
    deliveryCharge: delivery,
    items: items.map(i=>({productId:i.product.id, name:i.product.name, category:i.product.category||'', colorName:i.product.colorName||'', price:Number(i.product.price), qty:i.qty})),
    subtotal, total: subtotal + delivery,
    paymentConfirmed: true,
    status: 'Pending',
    placedAt: firebase.firestore.FieldValue.serverTimestamp(),
    placedAtLocal: new Date().toISOString(),
  };

  try{
    const ref = await db.collection('orders').add(order);
    if(checkoutMode.type==='cart'){ CART = []; saveCart(); }

    document.getElementById('checkoutContent').innerHTML = `
      <div class="modal-body success-box">
        <div class="check">✓</div>
        <h3>Order placed!</h3>
        <p>Thank you, ${escapeHtml(name)}. We've received your order and will call ${escapeHtml(phone)} shortly to confirm before ${deliveryOpt==='delivery'?'shipping':'pickup'}.</p>
        <div class="order-id-chip">Order #${ref.id.slice(-8).toUpperCase()}</div><br>
        <button class="btn-primary" style="margin-top:22px;" onclick="closeCheckout()">Done</button>
      </div>
    `;
  }catch(e){
    console.error('Order failed', e);
    btn.disabled = false;
    btn.innerHTML = 'Place order';
    errEl.textContent = 'Something went wrong sending your order. Please check your connection and try again.';
    errEl.style.display='block';
  }
}

/* ============================================================
   TOAST
   ============================================================ */
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}
function scrollToShop(){ document.getElementById('shopMain').scrollIntoView({behavior:'smooth'}); }

/* ============================================================
   INIT
   ============================================================ */
loadCart();
updateCartCount();
loadCategories();
loadProducts();
