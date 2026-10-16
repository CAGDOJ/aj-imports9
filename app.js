'use strict';
const API_ORIGIN="https://aj-imports9.carlosjralfa.chatgpt.site";
const WHATSAPP='https://wa.me/5591980793350';
const $=s=>document.querySelector(s);
let products=[],category='Todos',cart=[],submitting=false,pendingOrder=null,receipt=null,catalogReady=false,detailProduct=null,detailPhotos=[],photoIndex=0;
try{const saved=JSON.parse(localStorage.getItem('aj-selection')||'[]');if(Array.isArray(saved))cart=saved.filter(x=>x&&typeof x.id==='string'&&Number.isInteger(x.qty)&&x.qty>0).slice(0,100)}catch{}
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const imageUrl=src=>src.startsWith('/api/images/')?API_ORIGIN+src:src;
function photosOf(p){let photos=p.photos;try{if(typeof photos==='string')photos=JSON.parse(photos)}catch{photos=[]}return [...new Set([p.image,...(Array.isArray(photos)?photos:[])].filter(s=>typeof s==='string'&&s))].slice(0,8)}
function text(tag,value,cls){const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e}
function toast(message){$('#toast').textContent=message;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',2800)}
function totals(){return cart.reduce((sum,item)=>{const p=products.find(p=>p.id===item.id);sum.count+=item.qty;if(p)sum.cents+=Math.round(p.price*100)*item.qty;return sum},{count:0,cents:0})}
function updateBag(){const sum=totals();$('#count').textContent=sum.count;$('#floatingCount').textContent=sum.count;$('#floatingTotal').textContent=sum.count?(catalogReady?money(sum.cents/100)+' · Ver sacola':'Carregando subtotal…'):'Sua sacola está vazia';$('#floatingBag').setAttribute('aria-label',`Abrir sacola: ${sum.count} item(ns)${catalogReady?', subtotal '+money(sum.cents/100):''}`);$('#floatingBag').classList.toggle('has-items',sum.count>0)}
function persist(){if(!submitting){pendingOrder=null;receipt=null;$('#orderSuccess').hidden=true;$('#orderError').hidden=true;$('#selectionHint').hidden=false}try{localStorage.setItem('aj-selection',JSON.stringify(cart))}catch{}updateBag()}
function addItem(p,qty=1){if(submitting)return false;const existing=cart.find(x=>x.id===p.id),current=existing?.qty||0;if(!Number.isSafeInteger(qty)||qty<1||current+qty>p.stock){toast('Essa quantidade excede o estoque disponível.');return false}if(existing)existing.qty+=qty;else cart.push({id:p.id,qty});persist();return true}
function render(){
 const list=products.filter(p=>(category==='Todos'||p.category===category)&&p.name.toLocaleLowerCase('pt-BR').includes($('#search').value.toLocaleLowerCase('pt-BR')));
 const sort=$('#sort').value;list.sort((a,b)=>sort==='low'?a.price-b.price:sort==='high'?b.price-a.price:sort==='name'?a.name.localeCompare(b.name):0);
 $('#products').replaceChildren();$('#empty').hidden=list.length>0;$('#resultsCount').textContent=products.length?`${list.length} produto(s) encontrado(s)`:'';
 if(products.length&&!list.length){$('#empty h3').textContent='Nenhum produto encontrado.';$('#empty>p:not(.eyebrow)').textContent='Tente outra busca ou selecione outra categoria.'}
 for(const p of list){
  const el=text('article','','product'),open=text('button','','product-open');open.type='button';open.setAttribute('aria-label','Ver detalhes de '+p.name);open.setAttribute('aria-haspopup','dialog');open.onclick=()=>openProduct(p);
  const cover=photosOf(p)[0];if(cover){const img=document.createElement('img');img.src=imageUrl(cover);img.alt=p.name;img.loading='lazy';open.append(img)}else open.append(text('div','Foto em breve','product-placeholder'));
  open.append(text('span',p.category,'eyebrow'),text('h3',p.name),text('span',money(p.price),'product-price'),text('span','Ver detalhes','product-details-label'));
  const add=text('button',p.stock===0?'Indisponível':'Adicionar à sacola','product-add');add.type='button';add.disabled=p.stock===0;add.onclick=()=>{if(addItem(p))toast('Produto adicionado à sacola')};el.append(open,add);$('#products').append(el);
 }
}
function selectionMessage(){const lines=cart.map(x=>{const p=products.find(p=>p.id===x.id);return p?`${x.qty}x ${p.name} (${p.id}) — ${money(p.price)}`:''}).filter(Boolean);return lines.length?'Olá, AJ Imports! Tenho interesse nestes produtos:\n'+lines.join('\n')+'\nGostaria de confirmar disponibilidade, pagamento e entrega.':'Olá, AJ Imports! Gostaria de saber mais sobre os produtos.'}
function renderCart(){
 $('#cartItems').replaceChildren();
 for(const item of cart){const p=products.find(p=>p.id===item.id);if(!p)continue;
  const row=text('div','','cart-item');const cover=photosOf(p)[0];if(cover){const img=document.createElement('img');img.src=imageUrl(cover);img.alt=p.name;row.append(img)}
  const info=text('div','','cart-item-info');info.append(text('strong',p.name),text('p',money(p.price)+' por unidade'));
  const controls=text('div','','quantity-controls');
  const minus=text('button','−');minus.type='button';minus.setAttribute('aria-label',`Diminuir quantidade de ${p.name}`);minus.disabled=submitting;
  const value=text('span',String(item.qty));value.setAttribute('aria-label','Quantidade');
  const plus=text('button','+');plus.type='button';plus.setAttribute('aria-label',`Aumentar quantidade de ${p.name}`);plus.disabled=submitting||item.qty>=p.stock;
  minus.onclick=()=>{if(submitting)return;if(item.qty>1)item.qty--;else cart=cart.filter(x=>x!==item);persist();renderCart()};plus.onclick=()=>{if(addItem(p)){renderCart()}};
  controls.append(minus,value,plus);info.append(controls);
  const end=text('div','','cart-item-end');end.append(text('strong',money(Math.round(p.price*100)*item.qty/100)));
  const remove=text('button','Remover');remove.type='button';remove.setAttribute('aria-label','Remover '+p.name+' da sacola');remove.disabled=submitting;remove.onclick=()=>{if(submitting)return;cart=cart.filter(x=>x!==item);persist();renderCart()};end.append(remove);row.append(info,end);$('#cartItems').append(row);
 }
 if(!cart.length&&!receipt)$('#cartItems').append(text('p','Sua sacola está vazia. Explore o catálogo e adicione seus produtos favoritos.','muted'));
 $('#total').textContent=cart.length?`Subtotal: ${money(totals().cents/100)} • Entrega a combinar`:'';$('#copy').hidden=!cart.length;$('#orderForm').hidden=!catalogReady||!cart.length||!!receipt;$('#orderSuccess').hidden=!receipt;
 $('#sendWhatsApp').href=WHATSAPP+'?text='+encodeURIComponent(selectionMessage());$('#sendWhatsApp').textContent='Tirar uma dúvida pelo WhatsApp';updateBag();
}
function syncModal(){document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'))}
function openCart(){if($('#productDetails').open)$('#productDetails').close();renderCart();if(!$('#cart').open)$('#cart').showModal();syncModal()}
$('#openBag').onclick=openCart;$('#floatingBag').onclick=openCart;$('#cart .close').onclick=()=>{if(!submitting)$('#cart').close()};
for(const dialog of [$('#cart'),$('#productDetails')]){dialog.addEventListener('close',syncModal);dialog.addEventListener('cancel',e=>{if(submitting)e.preventDefault()});dialog.addEventListener('click',e=>{if(!submitting&&e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}})}
function updateDetailBuy(){if(!detailProduct)return;const available=Math.max(0,detailProduct.stock-(cart.find(x=>x.id===detailProduct.id)?.qty||0));$('#detailQuantity').max=String(available||1);$('#detailQuantity').disabled=!available;$('#detailAdd').disabled=!available;$('#detailAdd').textContent=available?'Adicionar à sacola':detailProduct.stock?'Todo o estoque está na sacola':'Indisponível';$('#detailStock').textContent=detailProduct.stock?`${detailProduct.stock} unidade(s) disponível(is) · ${cart.find(x=>x.id===detailProduct.id)?.qty||0} na sua sacola`:'Produto indisponível no momento';if(Number($('#detailQuantity').value)>available)$('#detailQuantity').value=String(Math.max(1,available))}
function showPhoto(index){photoIndex=(index+detailPhotos.length)%Math.max(1,detailPhotos.length);const src=detailPhotos[photoIndex];$('#detailImage').hidden=!src;$('#detailNoPhoto').hidden=!!src;if(src){$('#detailImage').src=imageUrl(src);$('#detailImage').alt=`${detailProduct.name} — foto ${photoIndex+1}` }else $('#detailImage').removeAttribute('src');$('#previousPhoto').hidden=$('#nextPhoto').hidden=detailPhotos.length<2;$('#photoCounter').hidden=!src;$('#photoCounter').textContent=`${photoIndex+1} / ${detailPhotos.length}`;$('#photoThumbnails').querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===photoIndex));b.classList.toggle('selected',i===photoIndex)})}
function openProduct(p){
 detailProduct=p;detailPhotos=photosOf(p);$('#detailName').textContent=p.name;$('#detailCategory').textContent=p.category;$('#detailPrice').textContent=money(p.price);$('#detailDescription').textContent=p.description||'Entre em contato com a AJ Imports para saber mais sobre este produto.';
 $('#detailSpecs').replaceChildren();const specs=String(p.specifications||'').split('\n').map(s=>s.trim()).filter(Boolean);$('#detailSpecsSection').hidden=!specs.length;
 for(const line of specs){const row=text('div','','spec-row'),colon=line.indexOf(':');if(colon>0)row.append(text('dt',line.slice(0,colon)),text('dd',line.slice(colon+1).trim()));else row.append(text('dd',line,'spec-full'));$('#detailSpecs').append(row)}
 $('#photoThumbnails').replaceChildren();detailPhotos.forEach((src,i)=>{const button=text('button','');button.type='button';button.setAttribute('aria-label',`Ver foto ${i+1} de ${p.name}`);const img=document.createElement('img');img.src=imageUrl(src);img.alt='';button.append(img);button.onclick=()=>showPhoto(i);$('#photoThumbnails').append(button)});showPhoto(0);
 $('#detailContact').href=WHATSAPP+'?text='+encodeURIComponent(`Olá, AJ Imports! Gostaria de saber mais sobre ${p.name} (${p.id}).`);$('#detailQuantity').value='1';$('#detailFeedback').textContent='';updateDetailBuy();$('#productDetails').showModal();syncModal();
}
$('#previousPhoto').onclick=()=>showPhoto(photoIndex-1);$('#nextPhoto').onclick=()=>showPhoto(photoIndex+1);$('#closeDetails').onclick=()=>$('#productDetails').close();$('#detailBag').onclick=openCart;
$('#detailAdd').onclick=()=>{const qty=Number($('#detailQuantity').value);if(!$('#detailQuantity').reportValidity())return;if(addItem(detailProduct,qty)){$('#detailFeedback').textContent=`${qty} unidade(s) adicionada(s) à sacola.`;updateDetailBuy()}};
$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(selectionMessage());toast('Seleção copiada. Cole na conversa com a loja.')}catch{toast('Não foi possível copiar. Confira os itens na sacola.')}};
$('#search').oninput=render;$('#sort').onchange=render;$('#year').textContent=new Date().getFullYear();updateBag();
fetch(API_ORIGIN+'/api/products',{credentials:'omit',cache:'no-store'}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{
 products=(Array.isArray(data)?data:[]).filter(p=>typeof p.id==='string'&&typeof p.name==='string'&&typeof p.category==='string'&&Number.isFinite(p.price)&&p.price>=0&&Number.isInteger(p.stock)&&p.stock>=0);catalogReady=true;
 const previous=JSON.stringify(cart);cart=cart.filter(x=>products.some(p=>p.id===x.id&&p.stock>0)).map(x=>({...x,qty:Math.min(x.qty,products.find(p=>p.id===x.id).stock)}));persist();if(JSON.stringify(cart)!==previous)toast('Sua sacola foi ajustada ao estoque disponível.');
 for(const c of ['Todos',...new Set(products.map(p=>p.category).filter(c=>c!=='Todos'))]){const b=text('button',c,c==='Todos'?'active':'');b.onclick=()=>{category=c;document.querySelectorAll('#categories button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});render()};b.setAttribute('aria-pressed',String(c==='Todos'));$('#categories').append(b)}render();if($('#cart').open)renderCart();
}).catch(()=>{$('#floatingTotal').textContent=cart.length?'Atualize para ver o subtotal':'Sua sacola está vazia';$('#empty h3').textContent='Não foi possível carregar o catálogo.';$('#empty>p:not(.eyebrow)').textContent='Atualize a página ou consulte a loja pelo WhatsApp.'});
$('#orderForm').addEventListener('input',()=>{pendingOrder=null;$('#orderError').hidden=true});
$('#orderForm').onsubmit=async e=>{
 e.preventDefault();if(submitting||!cart.length)return;
 const body={customer:$('#orderName').value.trim(),phone:$('#orderPhone').value,fulfillment:$('#orderDelivery').value,payment:$('#orderPayment').value,note:$('#orderNote').value.trim(),items:cart.map(l=>({id:l.id,qty:l.qty,price:Math.round((products.find(p=>p.id===l.id)?.price||0)*100)}))};
 const signature=JSON.stringify(body);
 if(!pendingOrder||pendingOrder.signature!==signature)pendingOrder={signature,requestId:crypto.randomUUID()};
 submitting=true;$('#orderError').hidden=true;
 for(const el of $('#orderForm').elements)el.disabled=true;
 $('#submitOrder').textContent='Enviando pedido…';renderCart();
 try{
  const response=await fetch(API_ORIGIN+'/api/orders',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,requestId:pendingOrder.requestId})});
  const result=await response.json();if(!response.ok)throw Error(result.error||'Não foi possível enviar. Tente novamente.');
  receipt=result;const summary=selectionMessage();
  $('#orderReceipt').textContent=`Pedido #${result.id.slice(0,8).toUpperCase()} · ${money(result.total/100)} (sem frete)`;
  $('#orderWhatsApp').href=WHATSAPP+'?text='+encodeURIComponent(`Olá! Enviei o pedido #${result.id.slice(0,8).toUpperCase()} no site. Sou ${body.customer}.\n`+summary+`\n${body.fulfillment} · Pagamento: ${body.payment}`);
  cart=[];persist();renderCart();$('#cartItems').replaceChildren();$('#orderForm').hidden=true;$('#orderSuccess').hidden=false;$('#copy').hidden=true;$('#selectionHint').hidden=true;pendingOrder=null;
 }catch(error){$('#orderError').textContent=error.message||'Falha de conexão. Tente novamente.';$('#orderError').hidden=false;}
 finally{submitting=false;for(const el of $('#orderForm').elements)el.disabled=false;$('#submitOrder').textContent='Enviar pedido para a loja';renderCart();if(receipt)$('#cartItems').replaceChildren();}
};
