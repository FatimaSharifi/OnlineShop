/* =========================================================
   Javedan Online Shop — admin panel logic (admin.html)
   ========================================================= */

const DEFAULT_CATEGORIES = ['Long Coats','Long Dress with Tops','Long Dresses','Skirts','Blazers','Cute Tops'];

const NAMED_COLOR_OPTIONS = [
  'Black','White','Ivory','Cream','Beige','Red','Maroon','Blush Pink','Rose',
  'Orange','Peach','Rust','Mustard','Gold','Yellow','Olive','Green','Emerald Green',
  'Sage','Mint','Teal','Navy Blue','Blue','Sky Blue','Denim Blue','Lavender','Purple',
  'Plum','Brown','Chocolate','Charcoal Grey','Grey','Silver','Multicolor'
];

let PRODUCTS = [];
let CATEGORIES = [];
let editingProductId = null;
let selectedImageFile = null;

function escapeHtml(s){ const d=document.createElement('div'); d.textContent = s==null?'':String(s); return d.innerHTML; }

/* ============================================================
   AUTH
   ============================================================ */
auth.onAuthStateChanged(async (user)=>{
  if(user){
    document.getElementById('adminLoginWrap').style.display = 'none';
    document.getElementById('adminPanel').style.display = '';
    document.getElementById('adminEmailLabel').textContent = user.email;
    await ensureCategoriesSeeded();
    populateCategorySelect();
    renderCategoryManageList();
    renderAdminOrders();
    await loadProductsAdmin();
    renderProductsAdminList();
  } else {
    document.getElementById('adminLoginWrap').style.display = '';
    document.getElementById('adminPanel').style.display = 'none';
  }
});

function loginWithEmail(){
  const email = document.getElementById('adminEmail').value.trim();
  const pass = document.getElementById('adminPassword').value;
  const errEl = document.getElementById('loginErr');
  errEl.style.display = 'none';
  if(!email || !pass){
    errEl.textContent = 'Enter your admin email and password.';
    errEl.style.display = 'block';
    return;
  }
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,0.4); border-top-color:#fff;"></span>Signing in…';
  auth.signInWithEmailAndPassword(email, pass)
    .catch(err=>{
      console.error(err);
      errEl.textContent = 'Incorrect email or password, or this account does not have admin access.';
      errEl.style.display = 'block';
    })
    .finally(()=>{
      btn.disabled = false;
      btn.innerHTML = 'Sign in';
    });
}
function logout(){
  auth.signOut();
}

/* ============================================================
   CATEGORIES
   ============================================================ */
