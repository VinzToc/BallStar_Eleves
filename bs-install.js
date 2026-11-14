/* bs-install.js — propose d'installer l'appli à l'ouverture (si elle n'est pas déjà installée).
   - Chrome, Edge, Android : bouton « Installer » (invite native du navigateur).
   - iPhone / iPad (Safari) : rappel des étapes « Partager → Sur l'écran d'accueil ».
   - « Plus tard » masque la proposition jusqu'à la prochaine ouverture de l'appli.
   Commun à BallStar_Eleves et BallStar_Prof (le nom affiché vient de <title>). */
(function(){
const standalone=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
if(standalone())return;
const KEY='BALLSTAR_INSTALL_PLUS_TARD';
const ss={get(){try{return sessionStorage.getItem(KEY)}catch(e){return null}},set(){try{sessionStorage.setItem(KEY,'1')}catch(e){}}};
const ua=navigator.userAgent||'';
const ios=/iphone|ipad|ipod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const nom=(document.title||'Ball Star').trim();
let evt=null,box=null;

const css=`.bsi{position:fixed;left:0;right:0;bottom:calc(var(--bsi-bottom,16px) + env(safe-area-inset-bottom,0px));z-index:40;display:flex;justify-content:center;
 padding:0 max(12px,env(safe-area-inset-right,0px)) 0 max(12px,env(safe-area-inset-left,0px));pointer-events:none;animation:bsiIn .4s cubic-bezier(.2,1.3,.4,1)}
.bsi>div{pointer-events:auto;max-width:560px;width:100%;display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:linear-gradient(180deg,#3a1690,#1d0b45);
 border:2px solid #ffe14a;border-radius:18px;padding:12px 14px;box-shadow:0 10px 30px #000a,0 0 24px #ffe14a33;color:#f6f0ff;font-family:'Nunito',system-ui,sans-serif}
.bsi img{width:44px;height:44px;border-radius:12px;flex:none}
.bsi .t{flex:1;min-width:170px;font-size:.88rem;line-height:1.3}.bsi .t b{display:block;font-size:1rem;color:#ffe14a}
.bsi .a{display:flex;gap:8px;margin-left:auto}
.bsi button{border:0;border-radius:12px;padding:10px 14px;font-weight:900;font-size:.88rem;cursor:pointer;font-family:inherit}
.bsi .go{background:linear-gradient(180deg,#ffe14a,#ffb000);color:#1a0b33;box-shadow:0 3px 0 #9a5a00}
.bsi .no{background:#ffffff14;color:#f6f0ff;border:2px solid #5a34b8}
@keyframes bsiIn{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.bsi{animation:none}}`;

function show(mode){if(box||ss.get()||standalone())return;
 const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
 const icon=(document.querySelector('link[rel="apple-touch-icon"]')||document.querySelector('link[rel="icon"]')||{}).href||'';
 box=document.createElement('div');box.className='bsi';box.setAttribute('role','dialog');box.setAttribute('aria-label','Installer '+nom);
 box.innerHTML=`<div>${icon?`<img src="${icon}" alt="">`:''}<div class="t"><b>Installe ${nom} 📲</b>${mode==='ios'
  ?'Touche <b style="display:inline;color:inherit">Partager</b> ⬆️ en bas de Safari, puis « Sur l\'écran d\'accueil ».'
  :'Ajoute l\'appli sur cet appareil : elle s\'ouvre en un geste et fonctionne même sans réseau.'}</div>
  <div class="a">${mode==='ios'?'':'<button class="go" type="button">Installer</button>'}<button class="no" type="button">${mode==='ios'?'OK':'Plus tard'}</button></div></div>`;
 document.body.appendChild(box);
 const go=box.querySelector('.go');if(go)go.onclick=async()=>{if(!evt)return hide();evt.prompt();try{await evt.userChoice}catch(e){}evt=null;hide()};
 box.querySelector('.no').onclick=()=>{ss.set();hide()}}
function hide(){if(box){box.remove();box=null}}

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();evt=e;setTimeout(()=>show('prompt'),1200)});
window.addEventListener('appinstalled',()=>{evt=null;hide()});
if(ios&&/safari/i.test(ua)&&!/crios|fxios|edgios/i.test(ua))setTimeout(()=>show('ios'),1500);
})();
