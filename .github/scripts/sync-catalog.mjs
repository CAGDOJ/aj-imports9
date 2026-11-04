// Sincroniza somente campos públicos, sem credenciais ou registros administrativos.
// O servidor e o banco continuam sendo a fonte oficial dos produtos.
import {readFile,writeFile} from 'node:fs/promises';
const endpoint='https://aj-imports9.carlosjralfa.chatgpt.site/api/products';
const publicFields=['id','name','category','description','price','stock','image','photos','specifications'];
const valid=p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.category==='string'&&Number.isFinite(p.price)&&Number.isInteger(p.stock)&&p.stock>=0;
let products;
let lastError;
for(let attempt=1;attempt<=3;attempt++){
 try{
  const response=await fetch(endpoint+'?sync='+Date.now(),{
   headers:{Accept:'application/json','User-Agent':'AJImportsCatalogSync/1.0'},
   signal:AbortSignal.timeout(15000),
   cache:'no-store'
  });
  if(!response.ok)throw Error('Servidor retornou HTTP '+response.status);
  const data=await response.json();
  if(!Array.isArray(data)||data.some(p=>!valid(p)))throw Error('Resposta inesperada; catálogo anterior preservado');
  products=data.map(p=>Object.fromEntries(publicFields.map(k=>[k,p[k]??(k==='photos'?[]:'')])));
  break;
 }catch(e){
  lastError=e;
  console.warn('Tentativa',attempt,'falhou:',String(e));
  if(attempt<3)await new Promise(resolve=>setTimeout(resolve,attempt*1500));
 }
}
if(!products)throw lastError;
const target='catalogo.json';
let existing;
try{existing=JSON.parse(await readFile(target,'utf8'))}catch{}
if(JSON.stringify(existing?.products)===JSON.stringify(products)){
 console.log('Catálogo já atualizado ('+products.length+' itens).');
 process.exit(0);
}
await writeFile(target,JSON.stringify({updatedAt:new Date().toISOString(),products},null,2)+'\n');
console.log('Catálogo renovado ('+products.length+' itens).');
