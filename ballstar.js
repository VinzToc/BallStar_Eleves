/* Ball Star — challenge XP pour les sports de raquette et de combat (Applis EPS Élèves).
   Une ligne par match dans la feuille « ballstar » du classeur de l'élève (base locale « EPSEleves » partagée avec le portail).
   Toute la progression (XP, niveau, défis, avatars) est recalculée à partir des matchs : réimporter une sauvegarde restaure tout. */
(function(){
const APP_ID='ballstar';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const N=v=>{const n=Number(v);return isFinite(n)?n:0};
const fileSafe=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w-]+/g,'_').replace(/^_+|_+$/g,'');
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const {AVATARS,NIVEAUX,avatarSVG,badgeSVG,logoSVG}=window.BSART;

/* ───────── Réglages (modifiables par le professeur) ───────── */
const ACTS=[{n:'Tennis de table',e:'🏓'},{n:'Badminton',e:'🏸'},{n:'Tennis',e:'🎾'},{n:'Sports de combat',e:'🥋'}];
const DEF={xp:{joue:10,victoire:25,bonus:5},ecart:[[3,5],[6,10],[10,15]],seuils:[0,150,400,750],
 acts:{
  'Tennis de table':{impose:'',obs:['Faire déplacer mon adversaire','Varier les trajectoires (long / court, gauche / droite)','Varier mes services','Jouer en revers quand il le faut','Accélérer sur une balle haute']},
  'Badminton':{impose:'',obs:['Faire déplacer mon adversaire aux 4 coins','Alterner jeu long et jeu court','Smasher sur un volant haut','Revenir au centre après chaque frappe','Servir long et haut']},
  'Tennis':{impose:'',obs:['Faire déplacer mon adversaire','Jouer en revers quand il le faut','Monter au filet pour conclure','Varier la longueur de balle','Réussir mes premières balles de service']},
  'Sports de combat':{impose:'',obs:['Conserver ma garde','Déséquilibrer avant d\'attaquer','Enchaîner deux actions','Rester dans la zone de combat','Contrôler mon adversaire au sol']}
 }};
const CFG_KEY='BALLSTAR_CONFIG',CFG_SHEET='BallStar_Config';
const clone=o=>JSON.parse(JSON.stringify(o));
function loadCfg(){let c=null;try{c=JSON.parse(ls.get(CFG_KEY)||'null')}catch(e){}
 const d=clone(DEF);if(!c)return d;
 Object.assign(d.xp,c.xp||{});if(Array.isArray(c.ecart))d.ecart=c.ecart;if(Array.isArray(c.seuils)&&c.seuils.length===4)d.seuils=c.seuils;
 for(const a of ACTS){const x=(c.acts||{})[a.n];if(x){if(Array.isArray(x.obs)&&x.obs.length)d.acts[a.n].obs=x.obs;d.acts[a.n].impose=x.impose||''}}
 return d}
let CFG=loadCfg();
const saveCfg=()=>ls.set(CFG_KEY,JSON.stringify(CFG));

/* ───────── Calcul de l'XP d'un match ───────── */
function calcXP(me,adv,ok){
 const win=me>adv,ecart=Math.abs(me-adv);
 let xe=0;if(win)for(const [min,xp] of [...CFG.ecart].sort((a,b)=>a[0]-b[0]))if(ecart>=N(min)&&N(min)>0)xe=N(xp);
 const r={match:N(CFG.xp.joue),victoire:win?N(CFG.xp.victoire):0,ecart:xe,bonus:ok?N(CFG.xp.bonus):0};
 r.total=r.match+r.victoire+r.ecart+r.bonus;r.win=win;r.nul=me===adv;r.diff=ecart;return r}
const maxEcartXP=()=>Math.max(0,...CFG.ecart.map(e=>N(e[1])));

