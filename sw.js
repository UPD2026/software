const CACHE='billing-v23';
const LOCAL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./icon-maskable-512.png','./cloud.js','./catalogue-bg.jpg','./catalogue.html','./proposal/service.webp','./proposal/prices.webp','./proposal/pages.webp','./proposal/demand.webp','./proposal/choices.webp','./proposal/profit.webp','./proposal/listen.webp','./proposal/independent.webp','./proposal/creativity.webp','./proposal/localfocus.webp','./proposal/allinone.webp','./proposal/authorvisit.webp'];
const XLSX_URL='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const SB_URL='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
const EXT=[XLSX_URL,SB_URL];
self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    await c.addAll(LOCAL);
    for(const u of EXT){try{await c.add(new Request(u,{mode:'cors'}))}catch(_){}}
    self.skipWaiting();
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(new URL(e.request.url).origin!==location.origin&&!EXT.includes(e.request.url))return;
  if(new URL(e.request.url).pathname.endsWith('/config.js')){
    e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).then(r=>{
    const same=new URL(e.request.url).origin===location.origin;
    if(r&&r.ok&&(same||EXT.includes(e.request.url))){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp))}
    return r;
  }).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):Response.error())));
});
