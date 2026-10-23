/* Shared-database layer. Active only when config.js has a Supabase url + key.
   The app still works from its local copy; changes are pushed to the database and
   other laptops' changes arrive live. */
(function(){
'use strict';
if(!CLOUD)return;
const g=id=>document.getElementById(id);
const sj=o=>JSON.stringify(o,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort().reduce((a,x)=>(a[x]=v[x],a),{}):v);
const split=k=>{const i=k.indexOf('|');return [k.slice(0,i),k.slice(i+1)]};
/* catalogue images are big: keep only a short fingerprint of them in the saved snapshot */
const h32=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
const sg=(kind,id,obj)=>{const j=sj(obj);return (kind==='catbook'||(kind==='set'&&id==='catbg'))?j.length+':'+h32(j):j};
const catMeta=()=>({heading:catalog.heading,per:catalog.per,order:catalog.books.map(b=>b.id)});
let catStore={books:{},meta:null,bg:''};
function applyCat(){
  if(window.catFromCloud)catFromCloud(catStore);
  /* ids the order list mentions but whose row has not arrived yet: remember them as blank so they are not re-uploaded */
  ((catStore.meta&&catStore.meta.order)||[]).forEach(id=>{if(!catStore.books[id])snap['catbook|'+id]=sg('catbook',id,{id,image:'',price:''})});
  persistSnap();
}
const _save=window.save;
let sb=null,started=false,snap={},chain=Promise.resolve(),timer=null,lastPull=0,wasDown=false,chan=null,lastSt='';
try{snap=JSON.parse(localStorage.getItem('bsb_snap')||'{}')}catch(e){snap={}}
const persistSnap=()=>{try{localStorage.setItem('bsb_snap',JSON.stringify(snap))}catch(e){}};
const q=fn=>{chain=chain.then(fn).catch(()=>{});return chain};

/* ---------- login screen ---------- */
const em=g('em'),pw=g('pin'),msg=g('pinmsg');
em.classList.remove('hide');em.type='text';em.placeholder='Username';em.setAttribute('autocapitalize','none');em.setAttribute('autocorrect','off');em.spellcheck=false;em.style.cssText='font-size:16px;letter-spacing:normal;margin:14px 0 0';
pw.type='password';pw.placeholder='Password';pw.removeAttribute('inputmode');pw.maxLength=100;pw.style.cssText='font-size:16px;letter-spacing:normal;margin:8px 0 6px';
document.querySelector('#lock .lockbox .mu').textContent='Billing software · sign in to continue';
g('unlock').textContent='Sign in';
const st=document.createElement('div');st.id='syncst';st.style.cssText='font-size:12px;text-align:center;margin-top:8px;opacity:.9';
g('logout').insertAdjacentElement('afterend',st);
function setSt(k){
  lastSt=k;
  st.textContent={ok:'● Online · all changes saved',sync:'● Saving…',conn:'● Connecting…',off:'● Offline · saved on this laptop, will upload later'}[k]||'';
  st.style.color={ok:'#16a34a',sync:'#d97706',conn:'#d97706',off:'#dc2626'}[k]||'';
}
const lockUI=()=>{document.body.classList.add('locked');pw.value='';setTimeout(()=>em.focus(),50)};
const unlockUI=()=>document.body.classList.remove('locked');
lockUI();

if(typeof supabase==='undefined'||!supabase.createClient){
  g('unlock').onclick=()=>{msg.textContent='Cannot load the online library. Check the internet and reload.'};
  return;
}
sb=supabase.createClient(APP_CFG.url,APP_CFG.key,{auth:{persistSession:true,autoRefreshToken:true}});
window.sb=sb;

/* staff type a plain user name; it is stored in Supabase as  username@uniquebooks.app  (no email is ever sent) */
const USER_DOMAIN='@uniquebooks.app';
async function login(){
  let email=em.value.trim().toLowerCase();const pass=pw.value;
  if(!email||!pass){msg.textContent='Enter user name and password.';return}
  if(email.indexOf('@')<0)email+=USER_DOMAIN;
  msg.textContent='Signing in…';
  const {error}=await sb.auth.signInWithPassword({email,password:pass});
  if(error){msg.textContent=/network|fetch/i.test(error.message)?'No internet connection.':'Wrong user name or password.';pw.value='';return}
  msg.textContent='';pw.value='';unlockUI();q(start);
}
g('unlock').onclick=login;
pw.onkeydown=em.onkeydown=e=>{if(e.key==='Enter')login()};
g('logout').onclick=async()=>{started=false;try{await sb.removeAllChannels();await sb.auth.signOut()}catch(e){}lockUI()};
sb.auth.onAuthStateChange((ev)=>{if(ev==='SIGNED_OUT'){started=false;lockUI()}});

/* ---------- state <-> records ---------- */
function cur(){
  const s={},o={},add=(kind,id,obj)=>{const k=kind+'|'+id;o[k]=obj;s[k]=sg(kind,id,obj)};
  books.forEach(b=>add('book',String(b.isbn==null?'':b.isbn),b));
  sales.forEach(b=>add('sale',String(b.date),b));
  moves.forEach(v=>add('move',String(v.id),v));
  letters.forEach(v=>add('letter',String(v.id),v));
  add('set','logo',{v:logoData});add('set','prefix',{v:prefix});add('set','mvpfx',{v:mvpfx});
  if(catalog.live){catalog.books.forEach(b=>add('catbook',b.id,{id:b.id,image:b.image,price:b.price}));add('set','catmeta',{v:catMeta()});add('set','catbg',{v:catalog.bg})}
  return {s,o};
}
function setSetting(id,v){
  if(id==='logo')logoData=v||'';
  else if(id==='prefix')prefix=v==null?'INV-':v;
  else if(id==='mvpfx'&&v)mvpfx=Object.assign({IN:'IN-',OUT:'OUT-'},v);
  else if(id==='catmeta')catStore.meta=v||null;
  else if(id==='catbg')catStore.bg=v||'';
}
const sortAll=()=>{
  sales.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  moves.sort((a,b)=>(+b.id||0)-(+a.id||0));
  letters.sort((a,b)=>(+b.id||0)-(+a.id||0));
};
function setCounter(name,val){if(name==='INV')counter=val;else if(name==='IN'||name==='OUT')mvno[name]=val}

let rt=null;
function softRender(){
  clearTimeout(rt);
  rt=setTimeout(function go(){
    const a=document.activeElement;
    if(a&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)&&a.closest('table,dialog')){rt=setTimeout(go,1500);return}
    render();setBrandLogo();
  },300);
}

/* ---------- push (only what changed on this laptop) ---------- */
async function push(){
  const {s,o}=cur(),up=[],del=[];
  for(const k in s)if(snap[k]!==s[k])up.push(k);
  for(const k in snap)if(!(k in s))del.push(k);
  if(!up.length&&!del.length)return;
  try{
    for(let i=0;i<up.length;i+=200){
      const ch=up.slice(i,i+200);
      const {error}=await sb.from('records').upsert(ch.map(k=>{const [kind,id]=split(k);return {kind,id,data:o[k]}}),{onConflict:'kind,id'});
      if(error)throw error;
      ch.forEach(k=>snap[k]=s[k]);
    }
    const by={};del.forEach(k=>{const [kind,id]=split(k);(by[kind]=by[kind]||[]).push(id)});
    for(const kind in by){
      for(let i=0;i<by[kind].length;i+=100){
        const ch=by[kind].slice(i,i+100);
        const {error}=await sb.from('records').delete().eq('kind',kind).in('id',ch);
        if(error)throw error;
        ch.forEach(id=>delete snap[kind+'|'+id]);
      }
    }
  }finally{persistSnap()}
}

/* ---------- pull (everything from the database) ---------- */
async function pull(force){
  const rows=[];
  for(let from=0;;from+=1000){
    const {data,error}=await sb.from('records').select('kind,id,data').order('kind').order('id').range(from,from+999);
    if(error)throw error;
    rows.push(...data);if(data.length<1000)break;
  }
  const {data:cn,error:ce}=await sb.from('counters').select('name,value');
  if(ce)throw ce;
  lastPull=Date.now();
  const rs={};rows.forEach(r=>rs[r.kind+'|'+r.id]=sg(r.kind,r.id,r.data));
  let ctrChanged=false;(cn||[]).forEach(c=>{const old=c.name==='INV'?counter:mvno[c.name];if(old!==c.value)ctrChanged=true});
  let same=Object.keys(rs).length===Object.keys(snap).length&&Object.keys(rs).every(k=>snap[k]===rs[k]);
  if(same&&!ctrChanged&&!force)return;
  books=[];sales=[];moves=[];letters=[];catStore={books:{},meta:null,bg:''};
  rows.forEach(r=>{
    if(r.kind==='catbook')catStore.books[r.id]=r.data;else if(r.kind==='book')books.push(r.data);else if(r.kind==='sale')sales.push(r.data);
    else if(r.kind==='move')moves.push(r.data);else if(r.kind==='letter')letters.push(r.data);else if(r.kind==='set')setSetting(r.id,r.data&&r.data.v);
  });
  sortAll();
  (cn||[]).forEach(c=>setCounter(c.name,c.value));
  snap=rs;persistSnap();applyCat();_save();softRender();
}

/* ---------- start / schedule ---------- */
async function start(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session)return;
  if(started)return;
  setSt('conn');
  try{
    const {count,error}=await sb.from('records').select('*',{count:'exact',head:true});
    if(error)throw error;
    const hasLocal=books.length||sales.length||moves.length,fresh=!Object.keys(snap).length;
    if(fresh&&hasLocal){
      try{localStorage.setItem('bsb_local_backup',localStorage.getItem('bsb')||'')}catch(e){}
      if(count===0&&confirm('The shared database is empty.\n\nOK = upload the books and bills stored on this laptop to the shared database.\nCancel = start with an empty shared database.')){
        await push();
        await sb.rpc('set_number',{p_name:'INV',p_value:counter});
        await sb.rpc('set_number',{p_name:'IN',p_value:mvno.IN});
        await sb.rpc('set_number',{p_name:'OUT',p_value:mvno.OUT});
      }else if(count>0){
        alert('This laptop had older data saved before sharing was turned on.\nIt has been replaced by the shared data. (A backup copy is kept inside this browser.)');
      }
    }else if(!fresh){await push()}
    await pull(true);
    started=true;subscribe();setSt('ok');
  }catch(e){setSt('off')}
}
function subscribe(){
  if(chan)return;
  chan=sb.channel('shop-live')
   .on('postgres_changes',{event:'*',schema:'public',table:'records'},onRec)
   .on('postgres_changes',{event:'*',schema:'public',table:'counters'},p=>{const r=p.new;if(r&&r.name){setCounter(r.name,r.value);_save();softRender()}})
   .subscribe(status=>{
     if(status==='SUBSCRIBED'){if(wasDown){wasDown=false;q(()=>pull().catch(()=>{}))}}
     else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED')wasDown=true;
   });
}
function onRec(p){
  const arrOf={book:()=>books,sale:()=>sales,move:()=>moves,letter:()=>letters};
  if(p.eventType==='DELETE'){
    const kind=p.old.kind,id=p.old.id,k=kind+'|'+id;
    if(!(k in snap))return;
    if(kind==='book')books=books.filter(b=>String(b.isbn==null?'':b.isbn)!==id);
    else if(kind==='sale')sales=sales.filter(b=>String(b.date)!==id);
    else if(kind==='move')moves=moves.filter(v=>String(v.id)!==id);
    else if(kind==='letter')letters=letters.filter(v=>String(v.id)!==id);
    else if(kind==='catbook'){delete catStore.books[id];delete snap[k];applyCat();_save();return}
    delete snap[k];persistSnap();_save();softRender();return;
  }
  const r=p.new;if(!r)return;
  const k=r.kind+'|'+r.id,s=sg(r.kind,r.id,r.data);
  if(snap[k]===s)return;
  /* this laptop has edits not uploaded yet: keep them (they will be uploaded), ignore the older copy */
  if(r.kind==='catbook'){
    const lb=catalog.books.find(b=>b.id===r.id);
    if(lb&&sg('catbook',r.id,{id:r.id,image:lb.image,price:lb.price})!==snap[k])return;
    catStore.books[r.id]=r.data;snap[k]=s;applyCat();return;
  }
  if(r.kind==='set'&&(r.id==='catmeta'||r.id==='catbg')){
    const lv=r.id==='catmeta'?catMeta():catalog.bg;
    if(catalog.live&&sg('set',r.id,{v:lv})!==snap[k])return;
    setSetting(r.id,r.data&&r.data.v);snap[k]=s;applyCat();return;
  }
  if(r.kind==='set'){setSetting(r.id,r.data&&r.data.v)}
  else if(arrOf[r.kind]){
    const a=arrOf[r.kind](),idf=r.kind==='book'?b=>String(b.isbn==null?'':b.isbn):r.kind==='sale'?b=>String(b.date):b=>String(b.id);
    const i=a.findIndex(x=>idf(x)===r.id);
    if(i>=0)a[i]=r.data;else a.push(r.data);
    sortAll();
  }
  snap[k]=s;persistSnap();_save();softRender();
}
function schedule(){
  clearTimeout(timer);
  timer=setTimeout(()=>q(async()=>{
    if(!started){await start();return}
    try{setSt('sync');await push();setSt('ok')}catch(e){setSt('off')}
  }),400);
}
window.save=function(){_save();schedule()};
window.takeNo=async name=>{const {data,error}=await sb.rpc('take_number',{p_name:name});if(error)throw error;return data};
window.setNo=async(name,val)=>{try{const {error}=await sb.rpc('set_number',{p_name:name,p_value:val});if(error)throw error}catch(e){alert('Could not update the number on the shared database (no internet?).')}};

/* retries and safety nets */
setInterval(()=>q(async()=>{
  if(!started){await start();return}
  try{
    const {s}=cur();let dirty=false;
    for(const k in s)if(snap[k]!==s[k]){dirty=true;break}
    if(!dirty)for(const k in snap)if(!(k in s)){dirty=true;break}
    if(dirty){setSt('sync');await push()}
    if(Date.now()-lastPull>10*60*1000)await pull();
    setSt('ok');
  }catch(e){setSt('off')}
}),30000);
const wake=()=>{if(document.visibilityState==='visible'&&started&&Date.now()-lastPull>60000)q(async()=>{try{await push();await pull();setSt('ok')}catch(e){setSt('off')}})};
document.addEventListener('visibilitychange',wake);
window.addEventListener('online',()=>q(async()=>{if(!started){await start();return}try{await push();await pull();setSt('ok')}catch(e){setSt('off')}}));
window.addEventListener('offline',()=>setSt('off'));

/* already signed in on this laptop? */
sb.auth.getSession().then(({data:{session}})=>{if(session){unlockUI();q(start)}});
})();