/* ───────── Progression ───────── */
const sortRows=rows=>[...rows].sort((a,b)=>(String(a.Date)+String(a.Heure||'')).localeCompare(String(b.Date)+String(b.Heure||'')));
const levelOf=xp=>{let l=0;CFG.seuils.forEach((s,i)=>{if(xp>=N(s))l=i});return l};
function streak(rows,f){let m=0,c=0;for(const r of rows){if(f(r)){c++;m=Math.max(m,c)}else c=0}return m}
const isWin=r=>r['Résultat']==='Victoire',isOk=r=>String(r['Observable réussi']).toLowerCase()==='oui';
const DEFIS=[
 {id:'combo',nom:'Série de feu',desc:"Gagner 3 matchs d'affilée",but:3,val:R=>streak(R,isWin)},
 {id:'globe',nom:'Tour du monde',desc:'Affronter 5 adversaires différents',but:5,val:R=>new Set(R.map(r=>norm(r.Adversaire)).filter(Boolean)).size},
 {id:'lynx',nom:'Œil de lynx',desc:"Réussir l'observable 5 fois",but:5,val:R=>R.filter(isOk).length},
 {id:'turbo',nom:'Increvable',desc:'Jouer 10 matchs',but:10,val:R=>R.length},
 {id:'titan',nom:'Rouleau compresseur',desc:"Gagner un match avec le plus gros bonus d'écart",but:1,val:R=>{const m=maxEcartXP();return m>0?R.filter(r=>isWin(r)&&N(r['XP écart'])>=m).length:0}},
 {id:'zen',nom:'Maîtrise totale',desc:"Réussir l'observable 3 matchs d'affilée",but:3,val:R=>streak(R,isOk)}
];
function state(rows){const R=sortRows(rows);const xp=R.reduce((s,r)=>s+N(r['XP gagnée']),0),lvl=levelOf(xp);
 const defis=DEFIS.map(d=>{const v=d.val(R);return{...d,v:Math.min(v,d.but),done:v>=d.but}});
 const unlocked=new Set(AVATARS.filter(a=>a.defi?defis.find(d=>d.id===a.defi).done:a.niveau<=lvl).map(a=>a.id));
 const w=R.filter(isWin).length,l=R.filter(r=>r['Résultat']==='Défaite').length,ok=R.filter(isOk).length;
 return{R,xp,lvl,defis,unlocked,w,l,ok,n:R.length}}

/* ───────── Données élève ───────── */
let ME=null,ROWS=[],ST=state([]);
async function reload(){ME=window.ELEVE?await ELEVE.courant():null;
 ROWS=ME?((await ELEVE.donnees())[APP_ID]||[]):[];ST=state(ROWS);renderAll()}
const avKey=()=>'BALLSTAR_AVATAR_'+(ME?ME.id:'anon');
function activeAvatar(){let id=ls.get(avKey());if(!id||!ST.unlocked.has(id))id='pixel';return AVATARS.find(a=>a.id===id)}

/* ───────── Interface : navigation ───────── */
const VIEWS=['vArene','vMatch','vDefis','vAvatars','vBilan','vProf'];
function go(v){VIEWS.forEach(x=>$('#'+x).hidden=x!==v);$$('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.go===v));
 if(v==='vProf')renderProf();if(v==='vMatch')renderMatchForm();window.scrollTo({top:0,behavior:'smooth'})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)go(b.dataset.go)});

function toast(msg,ko){const t=document.createElement('div');t.className='toast'+(ko?' ko':'');t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3200)}
function modal(html,btns){return new Promise(res=>{const m=$('#modal');m.innerHTML=`<div class="modal"><div class="mbox">${html}<div class="row">${btns.map((b,i)=>`<button class="btn ${b.cls||''}" data-i="${i}">${b.t}</button>`).join('')}</div></div></div>`;
 m.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{m.innerHTML='';res(btns[+b.dataset.i].v)})})}
function confetti(box){const c=document.createElement('div');c.className='confetti';const cols=['#ffe14a','#ff3df2','#8f5bff','#3dffa0','#fff'];
 for(let i=0;i<40;i++){const s=document.createElement('span');s.style.left=Math.random()*100+'%';s.style.background=cols[i%cols.length];s.style.animationDelay=(Math.random()*.6)+'s';c.appendChild(s)}box.appendChild(c)}

/* ───────── Arène ───────── */
function xpInfo(){const s=CFG.seuils,l=ST.lvl;if(l>=3)return{pct:100,txt:`${ST.xp} XP`,next:'Niveau maximum atteint : tu es une Star ⭐'};
 const a=N(s[l]),b=N(s[l+1]);return{pct:Math.max(2,Math.min(100,(ST.xp-a)/(b-a)*100)),txt:`${ST.xp} / ${b} XP`,next:`Encore ${b-ST.xp} XP pour passer ${NIVEAUX[l+1].nom}`}}
