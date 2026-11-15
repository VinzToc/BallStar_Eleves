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
function matchItem(r,del){const win=isWin(r),act=ACTS.find(a=>a.n===r['Activité'])||{e:'🎮'};
 return `<div class="m ${win?'win':r['Résultat']==='Défaite'?'loss':''}"><span class="e" aria-hidden="true">${act.e}</span>
 <div class="t"><b>vs ${esc(r.Adversaire||'?')}</b><small>${esc(fmtDate(r.Date))} · ${esc(r['Résultat'])}${r.Observable?` · 🎯 ${nbObs(r)} × ${esc(r.Observable)}`:''}</small></div>
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
 const last=ST.R.slice(-3).reverse();
 $('#lastMatchs').innerHTML=last.length?last.map(r=>matchItem(r)).join(''):`<div class="empty">Aucun match pour l'instant.<br>Touche <b>⚔️ Nouveau match</b> après ta première rencontre pour gagner tes premiers XP.</div>`;
 if(!ME)$('#lastMatchs').insertAdjacentHTML('afterbegin',`<div class="empty" style="margin-bottom:8px;border-color:var(--y)">👤 Identifie-toi pour enregistrer tes matchs et gagner de l'XP.<br><button class="btn" style="margin-top:8px" id="bIdent">S'identifier</button></div>`)}
function defiItem(d){const a=AVATARS.find(x=>x.defi===d.id),max=d.etoiles>=3;
 return `<div class="defi ${d.done?'done':''}"><div class="pic">${avatarSVG(a,{locked:!d.done,k:'d',stars:d.etoiles})}</div><div><b>${esc(d.nom)} <span class="stars" aria-label="${d.etoiles} étoile(s) sur 3">${STARS(d.etoiles)}</span></b>
 <small>${max?'Défi terminé : 3 étoiles !':`${d.etoiles?'Étoile suivante':'1re étoile (avatar '+esc(a.nom)+')'} : ${esc(d.texte)}`}</small>
 <div class="pbar"><i style="width:${Math.min(100,Math.round(d.v/d.cible*100))}%"></i></div>
 <small class="pal">${d.paliers.map((n,i)=>`<span class="${d.etoiles>i?'on':''}">${'★'.repeat(i+1)} ${n}</span>`).join('')}<span class="cur">${Math.min(d.v,d.cible)} / ${d.cible}</span></small></div></div>`}

/* ───────── Match ───────── */
const F={act:null,nObs:0,obsSel:'',mode:'post'};
function lastAct(){const r=ST.R[ST.R.length-1];return r&&ACTS.some(a=>a.n===r['Activité'])?r['Activité']:ACTS[0].n}
function renderMatchForm(){if(!F.act)F.act=lastAct();
 $('#mAct').innerHTML=ACTS.map(a=>`<button type="button" class="chip ${a.n===F.act?'on':''}" data-act="${esc(a.n)}"><span class="e">${a.e}</span>${esc(a.n)}</button>`).join('');
 const advs=[...new Set(ST.R.map(r=>r.Adversaire).filter(Boolean))];$('#advList').innerHTML=advs.map(a=>`<option value="${esc(a)}">`).join('');
 const c=CFG.acts[F.act];
 if(c.impose){$('#mObsZone').innerHTML=`<div class="lock">🔒 ${esc(c.impose)}<small>Bonus BallStar fixé par ton professeur</small></div>`}
 else{const opts=c.obs.map(o=>`<option ${o===F.obsSel?'selected':''}>${esc(o)}</option>`).join('');
  const autre=F.obsSel&&!c.obs.includes(F.obsSel);
  $('#mObsZone').innerHTML=`<select id="mObs" aria-label="Choisir mon bonus BallStar"><option value="">— Choisis ton bonus BallStar —</option>${opts}<option value="__autre" ${autre?'selected':''}>✏️ Autre : je l'écris moi-même</option></select>
  <input type="text" id="mObsAutre" maxlength="80" placeholder="Écris ton bonus BallStar" ${autre?'':'hidden'} value="${autre?esc(F.obsSel):''}">`;
  $('#mObs').onchange=()=>{const v=$('#mObs').value;$('#mObsAutre').hidden=v!=='__autre';F.obsSel=v==='__autre'?$('#mObsAutre').value.trim():v;if(v==='__autre')$('#mObsAutre').focus();preview()};
  $('#mObsAutre').oninput=()=>{F.obsSel=$('#mObsAutre').value.trim();preview()}}
 $('#nObs').value=F.nObs;$('#nObsMax').textContent=`XP comptée jusqu'à ${CFG.xp.maxObs} bonus par match (${CFG.xp.bonus} XP chacun).`;
 preview()}
