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

/* ───────── Règles et réglages (lecture seule côté élève) ─────────
   Les réglages ne se modifient que dans l'interface prof (BallStar_Prof). L'élève peut seulement importer
   le fichier de réglages produit par son professeur : un fichier modifié à la main est refusé (code de contrôle). */
const R_=window.BSRULES,{ACTS,DEFIS,calcXP,isWin,isOk,nbObs}=R_;
const CFG_KEY='BALLSTAR_CONFIG',CFG_SHEET=R_.CFG_SHEET;
function loadCfg(){try{const o=JSON.parse(ls.get(CFG_KEY)||'null');if(o&&o.cfg&&o.code&&o.code===R_.signe(o.cfg))return R_.clean(o.cfg)}catch(e){}return R_.clean(R_.DEF)}
let CFG=loadCfg();
const saveCfg=()=>ls.set(CFG_KEY,JSON.stringify({cfg:CFG,code:R_.signe(CFG)}));
const levelOf=xp=>R_.levelOf(CFG,xp);
function state(rows){const p=R_.progression(CFG,rows);p.unlocked=new Set(AVATARS.filter(a=>a.defi?p.defis.find(d=>d.id===a.defi).done:a.legende!=null?p.etoiles>=CFG.legendes[a.legende]:a.niveau<=p.lvl).map(a=>a.id));return p}

/* ───────── Données élève ───────── */
let ME=null,ROWS=[],ST=state([]);
async function reload(){ME=window.ELEVE?await ELEVE.courant():null;
 ROWS=ME?((await ELEVE.donnees())[APP_ID]||[]):[];ST=state(ROWS);renderAll()}
const avKey=()=>'BALLSTAR_AVATAR_'+(ME?ME.id:'anon');
const starsOf=a=>a.defi?(ST.defis.find(d=>d.id===a.defi)||{}).etoiles||0:0;
const STARS=n=>'<span class="on">'+'★'.repeat(n)+'</span><span class="off">'+'★'.repeat(3-n)+'</span>';
function activeAvatar(){let id=ls.get(avKey());if(!id||!ST.unlocked.has(id))id='pixel';return AVATARS.find(a=>a.id===id)}

/* ───────── Interface : navigation ───────── */
const VIEWS=['vArene','vMatch','vDefis','vAvatars','vBilan','vLive'];
function go(v){VIEWS.forEach(x=>$('#'+x).hidden=x!==v);$$('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.go===v));
 if(v==='vMatch'){renderMatchForm();setMode()}window.scrollTo({top:0,behavior:'smooth'})}
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)go(b.dataset.go)});

function toast(msg,ko){const t=document.createElement('div');t.className='toast'+(ko?' ko':'');t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3200)}
function modal(html,btns){return new Promise(res=>{const m=$('#modal');m.innerHTML=`<div class="modal"><div class="mbox">${html}<div class="row">${btns.map((b,i)=>`<button class="btn ${b.cls||''}" data-i="${i}">${b.t}</button>`).join('')}</div></div></div>`;
 m.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{m.innerHTML='';res(btns[+b.dataset.i].v)})})}
function confetti(box){const c=document.createElement('div');c.className='confetti';const cols=['#ffe14a','#ff3df2','#8f5bff','#3dffa0','#fff'];
 for(let i=0;i<40;i++){const s=document.createElement('span');s.style.left=Math.random()*100+'%';s.style.background=cols[i%cols.length];s.style.animationDelay=(Math.random()*.6)+'s';c.appendChild(s)}box.appendChild(c)}

/* ───────── Arène ───────── */
function xpInfo(){const s=CFG.seuils,l=ST.lvl;if(l>=3)return{pct:100,txt:`${ST.xp} XP`,next:'Niveau maximum atteint : tu es une Star ⭐'};
 const a=N(s[l]),b=N(s[l+1]);return{pct:Math.max(2,Math.min(100,(ST.xp-a)/(b-a)*100)),txt:`${ST.xp} / ${b} XP`,next:`Encore ${b-ST.xp} XP pour passer ${NIVEAUX[l+1].nom}`}}
function obsItem(r,del){const act=ACTS.find(a=>a.n===r['Activité'])||{e:'🎮'};
 return `<div class="m obs"><span class="e" aria-hidden="true">👀</span><div class="t"><b>Observateur · ${esc(r['Joueur A'])} vs ${esc(r['Joueur B'])}</b><small>${esc(fmtDate(r.Date))} · ${act.e} ${esc(r['Activité']||'')} · ${N(r['Bonus A validés'])+N(r['Bonus B validés'])} bonus notés</small></div>
 <div class="x"><span class="sc">${N(r['Score A'])} – ${N(r['Score B'])}</span><span class="xp">+${N(r['XP gagnée'])} XP</span>${del?`<br><button class="qr" data-qr="${esc(r['ID match'])}">📱 QR code</button> <button class="del" data-del="${esc(r.Date)}|${esc(r.Heure||'')}|">🗑️</button>`:''}</div></div>`}
function matchItem(r,del){if(R_.isObsRow(r))return obsItem(r,del);const win=isWin(r),act=ACTS.find(a=>a.n===r['Activité'])||{e:'🎮'};
 return `<div class="m ${win?'win':r['Résultat']==='Défaite'?'loss':''}"><span class="e" aria-hidden="true">${act.e}</span>
 <div class="t"><b>vs ${esc(r.Adversaire||'?')}</b><small>${esc(fmtDate(r.Date))} · ${esc(r['Résultat'])}${r.Observable?` · 🎯 ${nbObs(r)} × ${esc(r.Observable)}`:''}${r.Observateur?` · 👀 observé par ${esc(r.Observateur)}`:''}</small></div>
 <div class="x"><span class="sc">${N(r['Mon score'])} – ${N(r['Score adversaire'])}</span><span class="xp">+${N(r['XP gagnée'])} XP</span>${del?`<br><button class="del" data-del="${esc(r.Date)}|${esc(r.Heure||'')}|${esc(r.Adversaire||'')}">🗑️ supprimer</button>`:''}</div></div>`}