function matchItem(r,del){const win=isWin(r),act=ACTS.find(a=>a.n===r['Activité'])||{e:'🎮'};
 return `<div class="m ${win?'win':r['Résultat']==='Défaite'?'loss':''}"><span class="e" aria-hidden="true">${act.e}</span>
 <div class="t"><b>vs ${esc(r.Adversaire||'?')}</b><small>${esc(fmtDate(r.Date))} · ${esc(r['Résultat'])}${r.Observable?` · ${isOk(r)?'✅':'❌'} ${esc(r.Observable)}`:''}</small></div>
 <div class="x"><span class="sc">${N(r['Mon score'])} – ${N(r['Score adversaire'])}</span><span class="xp">+${N(r['XP gagnée'])} XP</span>${del?`<br><button class="del" data-del="${esc(r.Date)}|${esc(r.Heure||'')}|${esc(r.Adversaire||'')}">🗑️ supprimer</button>`:''}</div></div>`}
const fmtDate=d=>{const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(String(d||''));return m?`${m[3]}/${m[2]}/${m[1]}`:String(d||'')};
function renderArene(){const a=activeAvatar(),x=xpInfo(),pctOk=ST.n?Math.round(ST.ok/ST.n*100)+'%':'–';
 $('#hero').innerHTML=`<div class="pic" data-go="vAvatars" title="Changer d'avatar">${avatarSVG(a,{k:'h'})}</div>
 <div class="info"><div class="nm">${esc(a.nom)}</div><div class="tt">${ME?esc(ME.prenom)+' · ':''}${esc(a.titre)}</div>
  <div class="lvl">${badgeSVG(ST.lvl,34)} ${NIVEAUX[ST.lvl].nom}</div>
  <div class="xpbar"><i id="xpFill"></i><b>${x.txt}</b></div><div class="xpnext">${x.next}</div></div>
 <div class="stats" style="grid-column:1/-1"><div class="stat"><b>${ST.n}</b><span>Matchs</span></div><div class="stat"><b>${ST.w}</b><span>Victoires</span></div><div class="stat"><b>${ST.l}</b><span>Défaites</span></div><div class="stat"><b>${pctOk}</b><span>Observable</span></div></div>`;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{const f=$('#xpFill');if(f)f.style.width=x.pct+'%'}));
 const nd=ST.defis.filter(d=>!d.done).sort((p,q)=>q.v/q.but-p.v/p.but)[0];
 $('#nextDefi').innerHTML=nd?defiItem(nd):`<div class="empty">🏆 Tous les défis sont réussis. Respect !</div>`;
 const last=ST.R.slice(-3).reverse();
 $('#lastMatchs').innerHTML=last.length?last.map(r=>matchItem(r)).join(''):`<div class="empty">Aucun match pour l'instant.<br>Touche <b>⚔️ Nouveau match</b> après ta première rencontre pour gagner tes premiers XP.</div>`;
 if(!ME)$('#lastMatchs').insertAdjacentHTML('afterbegin',`<div class="empty" style="margin-bottom:8px;border-color:var(--y)">👤 Identifie-toi pour enregistrer tes matchs et gagner de l'XP.<br><button class="btn" style="margin-top:8px" id="bIdent">S'identifier</button></div>`)}
function defiItem(d){const a=AVATARS.find(x=>x.defi===d.id);
 return `<div class="defi ${d.done?'done':''}"><div class="pic">${avatarSVG(a,{locked:!d.done,k:'d'})}</div><div><b>${d.done?'✅ ':''}${esc(d.nom)}</b><small>${esc(d.desc)} · avatar ${esc(a.nom)}</small>
 <div class="pbar"><i style="width:${Math.round(d.v/d.but*100)}%"></i></div><small>${d.v} / ${d.but}</small></div></div>`}