function curObs(){const c=CFG.acts[F.act];return c.impose?{txt:c.impose,src:'Prof'}:{txt:F.obsSel,src:c.obs.includes(F.obsSel)?'Liste':'Élève'}}
function scores(){return{me:Math.max(0,Math.round(N($('#sMe').value))),adv:Math.max(0,Math.round(N($('#sAdv').value)))}}
function preview(){const s=scores(),x=calcXP(CFG,s.me,s.adv,F.nObs);
 $('#advLb').textContent=$('#mAdv').value.trim()||'Adversaire';
 $('#mPrev').innerHTML=`<div>🎮 Match joué<span>+${x.match} XP</span></div><div class="${x.victoire?'':'off'}">🏆 Victoire<span>+${x.victoire} XP</span></div>
 <div class="${x.ecart?'':'off'}">📏 Écart au score (${x.diff} pt${x.diff>1?'s':''})<span>+${x.ecart} XP</span></div><div class="${x.bonus?'':'off'}">🎯 Bonus BallStar validés (${x.compte}${x.nObs>x.compte?` comptés sur ${x.nObs}`:''} × ${CFG.xp.bonus} XP)<span>+${x.bonus} XP</span></div>
 <div class="tot">Total<span>+${x.total} XP</span></div>`}
$('#mAct').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;F.act=b.dataset.act;F.obsSel='';renderMatchForm()});
$$('[data-s]').forEach(b=>b.onclick=()=>{const i=b.dataset.s==='me'?$('#sMe'):$('#sAdv');i.value=Math.max(0,N(i.value)+N(b.dataset.d));preview()});
['#sMe','#sAdv','#mAdv'].forEach(s=>$(s).addEventListener('input',preview));
$$('[data-o]').forEach(b=>b.onclick=()=>{F.nObs=Math.max(0,Math.min(99,F.nObs+N(b.dataset.o)));$('#nObs').value=F.nObs;preview()});
$('#nObs').addEventListener('input',()=>{F.nObs=Math.max(0,Math.min(99,Math.round(N($('#nObs').value))));preview()});
$('#mMode').onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;F.mode=b.dataset.m;setMode()};
function setMode(){$$('#mMode button').forEach(b=>b.classList.toggle('on',b.dataset.m===F.mode));
 $('#postZone').hidden=F.mode!=='post';$('#liveZone').hidden=F.mode!=='live';$('#mErr').textContent='';
 const st=$$('#vMatch .step')[1];if(st)st.innerHTML=`<i>2</i> ${F.mode==='live'?'Pendant le match':'Après le match'}`}

