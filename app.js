// batteries shop - single-file app logic (clean rebuild)
// All data is persisted into localStorage for demo purposes only.

const sampleProducts = [
  {id:'p1',name:'Lead Acid 12V 7Ah',category:'lead-acid',price:18.5,stock:25},
  {id:'p2',name:'Li-ion 18650 3.7V',category:'li-ion',price:6.75,stock:120},
  {id:'p3',name:'Ni-MH AA 2000mAh',category:'ni-mh',price:2.1,stock:300},
  {id:'p4',name:'Li-ion 21700 3.7V',category:'li-ion',price:12.5,stock:70},
  {id:'p5',name:'Lead Acid 6V 4.5Ah',category:'lead-acid',price:9.0,stock:40}
];

const KEY_PRODUCTS = 'bs_products';
const KEY_USERS = 'bs_users';
const KEY_SESSION = 'bs_session';
const KEY_ORDERS = 'bs_orders';
const KEY_GUEST_CART = 'bs_guest_cart';

function $(id){ return document.getElementById(id); }

function initData(){
  if(!localStorage.getItem(KEY_PRODUCTS)) localStorage.setItem(KEY_PRODUCTS, JSON.stringify(sampleProducts));
  if(!localStorage.getItem(KEY_USERS)) localStorage.setItem(KEY_USERS, JSON.stringify([{username:'admin',password:'admin',role:'admin'}]));
  if(!localStorage.getItem(KEY_ORDERS)) localStorage.setItem(KEY_ORDERS, JSON.stringify([]));
}

function getProducts(){ try{ return JSON.parse(localStorage.getItem(KEY_PRODUCTS))||[];}catch(e){return []} }
function saveProducts(list){ localStorage.setItem(KEY_PRODUCTS, JSON.stringify(list)); }
function getUsers(){ return JSON.parse(localStorage.getItem(KEY_USERS)||'[]'); }
function saveUsers(u){ localStorage.setItem(KEY_USERS, JSON.stringify(u)); }
function getOrders(){ return JSON.parse(localStorage.getItem(KEY_ORDERS)||'[]'); }
function saveOrders(o){ localStorage.setItem(KEY_ORDERS, JSON.stringify(o)); }
function getSession(){ try{return JSON.parse(localStorage.getItem(KEY_SESSION));}catch(e){return null;} }
function saveSession(s){ localStorage.setItem(KEY_SESSION, JSON.stringify(s)); }
function clearSession(){ localStorage.removeItem(KEY_SESSION); }
function getGuestCart(){ try{return JSON.parse(localStorage.getItem(KEY_GUEST_CART)||'[]')}catch(e){return []} }
function saveGuestCart(c){ localStorage.setItem(KEY_GUEST_CART, JSON.stringify(c)); }

function getCart(){ const s = getSession(); if(s && s.cart) return s.cart; return getGuestCart(); }
function saveCart(cart){ const s = getSession(); if(s){ s.cart = cart; saveSession(s); } else { saveGuestCart(cart); } }

// Render product grid
function renderProducts(){ const container = $('products'); if(!container) return; container.innerHTML=''; const cat = $('filter-category')?$('filter-category').value:'all'; const list = getProducts().filter(p=>cat==='all'||p.category===cat); list.forEach(p=>{ const div = document.createElement('div'); div.className='card'; div.innerHTML = `
    <div class="thumb">Battery</div>
    <h4>${p.name}</h4>
    <div class="meta">${p.category} • Stock: ${p.stock}</div>
    <div class="price">$${p.price.toFixed(2)}</div>
    <div style="margin-top:10px" class="actions">
      <label style="display:inline-flex;align-items:center;gap:8px">Qty <input type="number" min="1" value="1" data-id="${p.id}" class="qty" style="width:64px"></label>
      <button data-id="${p.id}" class="add">Add to cart</button>
    </div>`; container.appendChild(div); }); }

function updateCartCount(){ const c = getCart(); const count = c.reduce((s,i)=>s+(i.qty||0),0); const el = $('cart-count'); if(el) el.textContent = count; }

// Cart rendering
function renderCartItems(){ const itemsEl = $('cart-items'); if(!itemsEl) return; itemsEl.innerHTML=''; const cart = getCart(); let total=0; cart.forEach(ci=>{ const p = getProducts().find(x=>x.id===ci.id)||{name:'(unknown)',price:0}; const d = document.createElement('div'); d.className='cart-item'; d.innerHTML = `
    <div class="name">${p.name}</div>
    <div class="cart-controls">
      <input class="cart-qty" type="number" min="1" value="${ci.qty}" data-id="${ci.id}">
      <div>$${(p.price*ci.qty).toFixed(2)}</div>
      <button class="remove" data-id="${ci.id}">Remove</button>
    </div>`; itemsEl.appendChild(d); total += p.price*ci.qty; }); const totalEl = $('cart-total'); if(totalEl) totalEl.textContent = total.toFixed(2); }

