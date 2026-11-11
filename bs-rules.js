/* bs-rules.js — règles du jeu Ball Star, communes à l'appli élève (BallStar_Eleves) et à l'interface prof (BallStar_Prof).
   ⚠ Ce fichier doit être IDENTIQUE dans les deux dépôts.
   - Réglages par défaut, calcul de l'XP, niveaux, défis.
   - Fichier de réglages du professeur (feuille « BallStar_Config ») avec un code de contrôle :
     l'appli élève refuse un fichier modifié à la main ou qui ne vient pas de l'interface prof.
   - L'interface prof recalcule toujours l'XP avec SES réglages : un élève ne peut pas progresser plus vite en trichant sur le barème. */
(function(){
const N=v=>{const n=Number(v);return isFinite(n)?n:0};
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const clone=o=>JSON.parse(JSON.stringify(o));

const ACTS=[{n:'Tennis de table',e:'🏓'},{n:'Badminton',e:'🏸'},{n:'Tennis',e:'🎾'},{n:'Sports de combat',e:'🥋'}];
const NIV=['Bronze','Argent','Or','Star'];
const DEF={xp:{joue:10,victoire:25,bonus:5},ecart:[[3,5],[6,10],[10,15]],seuils:[0,150,400,750],
 acts:{
  'Tennis de table':{impose:'',obs:['Faire déplacer mon adversaire','Varier les trajectoires (long / court, gauche / droite)','Varier mes services','Jouer en revers quand il le faut','Accélérer sur une balle haute']},
  'Badminton':{impose:'',obs:['Faire déplacer mon adversaire aux 4 coins','Alterner jeu long et jeu court','Smasher sur un volant haut','Revenir au centre après chaque frappe','Servir long et haut']},
  'Tennis':{impose:'',obs:['Faire déplacer mon adversaire','Jouer en revers quand il le faut','Monter au filet pour conclure','Varier la longueur de balle','Réussir mes premières balles de service']},
  'Sports de combat':{impose:'',obs:['Conserver ma garde','Déséquilibrer avant d\'attaquer','Enchaîner deux actions','Rester dans la zone de combat','Contrôler mon adversaire au sol']}
 }};

/* Remet un objet de réglages dans une forme propre et complète (ordre des clés fixe → code de contrôle stable). */
function clean(c){c=c||{};const d=clone(DEF),x=c.xp||{};
 const out={xp:{joue:N(x.joue??d.xp.joue),victoire:N(x.victoire??d.xp.victoire),bonus:N(x.bonus??d.xp.bonus)},
  ecart:(Array.isArray(c.ecart)?c.ecart:d.ecart).map(e=>[N(e[0]),N(e[1])]).filter(e=>e[0]>0).sort((a,b)=>a[0]-b[0]),
  seuils:Array.isArray(c.seuils)&&c.seuils.length===4?[0,N(c.seuils[1]),N(c.seuils[2]),N(c.seuils[3])]:d.seuils,acts:{}};
 for(const a of ACTS){const s=(c.acts||{})[a.n]||{},obs=Array.isArray(s.obs)&&s.obs.length?[...new Set(s.obs.map(o=>String(o).trim()).filter(Boolean))]:d.acts[a.n].obs;
  out.acts[a.n]={impose:String(s.impose||'').trim(),obs}}
 return out}
const isDefault=c=>JSON.stringify(clean(c))===JSON.stringify(clean(DEF));

/* Code de contrôle (empreinte du contenu des réglages). */
const SALT='BallStar·EPS·v1·raquettes&combat';
function hash(str){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h1=Math.imul(h1^c,2654435761);h2=Math.imul(h2^c,1597334677)}
 h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
 return(4294967296*(2097151&h2)+(h1>>>0)).toString(36).toUpperCase().padStart(11,'0')}
const signe=c=>hash(SALT+JSON.stringify(clean(c)));
const codeCourt=c=>isDefault(c)?'Défaut':signe(c).slice(-6);

/* XP d'un match */
function calcXP(cfg,me,adv,ok){me=N(me);adv=N(adv);const win=me>adv,diff=Math.abs(me-adv);
 let xe=0;if(win)for(const [min,xp] of cfg.ecart)if(diff>=min)xe=xp;
 const r={match:cfg.xp.joue,victoire:win?cfg.xp.victoire:0,ecart:xe,bonus:ok?cfg.xp.bonus:0};
 r.total=r.match+r.victoire+r.ecart+r.bonus;r.win=win;r.nul=me===adv;r.diff=diff;return r}
const maxEcartXP=cfg=>Math.max(0,...cfg.ecart.map(e=>e[1]));
const levelOf=(cfg,xp)=>{let l=0;cfg.seuils.forEach((s,i)=>{if(xp>=s)l=i});return l};

/* Matchs */
const isWin=r=>r['Résultat']==='Victoire'||(r['Résultat']==null&&N(r['Mon score'])>N(r['Score adversaire']));
const isLoss=r=>r['Résultat']==='Défaite';
const isOk=r=>norm(r['Observable réussi'])==='oui';
const sortRows=rows=>[...rows].sort((a,b)=>(String(a.Date)+String(a.Heure||'')).localeCompare(String(b.Date)+String(b.Heure||'')));
function streak(rows,f){let m=0,c=0;for(const r of rows){if(f(r)){c++;m=Math.max(m,c)}else c=0}return m}
const DEFIS=[
 {id:'combo',nom:'Série de feu',desc:"Gagner 3 matchs d'affilée",but:3,val:(R)=>streak(R,isWin)},
 {id:'globe',nom:'Tour du monde',desc:'Affronter 5 adversaires différents',but:5,val:(R)=>new Set(R.map(r=>norm(r.Adversaire)).filter(Boolean)).size},
 {id:'lynx',nom:'Œil de lynx',desc:"Réussir l'observable 5 fois",but:5,val:(R)=>R.filter(isOk).length},
 {id:'turbo',nom:'Increvable',desc:'Jouer 10 matchs',but:10,val:(R)=>R.length},
 {id:'titan',nom:'Rouleau compresseur',desc:"Gagner un match avec le plus gros bonus d'écart",but:1,val:(R,cfg)=>{const m=maxEcartXP(cfg);return m>0?R.filter(r=>isWin(r)&&N(r['XP écart'])>=m).length:0}},
 {id:'zen',nom:'Maîtrise totale',desc:"Réussir l'observable 3 matchs d'affilée",but:3,val:(R)=>streak(R,isOk)}
];

/* Progression d'un élève.  recalc:true → l'XP de chaque match est recalculée avec cfg (interface prof). */
function progression(cfg,rows,opt){opt=opt||{};let R=sortRows(rows);
 if(opt.recalc)R=R.map(r=>{const x=calcXP(cfg,r['Mon score'],r['Score adversaire'],isOk(r));
  return{...r,'Résultat':x.win?'Victoire':x.nul?'Égalité':'Défaite','XP match':x.match,'XP victoire':x.victoire,'XP écart':x.ecart,'XP bonus':x.bonus,'XP gagnée':x.total,_declare:N(r['XP gagnée'])}});
 let cum=0;R=R.map(r=>{cum+=N(r['XP gagnée']);return{...r,_cum:cum}});
 const xp=cum,lvl=levelOf(cfg,xp);
 const defis=DEFIS.map(d=>{const v=d.val(R,cfg);return{...d,v:Math.min(v,d.but),done:v>=d.but}});
 const w=R.filter(isWin).length,l=R.filter(isLoss).length,ok=R.filter(isOk).length;
 const declare=rows.reduce((s,r)=>s+N(r['XP gagnée']),0);
 return{R,xp,lvl,defis,w,l,ok,n:R.length,declare}}

/* Fichier de réglages (feuille BallStar_Config) */
const CFG_SHEET='BallStar_Config';
function versLignes(cfg){cfg=clean(cfg);const r=[['Paramètre','Activité','Valeur','XP'],['XP match joué','','',cfg.xp.joue],['XP victoire','','',cfg.xp.victoire],['XP observable réussi','','',cfg.xp.bonus]];
 cfg.ecart.forEach(e=>r.push(['Bonus écart','',e[0],e[1]]));[1,2,3].forEach(i=>r.push(['Seuil niveau',NIV[i],cfg.seuils[i],'']));
 ACTS.forEach(a=>{const c=cfg.acts[a.n];c.obs.forEach(o=>r.push(['Observable',a.n,o,'']));if(c.impose)r.push(['Observable imposé',a.n,c.impose,''])});
 r.push(['Code de contrôle','',signe(cfg),'']);return r}
/* Lit la feuille ; retourne {cfg, valide} — valide=false si le code de contrôle manque ou ne correspond pas. */
function depuisLignes(rows){const c={xp:{},ecart:[],seuils:[0,0,0,0],acts:{}};let code='',seen=0;
 for(const row of rows.slice(1)){const [p,a,v,x]=Array.from(row||[],z=>z==null?'':z),k=norm(p),act=ACTS.find(z=>norm(z.n)===norm(a));
  if(k==='xpmatchjoue'){c.xp.joue=N(x);seen++}else if(k==='xpvictoire'){c.xp.victoire=N(x);seen++}else if(k==='xpobservablereussi'){c.xp.bonus=N(x);seen++}
  else if(k==='bonusecart'){c.ecart.push([N(v),N(x)]);seen++}
  else if(k==='seuilniveau'){const i=NIV.findIndex(n=>norm(n)===norm(a));if(i>0){c.seuils[i]=N(v);seen++}}
  else if(k==='observable'&&act&&String(v).trim()){c.acts[act.n]=c.acts[act.n]||{obs:[],impose:''};c.acts[act.n].obs.push(String(v).trim());seen++}
  else if(k==='observableimpose'&&act){c.acts[act.n]=c.acts[act.n]||{obs:[],impose:''};c.acts[act.n].impose=String(v).trim();seen++}
  else if(k==='codedecontrole')code=String(v).trim()}
 if(!seen)throw new Error('aucun réglage reconnu');
 if(!c.seuils[1])c.seuils=DEF.seuils.slice();
 const cfg=clean(c);return{cfg,valide:!!code&&code===signe(cfg)}}

window.BSRULES={ACTS,NIV,DEF,DEFIS,clean,isDefault,signe,codeCourt,calcXP,levelOf,maxEcartXP,isWin,isLoss,isOk,sortRows,progression,CFG_SHEET,versLignes,depuisLignes,norm,N};
})();