/* ───────── Match ───────── */
const F={act:null,ok:null,val:null,obsSel:''};
function lastAct(){const r=ST.R[ST.R.length-1];return r&&ACTS.some(a=>a.n===r['Activité'])?r['Activité']:ACTS[0].n}
function renderMatchForm(){if(!F.act)F.act=lastAct();
 $('#mAct').innerHTML=ACTS.map(a=>`<button type="button" class="chip ${a.n===F.act?'on':''}" data-act="${esc(a.n)}"><span class="e">${a.e}</span>${esc(a.n)}</button>`).join('');
 const advs=[...new Set(ST.R.map(r=>r.Adversaire).filter(Boolean))];$('#advList').innerHTML=advs.map(a=>`<option value="${esc(a)}">`).join('');
 const c=CFG.acts[F.act];
 if(c.impose){$('#mObsZone').innerHTML=`<div class="lock">🔒 ${esc(c.impose)}<small>Observable fixé par ton professeur</small></div>`}
 else{const opts=c.obs.map(o=>`<option ${o===F.obsSel?'selected':''}>${esc(o)}</option>`).join('');
  const autre=F.obsSel&&!c.obs.includes(F.obsSel);
  $('#mObsZone').innerHTML=`<select id="mObs" aria-label="Choisir mon observable"><option value="">— Choisis ton observable —</option>${opts}<option value="__autre" ${autre?'selected':''}>✏️ Autre : je l'écris moi-même</option></select>
  <input type="text" id="mObsAutre" maxlength="80" placeholder="Écris ton observable" ${autre?'':'hidden'} value="${autre?esc(F.obsSel):''}">`;
  $('#mObs').onchange=()=>{const v=$('#mObs').value;$('#mObsAutre').hidden=v!=='__autre';F.obsSel=v==='__autre'?$('#mObsAutre').value.trim():v;if(v==='__autre')$('#mObsAutre').focus();preview()};
  $('#mObsAutre').oninput=()=>{F.obsSel=$('#mObsAutre').value.trim();preview()}}
 $$('#mOk button').forEach(b=>b.classList.toggle('on',b.dataset.v===F.ok));
 $$('#mVal button').forEach(b=>b.classList.toggle('on',b.dataset.v===F.val));
 preview()}
function curObs(){const c=CFG.acts[F.act];return c.impose?{txt:c.impose,src:'Prof'}:{txt:F.obsSel,src:c.obs.includes(F.obsSel)?'Liste':'Élève'}}
function scores(){return{me:Math.max(0,Math.round(N($('#sMe').value))),adv:Math.max(0,Math.round(N($('#sAdv').value)))}}
function preview(){const s=scores(),x=calcXP(s.me,s.adv,F.ok==='Oui');
 $('#advLb').textContent=$('#mAdv').value.trim()||'Adversaire';
 $('#mPrev').innerHTML=`<div>🎮 Match joué<span>+${x.match} XP</span></div><div class="${x.victoire?'':'off'}">🏆 Victoire<span>+${x.victoire} XP</span></div>
 <div class="${x.ecart?'':'off'}">📏 Écart au score (${x.diff} pt${x.diff>1?'s':''})<span>+${x.ecart} XP</span></div><div class="${x.bonus?'':'off'}">🎯 Observable réussi<span>+${x.bonus} XP</span></div>
 <div class="tot">Total<span>+${x.total} XP</span></div>`}
$('#mAct').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;F.act=b.dataset.act;F.obsSel='';renderMatchForm()});
$$('[data-s]').forEach(b=>b.onclick=()=>{const i=b.dataset.s==='me'?$('#sMe'):$('#sAdv');i.value=Math.max(0,N(i.value)+N(b.dataset.d));preview()});
['#sMe','#sAdv','#mAdv'].forEach(s=>$(s).addEventListener('input',preview));
$('#mOk').onclick=e=>{const b=e.target.closest('button');if(!b)return;F.ok=b.dataset.v;renderMatchForm()};
$('#mVal').onclick=e=>{const b=e.target.closest('button');if(!b)return;F.val=b.dataset.v;renderMatchForm()};

