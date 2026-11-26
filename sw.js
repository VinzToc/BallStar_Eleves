/* Service worker Ball Star – tout est mis en cache : l'app fonctionne sans réseau, et prend la dernière version dès qu'il y a du réseau.
   Pour publier une mise à jour : changer VERSION ci-dessous (et APP_VERSION dans version.js). */
const VERSION='2.3.6';
const CACHE='ballstar-eleves-'+VERSION;
const CORE=['fonts/fonts.css','fonts/lilita-one-latin-400-normal.woff2','fonts/nunito-latin-600-normal.woff2','fonts/nunito-latin-800-normal.woff2','fonts/nunito-latin-900-normal.woff2','footer.js','nouveautes.js','nouveautes.json',"./","index.html","ballstar.js","ballstar.css","bs-art.js","bs-rules.js","bs-install.js","lib/qrcode.js","lib/jsQR.js","bs-xlsx.js","eps-core.js","eleve-core.js","version.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/apple-touch-icon.png","icons/neo-pocket.png"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('ballstar-eleves-')&&k!==CACHE)await caches.delete(k);await self.clients.claim()})())});
// Réseau d'abord (la dernière version est utilisée dès qu'il y a du réseau), cache si hors ligne ou réseau trop lent.
self.addEventListener('fetch',e=>{const req=e.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 e.respondWith((async()=>{const cache=await caches.open(CACHE);
  const net=fetch(req,{cache:'no-cache'}).then(r=>{if(r&&r.ok)cache.put(req,r.clone());return r}).catch(()=>null);
  const lent=new Promise(res=>setTimeout(()=>res(null),3500));
  const r=await Promise.race([net,lent]);if(r)return r;
  const cached=await cache.match(req,{ignoreSearch:true});if(cached){e.waitUntil(net);return cached}
  const r2=await net;if(r2)return r2;
  if(req.mode==='navigate'){const fb=await cache.match('index.html');if(fb)return fb}
  return new Response('Hors ligne',{status:503})})())});