function addToCart(id,qty){ qty = Number(qty)||1; const cart = getCart(); const f = cart.find(c=>c.id===id); if(f) f.qty += qty; else cart.push({id,qty}); saveCart(cart); updateCartCount(); }

function checkout(){ const s = getSession(); if(!s||!s.user){ alert('Please login to checkout'); return; } const cart = getCart(); if(!cart.length){ alert('Cart empty'); return; } const orders = getOrders(); const order = { id:'o'+Date.now(), user: s.user.username, items: cart, status:'pending', created: Date.now(), history:[{status:'pending',time:Date.now(),note:'created'}] }; orders.push(order); saveOrders(orders); saveCart([]); renderCartItems(); updateCartCount(); alert('Order placed'); renderAdmin(); }

// Auth modal helpers
function showAuth(mode){ const modal = $('auth-modal'); if(!modal) return; modal.hidden=false; modal.classList.add('show'); modal.classList.remove('hidden'); modal.style.display='flex'; try{ document.body.classList.add('modal-open'); }catch(e){} const title = (mode==='register' || mode==='Register')?'Register':'Login'; $('auth-title').textContent = title; document.querySelectorAll('.auth-tabs .tab').forEach(t=>t.classList.toggle('active', t.dataset.mode===title.toLowerCase())); if($('role-field')) $('role-field').style.display = title==='Register'?'block':'none'; if($('auth-submit')) $('auth-submit').dataset.mode = title.toLowerCase(); setTimeout(()=>{ if($('auth-username')) $('auth-username').focus(); },120); trapFocus(modal); }

function hideAuth(){ const modal = $('auth-modal'); if(!modal) return; modal.classList.remove('show'); if(modal._keyHandler) document.removeEventListener('keydown', modal._keyHandler); if(modal._observer){ try{ modal._observer.disconnect(); }catch(e){} modal._observer = null; } modal.hidden = true; modal.classList.add('hidden'); modal.style.display = 'none'; try{ document.body.classList.remove('modal-open'); }catch(e){} const msg=$('auth-message'); if(msg) msg.textContent=''; }

