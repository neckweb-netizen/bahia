const SUPABASE_URL='https://nnflqxkexcmncendyaas.supabase.co';
const SUPABASE_KEY='sb_publishable_soMUpvwfZ4jwkG2sT6RbZg_RDoRzMXd';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const date=v=>v?new Date(v).toLocaleDateString('pt-BR'):'Hoje';
const toast=m=>{const e=$('#toast');if(e){e.textContent=m;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2800)}};
let user=null,chatChannel=null,route=document.body.dataset.page||location.hash.replace('#','')||'inicio';

function updateAccount(){const b=$('#accountBtn');if(b){b.textContent=user?'Sair':'Entrar';b.onclick=account;}}
function auth(){
 if($('#authModal'))return;
 document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="authModal"><section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="authTitle"><button type="button" class="modal-close" id="closeAuth" aria-label="Fechar">×</button><p class="eyebrow">+1Bahia</p><h2 id="authTitle">Bem-vindo à torcida</h2><p id="authDescription">Entre com seu e-mail e senha.</p><form id="authForm"><label id="authNameLabel" hidden>Seu nome<input id="authName" autocomplete="name" maxlength="80"></label><label>E-mail<input id="authEmail" type="email" autocomplete="email" required></label><label>Senha<input id="authPassword" type="password" autocomplete="current-password" minlength="6" required></label><button class="button primary" id="authSubmit">Entrar</button></form><button class="auth-switch" id="authSwitch">Criar uma conta gratuita</button><button class="auth-switch" id="forgotPassword">Esqueci minha senha</button><p id="authError" class="auth-error" role="status"></p></section></div>`);
 let signup=false,busy=false;
 const draw=()=>{$('#authTitle').textContent=signup?'Crie sua conta':'Bem-vindo à torcida';$('#authDescription').textContent=signup?'Cadastro gratuito para participar da resenha.':'Entre com seu e-mail e senha.';$('#authNameLabel').hidden=!signup;$('#authName').required=signup;$('#authSubmit').textContent=signup?'Criar conta':'Entrar';$('#authSwitch').textContent=signup?'Já tenho uma conta':'Criar uma conta gratuita';$('#authPassword').autocomplete=signup?'new-password':'current-password';};
 $('#closeAuth').onclick=()=>{if(!busy)$('#authModal').remove();};
 $('#authSwitch').onclick=()=>{if(!busy){signup=!signup;draw();}};
 $('#forgotPassword').onclick=async()=>{const email=$('#authEmail').value.trim();if(!email){$('#authError').textContent='Informe seu e-mail primeiro.';return;}const r=await db.auth.resetPasswordForEmail(email);$('#authError').textContent=r.error?r.error.message:'Confira seu e-mail para recuperar a senha.';};
 $('#authForm').onsubmit=async event=>{
  event.preventDefault();if(busy)return;busy=true;$('#authSubmit').disabled=true;$('#authError').textContent='Conectando...';
  try{
   const email=$('#authEmail').value.trim(),password=$('#authPassword').value;
   const request=signup?db.auth.signUp({email,password,options:{data:{display_name:$('#authName').value.trim()}}}):db.auth.signInWithPassword({email,password});
   const r=await Promise.race([request,new Promise((_,reject)=>setTimeout(()=>reject(new Error('A conexão demorou. Tente novamente.')),15000))]);
   if(r.error)throw r.error;
   user=r.data.user||null;
   if(signup&&!r.data.session){user=null;$('#authError').textContent='Conta criada. Confirme o cadastro pelo link enviado ao seu e-mail.';return;}
   $('#authModal').remove();initializedSession=true;updateAccount();schedulePage();toast('Você está conectado.');
  }catch(error){if($('#authError'))$('#authError').textContent=error.message==='Invalid login credentials'?'E-mail ou senha incorretos.':error.message;}
  finally{busy=false;if($('#authSubmit'))$('#authSubmit').disabled=false;}
 };draw();$('#authEmail').focus();
}
async function refresh(){updateAccount();await page();}
async function account(){if(user){const r=await db.auth.signOut();if(r.error){toast(r.error.message);return;}user=null;authorizedAdminId=null;++adminRequestVersion;updateAccount();schedulePage();}else auth();}
function shell(title,body){const main=$('main');main.innerHTML=`<div class="page-wrap"><p class="eyebrow">+1Bahia</p><h1 class="page-title">${title}</h1>${body}</div>`}
function nav(active){document.querySelectorAll('.bottom-nav a').forEach(a=>a.classList.toggle('active',a.dataset.route===active))}
async function page(){route=document.body.dataset.page||location.hash.replace('#','')||'inicio';nav(route);if(route==='noticias')return newsPage();if(route==='chat')return chatPage();if(route==='transmissoes')return streamsPage();if(route==='pwa')return pwaPage();if(route==='admin')return adminPage();return homePage()}
async function homePage(){shell('O Bahia no seu ritmo.','<p class="loading">Carregando próximo confronto...</p>');const r=await db.from('matches').select('*').eq('is_next',true).order('updated_at',{ascending:false}).limit(1).maybeSingle();if(r.error){shell('O Bahia no seu ritmo.','<p class="empty-state">Não foi possível carregar o próximo confronto.</p>');console.error(r.error);return}const m=r.data||{};const when=m.match_date?new Date(m.match_date).toLocaleString('pt-BR',{dateStyle:'medium',timeStyle:'short'}):'Data ainda não definida';shell('O Bahia no seu ritmo.','<p class="hero-copy">Notícias, resenhas e transmissões em um só lugar. Feito para quem vive o Esquadrão.</p><div class="hero-actions"><a class="button primary" href="noticias.html">Ver notícias</a><a class="button ghost" href="chat.html">Entrar na resenha</a></div><div class="home-grid"><div><p class="eyebrow">Próximo confronto</p><div class="score-card"><strong>'+esc(m.home_team||'BAH')+'</strong><em>×</em><strong>'+esc(m.away_team||'A definir')+'</strong><small>'+esc(m.competition||'Partida ainda não configurada')+' · '+when+'</small></div></div><div><p class="eyebrow">+1Bahia</p><h2>Uma arquibancada digital para a Nação Tricolor.</h2><p class="muted">Acompanhe notícias, converse com a torcida e encontre transmissões ao vivo.</p></div></div>')}
async function newsPage(){shell('Notícias do Bahia','<div id="newsGrid" class="news-grid"><p class="loading">Carregando...</p></div>');const r=await db.from('news').select('title,summary,image_url,published_at,slug,news_categories(name)').eq('status','published').order('published_at',{ascending:false});const g=$('#newsGrid');if(r.error||!r.data?.length){g.innerHTML='<p class="empty-state">Ainda não há notícias publicadas.</p>';return}g.innerHTML=r.data.map(n=>{const bg=n.image_url?'url("' + esc(n.image_url) + '")':'linear-gradient(135deg,#003b7a,#0756a0)';return '<article class="news-card"><div class="news-art" style="background-image:'+bg+'"><span>'+esc(n.news_categories?.name||'Bahia')+'</span></div><div class="news-body"><small>'+date(n.published_at)+'</small><h3>'+esc(n.title)+'</h3><p>'+esc(n.summary)+'</p></div></article>'}).join('')}
function chatPage(){
 shell('A resenha da torcida',`<div class="chat-card full-chat"><div class="card-head"><div><strong>Arquibancada digital</strong><small id="chatStatus">${user?'Você está conectado':'Entre para participar'}</small></div><button type="button" class="text-button" id="reloadChat">Atualizar</button></div><div class="messages tall" id="messages" aria-live="polite"></div><form class="chat-form" id="chatForm"><input id="chatInput" maxlength="500" placeholder="Escreva sua mensagem..." autocomplete="off" aria-label="Mensagem"><button aria-label="Enviar mensagem">↑</button></form><small class="limit">Chat gratuito e sem limite diário. Somente as 200 mensagens mais recentes ficam no histórico.</small></div>`);
 $('#chatForm').onsubmit=send;$('#reloadChat').onclick=loadChat;
 if(user){loadChat();subscribeChat();}else{$('#messages').innerHTML='<div class="empty-state"><p>Faça parte da resenha do Esquadrão.</p><button class="button primary" id="chatLogin">Entrar ou criar conta</button></div>';$('#chatLogin').onclick=auth;}
}
let chatLoading=false;
async function loadChat(){
 const box=$('#messages');if(!box||!user||chatLoading)return;chatLoading=true;
 const nearBottom=box.scrollHeight-box.scrollTop-box.clientHeight<100;
 try{
  const r=await db.from('chat_messages').select('id,user_id,content,created_at').order('created_at',{ascending:false}).limit(200);
  if(r.error)throw r.error;
  if(!document.contains(box))return;
  const rows=(r.data||[]).reverse();
  box.innerHTML=rows.length?rows.map(m=>{const mine=m.user_id===user.id;const name=mine?'Você':'Torcedor '+m.user_id.slice(0,6);return '<div class="message '+(mine?'mine':'')+'"><b>'+esc(name)+'</b><p>'+esc(m.content)+'</p><small>'+new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'</small></div>';}).join(''):'<p class="empty-state">A resenha começa com você.</p>';
  if(nearBottom)box.scrollTop=box.scrollHeight;
 }catch(error){console.error('Chat:',error);box.innerHTML='<p class="empty-state">Não foi possível carregar as mensagens. Use Atualizar para tentar novamente.</p>';}
 finally{chatLoading=false;}
}
function subscribeChat(){
 if(chatChannel)return;
 chatChannel=db.channel('mais-um-bahia-chat').on('postgres_changes',{event:'*',schema:'public',table:'chat_messages'},()=>{if(document.body.dataset.page==='chat')loadChat();}).subscribe(status=>{const s=$('#chatStatus');if(s&&user)s.textContent=status==='SUBSCRIBED'?'Conectado em tempo real':'Conectando ao chat...';});
}
async function send(event){
 event.preventDefault();if(!user){auth();return;}const input=$('#chatInput'),button=$('#chatForm button'),content=input.value.trim();if(!content)return;button.disabled=true;
 try{const r=await db.rpc('post_chat_message',{message_content:content});if(r.error)throw r.error;input.value='';await loadChat();const box=$('#messages');if(box)box.scrollTop=box.scrollHeight;}catch(error){console.error(error);toast('Não foi possível enviar: '+error.message);}finally{button.disabled=false;}
}
async function streamsPage(){shell('Transmissões','<div id="streamsList"><p class="loading">Carregando transmissões...</p></div>');const r=await db.from('streams').select('*').order('starts_at',{ascending:false});const box=$('#streamsList');if(r.error||!r.data?.length){box.innerHTML='<p class="empty-state">Nenhuma transmissão cadastrada.</p>';return}box.innerHTML=r.data.map(s=>{const open=s.is_open;const live=s.media_type==='hls'||/\\.m3u8($|\\?)/i.test(s.media_url);return '<article class="stream-card"><div class="stream-status '+(open?'open':'closed')+'">'+(open?'● Ao vivo':'● Fechada')+'</div><h2>'+esc(s.title)+'</h2><p>'+esc(s.description)+'</p>'+(open?'<div class="live-player" data-url="'+esc(s.media_url)+'" data-type="'+esc(s.media_type)+'"><p>Preparando transmissão ao vivo...</p></div>':'<div class="closed-player">A transmissão não está disponível neste momento.</div>')+'</article>'}).join('');if(!window.Hls){const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/hls.js@1.5.17';script.onload=()=>mountLivePlayers();document.head.appendChild(script)}else mountLivePlayers()}
function mountLivePlayers(){document.querySelectorAll('.live-player').forEach(container=>{if(container.dataset.mounted)return;container.dataset.mounted='1';const url=container.dataset.url,type=container.dataset.type;const video=document.createElement('video');video.controls=true;video.autoplay=true;video.playsInline=true;video.muted=true;video.loop=false;video.preload='none';container.replaceChildren(video);if((type==='hls'||/\\.m3u8($|\\?)/i.test(url))&&window.Hls&&window.Hls.isSupported()){const hls=new Hls({liveDurationInfinity:true,enableWorker:true});hls.loadSource(url);hls.attachMedia(video);hls.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal)container.insertAdjacentHTML('beforeend','<p class="player-error">Não foi possível conectar ao sinal ao vivo.</p>')})}else if(video.canPlayType('application/vnd.apple.mpegurl')&&(/\\.m3u8($|\\?)/i.test(url)||type==='hls')){video.src=url}else{video.src=url;video.addEventListener('error',()=>container.insertAdjacentHTML('beforeend','<p class="player-error">Formato não suportado pelo navegador. Use HLS (.m3u8), áudio ou vídeo compatível.</p>'),{once:true})}})}
function pwaPage(){shell('Instalar +1Bahia',`<div class="pwa-card"><p class="eyebrow">Aplicativo gratuito</p><h2>Tenha o +1Bahia na tela inicial.</h2><p>Instale o site como um aplicativo no seu celular para acessar notícias, chat e transmissões com mais rapidez.</p><button class="button primary" id="installPwa">Instalar aplicativo</button><p class="pwa-help">Se o botão não aparecer, use o menu do navegador e escolha “Adicionar à tela inicial”.</p></div>`);let installEvent;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e});$('#installPwa').onclick=async()=>{if(installEvent){installEvent.prompt();await installEvent.userChoice;installEvent=null}else toast('Abra o menu do navegador e escolha “Adicionar à tela inicial”.')}}
let adminRequestVersion=0;
let activeAdminTab='resumo';
let authorizedAdminId=null;

async function checkedQuery(query, label='Consulta', timeout=12000) {
 const controller=new AbortController();
 let timer;
 try {
  const result=await Promise.race([
   Promise.resolve(query.abortSignal(controller.signal)),
   new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error(label+': a conexão demorou. Atualize a lista antes de repetir uma gravação.'));},timeout);})
  ]);
  if(result.error)throw result.error;
  return result.data;
 } finally {clearTimeout(timer);}
}
function panelError(error, retry) {
 console.error('[+1Bahia admin]',error);
 const box=$('#adminContent')||$('main');
 if(!box)return;
 box.innerHTML='<p class="empty-state" role="alert">'+esc(error.message||'Falha ao conectar.')+'</p><button class="button outline" id="retryAdmin">Tentar novamente</button>';
 $('#retryAdmin').onclick=retry;
}
async function adminAction(button, operation) {
 if(button.disabled)return;
 button.disabled=true;
 try {await operation();}
 catch(error){console.error('[+1Bahia admin action]',error);toast(error.message||'Operação não concluída.');}
 finally{if(document.contains(button))button.disabled=false;}
}
function adminIsCurrent(version, box, uid) {
 return version===adminRequestVersion&&document.contains(box)&&user?.id===uid&&authorizedAdminId===uid;
}
async function adminPage(){
 const version=++adminRequestVersion, uid=user?.id;
 authorizedAdminId=null;
 if(!uid){
  shell('Área administrativa','<div class="admin-access"><p class="empty-state">Faça login com sua conta administrativa para continuar.</p><button class="button primary" id="adminLogin">Entrar no painel</button></div>');
  $('#adminLogin').onclick=auth;return;
 }
 shell('Painel administrativo','<p class="loading" role="status">Verificando autorização...</p>');
 try{
  const a=await checkedQuery(db.from('admin_users').select('user_id').eq('user_id',uid).maybeSingle(),'Autorização');
  if(version!==adminRequestVersion||user?.id!==uid)return;
  if(!a){shell('Área administrativa','<p class="empty-state">Seu usuário não possui autorização administrativa.</p>');return;}
  authorizedAdminId=uid;
  shell('Painel administrativo','<div class="admin-panel"><nav class="admin-menu" aria-label="Seções administrativas"><button class="admin-tab" data-tab="resumo">Resumo</button><button class="admin-tab" data-tab="noticias-admin">Notícias</button><button class="admin-tab" data-tab="transmissoes-admin">Transmissões</button><button class="admin-tab" data-tab="confronto-admin">Próximo confronto</button><button class="admin-tab" data-tab="usuarios-admin">Usuários</button></nav><section id="adminContent" aria-live="polite"></section></div>');
  document.querySelectorAll('.admin-tab').forEach(b=>b.onclick=()=>renderAdminTab(b.dataset.tab));
  await renderAdminTab(activeAdminTab);
 }catch(error){
  if(version!==adminRequestVersion||user?.id!==uid)return;
  shell('Painel administrativo','<section id="adminContent"></section>');
  panelError(error,adminPage);
 }
}
async function renderAdminTab(tab){
 const box=$('#adminContent'), uid=user?.id;
 if(!box||!uid||authorizedAdminId!==uid)return;
 const version=++adminRequestVersion;
 activeAdminTab=tab;
 document.querySelectorAll('.admin-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 box.innerHTML='<p class="loading" role="status">Carregando...</p>';
 const current=()=>adminIsCurrent(version,box,uid);
 try{
  if(tab==='resumo'){box.innerHTML='<h2>Resumo</h2><p>Use o menu para administrar o conteúdo.</p>';return;}
  if(tab==='transmissoes-admin'){
   const rows=await checkedQuery(db.from('streams').select('*').order('created_at',{ascending:false}),'Transmissões');
   if(!current())return;
   box.innerHTML='<h2>Transmissões</h2><div class="admin-actions"><button class="button primary" id="newStream">Nova transmissão</button><button class="button outline" id="reloadStreams">Atualizar lista</button></div><div>'+(rows.length?rows.map(s=>'<article class="admin-item"><div><strong>'+esc(s.title)+'</strong><small>'+(s.is_open?'Aberta':'Fechada')+' · '+esc(s.media_type)+'</small></div><div class="admin-actions"><button class="button outline" data-toggle-stream="'+esc(s.id)+'">'+(s.is_open?'Fechar':'Abrir')+'</button><button class="button outline" data-edit-stream="'+esc(s.id)+'">Editar</button><button class="button danger" data-delete-stream="'+esc(s.id)+'">Excluir</button></div></article>').join(''):'<p class="empty-state">Nenhuma transmissão cadastrada.</p>')+'</div>';
   $('#newStream').onclick=()=>streamForm(null);
   $('#reloadStreams').onclick=()=>renderAdminTab(tab);
   document.querySelectorAll('[data-edit-stream]').forEach(b=>b.onclick=()=>adminAction(b,async()=>{
    const stream=await checkedQuery(db.from('streams').select('*').eq('id',b.dataset.editStream).single(),'Carregar transmissão');
    if(current())streamForm(stream);
   }));
   document.querySelectorAll('[data-toggle-stream]').forEach(b=>b.onclick=()=>adminAction(b,async()=>{
    const stream=rows.find(s=>s.id===b.dataset.toggleStream);
    const nextOpen=!stream.is_open;
    const saved=await checkedQuery(db.from('streams').update({is_open:nextOpen,updated_at:new Date().toISOString()}).eq('id',stream.id).eq('is_open',stream.is_open).select('id,is_open').single(),'Alterar transmissão');
    if(saved.is_open!==nextOpen)throw new Error('Não foi possível confirmar o status.');
    toast(saved.is_open?'Transmissão aberta.':'Transmissão fechada.');
    if(current())await renderAdminTab(tab);
   }));
   document.querySelectorAll('[data-delete-stream]').forEach(b=>b.onclick=()=>{
    if(!confirm('Excluir esta transmissão permanentemente?'))return;
    return adminAction(b,async()=>{
     const deleted=await checkedQuery(db.from('streams').delete().eq('id',b.dataset.deleteStream).select('id').single(),'Excluir transmissão');
     if(!deleted?.id)throw new Error('A exclusão não foi confirmada.');
     toast('Transmissão excluída.');if(current())await renderAdminTab(tab);
    });
   });return;
  }
  if(tab==='noticias-admin'){
   const rows=await checkedQuery(db.from('news').select('id,title,status,published_at').order('created_at',{ascending:false}),'Notícias');
   if(!current())return;
   box.innerHTML='<h2>Notícias</h2><button class="button primary" id="newNews">Nova notícia</button><div>'+(rows.length?rows.map(n=>'<article class="admin-item"><div><strong>'+esc(n.title)+'</strong><small>'+esc(n.status)+' · '+date(n.published_at)+'</small></div><div class="admin-actions"><button class="button outline" data-edit-news="'+esc(n.id)+'">Editar</button><button class="button outline" data-publish-news="'+esc(n.id)+'">'+(n.status==='published'?'Despublicar':'Publicar')+'</button><button class="button danger" data-delete-news="'+esc(n.id)+'">Excluir</button></div></article>').join(''):'<p class="empty-state">Nenhuma notícia cadastrada.</p>')+'</div>';
   $('#newNews').onclick=()=>newsForm(null);
   document.querySelectorAll('[data-edit-news]').forEach(b=>b.onclick=()=>adminAction(b,async()=>{
    const n=await checkedQuery(db.from('news').select('*').eq('id',b.dataset.editNews).single(),'Carregar notícia');
    if(current())newsForm(n);
   }));
   document.querySelectorAll('[data-publish-news]').forEach(b=>b.onclick=()=>adminAction(b,async()=>{
    const n=rows.find(n=>n.id===b.dataset.publishNews),publish=n.status!=='published';
    await checkedQuery(db.from('news').update({status:publish?'published':'draft',published_at:publish?(n.published_at||new Date().toISOString()):null,updated_at:new Date().toISOString()}).eq('id',n.id).eq('status',n.status).select('id').single(),'Publicação');
    toast(publish?'Notícia publicada.':'Notícia despublicada.');if(current())await renderAdminTab(tab);
   }));
   document.querySelectorAll('[data-delete-news]').forEach(b=>b.onclick=()=>{
    if(!confirm('Excluir esta notícia permanentemente?'))return;
    return adminAction(b,async()=>{await checkedQuery(db.from('news').delete().eq('id',b.dataset.deleteNews).select('id').single(),'Excluir notícia');toast('Notícia excluída.');if(current())await renderAdminTab(tab);});
   });return;
  }
  if(tab==='confronto-admin'){
   const m=await checkedQuery(db.from('matches').select('*').eq('is_next',true).maybeSingle(),'Confronto')||{};
   if(!current())return;
   box.innerHTML='<h2>Próximo confronto</h2><form id="matchForm" class="admin-form"><label>Time da casa<input id="mh" value="'+esc(m.home_team||'Bahia')+'" required></label><label>Adversário<input id="ma" value="'+esc(m.away_team||'')+'" required></label><label>Competição<input id="mc" value="'+esc(m.competition||'')+'"></label><label>Data e hora local<input id="md" type="datetime-local" value="'+localDateInput(m.match_date)+'"></label><button class="button primary" id="saveMatch">Salvar confronto</button><p id="matchFeedback" role="status"></p></form>';
   const form=$('#matchForm');
   form.onsubmit=e=>{
    e.preventDefault();
    return adminAction($('#saveMatch'),async()=>{
     const d={home_team:$('#mh').value.trim(),away_team:$('#ma').value.trim(),competition:$('#mc').value.trim(),match_date:$('#md').value?new Date($('#md').value).toISOString():null,is_next:true,updated_at:new Date().toISOString()};
     if(!d.home_team||!d.away_team)throw new Error('Informe os dois times.');
     const query=m.id?db.from('matches').update(d).eq('id',m.id):db.from('matches').insert({...d,created_by:uid});
     await checkedQuery(query.select('id').single(),'Salvar confronto');
     if(current())$('#matchFeedback').textContent='Confronto salvo e confirmado no banco.';
     toast('Confronto salvo.');
    });
   };return;
  }
  if(tab==='usuarios-admin'){
   const rows=await checkedQuery(db.from('profiles').select('id,display_name'),'Usuários');
   if(current())box.innerHTML='<h2>Usuários</h2>'+(rows.length?rows.map(x=>'<article class="admin-item">'+esc(x.display_name||'Torcedor')+'</article>').join(''):'<p class="empty-state">Nenhum perfil encontrado.</p>');
  }
 }catch(error){if(current())panelError(error,()=>renderAdminTab(tab));}
}
function localDateInput(value){
 if(!value)return '';
 const d=new Date(value);
 if(Number.isNaN(d.getTime()))return '';
 const pad=n=>String(n).padStart(2,'0');
 return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
}
function streamForm(stream){
 const box=$('#adminContent'),uid=user?.id;
 if(!box||authorizedAdminId!==uid)return;
 const version=++adminRequestVersion;
 box.innerHTML='<h2>'+(stream?'Editar transmissão':'Nova transmissão')+'</h2><form id="streamEditor" class="admin-form"><label>Título<input id="streamTitle" maxlength="200" value="'+esc(stream?.title||'')+'" required></label><label>Descrição<textarea id="streamDescription">'+esc(stream?.description||'')+'</textarea></label><label>URL do sinal<input id="streamUrl" type="url" placeholder="https://…" value="'+esc(stream?.media_url||'')+'" required></label><label>Formato<select id="streamType"><option value="hls">HLS (.m3u8)</option><option value="video">Vídeo</option><option value="mpegts">MPEG-TS (.ts)</option><option value="mp3">Áudio MP3</option><option value="m3u">Playlist M3U</option><option value="audio">Áudio</option></select></label><label>Status<select id="streamOpen"><option value="false">Fechada</option><option value="true">Aberta</option></select></label><label>Início (hora local)<input id="streamStart" type="datetime-local" value="'+localDateInput(stream?.starts_at)+'"></label><label>Encerramento (hora local)<input id="streamEnd" type="datetime-local" value="'+localDateInput(stream?.ends_at)+'"></label><p class="muted">Transmissão gratuita. O player só será carregado quando estiver aberta.</p><div class="admin-actions"><button class="button primary" id="saveStream">Salvar transmissão</button><button type="button" class="button outline" id="cancelStream">Cancelar</button></div><p id="streamFeedback" role="status"></p></form>';
 $('#streamType').value=stream?.media_type||'hls';
 $('#streamOpen').value=String(stream?.is_open||false);
 $('#cancelStream').onclick=()=>renderAdminTab('transmissoes-admin');
 const form=$('#streamEditor'),button=$('#saveStream'),feedback=$('#streamFeedback');
 form.onsubmit=async e=>{
  e.preventDefault();if(button.disabled)return;
  button.disabled=true;$('#cancelStream').disabled=true;feedback.textContent='Salvando...';
  try{
   const url=new URL($('#streamUrl').value.trim());
   if(!['https:','http:'].includes(url.protocol))throw new Error('Use uma URL HTTP ou HTTPS válida.');
   if(location.protocol==='https:'&&url.protocol!=='https:')throw new Error('Use HTTPS para evitar bloqueio do player pelo navegador.');
   const starts=$('#streamStart').value,ends=$('#streamEnd').value;
   if(starts&&ends&&new Date(ends)<=new Date(starts))throw new Error('O encerramento deve ser posterior ao início.');
   const d={title:$('#streamTitle').value.trim(),description:$('#streamDescription').value.trim(),media_url:url.href,media_type:$('#streamType').value,is_open:$('#streamOpen').value==='true',is_exclusive:false,starts_at:starts?new Date(starts).toISOString():null,ends_at:ends?new Date(ends).toISOString():null,updated_at:new Date().toISOString()};
   if(!d.title)throw new Error('Informe o título.');
   const query=stream?db.from('streams').update(d).eq('id',stream.id):db.from('streams').insert({...d,created_by:uid});
   const saved=await checkedQuery(query.select('id').single(),'Salvar transmissão');
   if(!saved?.id)throw new Error('A gravação não foi confirmada.');
   if(adminIsCurrent(version,box,uid)){toast('Transmissão salva.');await renderAdminTab('transmissoes-admin');}
  }catch(error){console.error('[+1Bahia stream save]',error);if(document.contains(form))feedback.textContent=error.message||'Falha ao salvar.';}
  finally{if(document.contains(form)){button.disabled=false;$('#cancelStream').disabled=false;}}
 };
}
function newsForm(n){
 const box=$('#adminContent'),uid=user?.id;
 if(!box||authorizedAdminId!==uid)return;
 const version=++adminRequestVersion;
 box.innerHTML='<h2>'+(n?'Editar':'Nova')+' notícia</h2><form id="newsEditor" class="admin-form"><label>Título<input id="et" value="'+esc(n?.title||'')+'" required></label><label>Resumo<input id="es" value="'+esc(n?.summary||'')+'" required></label><label>Conteúdo<textarea id="ec" required>'+esc(n?.content||'')+'</textarea></label><label>URL da imagem<input id="ei" type="url" value="'+esc(n?.image_url||'')+'"></label><label>Slug<input id="egl" value="'+esc(n?.slug||'')+'" required></label><label>Status<select id="estt"><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label><button class="button primary" id="saveNews">Salvar</button><button type="button" class="button outline" id="cancelNews">Cancelar</button><p id="newsFeedback" role="status"></p></form>';
 $('#estt').value=n?.status||'draft';
 $('#cancelNews').onclick=()=>renderAdminTab('noticias-admin');
 const form=$('#newsEditor'),button=$('#saveNews'),feedback=$('#newsFeedback');
 form.onsubmit=async e=>{
  e.preventDefault();if(button.disabled)return;
  button.disabled=true;$('#cancelNews').disabled=true;feedback.textContent='Salvando...';
  try{
   const d={title:$('#et').value.trim(),summary:$('#es').value.trim(),content:$('#ec').value.trim(),image_url:$('#ei').value.trim()||null,slug:$('#egl').value.trim(),status:$('#estt').value,published_at:$('#estt').value==='published'?(n?.published_at||new Date().toISOString()):null,updated_at:new Date().toISOString()};
   if(!d.title||!d.summary||!d.content||!d.slug)throw new Error('Preencha os campos obrigatórios.');
   const query=n?db.from('news').update(d).eq('id',n.id):db.from('news').insert({...d,author_id:uid});
   await checkedQuery(query.select('id').single(),'Salvar notícia');
   if(adminIsCurrent(version,box,uid)){toast('Notícia salva.');await renderAdminTab('noticias-admin');}
  }catch(error){console.error('[+1Bahia news save]',error);if(document.contains(form))feedback.textContent=error.message||'Falha ao salvar.';}
  finally{if(document.contains(form)){button.disabled=false;$('#cancelNews').disabled=false;}}
 };
}
let initializedSession=false;
let sessionVersion=0;
let pageTimer;
function schedulePage(){
 clearTimeout(pageTimer);
 pageTimer=setTimeout(()=>{Promise.resolve(page()).catch(error=>{console.error('[+1Bahia page]',error);toast(error.message||'Falha ao carregar a página.');});},0);
}
function sessionFailure(error){
 console.error('[+1Bahia session]',error);
 if(document.body.dataset.page==='admin'){
  shell('Painel administrativo','<p class="empty-state" role="alert">Não foi possível recuperar a sessão. '+esc(error.message||'Verifique sua conexão.')+'</p><button class="button primary" id="retrySession">Tentar novamente</button>');
  $('#retrySession').onclick=initializeSession;
 }else{toast('Não foi possível recuperar sua sessão. Tente novamente.');schedulePage();}
}
async function initializeSession(){
 const version=++sessionVersion;
 let timer;
 if(document.body.dataset.page==='admin')shell('Painel administrativo','<p class="loading">Recuperando sessão...</p>');
 try{
  const result=await Promise.race([
   db.auth.getSession(),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('A conexão demorou.')),12000);})
  ]);
  if(version!==sessionVersion)return;
  if(result.error)throw result.error;
  user=result.data.session?.user||null;
  initializedSession=true;updateAccount();schedulePage();
 }catch(error){if(version===sessionVersion)sessionFailure(error);}
 finally{clearTimeout(timer);}
}
window.addEventListener('hashchange',schedulePage);
document.addEventListener('DOMContentLoaded',()=>{
 updateAccount();
 db.auth.onAuthStateChange((event,session)=>{
  // Keep this callback synchronous: Supabase operations here can deadlock.
  if(event==='INITIAL_SESSION')return;
  const next=session?.user||null,changed=user?.id!==next?.id;
  user=next;updateAccount();
  if(initializedSession&&(changed||event==='SIGNED_OUT'||event==='PASSWORD_RECOVERY')){
   authorizedAdminId=null;++adminRequestVersion;schedulePage();
  }
 });
 initializeSession();
 const banner=$('#pwaBanner'),install=$('#pwaBannerButton'),close=$('#pwaBannerClose');let prompt=null;
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;if(banner)banner.hidden=false;});
 if(install)install.onclick=async()=>{if(prompt){await prompt.prompt();prompt=null;}else location.href='pwa.html';};
 if(close)close.onclick=()=>{banner.hidden=true;};
});
window.addEventListener('focus',()=>{if(document.body.dataset.page==='chat'&&user)loadChat();});
setInterval(()=>{if(!document.hidden&&document.body.dataset.page==='chat'&&user)loadChat();},10000);