const fmtDate=d=>{const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(String(d||''));return m?`${m[3]}/${m[2]}/${m[1]}`:String(d||'')};
function renderArene(){const a=activeAvatar(),x=xpInfo();
 $('#hero').innerHTML=`<div class="pic" data-go="vAvatars" title="Changer d'avatar">${avatarSVG(a,{k:'h',stars:starsOf(a)})}</div>
 <div class="info"><div class="nm">${esc(a.nom)}</div><div class="tt">${ME?esc(ME.prenom)+' · ':''}${esc(a.titre)}</div>
  <div class="lvl">${badgeSVG(ST.lvl,34)} ${NIVEAUX[ST.lvl].nom}</div>
  <div class="xpbar"><i id="xpFill"></i><b>${x.txt}</b></div><div class="xpnext">${x.next}</div></div>
 <div class="stats" style="grid-column:1/-1"><div class="stat"><b>${ST.n}</b><span>Matchs</span></div><div class="stat"><b>${ST.w}</b><span>Victoires</span></div><div class="stat"><b>${ST.l}</b><span>Défaites</span></div><div class="stat"><b>${ST.obs}</b><span>Bonus</span></div></div>`;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{const f=$('#xpFill');if(f)f.style.width=x.pct+'%'}));
 const nd=ST.defis.filter(d=>d.etoiles<3).sort((p,q)=>q.v/q.cible-p.v/p.cible)[0];
 $('#nextDefi').innerHTML=nd?defiItem(nd):`<div class="empty">🏆 Tous les défis sont à 3 étoiles. Respect !</div>`;
 const last=ST.T.slice(-3).reverse();
 $('#lastMatchs').innerHTML=last.length?last.map(r=>matchItem(r)).join(''):`<div class="empty">Aucun match pour l'instant.<br>Touche <b>⚔️ Nouveau match</b> après ta première rencontre pour gagner tes premiers XP.</div>`;
 if(!ME)$('#lastMatchs').insertAdjacentHTML('afterbegin',`<div class="empty" style="margin-bottom:8px;border-color:var(--y)">👤 Identifie-toi pour enregistrer tes matchs et gagner de l'XP.<br><button class="btn" style="margin-top:8px" id="bIdent">S'identifier</button></div>`)}
function defiItem(d){const a=AVATARS.find(x=>x.defi===d.id),max=d.etoiles>=3;
 return `<div class="defi ${d.done?'done':''}"><div class="pic">${avatarSVG(a,{locked:!d.done,k:'d',stars:d.etoiles})}</div><div><b>${esc(d.nom)} <span class="stars" aria-label="${d.etoiles} étoile(s) sur 3">${STARS(d.etoiles)}</span></b>
 <small>${max?'Défi terminé : 3 étoiles !':`${d.etoiles?'Étoile suivante':'1re étoile (avatar '+esc(a.nom)+')'} : ${esc(d.texte)}`}</small>
 <div class="pbar"><i style="width:${Math.min(100,Math.round(d.v/d.cible*100))}%"></i></div>
 <small class="pal">${d.paliers.map((n,i)=>`<span class="${d.etoiles>i?'on':''}">${'★'.repeat(i+1)} ${n}</span>`).join('')}<span class="cur">${Math.min(d.v,d.cible)} / ${d.cible}</span></small></div></div>`}

/* ───────── Match ───────── */
const F={act:null,nObs:0,obsSel:'',mode:'post',ob:['','']};
function lastAct(){const r=ST.R[ST.R.length-1];return r&&ACTS.some(a=>a.n===r['Activité'])?r['Activité']:ACTS[0].n}
function renderMatchForm(){if(!F.act)F.act=lastAct();
 $('#mAct').innerHTML=ACTS.map(a=>`<button type="button" class="chip ${a.n===F.act?'on':''}" data-act="${esc(a.n)}"><span class="e">${a.e}</span>${esc(a.n)}</button>`).join('');
 const advs=[...new Set([...ST.R.map(r=>r.Adversaire),...ST.O.flatMap(r=>[r['Joueur A'],r['Joueur B']])].filter(Boolean))];$('#advList').innerHTML=advs.map(a=>`<option value="${esc(a)}">`).join('');
 const c=CFG.acts[F.act];
 if(c.impose){$('#mObsZone').innerHTML=`<div class="lock">🔒 ${esc(c.impose)}<small>Bonus BallStar fixé par ton professeur</small></div>`}
 else{const opts=c.obs.map(o=>`<option ${o===F.obsSel?'selected':''}>${esc(o)}</option>`).join('');
  const autre=F.obsSel&&!c.obs.includes(F.obsSel);
  $('#mObsZone').innerHTML=`<select id="mObs" aria-label="Choisir mon bonus BallStar"><option value="">— Choisis ton bonus BallStar —</option>${opts}<option value="__autre" ${autre?'selected':''}>✏️ Autre : je l'écris moi-même</option></select>
  <input type="text" id="mObsAutre" maxlength="80" placeholder="Écris ton bonus BallStar" ${autre?'':'hidden'} value="${autre?esc(F.obsSel):''}">`;
  $('#mObs').onchange=()=>{const v=$('#mObs').value;$('#mObsAutre').hidden=v!=='__autre';F.obsSel=v==='__autre'?$('#mObsAutre').value.trim():v;if(v==='__autre')$('#mObsAutre').focus();preview()};
  $('#mObsAutre').oninput=()=>{F.obsSel=$('#mObsAutre').value.trim();preview()}}
 [0,1].forEach(renderPick);
 $('#nObs').value=F.nObs;$('#nObsMax').textContent=`XP comptée jusqu'à ${CFG.xp.maxObs} bonus par match (${CFG.xp.bonus} XP chacun).`;
 preview()}
function renderPick(i){const c=CFG.acts[F.act],z=$('#o'+i+'Zone');
 if(c.impose){z.innerHTML=`<div class="lock">🔒 ${esc(c.impose)}<small>Bonus BallStar fixé par le professeur</small></div>`;return}
 const sel=F.ob[i],autre=sel&&!c.obs.includes(sel);
 z.innerHTML=`<select id="ob${i}" aria-label="Bonus BallStar du joueur ${i+1}"><option value="">— Choisis son bonus BallStar —</option>${c.obs.map(o=>`<option ${o===sel?'selected':''}>${esc(o)}</option>`).join('')}<option value="__autre" ${autre?'selected':''}>✏️ Autre : je l'écris</option></select>
 <input type="text" id="ob${i}Autre" maxlength="80" placeholder="Écris son bonus BallStar" ${autre?'':'hidden'} value="${autre?esc(sel):''}">`;
 $('#ob'+i).onchange=()=>{const v=$('#ob'+i).value;$('#ob'+i+'Autre').hidden=v!=='__autre';F.ob[i]=v==='__autre'?$('#ob'+i+'Autre').value.trim():v};
 $('#ob'+i+'Autre').oninput=()=>{F.ob[i]=$('#ob'+i+'Autre').value.trim()}}
