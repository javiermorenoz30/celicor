(()=>{
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const money=n=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
let products=[],selectedBrand='Todas',site={},spriteObjectUrl='';
let cart=[];
try{const saved=JSON.parse(localStorage.getItem('celicor-cart')||'[]');cart=Array.isArray(saved)?saved:[]}catch(e){localStorage.removeItem('celicor-cart')}
cart=cart.filter(x=>x&&Number.isFinite(+x.id)&&Number.isFinite(+x.qty)&&+x.qty>0).map(x=>({id:+x.id,qty:+x.qty}));

// The repository sprite is 1280x1408: 10 columns x 11 rows, 128px per source cell.
const spriteStyle=id=>{const n=Number(id)-1;return `--sx:${n%10};--sy:${Math.floor(n/10)}`};
function toast(text){const el=$('#toast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800)}
function sessionId(){let id=localStorage.getItem('celicor-session');if(!id){id=crypto.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('celicor-session',id)}return id}
function track(event,meta={}){fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,path:location.pathname,session_id:sessionId(),meta}),keepalive:true}).catch(()=>{})}
function saveCart(){localStorage.setItem('celicor-cart',JSON.stringify(cart));renderCart()}

function renderChips(){const box=$('#chips');if(!box)return;const brands=['Todas',...new Set(products.map(p=>p.brand))];box.innerHTML=brands.map(b=>`<button class="chip ${b===selectedBrand?'active':''}" data-brand="${b}">${b}</button>`).join('');$$('[data-brand]').forEach(b=>b.onclick=()=>{selectedBrand=b.dataset.brand;renderChips();renderProducts()})}
function productVisual(p){if(p.image)return `<img class="productImg" src="${p.image}" alt="${p.brand} ${p.name}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><div class="photo" style="display:none;${spriteStyle(p.id)}" role="img" aria-label="${p.brand} ${p.name}"></div>`;return `<div class="photo" role="img" aria-label="${p.brand} ${p.name}" style="${spriteStyle(p.id)}"></div>`}
function renderProducts(){const grid=$('#grid');if(!grid)return;const q=($('#search')?.value||'').trim().toLowerCase();let list=products.filter(p=>(selectedBrand==='Todas'||p.brand===selectedBrand)&&`${p.brand} ${p.name} ${p.size} ${p.desc||''}`.toLowerCase().includes(q));const sort=$('#sort')?.value||'featured';if(sort==='asc')list.sort((a,b)=>a.price-b.price);else if(sort==='desc')list.sort((a,b)=>b.price-a.price);else if(sort==='name')list.sort((a,b)=>(a.brand+' '+a.name).localeCompare(b.brand+' '+b.name));if($('#resultCount'))$('#resultCount').textContent=`${list.length} productos`;grid.innerHTML=list.map(p=>`<article class="card"><div class="visual"><span class="badge">${p.brand}</span><span class="size">${p.size}</span>${productVisual(p)}</div><div class="info"><small>RON · PÁG. ${p.page||'—'}</small><h3>${p.name}</h3><p class="desc">${p.desc||''}</p><div class="priceRow"><div class="price">${money(p.price)}</div>${p.box_price?`<div class="box">Caja ${p.box_qty||''} uds.<br><b>${money(p.box_price)}</b></div>`:''}</div><button class="add" data-add="${p.id}">Agregar al carrito</button></div></article>`).join('');$$('[data-add]').forEach(b=>b.onclick=()=>add(+b.dataset.add))}
function add(id){const item=cart.find(x=>x.id===id);item?item.qty++:cart.push({id,qty:1});saveCart();openCart();track('add_to_cart',{product_id:id});toast('Producto agregado')}
function changeQty(id,d){const item=cart.find(x=>x.id===id);if(!item)return;item.qty+=d;if(item.qty<=0)cart=cart.filter(x=>x.id!==id);saveCart()}
function renderCart(){if(!$('#count')||!$('#cartItems')||!$('#total'))return;const clean=cart.filter(x=>products.some(p=>p.id===x.id));if(products.length&&clean.length!==cart.length){cart=clean;localStorage.setItem('celicor-cart',JSON.stringify(cart))}$('#count').textContent=cart.reduce((s,x)=>s+x.qty,0);$('#cartItems').innerHTML=cart.length?cart.map(x=>{const p=products.find(p=>p.id===x.id);if(!p)return'';return `<div class="cartRow"><div><b>${p.brand} · ${p.name}</b><small>${p.size} · ${money(p.price)}</small></div><div class="qty"><button data-minus="${p.id}">−</button><b>${x.qty}</b><button data-plus="${p.id}">+</button><button class="remove" data-remove="${p.id}">Quitar</button></div></div>`}).join(''):'<p style="color:var(--muted)">Tu carrito está vacío.</p>';$('#total').textContent=money(cart.reduce((s,x)=>{const p=products.find(p=>p.id===x.id);return s+(p?p.price*x.qty:0)},0));$$('[data-minus]').forEach(b=>b.onclick=()=>changeQty(+b.dataset.minus,-1));$$('[data-plus]').forEach(b=>b.onclick=()=>changeQty(+b.dataset.plus,1));$$('[data-remove]').forEach(b=>b.onclick=()=>{cart=cart.filter(x=>x.id!==+b.dataset.remove);saveCart()})}
function openOverlay(id){$(id)?.classList.add('open');document.body.classList.add('lock')}
function closeOverlay(id){$(id)?.classList.remove('open');if(!$('.overlay.open'))document.body.classList.remove('lock')}
function openCart(){openOverlay('#cartOverlay')}
function makeOrder(){if(!cart.length){toast('Tu carrito está vacío');return}track('checkout_open',{items:cart.reduce((s,x)=>s+x.qty,0)});closeOverlay('#cartOverlay');openOverlay('#checkoutOverlay')}
async function sendOrder(e){e.preventDefault();const fd=new FormData(e.currentTarget),mode=fd.get('modalidad'),addr=(fd.get('direccion')||'').trim();if(mode==='Delivery'&&!addr){toast('Indica la dirección de delivery');return}const items=cart.map(x=>{const p=products.find(p=>p.id===x.id);return p?{id:p.id,brand:p.brand,name:p.name,size:p.size,qty:x.qty,unit_price:p.price,total:p.price*x.qty}:null}).filter(Boolean),total=items.reduce((s,x)=>s+x.total,0),payload={customer_name:fd.get('nombre'),phone:fd.get('telefono'),mode,payment:fd.get('pago'),address:addr,total,items};fetch('/api/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});track('checkout',{total,items:items.length});const lines=items.map(x=>`• ${x.brand} ${x.name} (${x.size}) x${x.qty} — ${money(x.total)}`),msg=[`Hola CELICOR La Castellana, quiero hacer un pedido:`,...lines,'',`Total estimado: ${money(total)}`,`Nombre: ${payload.customer_name}`,`Teléfono: ${payload.phone}`,`Modalidad: ${mode}`,`Pago: ${payload.payment}`,addr?`Dirección: ${addr}`:''].filter(Boolean).join('\n');window.open(`https://wa.me/${site.whatsapp||'584242583500'}?text=${encodeURIComponent(msg)}`,'_blank','noopener');closeOverlay('#checkoutOverlay')}

function imageLoads(src){return new Promise((ok,fail)=>{const img=new Image();img.onload=()=>ok(src);img.onerror=fail;img.src=src})}
async function loadSprite(){
  // Prefer the generated binary when GitHub Actions has built it.
  const direct='assets/products-sprite.webp?v=10';
  try{await imageLoads(direct);document.documentElement.style.setProperty('--sprite',`url("${direct}")`);return true}catch(e){}
  // Fallback: rebuild the first valid RIFF WebP in-browser from the repo chunks.
  try{
    const files=Array.from({length:14},(_,i)=>`assets/products-sprite128/part-${String(i).padStart(2,'0')}.txt?v=10`);
    const parts=await Promise.all(files.map(u=>fetch(u,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(u);return r.text()})));
    const all=parts.join('').replace(/\s+/g,'');
    const header=atob(all.slice(0,40));
    if(header.slice(0,4)!=='RIFF'||header.slice(8,12)!=='WEBP')throw Error('Cabecera WebP inválida');
    const riffSize=(header.charCodeAt(4)|(header.charCodeAt(5)<<8)|(header.charCodeAt(6)<<16)|(header.charCodeAt(7)<<24))>>>0;
    const fileSize=riffSize+8;
    const needed=Math.ceil(fileSize/3)*4;
    const raw=atob(all.slice(0,needed));
    const bytes=new Uint8Array(fileSize);
    for(let i=0;i<fileSize;i++)bytes[i]=raw.charCodeAt(i);
    const blob=new Blob([bytes],{type:'image/webp'});
    spriteObjectUrl=URL.createObjectURL(blob);
    await imageLoads(spriteObjectUrl);
    document.documentElement.style.setProperty('--sprite',`url("${spriteObjectUrl}")`);
    return true;
  }catch(e){console.error('CELICOR product sprite error',e);return false}
}
async function loadSite(){try{site=await fetch('data/site.json?v=10',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('site');return r.json()});const h=$('.hero');if(h&&site.hero){if(h.querySelector('.eyebrow'))h.querySelector('.eyebrow').textContent=site.hero.eyebrow||h.querySelector('.eyebrow').textContent;if(h.querySelector('h1'))h.querySelector('h1').innerHTML=`${site.hero.titleLine1||'Elegancia para'}<br><em>${site.hero.titleLine2||'cada brindis.'}</em>`;if(h.querySelector('p'))h.querySelector('p').textContent=site.hero.description||h.querySelector('p').textContent;const btn=h.querySelectorAll('.heroBtns a');if(btn[0])btn[0].textContent=site.hero.primaryCta||btn[0].textContent;if(btn[1])btn[1].textContent=site.hero.secondaryCta||btn[1].textContent}const ch=$('.catalog .sectionHead h2');if(ch&&site.catalog?.headline)ch.textContent=site.catalog.headline}catch(e){site={}}}
async function loadProducts(){const parts=await Promise.all(['data/rones-1.json','data/rones-2.json','data/rones-3.json','data/rones-4.json'].map(u=>fetch(u+'?v=10',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(u);return r.json()})));products=parts.flat().map((p,i)=>({...p,id:i+1}));renderChips();renderProducts();renderCart()}
function bind(){if($('#search'))$('#search').oninput=renderProducts;if($('#sort'))$('#sort').onchange=renderProducts;if($('#cartOpen'))$('#cartOpen').onclick=openCart;if($('#cartClose'))$('#cartClose').onclick=()=>closeOverlay('#cartOverlay');if($('#cartShade'))$('#cartShade').onclick=()=>closeOverlay('#cartOverlay');if($('#checkoutBtn'))$('#checkoutBtn').onclick=makeOrder;if($('#checkoutClose'))$('#checkoutClose').onclick=()=>closeOverlay('#checkoutOverlay');if($('#checkoutShade'))$('#checkoutShade').onclick=()=>closeOverlay('#checkoutOverlay');if($('#checkoutForm'))$('#checkoutForm').onsubmit=sendOrder;if($('#yes'))$('#yes'].onclick=()=>{};
}
async function init(){
  // Template is executed before this deferred script, so all storefront elements exist here.
  if($('#search'))$('#search').oninput=renderProducts;
  if($('#sort'))$('#sort').onchange=renderProducts;
  if($('#cartOpen'))$('#cartOpen').onclick=openCart;
  if($('#cartClose'))$('#cartClose').onclick=()=>closeOverlay('#cartOverlay');
  if($('#cartShade'))$('#cartShade').onclick=()=>closeOverlay('#cartOverlay');
  if($('#checkoutBtn'))$('#checkoutBtn').onclick=makeOrder;
  if($('#checkoutClose'))$('#checkoutClose').onclick=()=>closeOverlay('#checkoutOverlay');
  if($('#checkoutShade'))$('#checkoutShade').onclick=()=>closeOverlay('#checkoutOverlay');
  if($('#checkoutForm'))$('#checkoutForm').onsubmit=sendOrder;
  if($('#yes'))$('#yes').onclick=()=>{$('#age')?.classList.add('hide');localStorage.setItem('celicor-age','yes')};
  if($('#no'))$('#no').onclick=()=>location.href='https://www.google.com';
  if(localStorage.getItem('celicor-age')==='yes')$('#age')?.classList.add('hide');
  try{const [,photosReady]=await Promise.all([loadProducts(),loadSprite(),loadSite()]);track('pageview');if(!photosReady)toast('No se pudieron cargar algunas fotos')}catch(e){console.error(e);if($('#resultCount'))$('#resultCount').textContent='Error al cargar';if($('#grid'))$('#grid').innerHTML='<p>No se pudo cargar el catálogo. Intenta recargar la página.</p>'}
}
window.addEventListener('beforeunload',()=>{if(spriteObjectUrl)URL.revokeObjectURL(spriteObjectUrl)});
document.addEventListener('DOMContentLoaded',init);
})();