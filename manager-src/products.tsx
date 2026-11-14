'use client';
import {useEffect,useState,useRef} from 'react';
import {imageUrl} from './client-api';

type Product={id:string;name:string;category:string;description:string;specifications:string;price:number;cost:number;stock:number;image:string;photos:string[]|string;active:boolean|number};
type Props={products:Product[];busy:boolean;onNew:()=>void;onEdit:(p:Product)=>void;onAction:(payload:any,after?:()=>void)=>Promise<void>};
const money=(n:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100);
function images(p:Product):string[]{let a:any=p.photos;try{if(typeof a==='string')a=JSON.parse(a)}catch{a=[]}return [...new Set([p.image,...(Array.isArray(a)?a:[])].filter((v):v is string=>typeof v==='string'&&!!v))].slice(0,8)}
export default function ProductCards({products,busy,onNew,onEdit,onAction}:Props){
 const [query,setQuery]=useState(''),[showHidden,setShowHidden]=useState(false),[preview,setPreview]=useState(''),[remove,setRemove]=useState(''),[photo,setPhoto]=useState(0);
 const selected=products.find(p=>p.id===preview),deleting=products.find(p=>p.id===remove),pics=selected?images(selected):[];
 const filtered=products.filter(p=>(showHidden||!!p.active)&&(p.name+' '+p.category+' '+p.id).toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
 const touch=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>{setPhoto(0)},[preview]);
 useEffect(()=>{if(!preview&&!remove)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!busy){setRemove('');setPreview('')}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',key)}},[preview,remove,busy]);
 const change=(delta:number)=>setPhoto(i=>(i+delta+Math.max(1,pics.length))%Math.max(1,pics.length));
 const edit=(p:Product)=>{setRemove('');setPreview('');requestAnimationFrame(()=>onEdit(p))};
 const deletingAction=async()=>{if(!deleting)return;await onAction({action:'delete_product',id:deleting.id},()=>{setRemove('');setPreview('')})};
 return <section className="aj-manage-products" aria-label="Gerenciar produtos">
  <div className="aj-manage-toolbar">
   <input type="search" aria-label="Buscar produtos" placeholder="Buscar nome, categoria ou código" value={query} onChange={e=>setQuery(e.target.value)}/>
   <button className="btn" type="button" onClick={onNew}>+ Cadastrar produto</button>
  </div>
  <div className="aj-manage-options">
   <span>{filtered.length} produto(s) encontrado(s)</span>
   <label><input type="checkbox" checked={showHidden} onChange={e=>setShowHidden(e.target.checked)}/> Mostrar ocultos</label>
  </div>
  {filtered.length===0?<div className="panel aj-manage-empty">Nenhum produto encontrado. Tente outra busca ou exiba os produtos ocultos.</div>:
  <div className="aj-manage-grid">{filtered.map(p=>{const cover=images(p)[0];return <article className="aj-manage-card" key={p.id}>
   <button type="button" className="aj-manage-cover" onClick={()=>setPreview(p.id)} aria-label={'Visualizar '+p.name}>{cover?<img src={imageUrl(cover)} alt={p.name} loading="lazy"/>:<span>Sem foto</span>}</button>
   <div className="aj-manage-info">
    <span className={'aj-manage-status '+(p.active?'published':'hidden')}>{p.active?'Publicado':'Oculto'}</span>
    <p className="aj-manage-category">{p.category}</p>
    <h3>{p.name}</h3>
    <strong>{money(p.price)}</strong>
    <p>{p.stock} unidade(s) em estoque</p>
    <small>Código: {p.id.slice(0,8).toUpperCase()}</small>
   </div>
   <div className="aj-manage-actions">
    <button type="button" className="btn secondary" onClick={()=>setPreview(p.id)}>Visualizar</button>
    <button type="button" className="btn" onClick={()=>edit(p)}>Editar</button>
    <button type="button" className="btn danger" onClick={()=>setRemove(p.id)}>Excluir</button>
   </div>
  </article>})}</div>}
  {selected&&<div className="aj-manage-scrim" onClick={e=>{if(e.target===e.currentTarget)setPreview('')}}>
   <section className="aj-manage-preview" role="dialog" aria-modal="true" aria-labelledby="aj-preview-name">
    <header className="aj-manage-preview-header"><strong>Prévia do produto</strong><button type="button" onClick={()=>setPreview('')} aria-label="Fechar visualização">×</button></header>
    <div className="aj-manage-preview-body">
     <div className="aj-manage-gallery">
      <div className="aj-manage-main-photo" onTouchStart={e=>{if(e.touches.length===1)touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}}
       onTouchEnd={e=>{if(!touch.current||e.changedTouches.length!==1)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;touch.current=null;if(pics.length>1&&Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.2)change(dx<0?1:-1)}}>
       {pics[photo]?<img src={imageUrl(pics[photo])} alt={selected.name+' foto '+(photo+1)}/>:<p>Produto sem imagem</p>}
       {pics.length>1&&<><button type="button" className="aj-manage-prev" onClick={()=>change(-1)} aria-label="Foto anterior">‹</button><button type="button" className="aj-manage-next" onClick={()=>change(1)} aria-label="Próxima foto">›</button><span>{photo+1} / {pics.length}</span></>}
      </div>
      {pics.length>1&&<div className="aj-manage-thumbs">{pics.map((src,i)=><button type="button" key={src} className={i===photo?'selected':''} aria-label={'Foto '+(i+1)} onClick={()=>setPhoto(i)}><img src={imageUrl(src)} alt=""/></button>)}</div>}
     </div>
     <div className="aj-manage-preview-info">
      <p>{selected.category}</p><h2 id="aj-preview-name">{selected.name}</h2><strong>{money(selected.price)}</strong>
      <p>{selected.stock} unidade(s) · {selected.active?'Publicado':'Oculto'}</p>
      <h3>Descrição</h3><div className="aj-manage-description">{selected.description||'Descrição não cadastrada.'}</div>
      {selected.specifications&&<><h3>Especificações</h3><div className="aj-manage-description">{selected.specifications}</div></>}
      <div className="aj-manage-actions"><button type="button" className="btn" onClick={()=>edit(selected)}>Editar produto</button><button type="button" className="btn danger" onClick={()=>setRemove(selected.id)}>Excluir</button></div>
     </div>
    </div>
   </section>
  </div>}
  {deleting&&<div className="aj-manage-scrim aj-manage-confirm-scrim">
   <section className="aj-manage-confirm" role="alertdialog" aria-modal="true" aria-labelledby="aj-confirm-title">
    <h2 id="aj-confirm-title">Excluir produto?</h2>
    <strong>{deleting.name}</strong>
    <p>Se o produto já tiver vendas ou pedidos, será retirado da vitrine, mas seu histórico será preservado. Produtos sem histórico poderão ser excluídos definitivamente.</p>
    <div className="aj-manage-actions"><button type="button" className="btn secondary" disabled={busy} onClick={()=>setRemove('')}>Cancelar</button><button type="button" className="btn danger" disabled={busy} onClick={deletingAction}>{busy?'Excluindo…':'Confirmar exclusão'}</button></div>
   </section>
  </div>}
 </section>
}