function curObsP(i){const c=CFG.acts[F.act];return c.impose?{txt:c.impose,src:'Prof'}:{txt:F.ob[i],src:c.obs.includes(F.ob[i])?'Liste':'Observateur'}}
function curObs(){const c=CFG.acts[F.act];return c.impose?{txt:c.impose,src:'Prof'}:{txt:F.obsSel,src:c.obs.includes(F.obsSel)?'Liste':'Élève'}}
function scores(){return{me:Math.max(0,Math.round(N($('#sMe').value))),adv:Math.max(0,Math.round(N($('#sAdv').value)))}}
function preview(){const s=scores(),x=calcXP(CFG,s.me,s.adv,F.nObs);
 $('#advLb').textContent=$('#mAdv').value.trim()||'Adversaire';
 $('#mPrev').innerHTML=`<div>🎮 Match joué<span>+${x.match} XP</span></div><div class="${x.victoire?'':'off'}">🏆 Victoire<span>+${x.victoire} XP</span></div>
 <div class="${x.ecart?'':'off'}">📏 Écart au score (${x.diff} pt${x.diff>1?'s':''})<span>+${x.ecart} XP</span></div><div class="${x.bonus?'':'off'}">🎯 Bonus BallStar validés (${x.compte}${x.nObs>x.compte?` comptés sur ${x.nObs}`:''} × ${CFG.xp.bonus} XP)<span>+${x.bonus} XP</span></div>
 <div class="tot">Total<span>+${x.total} XP</span></div>`}
$('#mAct').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;F.act=b.dataset.act;F.obsSel='';F.ob=['',''];renderMatchForm()});
$$('[data-s]').forEach(b=>b.onclick=()=>{const i=b.dataset.s==='me'?$('#sMe'):$('#sAdv');i.value=Math.max(0,N(i.value)+N(b.dataset.d));preview()});
['#sMe','#sAdv','#mAdv'].forEach(s=>$(s).addEventListener('input',preview));
$$('[data-o]').forEach(b=>b.onclick=()=>{F.nObs=Math.max(0,Math.min(99,F.nObs+N(b.dataset.o)));$('#nObs').value=F.nObs;preview()});
$('#nObs').addEventListener('input',()=>{F.nObs=Math.max(0,Math.min(99,Math.round(N($('#nObs').value))));preview()});
$('#mMode').onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;F.mode=b.dataset.m;setMode()};
function setMode(){$$('#mMode button').forEach(b=>b.classList.toggle('on',b.dataset.m===F.mode));
 $('#postZone').hidden=F.mode!=='post';$('#liveZone').hidden=F.mode!=='live';$('#postSetup').hidden=F.mode!=='post';$('#liveSetup').hidden=F.mode!=='live';$('#mErr').textContent='';
 const st=$$('#vMatch .step');if(st[1])st[1].innerHTML=`<i>2</i> ${F.mode==='live'?'Pendant le match':'Après le match'}`;if(st[0])st[0].innerHTML=`<i>1</i> ${F.mode==='live'?'Le match que tu observes':'Avant le match'}`}

/* Enregistre un match (saisi après coup ou en direct) puis lance les animations. */
const errM=t=>{$('#mErr').textContent=t;toast(t,true);return null};
async function needMe(){if(!ME&&window.ELEVE){ELEVE.changer();await ELEVE.demander();await reload()}return !!ME}
async function saveMatch(m){const x=calcXP(CFG,m.me,m.ad,m.nObs),before=ST,st=stamp();
 const xpCum=before.xp+x.total,lvlAfter=levelOf(xpCum);
 const row={Date:m.date||st.date,Heure:m.heure||st.heure,
  'Activité':m.act,Adversaire:m.adv,'Mon score':m.me,'Score adversaire':m.ad,'Résultat':x.win?'Victoire':x.nul?'Égalité':'Défaite','Écart':x.diff,
  Observable:m.obs,'Origine observable':m.src,'Observables validés':m.nObs,'Observable réussi':m.nObs>0?'Oui':'Non',Saisie:m.saisie,
  'XP match':x.match,'XP victoire':x.victoire,'XP écart':x.ecart,'XP bonus':x.bonus,'XP gagnée':x.total,'XP cumulée':xpCum,Niveau:NIVEAUX[lvlAfter].nom,'Réglages':R_.codeCourt(CFG),...(m.extra||{})};
 try{const ok=await ELEVE.enregistrer(APP_ID,row);if(!ok)return errM("Identifie-toi pour enregistrer ton match.")}catch(e){return errM("Enregistrement impossible : "+(e.message||e))}
 await reload();return{before,x}}
function checkPrep(){const adv=$('#mAdv').value.trim(),o=curObs();
 if(!adv)return errM("Indique le nom de ton adversaire.");if(!o.txt)return errM('Choisis ton bonus BallStar (étape 1).');return{adv,o}}

$('#mSave').onclick=async()=>{$('#mErr').textContent='';const pr=checkPrep();if(!pr)return;const s=scores();
 if(s.me===0&&s.adv===0)return errM('Entre le score du match.');
 if(!await needMe())return errM("Identifie-toi pour enregistrer ton match.");
 const r=await saveMatch({act:F.act,adv:pr.adv,me:s.me,ad:s.adv,nObs:F.nObs,obs:pr.o.txt,src:pr.o.src,saisie:'Après le match'});if(!r)return;
 $('#sMe').value=0;$('#sAdv').value=0;$('#mAdv').value='';F.nObs=0;
 go('vArene');celebrate(r.before,ST,r.x.total)};

/* ───────── Mode direct : l'élève OBSERVE un match entre deux autres joueurs ─────────
   L'observateur ne joue pas : le match ne compte pas dans ses propres matchs.
   Il gagne de l'XP d'observateur (ligne « Observation » de son historique), et les deux joueurs
   récupèrent leur match avec le QR code affiché à la fin (ou le prof l'attribue en important le fichier de l'observateur). */
const LIVE_KEY=()=>'BALLSTAR_LIVE_'+(ME?ME.id:'anon');
let LIVE=null,wake=null;
const saveLive=()=>ls.set(LIVE_KEY(),LIVE?JSON.stringify(LIVE):'');
function fly(txt,sub,cls){$$('.xpfly').forEach(e=>e.remove());const f=document.createElement('div');f.className='xpfly'+(cls?' '+cls:'');f.innerHTML=`${esc(txt)}${sub?`<small>${esc(sub)}</small>`:''}`;document.body.appendChild(f);setTimeout(()=>f.remove(),1600)}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function keepAwake(on){try{if(on&&'wakeLock' in navigator&&!wake)wake=await navigator.wakeLock.request('screen');if(!on&&wake){await wake.release();wake=null}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&LIVE){wake=null;keepAwake(true)}});
const meName=()=>ME?`${ME.prenom} ${String(ME.nom).toUpperCase()}`:'';
const isMe=n=>ME&&[R_.norm(ME.prenom+ME.nom),R_.norm(ME.nom+ME.prenom)].includes(R_.norm(n));
const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const stamp=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return{date:`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`,heure:`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`}};
$('#lStart').onclick=async()=>{$('#mErr').textContent='';
 const n=[0,1].map(i=>$('#p'+i).value.trim()),o=[0,1].map(i=>curObsP(i));
 if(!n[0]||!n[1])return errM('Indique le nom des deux joueurs.');
 if(R_.norm(n[0])===R_.norm(n[1]))return errM('Les deux joueurs doivent être différents.');
 if(!await needMe())return errM("Identifie-toi (l'observateur) avant de lancer le direct.");
 if(n.some(isMe))return errM("L'observateur ne peut pas être l'un des joueurs : observe un match entre deux camarades.");
 if(o.some(x=>!x.txt))return errM('Choisis le bonus BallStar de chaque joueur.');
 LIVE={id:newId(),act:F.act,p:n.map((nm,i)=>({n:nm,obs:o[i].txt,src:o[i].src,s:0,b:0})),hist:[],t:Date.now()};saveLive();openLive(true)};
