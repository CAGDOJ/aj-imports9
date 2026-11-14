import {readFile,writeFile,mkdir,copyFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const dist=path.join(root,'.manager-build-dist');
const source=await readFile(path.join(dist,'index.html'),'utf8');
if(!source.includes("basePath:'/gerencia'"))throw Error('Gerência sem domínio oficial.');
const scripts=[...source.matchAll(/src="(\/assets\/[^"]+\.js)"/g)];
if(scripts.length!==1)throw Error('Bundle JS da gerência ausente ou duplicado.');
if(!source.includes('href="/assets/'))throw Error('CSS compilado ausente.');
const targets=['gerencia','gerencia/entrar','gerencia/gerente','gerencia/gerente/entrar','gerencia/gerente/senha','gerencia/gerente/configurar'];
for(const route of targets){
 const dest=path.join(root,route);
 await mkdir(dest,{recursive:true});
 await writeFile(path.join(dest,'index.html'),source);
}
const assetsDir=path.join(root,'assets');
await mkdir(assetsDir,{recursive:true});
for(const f of await readdir(path.join(dist,'assets'))){
 if(!/\.(js|css)$/.test(f))continue;
 await copyFile(path.join(dist,'assets',f),path.join(assetsDir,f));
}
console.log('AJ Imports /gerencia: novo bundle React publicado com',scripts[0][1]);