$('#mSave').onclick=async()=>{const err=t=>{$('#mErr').textContent=t;toast(t,true)};$('#mErr').textContent='';
 const adv=$('#mAdv').value.trim(),s=scores(),o=curObs();
 if(!adv)return err("Indique le nom de ton adversaire.");
 if(s.me===0&&s.adv===0)return err('Entre le score du match.');
 if(!o.txt)return err('Choisis ton observable (étape 1).');
 if(!F.ok)return err('Indique si ton observable est réussi.');
 if(!F.val)return err('Indique qui a validé ton observable.');
 if(!ME){if(window.ELEVE){ELEVE.changer();await ELEVE.demander();await reload()}if(!ME)return err("Identifie-toi pour enregistrer ton match.")}
 const x=calcXP(s.me,s.adv,F.ok==='Oui'),before=ST,now=new Date(),p=n=>String(n).padStart(2,'0');
 const xpCum=before.xp+x.total,lvlAfter=levelOf(xpCum);
 const row={Date:`${now.getFullYear()}-${p(now.getMonth()+1)}-${p(now.getDate())}`,Heure:`${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`,
  'Activité':F.act,Adversaire:adv,'Mon score':s.me,'Score adversaire':s.adv,'Résultat':x.win?'Victoire':x.nul?'Égalité':'Défaite','Écart':x.diff,
  Observable:o.txt,'Origine observable':o.src,'Observable réussi':F.ok,'Validé par':F.val,
  'XP match':x.match,'XP victoire':x.victoire,'XP écart':x.ecart,'XP bonus':x.bonus,'XP gagnée':x.total,'XP cumulée':xpCum,Niveau:NIVEAUX[lvlAfter].nom};
 try{const ok=await ELEVE.enregistrer(APP_ID,row);if(!ok)return err("Identifie-toi pour enregistrer ton match.")}catch(e){return err("Enregistrement impossible : "+(e.message||e))}
 await reload();
 // remise à zéro du formulaire (on garde l'activité et l'observable)
 $('#sMe').value=0;$('#sAdv').value=0;$('#mAdv').value='';F.ok=null;F.val=null;
 go('vArene');celebrate(before,ST,x.total)};

async function celebrate(before,after,gain){const fly=document.createElement('div');fly.className='xpfly';fly.textContent=`+${gain} XP`;document.body.appendChild(fly);setTimeout(()=>fly.remove(),1600);
 await new Promise(r=>setTimeout(r,1300));
 if(after.lvl>before.lvl){const a=AVATARS.find(v=>v.niveau===after.lvl);
  await showUnlock(`${badgeSVG(after.lvl,70)}<h2>Niveau ${NIVEAUX[after.lvl].nom} !</h2>`,a,`Tu débloques l'avatar <b>${esc(a.nom)}</b>, ${esc(a.titre.toLowerCase())}.`)}
 for(const d of after.defis)if(d.done&&!before.defis.find(b=>b.id===d.id).done){const a=AVATARS.find(v=>v.defi===d.id);
  await showUnlock(`<h2>Défi réussi !</h2><p style="margin:0;font-weight:800">${esc(d.nom)} : ${esc(d.desc)}</p>`,a,`Nouvel avatar : <b>${esc(a.nom)}</b>`)}}
async function showUnlock(head,a,txt){const p=modal(`${head}<div class="bigava"><div class="rays"></div>${avatarSVG(a,{k:'u'})}</div><p>${txt}</p>`,[{t:'Le choisir',v:'pick'},{t:'Plus tard',v:'',cls:'g'}]);
 confetti($('#modal .mbox'));if(await p==='pick'){ls.set(avKey(),a.id);renderAll()}}

/* ───────── Défis & niveaux ───────── */
function renderDefis(){const s=CFG.seuils;
 $('#lvlList').innerHTML=NIVEAUX.map((n,i)=>{const a=AVATARS.find(v=>v.niveau===i),done=ST.lvl>=i;
  return `<div class="defi ${done?'done':''}"><div class="pic">${avatarSVG(a,{locked:!done,k:'l'})}</div><div><div class="lvl">${badgeSVG(i,28)} ${n.nom}</div><small>${i===0?'Niveau de départ':`À partir de ${N(s[i])} XP`} · avatar ${esc(a.nom)}</small>
  ${i>0?`<div class="pbar"><i style="width:${Math.min(100,Math.round(ST.xp/N(s[i])*100))}%"></i></div>`:''}</div></div>`}).join('');
 $('#defiList').innerHTML=ST.defis.map(defiItem).join('')}

/* ───────── Avatars ───────── */
function renderAvatars(){const act=activeAvatar().id;$('#avCount').textContent=`${ST.unlocked.size} / ${AVATARS.length}`;
 $('#avGrid').innerHTML=AVATARS.map(a=>{const ok=ST.unlocked.has(a.id),how=a.defi?DEFIS.find(d=>d.id===a.defi).desc:(a.niveau===0?'Avatar de départ':'Niveau '+NIVEAUX[a.niveau].nom);
  return `<div class="acard ${ok?'':'lk'} ${a.id===act?'on':''}" ${ok?`data-av="${a.id}" role="button" tabindex="0"`:''}>${avatarSVG(a,{locked:!ok,k:'g'})}${ok?'':'<span class="lkic" aria-hidden="true">🔒</span>'}<b>${ok?esc(a.nom):'???'}</b><small>${ok?esc(a.titre):esc(how)}</small></div>`}).join('')}