function openLive(first){document.body.classList.add('live');go('vLive');renderLive();keepAwake(true);
 if(first)setTimeout(()=>fly(`+${CFG.xp.obsMatch} XP`,'Match observé'),350)}
const cnt=b=>Math.min(b,CFG.xp.maxObs);
const obsXPlive=L=>CFG.xp.obsMatch+CFG.xp.obsBonus*(cnt(L.p[0].b)+cnt(L.p[1].b));
const pXP=(L,i)=>calcXP(CFG,L.p[i].s,L.p[1-i].s,L.p[i].b);
function renderLive(bump){if(!LIVE)return;const L=LIVE,a=activeAvatar();
 const act=ACTS.find(z=>z.n===L.act)||{e:'🎮'};$('#lAct').textContent=`${act.e} ${L.act}`;
 $('#lAva').innerHTML=avatarSVG(a,{k:'lv',stars:starsOf(a)});$('#lName').textContent=`${ME?ME.prenom:''} observe`;
 $('#lObsRule').textContent=`+${CFG.xp.obsMatch} XP le match · +${CFG.xp.obsBonus} XP par bonus noté`;
 const x=$('#lXP');x.textContent='+'+obsXPlive(L);if(bump){x.classList.remove('bump');void x.offsetWidth;x.classList.add('bump')}
 [0,1].forEach(i=>{const P=L.p[i];$('#lN'+i).textContent=P.n;$('#lS'+i).textContent=P.s;$('#lO'+i).textContent=P.obs;
  $('#lX'+i).textContent='+'+(CFG.xp.joue+cnt(P.b)*CFG.xp.bonus);
  $('#lC'+i).textContent=`${P.b} réussi${P.b>1?'s':''} · ${cnt(P.b)}/${CFG.xp.maxObs} en XP`;
  $$('#vLive .lp')[i].classList.toggle('lead',P.s>L.p[1-i].s)});
 const [A,B]=L.p,lead=A.s===B.s?null:(A.s>B.s?A:B);
 $('#lHint').textContent=lead?`${lead.n} mène : la victoire lui rapporterait +${CFG.xp.victoire} XP`:`Égalité ${A.s} – ${B.s}`}
function act(t){if(!LIVE)return;const i=+t[1];LIVE.hist.push(t);
 if(t[0]==='s'){LIVE.p[i].s++;pop('#lS'+i)}
 else{LIVE.p[i].b++;const P=LIVE.p[i];
  if(P.b<=CFG.xp.maxObs)fly(`+${CFG.xp.bonus} XP`,`${P.n} · +${CFG.xp.obsBonus} pour toi`);else fly('Bonus !',`${P.n} : déjà ${CFG.xp.maxObs} comptés en XP`,'small')}
 saveLive();renderLive(t[0]==='b')}
function pop(sel){const e=$(sel);e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}
$$('#vLive [data-pt]').forEach(b=>b.onclick=()=>act('s'+b.dataset.pt));
$$('#vLive [data-bonus]').forEach(b=>b.onclick=()=>act('b'+b.dataset.bonus));
$$('#vLive [data-minus]').forEach(b=>b.onclick=()=>{if(!LIVE)return;const i=+b.dataset.minus;if(LIVE.p[i].s>0){LIVE.p[i].s--;const k=LIVE.hist.lastIndexOf('s'+i);if(k>=0)LIVE.hist.splice(k,1)}saveLive();renderLive()});
$('#lUndo').onclick=()=>{if(!LIVE||!LIVE.hist.length)return toast('Rien à annuler.');const t=LIVE.hist.pop(),i=+t[1];
 if(t[0]==='s')LIVE.p[i].s--;else LIVE.p[i].b--;saveLive();renderLive(t[0]==='b');toast(t[0]==='b'?`Dernier bonus de ${LIVE.p[i].n} annulé`:`Dernier point de ${LIVE.p[i].n} annulé`)};
function closeLive(){LIVE=null;saveLive();keepAwake(false);document.body.classList.remove('live')}
$('#lQuit').onclick=async()=>{const v=await modal('<h2>Abandonner le direct ?</h2><p>Le match observé ne sera pas enregistré : personne ne gagne d\'XP.</p>',[{t:'Abandonner',v:1,cls:'r'},{t:'Continuer le match',v:0,cls:'g'}]);
 if(v){closeLive();go('vMatch');setMode()}};
$('#lEnd').onclick=async()=>{const L=LIVE;if(!L)return;const [A,B]=L.p;if(!A.s&&!B.s)return toast('Le score est encore 0 – 0.',true);
 const v=await modal(`<h2>🏁 Fin du match ?</h2><p style="font-family:var(--fd);font-size:1.8rem;margin:6px 0">${A.s} – ${B.s}</p><p>${esc(A.n)} contre ${esc(B.n)}<br>Bonus BallStar : ${A.b} pour ${esc(A.n)}, ${B.b} pour ${esc(B.n)}</p>`,[{t:'Valider le match',v:1},{t:'Continuer',v:0,cls:'g'}]);
 if(!v)return;
 const w=A.s===B.s?null:(A.s>B.s?0:1);
 if(w!=null){const x=pXP(L,w);fly(`+${x.victoire+x.ecart} XP`,`Victoire de ${L.p[w].n}`);$('#lX'+w).textContent='+'+x.total;await wait(1400)}
 const st=stamp(),before=ST,oxp=obsXPlive(L),xpCum=before.xp+oxp;
 const row={Type:'Observation',Date:st.date,Heure:st.heure,'ID match':L.id,'Activité':L.act,
  'Joueur A':A.n,'Joueur B':B.n,'Score A':A.s,'Score B':B.s,'Bonus A':A.obs,'Bonus B':B.obs,'Bonus A validés':A.b,'Bonus B validés':B.b,
  Saisie:'Observateur','XP gagnée':oxp,'XP cumulée':xpCum,Niveau:NIVEAUX[levelOf(xpCum)].nom,'Réglages':R_.codeCourt(CFG)};
 try{const ok=await ELEVE.enregistrer(APP_ID,row);if(!ok)throw new Error('élève non identifié')}catch(e){toast("Le match n'a pas pu être enregistré. Le direct reste ouvert.",true);return}
 closeLive();await reload();go('vArene');fly(`+${oxp} XP`,'Observateur');await wait(1300);
 await showQR(row);celebrate(before,ST,oxp,true)};