function trapFocus(modal){ const focusable = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'; const nodes = Array.from(modal.querySelectorAll(focusable)).filter(n=>!n.hasAttribute('disabled')); if(nodes.length===0) return; const first = nodes[0]; const last = nodes[nodes.length-1]; function keyHandler(e){ if(e.key === 'Tab'){ if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); } } if(e.key === 'Escape'){ hideAuth(); } } modal._keyHandler = keyHandler; document.addEventListener('keydown', keyHandler); const observer = new MutationObserver(()=>{ if(modal.hidden){ document.removeEventListener('keydown', keyHandler); observer.disconnect(); } }); modal._observer = observer; observer.observe(modal, {attributes:true, attributeFilter:['hidden']}); }

function handleAuthSubmitForm(e){ e.preventDefault(); const mode = $('auth-submit').dataset.mode || 'login'; const username = $('auth-username').value.trim(); const password = $('auth-password').value; const role = $('auth-role') ? $('auth-role').value : 'customer'; const msg = $('auth-message'); if(!username){ if(msg) msg.textContent='Please enter a username'; if($('auth-username')) $('auth-username').focus(); return; } if(!password){ if(msg) msg.textContent='Please enter a password'; if($('auth-password')) $('auth-password').focus(); return; } const users = getUsers(); if(mode==='register'){ if(users.find(u=>u.username===username)){ if(msg) msg.textContent='Username already taken'; return; } users.push({username,password,role}); saveUsers(users); if(msg) msg.textContent='Registered — you can now login'; const tabLogin = document.getElementById('tab-login'); if(tabLogin) tabLogin.click(); return; } const user = users.find(u=>u.username===username && u.password===password); if(!user){ if(msg) msg.textContent='Invalid username or password'; return; } const guest = getGuestCart(); const sessionCart = []; const existing = user._cart || []; existing.forEach(it=>sessionCart.push({...it})); guest.forEach(g=>{ const f = sessionCart.find(s=>s.id===g.id); if(f) f.qty += g.qty; else sessionCart.push({...g}); }); saveGuestCart([]); saveSession({user,cart:sessionCart}); hideAuth(); applySession(); setTimeout(()=>{ renderProducts(); updateCartCount(); renderCartItems(); },50); }

function applySession(){ const s = getSession(); const adminPanel = $('admin-panel'); const productSection = $('product-section'); if(s && s.user){ if($('btn-login')) $('btn-login').hidden=true; if($('btn-register')) $('btn-register').hidden=true; if($('btn-logout')) $('btn-logout').hidden=false; if($('user-role')) $('user-role').textContent = s.user.username + ' (' + s.user.role + ')'; if(s.user.role === 'admin'){ if(adminPanel){ adminPanel.classList.remove('hidden'); adminPanel.hidden=false; adminPanel.setAttribute('aria-hidden','false'); adminPanel.style.display='block'; } if(productSection){ productSection.classList.add('hidden'); productSection.hidden=true; productSection.style.display='none'; } } else { if(adminPanel){ adminPanel.classList.add('hidden'); adminPanel.hidden=true; adminPanel.setAttribute('aria-hidden','true'); adminPanel.style.display='none'; } if(productSection){ productSection.classList.remove('hidden'); productSection.hidden=false; productSection.style.display='block'; } } } else { if($('btn-login')) $('btn-login').hidden=false; if($('btn-register')) $('btn-register').hidden=false; if($('btn-logout')) $('btn-logout').hidden=true; if($('user-role')) $('user-role').textContent=''; if(adminPanel){ adminPanel.classList.add('hidden'); adminPanel.hidden=true; adminPanel.setAttribute('aria-hidden','true'); adminPanel.style.display='none'; } if(productSection){ productSection.classList.remove('hidden'); productSection.hidden=false; productSection.style.display='block'; } } updateCartCount(); if(s && s.user && s.user.role === 'admin'){ renderAdmin(); renderAdminProducts(); } else { renderProducts(); } }

function logout(){ clearSession(); applySession(); }

// Admin: Orders
function renderAdmin(){ const panel = $('admin-panel'); if(!panel || panel.hidden) return; const orders = getOrders(); const stats = `<div>Orders total: ${orders.length}</div><div>Pending: ${orders.filter(o=>o.status==='pending').length}</div><div>Accepted: ${orders.filter(o=>o.status==='accepted').length}</div>`; if($('admin-stats')) $('admin-stats').innerHTML = stats; const filter = $('admin-filter') ? $('admin-filter').value : 'all'; const list = $('admin-orders'); if(list) list.innerHTML = ''; orders.filter(o => filter === 'all' || o.status === filter).forEach(o => { const d = document.createElement('div'); d.className = 'card'; d.innerHTML = `<strong>${o.id}</strong> by ${o.user} • ${new Date(o.created).toLocaleString()}<div>Status: ${o.status}</div>`; if(Array.isArray(o.history) && o.history.length){ const h = document.createElement('div'); h.className = 'order-history'; h.innerHTML = o.history.map(entry=>`<div class="small">${new Date(entry.time).toLocaleString()} — ${entry.status}${entry.note?(' - '+entry.note):''}</div>`).join(''); d.appendChild(h); } if(o.status === 'pending'){ const a = document.createElement('button'); a.className = 'btn'; a.textContent = 'Accept'; a.onclick = () => { const all = getOrders(); const f = all.find(x => x.id === o.id); if(f){ f.status = 'accepted'; f.history = f.history || []; f.history.push({status:'accepted', time:Date.now(), note:'accepted by admin'}); saveOrders(all); renderAdmin(); } }; const r = document.createElement('button'); r.className = 'btn ghost'; r.textContent = 'Reject'; r.onclick = () => { const all = getOrders(); const f = all.find(x => x.id === o.id); if(f){ f.status = 'rejected'; f.history = f.history || []; f.history.push({status:'rejected', time:Date.now(), note:'rejected by admin'}); saveOrders(all); renderAdmin(); } }; a.style.marginRight = '8px'; r.style.marginRight = '8px'; d.appendChild(a); d.appendChild(r); } if(list) list.appendChild(d); }); }

// Admin: Product management
function renderAdminProducts(){ const container = $('admin-products'); if(!container) return; container.innerHTML = ''; const prods = getProducts(); if(!prods || prods.length === 0){ container.innerHTML = '<div class="small">No products</div>'; return; } prods.forEach(p => { const d = document.createElement('div'); d.className = 'card'; d.style.display = 'flex'; d.style.justifyContent = 'space-between'; d.style.alignItems = 'center'; d.innerHTML = `<div><strong>${p.name}</strong><div class="small">${p.category} • stock: ${p.stock} • $${p.price.toFixed(2)}</div></div>`; const controls = document.createElement('div'); controls.style.display = 'flex'; controls.style.gap = '8px'; const edit = document.createElement('button'); edit.className = 'btn'; edit.textContent = 'Edit'; edit.addEventListener('click', () => openEditProduct(p.id)); const del = document.createElement('button'); del.className = 'btn ghost'; del.textContent = 'Delete'; del.addEventListener('click', () => { if(confirm('Delete product?')) deleteProduct(p.id); }); controls.appendChild(edit); controls.appendChild(del); d.appendChild(controls); container.appendChild(d); }); }

function openEditProduct(id){ const prods = getProducts(); const p = prods.find(x => x.id === id); if(!p) return; if($('prod-id')) $('prod-id').value = p.id; if($('prod-name')) $('prod-name').value = p.name; if($('prod-category')) $('prod-category').value = p.category; if($('prod-price')) $('prod-price').value = p.price; if($('prod-stock')) $('prod-stock').value = p.stock; const el = $('prod-name'); if(el) el.focus(); }
function clearProductForm(){ ['prod-id','prod-name','prod-category','prod-price','prod-stock'].forEach(id => { const el = $(id); if(el) el.value = ''; }); }
function saveProduct(){ const id = $('prod-id').value.trim(); const name = $('prod-name').value.trim(); const category = $('prod-category').value.trim(); const price = parseFloat($('prod-price').value) || 0; const stock = parseInt($('prod-stock').value,10) || 0; if(!name || !category){ alert('Please enter name and category'); return; } const prods = getProducts(); if(id){ const found = prods.find(p => p.id === id); if(found){ found.name = name; found.category = category; found.price = price; found.stock = stock; saveProducts(prods); } } else { const nid = 'p' + Date.now(); prods.push({id: nid, name, category, price, stock}); saveProducts(prods); } clearProductForm(); renderAdminProducts(); renderProducts(); }
function deleteProduct(id){ const prods = getProducts(); const idx = prods.findIndex(p => p.id === id); if(idx > -1){ prods.splice(idx,1); saveProducts(prods); renderAdminProducts(); renderProducts(); } }

function exportOrdersCSV(){ const orders = getOrders(); if(!orders.length){ alert('No orders to export'); return; } const rows = [['order_id','user','status','created','items','history']]; orders.forEach(o => { const items = o.items.map(i => `${i.id}x${i.qty}`).join('|'); const history = (o.history || []).map(h => `${new Date(h.time).toISOString()}:${h.status}`).join('|'); rows.push([o.id, o.user, o.status, new Date(o.created).toISOString(), `"${items}"`, `"${history}"`]); }); const csv = rows.map(r => r.join(',')).join('\n'); const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

// Small helpers for opening/closing panels
function openCart(){ const panel = $('cart-panel'); if(panel) panel.classList.remove('hidden'); renderCartItems(); }
function closeCart(){ const panel = $('cart-panel'); if(panel) panel.classList.add('hidden'); }
function openOrders(){ const panel = $('orders-panel'); if(panel) panel.classList.remove('hidden'); renderOrders(); }
function closeOrders(){ const panel = $('orders-panel'); if(panel) panel.classList.add('hidden'); }

// Orders panel render (for customers)
function renderOrders(){ const list = $('orders-list'); if(!list) return; const s = getSession(); if(!s||!s.user){ list.innerHTML = '<div class="small">Please login to see orders</div>'; return; } const orders = getOrders().filter(o=>o.user === s.user.username); if(!orders.length){ list.innerHTML = '<div class="small">No orders</div>'; return; } list.innerHTML = ''; orders.forEach(o=>{ const d = document.createElement('div'); d.className = 'card'; d.innerHTML = `<strong>${o.id}</strong> • ${new Date(o.created).toLocaleString()}<div>Status: ${o.status}</div>`; if(Array.isArray(o.history) && o.history.length){ const h = document.createElement('div'); h.className = 'order-history'; h.innerHTML = o.history.map(entry=>`<div class="small">${new Date(entry.time).toLocaleString()} — ${entry.status}</div>`).join(''); d.appendChild(h); } list.appendChild(d); }); }

// Event binding  
function bind(){ const filter = $('filter-category'); if(filter) filter.addEventListener('change', renderProducts);

  document.body.addEventListener('click', e=>{ const t = e.target; if(!t) return; if(t.classList && t.classList.contains('add')){ const id = t.dataset.id; const qtyInput = document.querySelector('input.qty[data-id="'+id+'"]'); const qty = qtyInput ? parseInt(qtyInput.value||1,10) : 1; addToCart(id,qty); alert('Added to cart'); renderCartItems(); updateCartCount(); } if(t.classList && t.classList.contains('remove')){ const id = t.dataset.id; const cart = getCart(); const idx = cart.findIndex(c=>c.id===id); if(idx>-1){ cart.splice(idx,1); saveCart(cart); renderCartItems(); updateCartCount(); } } });

  const btnCart = $('btn-cart'); if(btnCart) btnCart.addEventListener('click', openCart);
  const btnCheckout = $('btn-checkout'); if(btnCheckout) btnCheckout.addEventListener('click', checkout);
  const btnLogin = $('btn-login'); if(btnLogin) btnLogin.addEventListener('click', ()=>showAuth('Login'));
  const btnRegister = $('btn-register'); if(btnRegister) btnRegister.addEventListener('click', ()=>showAuth('Register'));
  const authCancel = $('auth-cancel'); if(authCancel) authCancel.addEventListener('click', hideAuth);
  const tabLogin = $('tab-login'); if(tabLogin) tabLogin.addEventListener('click', ()=>{ document.querySelectorAll('.auth-tabs .tab').forEach(t=>t.classList.remove('active')); tabLogin.classList.add('active'); if($('role-field')) $('role-field').style.display='none'; if($('auth-title')) $('auth-title').textContent='Login'; if($('auth-submit')) $('auth-submit').dataset.mode='login'; });
  const tabRegister = $('tab-register'); if(tabRegister) tabRegister.addEventListener('click', ()=>{ document.querySelectorAll('.auth-tabs .tab').forEach(t=>t.classList.remove('active')); tabRegister.classList.add('active'); if($('role-field')) $('role-field').style.display='block'; if($('auth-title')) $('auth-title').textContent='Register'; if($('auth-submit')) $('auth-submit').dataset.mode='register'; });
  const togglePassword = $('toggle-password'); if(togglePassword) togglePassword.addEventListener('click', ()=>{ const pw = $('auth-password'); const btn = $('toggle-password'); if(pw && pw.type==='password'){ pw.type='text'; btn.textContent='Hide'; } else if(pw){ pw.type='password'; btn.textContent='Show'; } });

  const authForm = $('auth-form'); if(authForm) authForm.addEventListener('submit', handleAuthSubmitForm);
  const btnLogout = $('btn-logout'); if(btnLogout) btnLogout.addEventListener('click', logout);
  const btnCartClose = $('btn-cart-close'); if(btnCartClose) btnCartClose.addEventListener('click', closeCart);
  const btnOrders = $('btn-orders'); if(btnOrders) btnOrders.addEventListener('click', openOrders);
  const btnOrdersClose = $('btn-orders-close'); if(btnOrdersClose) btnOrdersClose.addEventListener('click', closeOrders);

  const adminFilter = $('admin-filter'); if(adminFilter) adminFilter.addEventListener('change', ()=>renderAdmin());
  const adminExport = $('admin-export'); if(adminExport) adminExport.addEventListener('click', exportOrdersCSV);

  // admin product form bindings
  const prodSave = $('prod-save'); if(prodSave) prodSave.addEventListener('click', saveProduct);
  const prodCancel = $('prod-cancel'); if(prodCancel) prodCancel.addEventListener('click', clearProductForm);

  // click outside modal to close
  document.addEventListener('click', e=>{ const modal = $('auth-modal'); if(!modal || modal.hidden) return; if(e.target === modal) hideAuth(); });

  // cart qty input handler
  document.addEventListener('input', e=>{ if(e.target && e.target.classList && e.target.classList.contains('cart-qty')){ const id = e.target.dataset.id; const qty = Number(e.target.value)||1; const cart = getCart(); const it = cart.find(c=>c.id===id); if(it){ it.qty = qty; saveCart(cart); renderCartItems(); updateCartCount(); } } });
}

// Init
initData(); bind(); renderProducts(); applySession();

// ensure auth modal hidden at start
const am = $('auth-modal'); if(am) am.classList.add('hidden');

// global escape
document.addEventListener('keydown', e=>{ if(e.key === 'Escape'){ const m = $('auth-modal'); if(m && !m.hidden) hideAuth(); } });