$('#avGrid').addEventListener('click',e=>{const c=e.target.closest('[data-av]');if(!c)return;ls.set(avKey(),c.dataset.av);renderAll();toast(`${AVATARS.find(a=>a.id===c.dataset.av).nom} est ton avatar actif`)});
$('#avGrid').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const c=e.target.closest('[data-av]');if(c){e.preventDefault();c.click()}}});

/* ───────── Bilan ───────── */
function renderBilan(){const R=ST.R,pc=(a,b)=>b?Math.round(a/b*100)+'%':'–';
 $('#bStats').innerHTML=`<div class="stat"><b>${ST.xp}</b><span>XP totale</span></div><div class="stat"><b>${ST.n}</b><span>Matchs</span></div><div class="stat"><b>${pc(ST.w,ST.n)}</b><span>Victoires</span></div><div class="stat"><b>${pc(ST.ok,ST.n)}</b><span>Observable</span></div>`;
 const byAct=ACTS.map(a=>{const L=R.filter(r=>r['Activité']===a.n);return{a,n:L.length,w:L.filter(isWin).length,l:L.filter(r=>r['Résultat']==='Défaite').length,xp:L.reduce((s,r)=>s+N(r['XP gagnée']),0)}}).filter(x=>x.n);
 $('#bAct').innerHTML=byAct.length?`<table><thead><tr><th>Activité</th><th style="text-align:right">Matchs</th><th style="text-align:right">V</th><th style="text-align:right">D</th><th style="text-align:right">XP</th></tr></thead><tbody>${byAct.map(x=>`<tr><td>${x.a.e} ${esc(x.a.n)}</td><td class="n">${x.n}</td><td class="n">${x.w}</td><td class="n">${x.l}</td><td class="n">${x.xp}</td></tr>`).join('')}</tbody></table>`:`<div class="empty">Pas encore de match.</div>`;
 const obs={};R.forEach(r=>{const k=r.Observable||'—';(obs[k]=obs[k]||{n:0,ok:0}).n++;if(isOk(r))obs[k].ok++});
 const ok=Object.entries(obs).sort((a,b)=>b[1].n-a[1].n);
 $('#bObs').innerHTML=ok.length?`<table><thead><tr><th>Observable</th><th style="text-align:right">Tenté</th><th style="text-align:right">Réussi</th><th style="text-align:right">Taux</th></tr></thead><tbody>${ok.map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${v.n}</td><td class="n">${v.ok}</td><td class="n"><span class="pct">${pc(v.ok,v.n)}</span></td></tr>`).join('')}</tbody></table>`:`<div class="empty">Pas encore d'observable.</div>`;
 $('#bHist').innerHTML=R.length?[...R].reverse().map(r=>matchItem(r,true)).join(''):`<div class="empty">Ton historique apparaîtra ici.</div>`}
$('#bHist').addEventListener('click',async e=>{const b=e.target.closest('[data-del]');if(!b||!ME)return;
 const [d,h,a]=b.dataset.del.split('|');
 const v=await modal(`<h2>Supprimer ce match ?</h2><p>Match du ${esc(fmtDate(d))} contre ${esc(a)}. L'XP de ce match sera retirée.</p>`,[{t:'Supprimer',v:1,cls:'r'},{t:'Annuler',v:0,cls:'g'}]);if(!v)return;
 const i=ROWS.findIndex(r=>String(r.Date)===d&&String(r.Heure||'')===h&&String(r.Adversaire||'')===a);if(i<0)return;
 const rest=ROWS.filter((_,j)=>j!==i);
 if(rest.length)await EPS.setExt(APP_ID,ME.id,{lignes:rest});else await ELEVE.effacerApp(APP_ID);
 await reload();toast('Match supprimé')});