function resumeLive(){if(LIVE||!ME)return;try{const o=JSON.parse(ls.get(LIVE_KEY())||'null');if(o&&o.p){LIVE=o;openLive(false);toast('Direct en cours repris')}}catch(e){}}

/* ───────── QR code du match observé ───────── */
function codeOf(row){return R_.encodeMatch({id:row['ID match'],d:row.Date,h:String(row.Heure||'').slice(0,5),a:row['Activité'],o:meName(),oc:ME?ME.classe||'':'',
 p:[[row['Joueur A'],N(row['Score A']),row['Bonus A']||'',N(row['Bonus A validés'])],[row['Joueur B'],N(row['Score B']),row['Bonus B']||'',N(row['Bonus B validés'])]]},CFG)}
/* Marge blanche de 4 modules (norme QR) : indispensable pour les lecteurs anciens. */
function qrSVG(text){qrcode.stringToBytes=qrcode.stringToBytesFuncs['UTF-8'];const q=qrcode(0,'M');q.addData(text,'Byte');q.make();return q.createSvgTag({cellSize:8,margin:4,scalable:true})}
function showQR(row){const code=codeOf(row);
 const P=[['A','B'],['B','A']].map(([a,b])=>({n:row['Joueur '+a],x:calcXP(CFG,row['Score '+a],row['Score '+b],row['Bonus '+a+' validés'])}));
 return modal(`<h2>📱 QR code du match</h2><p style="margin:2px 0">${esc(row['Joueur A'])} ${N(row['Score A'])} – ${N(row['Score B'])} ${esc(row['Joueur B'])}</p>
 <div class="qrbox">${qrSVG(code)}</div>
 <p class="mut">Chaque joueur ouvre Ball Star : <b>Arène → 📷 Scanner un match observé</b>. Le match s'ajoute à son historique.</p><p class="mut" style="font-size:.78rem">💡 Lecture difficile ? Monte la luminosité de ton écran au maximum et éloigne un peu les téléphones.</p>
 <div class="qrsum">${P.map(p=>`<div>${esc(p.n)}<b>+${p.x.total} XP</b></div>`).join('')}</div>
 <p class="mut" style="font-size:.75rem">Tu pourras réafficher ce code depuis ton Bilan. Ton prof peut aussi attribuer le match aux joueurs en important ton fichier.</p>`,[{t:'Fermer',v:1}])}

/* ───────── Scanner un match observé (côté joueur) ───────── */
let scanStream=null,scanTimer=null;
function stopScan(){if(scanTimer)clearInterval(scanTimer);scanTimer=null;if(scanStream)scanStream.getTracks().forEach(t=>t.stop());scanStream=null}
function codeFrom(text){const t=String(text||'').trim();if(t.startsWith('B2~'))return t;const m=/[#&?]m=([\w-]+)/.exec(t);return m?m[1]:t}
$('#aScan').onclick=async()=>{if(!await needMe())return toast("Identifie-toi d'abord pour récupérer ton match.",true);
 const done=modal(`<div class="scan"><h2>📷 Scanner un match</h2><video id="scanV" playsinline muted></video><p class="mut" id="scanMsg">Vise le QR code affiché sur le téléphone de l'observateur.</p>
  <button class="btn g" id="scanPhoto" type="button">🖼️ Utiliser une photo du QR code</button></div>`,[{t:'Fermer',v:0,cls:'g'}]);
 $('#scanPhoto').onclick=()=>$('#qrPhoto').click();
 try{scanStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});const v=$('#scanV');v.srcObject=scanStream;await v.play();
  const det='BarcodeDetector' in window?new BarcodeDetector({formats:['qr_code']}):null,cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});
  scanTimer=setInterval(async()=>{if(!v.videoWidth)return;let txt=null;
   try{if(det){const r=await det.detect(v);if(r[0])txt=r[0].rawValue}else{const k=Math.min(1,800/Math.max(v.videoWidth,v.videoHeight));cv.width=v.videoWidth*k;cv.height=v.videoHeight*k;cx.drawImage(v,0,0,cv.width,cv.height);const d=cx.getImageData(0,0,cv.width,cv.height);const r=jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'});if(r)txt=r.data}}catch(e){}
   if(txt){stopScan();$('#modal').innerHTML='';importMatch(codeFrom(txt))}},250)}
 catch(e){const m=$('#scanMsg');if(m)m.textContent="La caméra n'est pas accessible. Autorise-la dans le navigateur, ou prends le QR code en photo et choisis « Utiliser une photo »."}
 await done;stopScan()};
$('#qrPhoto').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;stopScan();$('#modal').innerHTML='';
 try{const img=await createImageBitmap(f);let r=null;
  for(const max of [1200,800,1800,500]){const cv=document.createElement('canvas'),k=Math.min(1,max/Math.max(img.width,img.height));cv.width=Math.round(img.width*k);cv.height=Math.round(img.height*k);
   const cx=cv.getContext('2d');cx.drawImage(img,0,0,cv.width,cv.height);const d=cx.getImageData(0,0,cv.width,cv.height);r=jsQR(d.data,d.width,d.height,{inversionAttempts:'attemptBoth'});if(r)break}
  if(!r)throw new Error('aucun QR code trouvé sur la photo');importMatch(codeFrom(r.data))}catch(x){toast('Photo illisible : '+(x.message||x),true)}};
async function importMatch(code){let m;try{m=R_.decodeMatch(code,CFG)}catch(x){return toast('QR code refusé : '+x.message,true)}
 if(!await needMe())return toast("Identifie-toi pour récupérer ton match.",true);
 if(ROWS.some(r=>r['ID match']===m.id))return toast('Ce match est déjà dans ton historique.',true);
 if(isMe(m.o))return toast("Tu étais l'observateur de ce match : il est déjà dans ton historique.",true);
 const cand=[0,1].filter(i=>isMe(m.p[i][0])||R_.norm(m.p[i][0])===R_.norm(ME.prenom));
 const v=await modal(`<h2>📥 Match observé</h2><p style="font-family:var(--fd);font-size:1.4rem;margin:6px 0">${esc(m.p[0][0])} ${m.p[0][1]} – ${m.p[1][1]} ${esc(m.p[1][0])}</p>
  <p class="mut">${esc(m.a)} · ${esc(fmtDate(m.d))} · observé par ${esc(m.o)}</p><p><b>Quel joueur es-tu ?</b></p>`,
  [...[0,1].map(i=>({t:esc(m.p[i][0])+(cand.length===1&&cand[0]===i?' ✔':''),v:'p'+i,cls:cand.length===1&&cand[0]!==i?'g':''})),{t:'Annuler',v:'',cls:'g'}]);
 if(!v)return;const i=+v[1],P=m.p[i],O=m.p[1-i];
 if(!isMe(P[0])&&!(R_.norm(P[0])===R_.norm(ME.prenom))){const ok=await modal(`<h2>C'est bien toi ?</h2><p>L'observateur a noté « ${esc(P[0])} », mais tu es identifié comme ${esc(meName())}.</p>`,[{t:"Oui, c'est moi",v:1},{t:'Annuler',v:0,cls:'g'}]);if(!ok)return}
 const r=await saveMatch({act:m.a,adv:O[0],me:P[1],ad:O[1],nObs:P[3],obs:P[2],src:'Observateur',saisie:'Direct (observé)',date:m.d,heure:(m.h||'00:00')+':00',extra:{'ID match':m.id,Observateur:m.o}});
 if(!r)return;go('vArene');celebrate(r.before,ST,r.x.total)}