async function ensureCategoriesSeeded(){
  try{
    const snap = await db.collection('categories').get();
    if(snap.empty){
      const batch = db.batch();
      DEFAULT_CATEGORIES.forEach(name=>{
        const ref = db.collection('categories').doc();
        batch.set(ref, {name, createdAt: firebase.firestore.FieldValue.serverTimestamp()});
      });
      await batch.commit();
    }
    await loadCategories();
  }catch(e){ console.error('Could not seed/load categories', e); CATEGORIES = [...DEFAULT_CATEGORIES.map(name=>({name}))]; }
}
async function loadCategories(){
  const snap = await db.collection('categories').orderBy('name').get();
  CATEGORIES = snap.docs.map(d=>({id:d.id, name:d.data().name}));
}
function populateCategorySelect(){
  const sel = document.getElementById('itemCategory');
  sel.innerHTML = CATEGORIES.map(c=>`<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('') + `<option value="__other__">Other (add new category)</option>`;
  sel.onchange = ()=>{
    document.getElementById('newCategoryWrap').style.display = sel.value==='__other__' ? '' : 'none';
  };
}
function renderCategoryManageList(){
  const wrap = document.getElementById('catManageList');
  if(CATEGORIES.length===0){ wrap.innerHTML = `<span class="hint-text">No categories yet.</span>`; return; }
  wrap.innerHTML = CATEGORIES.map(c=>`
    <div class="cat-pill">${escapeHtml(c.name)} <button onclick="deleteCategory('${c.id}','${escapeHtml(c.name).replace(/'/g,"\\'")}')" title="Delete category">×</button></div>
  `).join('');
}
async function addCategoryQuick(){
  const input = document.getElementById('quickNewCategory');
  const name = input.value.trim();
  if(!name){ showToast('Enter a category name'); return; }
  if(CATEGORIES.some(c=>c.name.toLowerCase()===name.toLowerCase())){ showToast('That category already exists'); return; }
  try{
    await db.collection('categories').add({name, createdAt: firebase.firestore.FieldValue.serverTimestamp()});
    await loadCategories();
    populateCategorySelect();
    renderCategoryManageList();
    input.value='';
    showToast('Category added');
  }catch(e){ console.error(e); showToast('Could not add category'); }
}
async function deleteCategory(id, name){
  const inUse = PRODUCTS.some(p=>p.category===name);
  if(inUse){
    showToast('Cannot delete — items still use this category');
    return;
  }
  if(!confirm(`Delete category "${name}"?`)) return;
  try{
    await db.collection('categories').doc(id).delete();
    await loadCategories();
    populateCategorySelect();
    renderCategoryManageList();
    showToast('Category deleted');
  }catch(e){ console.error(e); showToast('Could not delete category'); }
}

/* ============================================================
   TAB SWITCHING
   ============================================================ */
function setAdminTab(tab){
  ['orders','add','categories'].forEach(t=>{
    document.getElementById('tab'+capitalize(t)).classList.toggle('active', t===tab);
    document.getElementById('view'+capitalize(t)).style.display = t===tab ? '' : 'none';
  });
  if(tab==='orders') renderAdminOrders();
  if(tab==='add') renderProductsAdminList();
}
function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

/* ============================================================
   PRODUCT IMAGE HANDLING
   ============================================================ */
function onImageSelected(e){
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 5*1024*1024){
    showToast('Image is too large — please choose one under 5MB');
    e.target.value = '';
    return;
  }
  selectedImageFile = file;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    document.getElementById('imgPreview').innerHTML = `<img src="${ev.target.result}" alt="preview">`;
  };
  reader.readAsDataURL(file);
}
async function uploadImageIfNeeded(){
  if(!selectedImageFile) return null;
  const filename = `products/${Date.now()}_${selectedImageFile.name.replace(/[^a-zA-Z0-9.]/g,'_')}`;
  const ref = storage.ref().child(filename);
  await ref.put(selectedImageFile);
  return await ref.getDownloadURL();
}

/* ============================================================
   COLOR FIELD (named list + "Other")
   ============================================================ */
function populateColorSelect(){
  const sel = document.getElementById('itemColor');
  sel.innerHTML = NAMED_COLOR_OPTIONS.map(c=>`<option value="${c}">${c}</option>`).join('') + `<option value="__other__">Other (type a color name)</option>`;
  sel.onchange = ()=>{
    document.getElementById('otherColorWrap').style.display = sel.value==='__other__' ? '' : 'none';
  };
}
function getChosenColorName(){
  const sel = document.getElementById('itemColor').value;
  if(sel==='__other__'){
    return document.getElementById('otherColorInput').value.trim();
  }
  return sel;
}

/* ============================================================
   ADD / EDIT PRODUCT
   ============================================================ */
function resetItemForm(){
  editingProductId = null;
  selectedImageFile = null;
  document.getElementById('itemName').value='';
  document.getElementById('itemPrice').value='';
  document.getElementById('itemDesc').value='';
  document.getElementById('otherColorInput').value='';
  document.getElementById('otherColorWrap').style.display='none';
  document.getElementById('newCategoryWrap').style.display='none';
  document.getElementById('quickNewCategoryInline').value='';
  document.getElementById('imgPreview').innerHTML = 'No photo selected';
  document.getElementById('itemColor').value = NAMED_COLOR_OPTIONS[0];
  document.getElementById('imgFileInput').value='';
  document.getElementById('formTitle').textContent = 'Add a new item';
  document.getElementById('saveItemBtn').textContent = 'Add to collection';
  document.getElementById('cancelEditBtn').style.display = 'none';
}
async function saveItem(){
  const name = document.getElementById('itemName').value.trim();
  const price = parseFloat(document.getElementById('itemPrice').value);
  const desc = document.getElementById('itemDesc').value.trim();
  let category = document.getElementById('itemCategory').value;
  const errEl = document.getElementById('itemFormErr');
  errEl.style.display='none';

  if(category==='__other__'){
    category = document.getElementById('quickNewCategoryInline').value.trim();
    if(!category){ errEl.textContent='Please type the new category name.'; errEl.style.display='block'; return; }
  }
  const colorName = getChosenColorName();

  if(!name || !price || price<=0 || !category || !colorName){
    errEl.textContent = 'Please fill in item name, category, price, and color.';
    errEl.style.display = 'block';
    return;
  }

  const btn = document.getElementById('saveItemBtn');
  btn.disabled = true;
  const originalLabel = btn.textContent;
  btn.innerHTML = '<span class="spinner" style="border-color:rgba(255,255,255,0.4); border-top-color:#fff;"></span>Saving…';

  try{
    // if a brand-new category was typed, make sure it exists in the categories collection
    if(!CATEGORIES.some(c=>c.name.toLowerCase()===category.toLowerCase())){
      await db.collection('categories').add({name:category, createdAt: firebase.firestore.FieldValue.serverTimestamp()});
      await loadCategories();
      populateCategorySelect();
      renderCategoryManageList();
      document.getElementById('itemCategory').value = category;
    }

    let imageUrl = null;
    if(selectedImageFile){
      imageUrl = await uploadImageIfNeeded();
    }

    if(editingProductId){
      const updateData = {name, category, price, colorName, desc};
      if(imageUrl) updateData.imageUrl = imageUrl;
      await db.collection('products').doc(editingProductId).update(updateData);
      showToast('Item updated');
    } else {
      await db.collection('products').add({
        name, category, price, colorName, desc,
        imageUrl: imageUrl || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      showToast('Item added to collection');
    }
    resetItemForm();
    await loadProductsAdmin();
    renderProductsAdminList();
  }catch(e){
    console.error(e);
    errEl.textContent = 'Something went wrong saving this item. Please try again.';
    errEl.style.display = 'block';
  }finally{
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}
function editItem(id){
  const p = PRODUCTS.find(pp=>pp.id===id);
  if(!p) return;
  editingProductId = id;
  selectedImageFile = null;
  document.getElementById('itemName').value = p.name;
  document.getElementById('itemPrice').value = p.price;
  document.getElementById('itemDesc').value = p.desc || '';
  document.getElementById('itemCategory').value = CATEGORIES.some(c=>c.name===p.category) ? p.category : '__other__';
  if(document.getElementById('itemCategory').value==='__other__'){
    document.getElementById('newCategoryWrap').style.display='';
    document.getElementById('quickNewCategoryInline').value = p.category;
  }
  const isNamed = NAMED_COLOR_OPTIONS.some(c=>c.toLowerCase()===String(p.colorName||'').toLowerCase());
  document.getElementById('itemColor').value = isNamed ? NAMED_COLOR_OPTIONS.find(c=>c.toLowerCase()===p.colorName.toLowerCase()) : '__other__';
  document.getElementById('otherColorWrap').style.display = isNamed ? 'none' : '';
  document.getElementById('otherColorInput').value = isNamed ? '' : (p.colorName||'');
  document.getElementById('imgPreview').innerHTML = p.imageUrl ? `<img src="${p.imageUrl}" alt="">` : 'No photo selected';
  document.getElementById('formTitle').textContent = 'Edit item';
  document.getElementById('saveItemBtn').textContent = 'Save changes';
  document.getElementById('cancelEditBtn').style.display = '';
  setAdminTab('add');
  window.scrollTo({top:0, behavior:'smooth'});
}
function cancelEdit(){ resetItemForm(); }
async function deleteItem(id){
  if(!confirm('Delete this item from the collection? This cannot be undone.')) return;
  try{
    await db.collection('products').doc(id).delete();
    showToast('Item deleted');
    await loadProductsAdmin();
    renderProductsAdminList();
  }catch(e){ console.error(e); showToast('Could not delete item'); }
}

/* ============================================================
   ADMIN PRODUCT LIST (within Add-Item tab)
   ============================================================ */
async function loadProductsAdmin(){
  try{
    const snap = await db.collection('products').orderBy('createdAt','desc').get();
    PRODUCTS = snap.docs.map(d=>({id:d.id, ...d.data()}));
  }catch(e){ console.error(e); PRODUCTS = []; }
}
function renderProductsAdminList(){
  const wrap = document.getElementById('existingItemsList');
  if(!wrap) return;
  if(PRODUCTS.length===0){
    wrap.innerHTML = `<div class="empty-note">No items in the collection yet.</div>`;
    return;
  }
  wrap.innerHTML = PRODUCTS.map(p=>`
    <div class="product-admin-card">
      <div class="product-admin-thumb">${p.imageUrl ? `<img src="${p.imageUrl}" alt="">` : ''}</div>
      <div class="product-admin-info">
        <h4>${escapeHtml(p.name)}</h4>
        <div class="meta">${escapeHtml(p.category||'')} &middot; ${escapeHtml(p.colorName||'')} &middot; <span class="mono">Rs ${Number(p.price).toLocaleString()}</span></div>
      </div>
      <div class="product-admin-actions">
        <button class="icon-btn" title="Edit" onclick="editItem('${p.id}')">✎</button>
        <button class="icon-btn danger" title="Delete" onclick="deleteItem('${p.id}')">🗑</button>
      </div>
    </div>
  `).join('');
}

/* ============================================================
   ORDERS
   ============================================================ */
function ordersUnsub(){}
let unsubscribeOrders = null;
function renderAdminOrders(){
  if(unsubscribeOrders) unsubscribeOrders();
  const listEl = document.getElementById('ordersList');
  listEl.innerHTML = `<div class="empty-note"><span class="spinner" style="border-color:rgba(122,39,57,0.3); border-top-color:var(--maroon);"></span>Loading orders…</div>`;
  unsubscribeOrders = db.collection('orders').orderBy('placedAt','desc').onSnapshot(snap=>{
    const orders = snap.docs.map(d=>({id:d.id, ...d.data()}));
    renderStatRow(orders);
    if(orders.length===0){
      listEl.innerHTML = `<div class="empty-note">No orders yet.</div>`;
      return;
    }
    listEl.innerHTML = orders.map(o=>orderCardHtml(o)).join('');
  }, err=>{
    console.error(err);
    listEl.innerHTML = `<div class="empty-note">Could not load orders. Please refresh.</div>`;
  });
}
function renderStatRow(orders){
  const totalRevenue = orders.reduce((s,o)=>s+(o.total||0),0);
  const pending = orders.filter(o=>o.status==='Pending').length;
  document.getElementById('statRow').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total orders</div><div class="stat-val">${orders.length}</div></div>
    <div class="stat-card"><div class="stat-label">Pending confirmation</div><div class="stat-val">${pending}</div></div>
    <div class="stat-card"><div class="stat-label">Total value</div><div class="stat-val mono" style="font-size:22px;">Rs ${totalRevenue.toLocaleString()}</div></div>
  `;
}
function orderCardHtml(o){
  let timeStr = '—';
  if(o.placedAt && o.placedAt.toDate){
    timeStr = o.placedAt.toDate().toLocaleString('en-GB', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'});
  } else if(o.placedAtLocal){
    timeStr = new Date(o.placedAtLocal).toLocaleString('en-GB', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) + ' (pending sync)';
  }
  const statuses = ['Pending','Confirmed','Shipped','Delivered','Cancelled'];
  return `
    <div class="order-card">
      <div class="order-top">
        <div><div class="order-id">#${o.id.slice(-8).toUpperCase()}</div><div class="order-time">Placed ${timeStr}</div></div>
        <select class="status-select" onchange="updateOrderStatus('${o.id}', this.value)">
          ${statuses.map(s=>`<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="order-grid">
        <div class="order-cust">
          <p><b>Name</b>${escapeHtml(o.customer?.name)}</p>
          <p><b>Phone</b>${escapeHtml(o.customer?.phone)}</p>
          <p><b>Address</b>${escapeHtml(o.customer?.address)}, House ${escapeHtml(o.customer?.houseNo)}</p>
          <p><b>Fulfilment</b>${o.deliveryOption==='pickup' ? 'Pickup from shop' : 'Home delivery'}</p>
        </div>
        <div class="order-items-list">
          ${(o.items||[]).map(it=>`<div class="oi-row"><span>${escapeHtml(it.name)}${it.colorName?' ('+escapeHtml(it.colorName)+')':''} × ${it.qty}</span><span class="mono">Rs ${(it.price*it.qty).toLocaleString()}</span></div>`).join('')}
          <div class="order-sum"><span>Delivery</span><span class="mono">${o.deliveryCharge===0?'Free':'Rs '+o.deliveryCharge}</span></div>
          <div class="order-sum"><span>Total</span><span class="mono">Rs ${(o.total||0).toLocaleString()}</span></div>
        </div>
      </div>
    </div>`;
}
async function updateOrderStatus(orderId, status){
  try{
    await db.collection('orders').doc(orderId).update({status});
    showToast('Order marked as ' + status);
  }catch(e){ console.error(e); showToast('Could not update order status'); }
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
  toastTimer = setTimeout(()=>t.classList.remove('show'), 2400);
}

/* ============================================================
   INIT
   ============================================================ */
populateColorSelect();