async function exporter(){if(!ME){toast("Identifie-toi d'abord.",true);return false}
 if(!ROWS.length){toast("Aucun match à exporter pour l'instant.",true);return false}
 try{const o=await EPS.exportXLSX({ids:[ME.id],apps:[APP_ID],sansEleves:true});
  const name=[fileSafe(ME.nom).toUpperCase(),fileSafe(ME.prenom),fileSafe(ME.classe)].filter(Boolean).join('_')+'_BallStar.xlsx';
  EPS.downloadXLSX(o,name);toast('Fichier exporté : '+name);return true}catch(e){toast('Export impossible : '+(e.message||e),true);return false}}
$('#bExport').onclick=exporter;
$('#bClear').onclick=async()=>{if(!ME)return toast("Aucune donnée : tu n'es pas identifié.",true);
 const v=await modal(`<h2>⚠️ Effacer Ball Star ?</h2><p>As-tu pensé à <b>exporter ta sauvegarde (.xlsx)</b> ? Effacer supprime définitivement tes matchs, ton XP et tes avatars Ball Star sur cet appareil.</p>`,
  [{t:'⬇️ Exporter d\'abord',v:'exp'},{t:'Effacer',v:'del',cls:'r'},{t:'Annuler',v:'',cls:'g'}]);
 if(v==='exp'){await exporter();return}
 if(v==='del'){await ELEVE.effacerApp(APP_ID);ls.set(avKey(),'pixel');await reload();toast('Données Ball Star effacées')}};

/* ───────── Réglages du professeur ───────── */
function renderProf(){$('#pJoue').value=CFG.xp.joue;$('#pVict').value=CFG.xp.victoire;$('#pBonus').value=CFG.xp.bonus;
 const e=[...CFG.ecart];while(e.length<3)e.push([0,0]);
 $('#pEcart').innerHTML=e.slice(0,3).map((x,i)=>`<div class="ecart">Écart ≥ <input type="number" min="0" id="pE${i}" value="${N(x[0])}" aria-label="Écart minimal ${i+1}"> points → + <input type="number" min="0" id="pX${i}" value="${N(x[1])}" aria-label="XP de l'écart ${i+1}"> XP</div>`).join('');
 [1,2,3].forEach(i=>$('#pS'+i).value=CFG.seuils[i]);
 $('#pActs').innerHTML=ACTS.map((a,i)=>{const c=CFG.acts[a.n];return `<div class="actbox"><h4>${a.e} ${esc(a.n)}</h4>
  <label class="f">Liste des observables<textarea id="pO${i}">${esc(c.obs.join('\n'))}</textarea></label>
  <label class="f">Observable de la classe<select id="pI${i}"><option value="">Libre : l'élève choisit</option>${c.obs.map(o=>`<option ${o===c.impose?'selected':''}>${esc(o)}</option>`).join('')}${c.impose&&!c.obs.includes(c.impose)?`<option selected>${esc(c.impose)}</option>`:''}</select></label></div>`}).join('');
 ACTS.forEach((a,i)=>$('#pO'+i).addEventListener('change',()=>{const sel=$('#pI'+i),cur=sel.value,list=lines($('#pO'+i).value);
  sel.innerHTML=`<option value="">Libre : l'élève choisit</option>`+list.map(o=>`<option ${o===cur?'selected':''}>${esc(o)}</option>`).join('')}))}
const lines=t=>[...new Set(String(t||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean))];
$('#pSave').onclick=()=>{const s=[0,N($('#pS1').value),N($('#pS2').value),N($('#pS3').value)];
 if(!(s[1]>0&&s[2]>s[1]&&s[3]>s[2]))return toast('Les seuils doivent augmenter : Argent < Or < Star.',true);
 const acts={};for(const [i,a] of ACTS.entries()){const obs=lines($('#pO'+i).value);if(!obs.length)return toast(`Ajoutez au moins un observable en ${a.n}.`,true);acts[a.n]={obs,impose:$('#pI'+i).value}}
 CFG={xp:{joue:N($('#pJoue').value),victoire:N($('#pVict').value),bonus:N($('#pBonus').value)},
  ecart:[0,1,2].map(i=>[N($('#pE'+i).value),N($('#pX'+i).value)]).filter(e=>e[0]>0),seuils:s,acts};
 saveCfg();ST=state(ROWS);renderAll();toast('Réglages enregistrés')};