async function celebrate(before,after,gain,quiet){if(!quiet){fly(`+${gain} XP`);await wait(1300)}else await wait(300);
 if(after.lvl>before.lvl){const a=AVATARS.find(v=>v.niveau===after.lvl);
  await showUnlock(`${badgeSVG(after.lvl,70)}<h2>Niveau ${NIVEAUX[after.lvl].nom} !</h2>`,a,`Tu débloques l'avatar <b>${esc(a.nom)}</b>, ${esc(a.titre.toLowerCase())}.`)}
 for(const d of after.defis){const b=before.defis.find(x=>x.id===d.id);if(d.etoiles<=b.etoiles)continue;const a=AVATARS.find(v=>v.defi===d.id);
  await showUnlock(`<h2>${esc(d.nom)}</h2><p class="stars big">${STARS(d.etoiles)}</p><p style="margin:0;font-weight:800">${esc(d.textes[d.etoiles-1])}</p>`,a,
   b.etoiles===0?`Nouvel avatar : <b>${esc(a.nom)}</b>`:`<b>${esc(a.nom)}</b> gagne sa ${d.etoiles===2?'2e':'3e'} étoile !`,d.etoiles)}
 for(const a of AVATARS.filter(v=>v.legende!=null&&after.unlocked.has(v.id)&&!before.unlocked.has(v.id)))
  await showUnlock(`<h2>Avatar légendaire !</h2><p style="margin:0;font-weight:800">${CFG.legendes[a.legende]} étoiles de défis gagnées</p>`,a,`<b>${esc(a.nom)}</b> rejoint ta collection.`)}
async function showUnlock(head,a,txt,stars){const p=modal(`${head}<div class="bigava"><div class="rays"></div>${avatarSVG(a,{k:'u',stars:stars||0})}</div><p>${txt}</p>`,[{t:'Le choisir',v:'pick'},{t:'Plus tard',v:'',cls:'g'}]);
 confetti($('#modal .mbox'));if(await p==='pick'){ls.set(avKey(),a.id);renderAll()}}

/* ───────── Défis & niveaux ───────── */
function renderDefis(){const s=CFG.seuils;
 $('#lvlList').innerHTML=NIVEAUX.map((n,i)=>{const a=AVATARS.find(v=>v.niveau===i),done=ST.lvl>=i;
  return `<div class="defi ${done?'done':''}"><div class="pic">${avatarSVG(a,{locked:!done,k:'l'})}</div><div><div class="lvl">${badgeSVG(i,28)} ${n.nom}</div><small>${i===0?'Niveau de départ':`À partir de ${N(s[i])} XP`} · avatar ${esc(a.nom)}</small>
  ${i>0?`<div class="pbar"><i style="width:${Math.min(100,Math.round(ST.xp/N(s[i])*100))}%"></i></div>`:''}</div></div>`}).join('');
 $('#defiList').innerHTML=ST.defis.map(defiItem).join('')}

/* ───────── Avatars ───────── */
function renderAvatars(){const act=activeAvatar().id;$('#avCount').textContent=`${ST.unlocked.size} / ${AVATARS.length}`;
 $('#avGrid').innerHTML=AVATARS.map(a=>{const ok=ST.unlocked.has(a.id),how=a.defi?(ST.defis.find(d=>d.id===a.defi)||{}).textes[0]:a.legende!=null?`Légendaire : ${CFG.legendes[a.legende]} étoiles de défis (tu en as ${ST.etoiles})`:(a.niveau===0?'Avatar de départ':'Niveau '+NIVEAUX[a.niveau].nom);
  return `<div class="acard ${ok?'':'lk'} ${a.id===act?'on':''}" ${ok?`data-av="${a.id}" role="button" tabindex="0"`:''}>${avatarSVG(a,{locked:!ok,k:'g',stars:starsOf(a)})}${ok?'':'<span class="lkic" aria-hidden="true">🔒</span>'}<b>${ok?esc(a.nom):'???'}${ok&&a.defi?` <span class="stars">${STARS(starsOf(a))}</span>`:''}</b><small>${ok?esc(a.titre):esc(how)}</small></div>`}).join('')}
$('#avGrid').addEventListener('click',e=>{const c=e.target.closest('[data-av]');if(!c)return;ls.set(avKey(),c.dataset.av);renderAll();toast(`${AVATARS.find(a=>a.id===c.dataset.av).nom} est ton avatar actif`)});
$('#avGrid').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const c=e.target.closest('[data-av]');if(c){e.preventDefault();c.click()}}});