/* Enregistre un match (saisi après coup ou en direct) puis lance les animations. */
const errM=t=>{$('#mErr').textContent=t;toast(t,true);return null};
async function needMe(){if(!ME&&window.ELEVE){ELEVE.changer();await ELEVE.demander();await reload()}return !!ME}
async function saveMatch(m){const x=calcXP(CFG,m.me,m.ad,m.nObs),before=ST,now=new Date(),p=n=>String(n).padStart(2,'0');
 const xpCum=before.xp+x.total,lvlAfter=levelOf(xpCum);
 const row={Date:`${now.getFullYear()}-${p(now.getMonth()+1)}-${p(now.getDate())}`,Heure:`${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`,
  'Activité':m.act,Adversaire:m.adv,'Mon score':m.me,'Score adversaire':m.ad,'Résultat':x.win?'Victoire':x.nul?'Égalité':'Défaite','Écart':x.diff,
  Observable:m.obs,'Origine observable':m.src,'Observables validés':m.nObs,'Observable réussi':m.nObs>0?'Oui':'Non',Saisie:m.saisie,
  'XP match':x.match,'XP victoire':x.victoire,'XP écart':x.ecart,'XP bonus':x.bonus,'XP gagnée':x.total,'XP cumulée':xpCum,Niveau:NIVEAUX[lvlAfter].nom,'Réglages':R_.codeCourt(CFG)};
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

/* ───────── Mode direct : un observateur suit un seul joueur pendant le match ───────── */
const LIVE_KEY=()=>'BALLSTAR_LIVE_'+(ME?ME.id:'anon');
let LIVE=null,wake=null;
const saveLive=()=>ls.set(LIVE_KEY(),LIVE?JSON.stringify(LIVE):'');
function fly(txt,sub,cls){$$('.xpfly').forEach(e=>e.remove());const f=document.createElement('div');f.className='xpfly'+(cls?' '+cls:'');f.innerHTML=`${esc(txt)}${sub?`<small>${esc(sub)}</small>`:''}`;document.body.appendChild(f);setTimeout(()=>f.remove(),1600)}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function keepAwake(on){try{if(on&&'wakeLock' in navigator&&!wake)wake=await navigator.wakeLock.request('screen');if(!on&&wake){await wake.release();wake=null}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&LIVE){wake=null;keepAwake(true)}});
$('#lStart').onclick=async()=>{$('#mErr').textContent='';const pr=checkPrep();if(!pr)return;
 if(!await needMe())return errM("Identifie le joueur observé avant de lancer le direct.");
 LIVE={act:F.act,adv:pr.adv,obs:pr.o.txt,src:pr.o.src,me:0,ad:0,nObs:0,hist:[],t:Date.now()};saveLive();openLive(true)};
function openLive(first){document.body.classList.add('live');go('vLive');renderLive();keepAwake(true);
 if(first)setTimeout(()=>fly(`+${CFG.xp.joue} XP`,'Match joué'),350)}