$('#pReset').onclick=async()=>{const v=await modal('<h2>Réglages par défaut ?</h2><p>Les observables et le barème reviennent aux valeurs de départ.</p>',[{t:'Rétablir',v:1},{t:'Annuler',v:0,cls:'g'}]);
 if(v){CFG=clone(DEF);saveCfg();ST=state(ROWS);renderProf();renderAll();toast('Réglages par défaut rétablis')}};
$('#pExport').onclick=()=>{const r=[['Paramètre','Activité','Valeur','XP'],['XP match joué','','',CFG.xp.joue],['XP victoire','','',CFG.xp.victoire],['XP observable réussi','','',CFG.xp.bonus]];
 CFG.ecart.forEach(e=>r.push(['Bonus écart','',e[0],e[1]]));[1,2,3].forEach(i=>r.push(['Seuil niveau',NIVEAUX[i].nom,CFG.seuils[i],'']));
 ACTS.forEach(a=>{const c=CFG.acts[a.n];c.obs.forEach(o=>r.push(['Observable',a.n,o,'']));if(c.impose)r.push(['Observable imposé',a.n,c.impose,''])});
 const lis=[['Ball Star — fichier de réglages du professeur'],[''],["Les élèves l'importent dans Ball Star : écran « Match » → « Importer les réglages »."],["Vous pouvez modifier la feuille BallStar_Config dans un tableur : une ligne « Observable » par observable, « Observable imposé » pour fixer celui de la classe."]];
 BSX.download(BSX.write([{name:'Lisez-moi',rows:lis},{name:CFG_SHEET,rows:r}]),'BallStar_Reglages.xlsx');toast('Fichier de réglages exporté')};
const pickCfg=()=>$('#cfgFile').click();$('#pImport').onclick=pickCfg;$('#mImpCfg').onclick=pickCfg;
$('#cfgFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 try{const sh=(await BSX.read(await f.arrayBuffer())).find(s=>norm(s.name)===norm(CFG_SHEET));if(!sh)throw new Error('feuille « '+CFG_SHEET+' » introuvable');
  const c=clone(DEF),obs={},imp={},ec=[];let seen=0;
  for(const row of sh.rows.slice(1)){const [p,a,v,x]=Array.from(row||[],z=>z==null?'':z),k=norm(p),act=ACTS.find(z=>norm(z.n)===norm(a));
   if(k==='xpmatchjoue'){c.xp.joue=N(x);seen++}else if(k==='xpvictoire'){c.xp.victoire=N(x);seen++}else if(k==='xpobservablereussi'){c.xp.bonus=N(x);seen++}
   else if(k==='bonusecart'&&N(v)>0){ec.push([N(v),N(x)]);seen++}
   else if(k==='seuilniveau'){const i=NIVEAUX.findIndex(n=>norm(n.nom)===norm(a));if(i>0){c.seuils[i]=N(v);seen++}}
   else if(k==='observable'&&act&&String(v).trim()){(obs[act.n]=obs[act.n]||[]).push(String(v).trim());seen++}
   else if(k==='observableimpose'&&act){imp[act.n]=String(v).trim();seen++}}
  if(!seen)throw new Error('aucun réglage reconnu');
  if(ec.length)c.ecart=ec;ACTS.forEach(a=>{if(obs[a.n])c.acts[a.n].obs=[...new Set(obs[a.n])];c.acts[a.n].impose=imp[a.n]||''});
  CFG=c;saveCfg();ST=state(ROWS);renderAll();if(!$('#vProf').hidden)renderProf();toast('Réglages du professeur importés ✔')}
 catch(x){toast('Fichier non reconnu : '+(x.message||x),true)}};
$('#bProf').onclick=()=>go('vProf');

/* ───────── Rendu global & démarrage ───────── */
function renderAll(){renderArene();renderDefis();renderAvatars();renderBilan();if(!$('#vMatch').hidden)renderMatchForm()}
document.addEventListener('click',async e=>{if(e.target.id==='bIdent'&&window.ELEVE){ELEVE.changer();await ELEVE.demander();reload()}});
$('#logo').innerHTML=logoSVG(52);
document.addEventListener('eleve-change',()=>reload());
(async()=>{try{if(window.ELEVE){ELEVE.bandeau($('#who'));await reload();if(!ME)await ELEVE.demander();await reload()}else renderAll()}catch(e){console.error(e);renderAll()}})();
if('serviceWorker' in navigator&&location.protocol==='https:'&&!window.BALLSTAR_NO_SW)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