/* ───────── Bilan ───────── */
function renderBilan(){const R=ST.R,pc=(a,b)=>b?Math.round(a/b*100)+'%':'–';
 $('#bStats').innerHTML=`<div class="stat"><b>${ST.xp}</b><span>XP totale</span></div><div class="stat"><b>${ST.n}</b><span>Matchs</span></div><div class="stat"><b>${pc(ST.w,ST.n)}</b><span>Victoires</span></div><div class="stat"><b>${ST.obs}</b><span>Bonus</span></div>`;
const ob=$('#bObsv');if(ob)ob.innerHTML=ST.O.length?`👀 ${ST.O.length} match${ST.O.length>1?'s':''} observé${ST.O.length>1?'s':''} · +${ST.xpObs} XP d'observateur`:'';
 const byAct=ACTS.map(a=>{const L=R.filter(r=>r['Activité']===a.n);return{a,n:L.length,w:L.filter(isWin).length,l:L.filter(r=>r['Résultat']==='Défaite').length,xp:L.reduce((s,r)=>s+N(r['XP gagnée']),0)}}).filter(x=>x.n);
 $('#bAct').innerHTML=byAct.length?`<table><thead><tr><th>Activité</th><th style="text-align:right">Matchs</th><th style="text-align:right">V</th><th style="text-align:right">D</th><th style="text-align:right">XP</th></tr></thead><tbody>${byAct.map(x=>`<tr><td>${x.a.e} ${esc(x.a.n)}</td><td class="n">${x.n}</td><td class="n">${x.w}</td><td class="n">${x.l}</td><td class="n">${x.xp}</td></tr>`).join('')}</tbody></table>`:`<div class="empty">Pas encore de match.</div>`;
 const obs={};R.forEach(r=>{const k=r.Observable||'—';(obs[k]=obs[k]||{n:0,ok:0}).n++;obs[k].ok+=nbObs(r)});
 const ok=Object.entries(obs).sort((a,b)=>b[1].n-a[1].n);
 $('#bObs').innerHTML=ok.length?`<table><thead><tr><th>Bonus BallStar</th><th style="text-align:right">Matchs</th><th style="text-align:right">Validés</th><th style="text-align:right">Moyenne</th></tr></thead><tbody>${ok.map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${v.n}</td><td class="n">${v.ok}</td><td class="n"><span class="pct">${(v.ok/v.n).toFixed(1).replace('.',',')}</span></td></tr>`).join('')}</tbody></table>`:`<div class="empty">Pas encore de bonus BallStar.</div>`;
 $('#bHist').innerHTML=ST.T.length?[...ST.T].reverse().map(r=>matchItem(r,true)).join(''):`<div class="empty">Ton historique apparaîtra ici.</div>`}
$('#bHist').addEventListener('click',async e=>{const q=e.target.closest('[data-qr]');if(q){const r=ROWS.find(x=>x['ID match']===q.dataset.qr&&R_.isObsRow(x));if(r)showQR(r);return}
 const b=e.target.closest('[data-del]');if(!b||!ME)return;
 const [d,h,a]=b.dataset.del.split('|');
 const v=await modal(`<h2>Supprimer ce match ?</h2><p>Match du ${esc(fmtDate(d))}${a?' contre '+esc(a):' (observateur)'}. L'XP de ce match sera retirée.</p>`,[{t:'Supprimer',v:1,cls:'r'},{t:'Annuler',v:0,cls:'g'}]);if(!v)return;
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

/* ───────── Envoi vers Nuage (si le prof a renseigné un lien de dépôt dans ses réglages) ─────────
   Envoi direct par WebDAV sur le partage public Nextcloud ; si le serveur ou le navigateur le refuse,
   le fichier est enregistré sur l'appareil et la page de dépôt Nuage s'ouvre pour le déposer. */
const nomFichier=(suffixe)=>[fileSafe(ME.nom).toUpperCase(),fileSafe(ME.prenom),fileSafe(ME.classe)].filter(Boolean).join('_')+'_BallStar'+(suffixe||'')+'.xlsx';
/* Mot de passe du partage : tapé par l'élève au premier envoi, retenu sur son appareil (jamais dans les réglages ni dans les fichiers). */
const PW_KEY=()=>'BALLSTAR_NUAGE_MDP_'+R_.norm(CFG.nuage).slice(-24);
function demanderMdp(msg){let val='';const p=modal(`<h2>🔑 Mot de passe Nuage</h2><p>${msg||'Le dossier Nuage de ton professeur est protégé. Tape le mot de passe qu\'il t\'a donné.'}</p>
 <input type="password" id="nPw" autocomplete="off" aria-label="Mot de passe Nuage" style="margin:4px 0 6px"><label class="chk" style="justify-content:center;margin-bottom:10px"><input type="checkbox" id="nPwShow"> Afficher</label>`,
 [{t:'Envoyer',v:'ok'},{t:'Annuler',v:'',cls:'g'}]);
 const i=$('#nPw');i.oninput=()=>{val=i.value};i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('#modal [data-i="0"]').click()}};$('#nPwShow').onchange=e=>{i.type=e.target.checked?'text':'password'};setTimeout(()=>i.focus(),50);
 return p.then(v=>v==='ok'&&val.trim()?val.trim():null)}
async function putNuage(bytes,name,pw){const u=new URL(CFG.nuage),tok=(/\/s\/([A-Za-z0-9]+)/.exec(u.pathname)||[])[1],base=u.origin+u.pathname.split(/\/(?:index\.php\/)?s\//)[0],f=encodeURIComponent(name);pw=pw||'';
 const essais=[{url:`${base}/public.php/dav/files/${tok}/${f}`,h:pw?{Authorization:'Basic '+btoa('anonymous:'+pw)}:{}},{url:`${base}/public.php/webdav/${f}`,h:{Authorization:'Basic '+btoa(tok+':'+pw)}}];
 let auth=false,last='';for(const e of essais){try{const r=await fetch(e.url,{method:'PUT',body:new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),credentials:'omit',headers:{'X-Requested-With':'XMLHttpRequest',...e.h}});
   if(r.ok)return true;if(r.status===401||r.status===403)auth=true;last='HTTP '+r.status}catch(x){last='réseau'}}
 const err=new Error(last);err.auth=auth;throw err}
async function envoyerNuage(){if(!ME)return toast("Identifie-toi d'abord.",true);if(!ROWS.length)return toast("Aucun match à envoyer pour l'instant.",true);if(!CFG.nuage)return;
 const d=new Date(),p=n=>String(n).padStart(2,'0'),name=nomFichier(`_${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}h${p(d.getMinutes())}`);
 let bytes;try{bytes=await EPS.exportXLSX({ids:[ME.id],apps:[APP_ID],sansEleves:true})}catch(e){return toast('Export impossible : '+(e.message||e),true)}
 let pw=CFG.nuageMdp?ls.get(PW_KEY()):'',msg='';
 for(let essai=0;essai<3;essai++){
  if(CFG.nuageMdp&&!pw){pw=await demanderMdp(msg);if(!pw)return toast('Envoi annulé.')}
  const b=$('#bNuage');b.disabled=true;b.textContent='☁️ Envoi en cours…';
  try{await putNuage(bytes,name,pw);if(CFG.nuageMdp)ls.set(PW_KEY(),pw);renderNuage();toast('☁️ Sauvegarde envoyée sur Nuage ✔');
   return modal(`<h2>☁️ Envoyé !</h2><p>Ta sauvegarde <b>${esc(name)}</b> est dans le dossier Nuage de ton professeur.</p>`,[{t:'OK',v:1}])}
  catch(e){if(e.auth&&CFG.nuageMdp){ls.set(PW_KEY(),'');pw='';msg='❌ Mot de passe incorrect. Vérifie-le et réessaie.';continue}
   if(e.auth&&!CFG.nuageMdp){msg='Le dossier Nuage demande un mot de passe. Tape celui que ton professeur t\'a donné.';const q=await demanderMdp(msg);if(!q)return toast('Envoi annulé.');pw=q;CFG.nuageMdp=true;continue}
   break}
  finally{const b=$('#bNuage');b.disabled=false;b.textContent='☁️ Envoyer vers Nuage'}}
 EPS.downloadXLSX(bytes,name);
 await modal(`<h2>☁️ Dépôt sur Nuage</h2><p>L'envoi direct n'a pas fonctionné sur cet appareil. Pas de souci, en deux étapes :</p>
  <div class="prev" style="text-align:left"><div style="display:block">1. Ta sauvegarde <b>${esc(name)}</b> vient d'être enregistrée sur ton appareil (dossier Téléchargements).</div><div style="display:block">2. Ouvre Nuage${CFG.nuageMdp?', tape le mot de passe,':''} et dépose ce fichier.</div></div>
  <p style="margin-top:12px"><a class="btn v" href="${esc(CFG.nuage)}" target="_blank" rel="noopener">☁️ Ouvrir Nuage</a></p>`,[{t:'Fermer',v:1,cls:'g'}])}