function liveXP(){return calcXP(CFG,LIVE.me,LIVE.ad,LIVE.nObs)}
function renderLive(bump){if(!LIVE)return;const L=LIVE,a=activeAvatar(),xpNow=CFG.xp.joue+Math.min(L.nObs,CFG.xp.maxObs)*CFG.xp.bonus;
 const act=ACTS.find(z=>z.n===L.act)||{e:'🎮'};$('#lAct').textContent=`${act.e} ${L.act}`;
 $('#lAva').innerHTML=avatarSVG(a,{k:'lv',stars:starsOf(a)});$('#lName').textContent=ME?`${ME.prenom} ${String(ME.nom).toUpperCase()}`:'Joueur';
 $('#lAdvN').textContent=L.adv;$('#lMeN').textContent=ME?ME.prenom:'Moi';$('#lAdN').textContent=L.adv;
 $('#lMeS').textContent=L.me;$('#lAdS').textContent=L.ad;$('#lObs').textContent=L.obs;
 const c=Math.min(L.nObs,CFG.xp.maxObs);$('#lCnt').textContent=`${L.nObs} réussi${L.nObs>1?'s':''} · ${c} / ${CFG.xp.maxObs} compté${c>1?'s':''} en XP`;
 const x=$('#lXP');x.textContent='+'+xpNow;if(bump){x.classList.remove('bump');void x.offsetWidth;x.classList.add('bump')}
 // barre de niveau avec l'XP du match en cours
 const tot=ST.xp+xpNow,lv=levelOf(tot),s=CFG.seuils,nx=lv<3?s[lv+1]:null;
 $('#lBar').style.width=(nx?Math.max(2,Math.min(100,(tot-s[lv])/(nx-s[lv])*100)):100)+'%';$('#lBarT').textContent=nx?`${tot} / ${nx} XP`:`${tot} XP`;
 const w=calcXP(CFG,Math.max(L.me,L.ad+1),L.ad,0);
 $('#lHint').innerHTML=(lv>ST.lvl?`🔥 Niveau ${NIVEAUX[lv].nom} atteint à la fin du match ! · `:'')+(L.me>L.ad?`En tête : la victoire rapporterait +${CFG.xp.victoire} XP${liveXP().ecart?` et +${liveXP().ecart} XP d'écart`:''}`:L.me===L.ad?'Égalité : gagne le match pour +'+CFG.xp.victoire+' XP':`Mené de ${L.ad-L.me} point${L.ad-L.me>1?'s':''} : accroche-toi !`)}
function act(type){if(!LIVE)return;LIVE.hist.push(type);
 if(type==='me'){LIVE.me++;pop('#lMeS')}else if(type==='ad'){LIVE.ad++;pop('#lAdS')}
 else if(type==='bonus'){LIVE.nObs++;if(LIVE.nObs<=CFG.xp.maxObs)fly(`+${CFG.xp.bonus} XP`,'Bonus BallStar');else fly('Bonus !',`déjà ${CFG.xp.maxObs} comptés en XP`,'small')}
 saveLive();renderLive(type==='bonus')}
function pop(sel){const e=$(sel);e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}
$('#lMe').onclick=()=>act('me');$('#lAd').onclick=()=>act('ad');$('#lBonus').onclick=()=>act('bonus');
$$('#vLive .minus').forEach(b=>b.onclick=()=>{if(!LIVE)return;const k=b.dataset.l;if(LIVE[k]>0){LIVE[k]--;const i=LIVE.hist.lastIndexOf(k);if(i>=0)LIVE.hist.splice(i,1)}saveLive();renderLive()});
$('#lUndo').onclick=()=>{if(!LIVE||!LIVE.hist.length)return toast('Rien à annuler.');const t=LIVE.hist.pop();if(t==='me')LIVE.me--;else if(t==='ad')LIVE.ad--;else LIVE.nObs--;
 saveLive();renderLive(t==='bonus');toast(t==='bonus'?'Dernier bonus annulé':'Dernier point annulé')};
function closeLive(){LIVE=null;saveLive();keepAwake(false);document.body.classList.remove('live')}
$('#lQuit').onclick=async()=>{const v=await modal('<h2>Abandonner le direct ?</h2><p>Le match en cours ne sera pas enregistré et aucune XP ne sera gagnée.</p>',[{t:'Abandonner',v:1,cls:'r'},{t:'Continuer le match',v:0,cls:'g'}]);
 if(v){closeLive();go('vMatch');setMode()}};
$('#lEnd').onclick=async()=>{const L=LIVE;if(!L)return;if(!L.me&&!L.ad)return toast('Le score est encore 0 – 0.',true);
 const x=liveXP();const v=await modal(`<h2>🏁 Fin du match ?</h2><p style="font-family:var(--fd);font-size:1.8rem;margin:6px 0">${L.me} – ${L.ad}</p><p>${esc(ME?ME.prenom:'Moi')} contre ${esc(L.adv)} · ${x.win?'Victoire':x.nul?'Égalité':'Défaite'} · ${L.nObs} bonus BallStar</p>`,[{t:'Valider le match',v:1},{t:'Continuer',v:0,cls:'g'}]);
 if(!v)return;
 if(x.victoire){fly(`+${x.victoire} XP`,'Victoire !');$('#lXP').textContent='+'+(x.match+x.bonus+x.victoire);await wait(1300)}
 if(x.ecart){fly(`+${x.ecart} XP`,`Écart de ${x.diff} points`);$('#lXP').textContent='+'+x.total;await wait(1300)}
 const r=await saveMatch({act:L.act,adv:L.adv,me:L.me,ad:L.ad,nObs:L.nObs,obs:L.obs,src:L.src,saisie:'Direct'});
 if(!r){toast("Le match n'a pas pu être enregistré. Le direct reste ouvert.",true);return}
 closeLive();$('#mAdv').value='';go('vArene');celebrate(r.before,ST,r.x.total,true)};
function resumeLive(){if(LIVE||!ME)return;try{const o=JSON.parse(ls.get(LIVE_KEY())||'null');if(o&&o.act){LIVE=o;openLive(false);toast('Direct en cours repris')}}catch(e){}}

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
 const byAct=ACTS.map(a=>{const L=R.filter(r=>r['Activité']===a.n);return{a,n:L.length,w:L.filter(isWin).length,l:L.filter(r=>r['Résultat']==='Défaite').length,xp:L.reduce((s,r)=>s+N(r['XP gagnée']),0)}}).filter(x=>x.n);
 $('#bAct').innerHTML=byAct.length?`<table><thead><tr><th>Activité</th><th style="text-align:right">Matchs</th><th style="text-align:right">V</th><th style="text-align:right">D</th><th style="text-align:right">XP</th></tr></thead><tbody>${byAct.map(x=>`<tr><td>${x.a.e} ${esc(x.a.n)}</td><td class="n">${x.n}</td><td class="n">${x.w}</td><td class="n">${x.l}</td><td class="n">${x.xp}</td></tr>`).join('')}</tbody></table>`:`<div class="empty">Pas encore de match.</div>`;
 const obs={};R.forEach(r=>{const k=r.Observable||'—';(obs[k]=obs[k]||{n:0,ok:0}).n++;obs[k].ok+=nbObs(r)});
 const ok=Object.entries(obs).sort((a,b)=>b[1].n-a[1].n);
 $('#bObs').innerHTML=ok.length?`<table><thead><tr><th>Bonus BallStar</th><th style="text-align:right">Matchs</th><th style="text-align:right">Validés</th><th style="text-align:right">Moyenne</th></tr></thead><tbody>${ok.map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${v.n}</td><td class="n">${v.ok}</td><td class="n"><span class="pct">${(v.ok/v.n).toFixed(1).replace('.',',')}</span></td></tr>`).join('')}</tbody></table>`:`<div class="empty">Pas encore d'observable.</div>`;
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

