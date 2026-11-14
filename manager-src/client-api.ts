'use client';
declare global{interface Window{AJ_PAGES?:{apiOrigin:string;basePath:string}}}
const config=()=>typeof window!=='undefined'?window.AJ_PAGES:undefined;
const KEY='ajimports-store-manager-token-v2';
export function isPagesClient(){return !!config()}
export function pagePath(path:string){if(path==='/')return 'https://ajimports.store/';return (config()?.basePath||'')+path.replace(/\/$/,'')+'/'}
export function clientAsset(path:string){return (config()?.basePath||'')+path}
export function readToken(){try{return sessionStorage.getItem(KEY)||''}catch{return ''}}
export function saveToken(token:string|null){if(!config())return;try{if(token)sessionStorage.setItem(KEY,token);else sessionStorage.removeItem(KEY)}catch{}}
export function imageUrl(path:string){return path.startsWith('/api/images/')?(config()?.apiOrigin||'')+path:path}
export async function clientFetch(path:string,options:RequestInit={}){const c=config();const headers=new Headers(options.headers);const token=c?readToken():'';if(token)headers.set('Authorization','Bearer '+token);const r=await fetch((c?.apiOrigin||'')+path,{...options,headers,credentials:c?'omit':'same-origin'});if(c&&path==='/api/manager'&&(r.status===401||r.status===403))saveToken(null);return r}