$('#bNuage').onclick=envoyerNuage;
function renderNuage(){$('#nuageZone').hidden=!CFG.nuage;const f=$('#bNuagePw');if(f)f.hidden=!(CFG.nuage&&CFG.nuageMdp&&ls.get(PW_KEY()))}
$('#bNuagePw').onclick=()=>{ls.set(PW_KEY(),'');renderNuage();toast('Mot de passe Nuage oublié sur cet appareil.')};
$('#bClear').onclick=async()=>{if(!ME)return toast("Aucune donnée : tu n'es pas identifié.",true);
 const v=await modal(`<h2>⚠️ Effacer Ball Star ?</h2><p>As-tu pensé à <b>exporter ta sauvegarde (.xlsx)</b> ? Effacer supprime définitivement tes matchs, ton XP et tes avatars Ball Star sur cet appareil.</p>`,
  [{t:'⬇️ Exporter d\'abord',v:'exp'},{t:'Effacer',v:'del',cls:'r'},{t:'Annuler',v:'',cls:'g'}]);
 if(v==='exp'){await exporter();return}
 if(v==='del'){await ELEVE.effacerApp(APP_ID);ls.set(avKey(),'pixel');await reload();toast('Données Ball Star effacées')}};

/* ───────── Règles du jeu (lecture seule) & import des réglages du prof ───────── */
function reglesHTML(){const c=CFG,src=R_.isDefault(c)?'Réglages par défaut':'Réglages de ton professeur · code '+R_.codeCourt(c);
 return `<div class="regles"><h2>📜 Règles du jeu</h2><p class="mut">🔒 ${esc(src)}. Seul ton professeur peut les changer : ce sont les mêmes pour toute la classe.</p>
 <h3>Gagner de l'XP à chaque match</h3><div class="prev"><div>🎮 Match joué<span>+${c.xp.joue} XP</span></div><div>🏆 Victoire<span>+${c.xp.victoire} XP</span></div>
 ${c.ecart.map(e=>`<div>📏 Victoire avec ${e[0]} points d'écart ou plus<span>+${e[1]} XP</span></div>`).join('')}
 <div>🎯 Chaque bonus BallStar validé (${c.xp.maxObs} maximum par match)<span>+${c.xp.bonus} XP</span></div></div>
 <p class="mut" style="margin:6px 0 0">Pour l'écart, seul le palier le plus haut atteint compte.</p>
 <h3>Observer un match en direct</h3><div class="prev"><div>👀 Match observé (tu ne joues pas)<span>+${c.xp.obsMatch} XP</span></div><div>🎯 Chaque bonus noté pour un joueur (${c.xp.maxObs} max par joueur)<span>+${c.xp.obsBonus} XP</span></div></div>
 <p class="mut" style="margin:6px 0 0">Les joueurs récupèrent leur match en scannant le QR code de fin de match.</p>
 <h3>Niveaux</h3><div class="prev">${NIVEAUX.map((n,i)=>`<div><span class="lvl" style="font-size:1rem">${badgeSVG(i,22)} ${n.nom}</span><span>${i?c.seuils[i]+' XP':'départ'}</span></div>`).join('')}</div>
 <p class="mut" style="margin:6px 0 0">Chaque niveau débloque un avatar.</p>
 <h3>Défis spéciaux</h3><div class="prev">${ST.defis.map(d=>`<div style="display:block"><b>${esc(d.nom)}</b><br>${d.textes.map((t,i)=>`<small class="rl">${'★'.repeat(i+1)} ${esc(t)}</small>`).join('')}</div>`).join('')}</div>
 <p class="mut" style="margin:6px 0 0">La 1re étoile débloque l'avatar du défi, les suivantes ajoutent des étoiles dessus.</p>
 <h3>Avatars légendaires</h3><div class="prev">${AVATARS.filter(a=>a.legende!=null).map(a=>`<div><span>✨ ${esc(a.nom)}</span><span>${c.legendes[a.legende]} étoiles de défis</span></div>`).join('')}</div>
 <p class="mut" style="margin:6px 0 0">Tu as ${ST.etoiles} étoile${ST.etoiles>1?'s':''} sur ${ST.defis.length*3}.</p></div>`}
$('#aRegles').onclick=()=>modal(reglesHTML(),[{t:'OK',v:1}]);
$('#aImp').onclick=()=>$('#cfgFile').click();
$('#cfgFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 try{const sh=(await BSX.read(await f.arrayBuffer())).find(s=>R_.norm(s.name)===R_.norm(CFG_SHEET));if(!sh)throw new Error('ce n\'est pas un fichier de réglages Ball Star');
  const r=R_.depuisLignes(sh.rows);
  if(!r.valide)throw new Error('ce fichier a été modifié ou ne vient pas de l\'interface prof. Demande le fichier original à ton professeur.');
  CFG=r.cfg;saveCfg();ST=state(ROWS);renderAll();toast('Réglages du professeur importés ✔')}
 catch(x){toast('Fichier refusé : '+(x.message||x),true)}};

/* ───────── Rendu global & démarrage ───────── */
function renderAll(){renderNuage();renderArene();renderDefis();renderAvatars();renderBilan();if(!$('#vMatch').hidden)renderMatchForm()}
document.addEventListener('click',async e=>{if(e.target.id==='bIdent'&&window.ELEVE){ELEVE.changer();await ELEVE.demander();reload()}});
document.addEventListener('eleve-change',()=>reload());
(async()=>{try{if(window.ELEVE){ELEVE.bandeau($('#who'));await reload();if(!ME)await ELEVE.demander();await reload();resumeLive();const h=/[#&]m=([\w-]+)/.exec(location.hash);if(h){history.replaceState(null,'',location.pathname+location.search);importMatch(h[1])}}else renderAll()}catch(e){console.error(e);renderAll()}})();
if('serviceWorker' in navigator&&location.protocol==='https:'&&!window.BALLSTAR_NO_SW)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