/* ───────── Règles du jeu (lecture seule) & import des réglages du prof ───────── */
function reglesHTML(){const c=CFG,src=R_.isDefault(c)?'Réglages par défaut':'Réglages de ton professeur · code '+R_.codeCourt(c);
 return `<div class="regles"><h2>📜 Règles du jeu</h2><p class="mut">🔒 ${esc(src)}. Seul ton professeur peut les changer : ce sont les mêmes pour toute la classe.</p>
 <h3>Gagner de l'XP à chaque match</h3><div class="prev"><div>🎮 Match joué<span>+${c.xp.joue} XP</span></div><div>🏆 Victoire<span>+${c.xp.victoire} XP</span></div>
 ${c.ecart.map(e=>`<div>📏 Victoire avec ${e[0]} points d'écart ou plus<span>+${e[1]} XP</span></div>`).join('')}
 <div>🎯 Chaque bonus BallStar validé (${c.xp.maxObs} maximum par match)<span>+${c.xp.bonus} XP</span></div></div>
 <p class="mut" style="margin:6px 0 0">Pour l'écart, seul le palier le plus haut atteint compte.</p>
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
function renderAll(){renderArene();renderDefis();renderAvatars();renderBilan();if(!$('#vMatch').hidden)renderMatchForm()}
document.addEventListener('click',async e=>{if(e.target.id==='bIdent'&&window.ELEVE){ELEVE.changer();await ELEVE.demander();reload()}});
document.addEventListener('eleve-change',()=>reload());
(async()=>{try{if(window.ELEVE){ELEVE.bandeau($('#who'));await reload();if(!ME)await ELEVE.demander();await reload();resumeLive()}else renderAll()}catch(e){console.error(e);renderAll()}})();
if('serviceWorker' in navigator&&location.protocol==='https:'&&!window.BALLSTAR_NO_SW)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
