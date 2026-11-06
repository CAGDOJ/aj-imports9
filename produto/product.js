'use strict';
const API=(location.pathname.startsWith('/store/')||location.hostname.endsWith('.chatgpt.site'))?'':'https://aj-imports9.carlosjralfa.chatgpt.site';
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const url=src=>src.startsWith('/api/images/')?API+src:src;
const productId=new URLSearchParams(location.search).get('id')||'';
let current=null,photos=[],photoIndex=0,sourcePriority=0;
function valid(p){return p&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.category==='string'&&Number.isFinite(p.price)&&Number.isInteger(p.stock)}
function photoList(p){let a=p.photos;try{if(typeof a==='string')a=JSON.parse(a)}catch{a=[]}return [...new Set([p.image,...(Array.isArray(a)?a:[])].filter(s=>typeof s==='string'&&s))].slice(0,8)}
function showPhoto(i){
 photoIndex=(i+photos.length)%Math.max(photos.length,1);
 const img=$('mainPhoto'),item=photos[photoIndex];
 img.hidden=!item;$('noPhoto').hidden=!!item;
 if(item){img.src=url(item);img.alt=current.name+' — foto '+(photoIndex+1)}else img.removeAttribute('src');
 $('prev').hidden=$('next').hidden=photos.length<2;$('counter').hidden=!item;
 $('counter').textContent=photos.length?(photoIndex+1)+' / '+photos.length:'';
 $('gestureHint').hidden=photos.length<2;
 $('thumbs').querySelectorAll('button').forEach((button,index)=>{button.classList.toggle('selected',index===photoIndex);button.setAttribute('aria-pressed',String(index===photoIndex))});
}
function productView(p){
 current=p;document.title=p.name+' | AJ Imports';$('crumb').textContent=p.name;
 $('name').textContent=p.name;$('category').textContent=p.category;$('price').textContent=money(p.price);
 $('stock').textContent=p.stock?p.stock+' unidade(s) disponível(is)':'Indisponível no momento';
 const description=String(p.description||'').trim();
 $('summary').textContent=description?(description.length>250?description.slice(0,250).trimEnd()+'…':description):'Confira as fotos e converse com a loja para obter mais informações.';
 $('description').textContent=description||'Para conhecer todos os detalhes, entre em contato com a AJ Imports.';
 $('quantity').max=String(Math.max(p.stock,1));$('quantity').disabled=!p.stock;$('add').disabled=!p.stock;
 $('add').textContent=p.stock?'Adicionar à sacola':'Indisponível';
 $('whatsapp').href='https://wa.me/5591980793350?text='+encodeURIComponent('Olá, AJ Imports! Gostaria de saber mais sobre '+p.name+' ('+p.id+').');
 $('specs').replaceChildren();
 const specifications=String(p.specifications||'').split('\n').map(x=>x.trim()).filter(Boolean);
 $('specSection').hidden=!specifications.length;
 for(const line of specifications){
  const item=document.createElement('div');item.className='spec-row';const index=line.indexOf(':');
  if(index>0){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=line.slice(0,index);dd.textContent=line.slice(index+1).trim();item.append(dt,dd)}
  else{const dd=document.createElement('dd');dd.className='spec-full';dd.textContent=line;item.append(dd)}
  $('specs').append(item);
 }
 photos=photoList(p);$('thumbs').replaceChildren();
 for(let i=0;i<photos.length;i++){
  const thumb=document.createElement('button');thumb.type='button';thumb.setAttribute('aria-label','Visualizar foto '+(i+1));const img=document.createElement('img');img.src=url(photos[i]);img.alt='Foto '+(i+1);img.loading='lazy';
  thumb.append(img);thumb.onclick=()=>showPhoto(i);$('thumbs').append(thumb);
 }
 showPhoto(0);$('loading').hidden=true;$('error').hidden=true;$('product').hidden=false;
}
async function loadCatalog(address){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),9000);
 try{
  const r=await fetch(address,{cache:'no-store',signal:controller.signal});
  if(!r.ok)throw Error('Serviço indisponível');
  const j=await r.json();const list=Array.isArray(j)?j:j?.products;
  if(!Array.isArray(list))throw Error('Dados inválidos');
  return list;
 }finally{clearTimeout(timeout)}
}
async function start(){
 if(!/^[0-9a-fA-F-]{36}$/.test(productId)){$('loading').hidden=true;$('error').hidden=false;return}
 const attempts=[
  loadCatalog((API?'../catalogo.json':'/api/products')+'?v='+Date.now()).then(list=>{const p=list.find(p=>p.id===productId&&valid(p));if(p&&sourcePriority<1){sourcePriority=1;productView(p)}}),
  loadCatalog(API+'/api/products').then(list=>{const p=list.find(p=>p.id===productId&&valid(p));if(p){sourcePriority=2;productView(p)}})
 ];
 await Promise.allSettled(attempts);
 if(!current){$('loading').hidden=true;$('error').hidden=false}
}
$('prev').onclick=()=>showPhoto(photoIndex-1);$('next').onclick=()=>showPhoto(photoIndex+1);
$('stage').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();showPhoto(photoIndex+1)}else if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(photoIndex-1)}});
let startX=null,startY=null;
$('stage').addEventListener('touchstart',e=>{if(e.touches.length!==1)return;startX=e.touches[0].clientX;startY=e.touches[0].clientY},{passive:true});
$('stage').addEventListener('touchend',e=>{if(startX===null||e.changedTouches.length!==1)return;const dx=e.changedTouches[0].clientX-startX,dy=e.changedTouches[0].clientY-startY;startX=null;startY=null;if(photos.length>1&&Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.25)showPhoto(photoIndex+(dx<0?1:-1))},{passive:true});
$('add').onclick=()=>{
 if(!current)return;
 const qty=Number($('quantity').value);
 if(!Number.isSafeInteger(qty)||qty<1){$('feedback').textContent='Informe uma quantidade válida.';return}
 let cart=[];try{const old=JSON.parse(localStorage.getItem('aj-selection')||'[]');if(Array.isArray(old))cart=old.filter(x=>x&&typeof x.id==='string'&&Number.isInteger(x.qty)&&x.qty>0)}catch{}
 const existing=cart.find(x=>x.id===current.id),total=(existing?.qty||0)+qty;
 if(total>current.stock){$('feedback').textContent='Quantidade indisponível. Confira o estoque.';return}
 if(existing)existing.qty=total;else cart.push({id:current.id,qty});
 try{localStorage.setItem('aj-selection',JSON.stringify(cart.slice(0,100)));$('feedback').textContent='Adicionado à sacola! Abra a sacola para finalizar seu pedido.'}
 catch{$('feedback').textContent='Seu navegador não permitiu salvar a sacola. Tente novamente.'}
};
start();
