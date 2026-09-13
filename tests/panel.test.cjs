const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/../app.js','utf8');
function fixture(){
 const elements=new Map(),events={},calls=[],rows=[];
 const state={error:null,session:{user:{id:'admin'}},sessionCalls:0,authCallback:null,pending:null};
 function element(){return {connected:true,value:'',disabled:false,textContent:'',dataset:{},classList:{toggle(){},add(){},remove(){}},focus(){},appendChild(){}};}
 function parse(html,parent){
  for(const m of html.matchAll(/<[^>]+>/g)){
   const id=m[0].match(/id="([^"]+)"/),data=[...m[0].matchAll(/data-([\w-]+)="([^"]*)"/g)];
   if(!id&&!data.length)continue;
   const e=element();e.parent=parent;e.value=m[0].match(/value="([^"]*)"/)?.[1]||'';
   data.forEach(x=>e.dataset[x[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=x[2]);
   elements.set(id?'#'+id[1]:'generated'+elements.size,e);
  }
 }
 function htmlProperty(e){Object.defineProperty(e,'innerHTML',{get(){return this.html||''},set(html){this.html=html;for(const x of elements.values())if(x.parent===this)x.connected=false;parse(html,this);}});return e;}
 const main=htmlProperty(element());elements.set('main',main);elements.set('#accountBtn',element());elements.set('#toast',element());
 const doc={body:{dataset:{page:'admin'}},hidden:false,querySelector:s=>{const e=elements.get(s);return e?.connected?e:null;},querySelectorAll:s=>[...elements.values()].filter(e=>e.connected&&(s==='.admin-tab'?e.dataset.tab:s.startsWith('[data-')?Object.hasOwn(e.dataset,s.slice(6,-1).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())):false)),contains:e=>!!e?.connected,addEventListener:(n,f)=>events[n]=f};
 const query=(table)=>{const q={table,operation:'select',filters:[],select(){return this},order(){return this},eq(k,v){this.filters.push([k,v]);return this},single(){this.one=true;return this},maybeSingle(){this.one=true;return this},abortSignal(signal){this.signal=signal;return this},insert(d){this.operation='insert';this.payload=d;return this},update(d){this.operation='update';this.payload=d;return this},delete(){this.operation='delete';return this},then(resolve,reject){calls.push({table,operation:this.operation,payload:this.payload});if(state.pending&&table==='streams'&&this.operation==='select'){const p=state.pending;state.pending=null;return p.then(resolve,reject);}if(state.error)return Promise.resolve({error:{message:state.error},data:null}).then(resolve,reject);let data;if(table==='admin_users')data={user_id:'admin'};else if(table==='streams'){if(this.operation==='insert'){const row={id:'stream1',...this.payload};rows.push(row);data=row;}else if(this.operation==='update'){const row=rows.find(r=>this.filters.every(([k,v])=>r[k]===v));if(row)Object.assign(row,this.payload);data=row||null;}else if(this.operation==='delete'){const i=rows.findIndex(r=>this.filters.every(([k,v])=>r[k]===v));data=i>=0?rows.splice(i,1)[0]:null;}else data=this.one?rows.find(r=>this.filters.every(([k,v])=>r[k]===v)):rows.slice();}else data=this.one?null:[];return Promise.resolve({data,error:!data&&this.one?{message:'No matching row'}:null}).then(resolve,reject);}};return q;};
 const db={from:query,auth:{getSession:async()=>{state.sessionCalls++;return {data:{session:state.session}};},onAuthStateChange:f=>{state.authCallback=f;f('INITIAL_SESSION',state.session);}}};
 const ctx={console,document:doc,location:{hash:'',protocol:'https:'},window:{supabase:{createClient:()=>db},addEventListener(){}},AbortController,URL,confirm:()=>true,setTimeout,clearTimeout,setInterval:()=>0};
 vm.createContext(ctx);vm.runInContext(source,ctx);
 // Make every DOM target support innerHTML, including dynamically created targets.
 const originalGet=doc.querySelector;doc.querySelector=s=>{const e=originalGet(s);if(e&&!Object.getOwnPropertyDescriptor(e,'innerHTML'))htmlProperty(e);return e;};
 return {ctx,events,elements,state,calls,rows,main,run:code=>vm.runInContext(code,ctx),get:s=>doc.querySelector(s)};
}
const tick=()=>new Promise(r=>setTimeout(r,5));
(async()=>{
 const boot=fixture();boot.run('let renders=0; page=async()=>{renders++}');boot.events.DOMContentLoaded();await tick();await tick();
 assert.equal(boot.state.sessionCalls,1);assert.equal(boot.run('renders'),1);
 boot.state.authCallback('SIGNED_IN',boot.state.session);await tick();assert.equal(boot.run('renders'),1,'Repeated sign-in must not reset editor');
 const f=fixture();f.run("user={id:'admin'};initializedSession=true");await f.run('adminPage()');
 await f.run("renderAdminTab('transmissoes-admin')");assert.equal(typeof f.get('#newStream').onclick,'function');f.get('#newStream').onclick();
 assert.equal(typeof f.get('#streamEditor').onsubmit,'function');
 f.get('#streamTitle').value='Canal ao vivo';f.get('#streamUrl').value='https://example.com/live.m3u8';f.get('#streamType').value='hls';f.get('#streamOpen').value='false';
 await f.get('#streamEditor').onsubmit({preventDefault(){}});assert.equal(f.rows.length,1);assert.equal(f.rows[0].created_by,'admin');assert.equal(f.rows[0].is_exclusive,false);
 const edit=[...f.elements.values()].find(e=>e.connected&&e.dataset.editStream);await edit.onclick();f.get('#streamTitle').value='Canal editado';await f.get('#streamEditor').onsubmit({preventDefault(){}});assert.equal(f.rows[0].title,'Canal editado');
 const toggle=[...f.elements.values()].find(e=>e.connected&&e.dataset.toggleStream);await toggle.onclick();assert.equal(f.rows[0].is_open,true);
 const del=[...f.elements.values()].find(e=>e.connected&&e.dataset.deleteStream);await del.onclick();assert.equal(f.rows.length,0);
 f.run('streamForm(null)');f.get('#streamTitle').value='Teste';f.get('#streamUrl').value='https://example.com/live.m3u8';f.get('#streamType').value='hls';f.state.error='RLS denied';await f.get('#streamEditor').onsubmit({preventDefault(){}});assert.equal(f.get('#streamFeedback').textContent,'RLS denied');assert.equal(f.get('#saveStream').disabled,false);assert.equal(f.rows.length,0);f.state.error=null;
 f.get('#streamUrl').value='javascript:alert(1)';await f.get('#streamEditor').onsubmit({preventDefault(){}});assert.match(f.get('#streamFeedback').textContent,/HTTP ou HTTPS/);
 let resolve;f.state.pending=new Promise(r=>resolve=r);const pending=f.run("renderAdminTab('transmissoes-admin')");await tick();await f.run("renderAdminTab('noticias-admin')");resolve({data:[],error:null});await pending;assert.match(f.get('#adminContent').innerHTML,/Notícias/);assert.doesNotMatch(f.get('#adminContent').innerHTML,/Nova transmissão/);
 const never={abortSignal(){return new Promise(()=>{})}};f.ctx.never=never;await assert.rejects(f.run("checkedQuery(never,'Teste',5)"),/conexão demorou/);
 const listeners={};vm.runInNewContext(fs.readFileSync(__dirname+'/../sw.js','utf8'),{self:{addEventListener:(n,fn)=>listeners[n]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{},matchAll:async()=>[]},registration:{unregister:async()=>true}},caches:{keys:async()=>[],delete:async()=>true}});let waited=false;listeners.activate({waitUntil:p=>{waited=true;p.catch(()=>{})}});assert.equal(waited,true);assert.equal(listeners.fetch,undefined);
 console.log('PASS: one session initialization; same-user auth preserves editor; stream create/edit/open/delete; save errors; unsafe URL rejection; stale tab isolation; request timeout; worker lifetime without navigation.');
})().catch(error=>{console.error(error);process.exitCode=1});
