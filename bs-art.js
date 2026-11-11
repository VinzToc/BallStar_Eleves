/* bs-art.js — dessins originaux de Ball Star (avatars, badges de niveau, logo), générés en SVG.
   Aucun personnage existant n'est repris : tous les avatars sont des créations propres à Ball Star. */
(function(){
const OL='#1a0b33'; // contour
const S=(w=6)=>`stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/* ── Accessoires tenus ── */
const ITEMS={
 paddle:c=>`<g transform="rotate(-25 160 130)"><rect x="153" y="138" width="14" height="44" rx="6" fill="#c98a4b" ${S(5)}/><circle cx="160" cy="112" r="30" fill="${c}" ${S()}/><path d="M144 100 Q152 90 164 88" fill="none" stroke="#fff8" stroke-width="5" stroke-linecap="round"/></g>`,
 racket:c=>`<g transform="rotate(-18 165 110)"><rect x="161" y="118" width="8" height="58" rx="3" fill="${OL}"/><rect x="158" y="160" width="14" height="26" rx="5" fill="${c}" ${S(4)}/><ellipse cx="165" cy="88" rx="22" ry="30" fill="#ffffff22" ${S(6)}/><ellipse cx="165" cy="88" rx="22" ry="30" fill="none" stroke="${c}" stroke-width="3"/><path d="M152 70v36M160 62v52M168 61v54M176 68v40M146 80h38M144 92h42M148 104h34" stroke="#fff9" stroke-width="1.6"/></g>`,
 tennis:c=>`<g transform="rotate(-20 165 112)"><rect x="160" y="124" width="10" height="56" rx="4" fill="${c}" ${S(4)}/><ellipse cx="165" cy="90" rx="26" ry="32" fill="#ffffff1c" ${S(7)}/><path d="M149 72v36M157 63v54M165 60v60M173 63v54M181 72v36M141 82h48M140 94h50M143 106h44" stroke="#fffa" stroke-width="1.6"/></g><circle cx="132" cy="178" r="13" fill="#d7f52a" ${S(4)}/><path d="M121 172q11 6 22 0" fill="none" stroke="#fff" stroke-width="2.5"/>`,
 glove:c=>`<g><path d="M140 150 q-4 -34 22 -38 q30 -4 30 26 q0 22 -18 30 l-24 4 z" fill="${c}" ${S()}/><path d="M146 156 q16 -2 26 -14" fill="none" stroke="${OL}" stroke-width="4"/><rect x="140" y="156" width="34" height="18" rx="5" fill="#fff" ${S(5)}/><path d="M156 122 q10 -6 22 2" fill="none" stroke="#fff8" stroke-width="5" stroke-linecap="round"/></g>`,
 shuttle:c=>`<g transform="rotate(25 165 110)"><path d="M150 80 L180 80 L172 128 L158 128 Z" fill="#fff" ${S(5)}/><path d="M158 82v44M165 80v48M172 82v44" stroke="#c9c2e8" stroke-width="2"/><path d="M152 96h26M154 112h22" stroke="#c9c2e8" stroke-width="2"/><ellipse cx="165" cy="134" rx="12" ry="10" fill="${c}" ${S(5)}/></g>`,
 belt:c=>`<g><path d="M60 178 h80" stroke="${c}" stroke-width="14" stroke-linecap="round"/><path d="M60 178 h80" stroke="${OL}" stroke-width="3" stroke-dasharray="0" fill="none" opacity=".25"/><path d="M98 178 l-10 22 M102 178 l12 20" stroke="${c}" stroke-width="10" stroke-linecap="round"/><path d="M94 172 h12 v12 h-12z" fill="${c}" ${S(4)}/></g>`,
 none:()=>''
};

/* ── Coiffures / couvre-chefs ── */
const HEADS={
 cap:(a)=>`<path d="M52 74 Q52 30 100 30 Q148 30 148 74 Z" fill="${a.acc}" ${S()}/><path d="M100 70 Q150 64 176 76 Q176 86 150 86 L100 80 Z" fill="${a.acc}" ${S()}/><circle cx="100" cy="34" r="6" fill="${a.acc2}" ${S(4)}/><path d="M78 56 l10 -12 l10 12 l10 -12 l10 12" fill="none" stroke="${a.acc2}" stroke-width="5" stroke-linejoin="round"/>`,
 headband:(a)=>`<path d="M50 78 L46 44 L64 54 L70 28 L86 46 L100 22 L114 46 L130 28 L136 54 L154 44 L150 78 Z" fill="${a.hair}" ${S()}/><rect x="48" y="62" width="104" height="16" rx="7" fill="${a.acc}" ${S(5)}/><path d="M150 68 q22 4 26 22 q-14 -6 -24 -6" fill="${a.acc}" ${S(5)}/>`,
 spiky:(a)=>`<path d="M50 84 L36 58 L58 60 L50 30 L76 46 L84 14 L102 40 L118 12 L126 44 L150 30 L146 60 L166 58 L150 84 Z" fill="${a.hair}" ${S()}/><path d="M84 30 L96 44 M118 26 L120 42" stroke="#fff7" stroke-width="5" stroke-linecap="round"/>`,
 crown:(a)=>`<path d="M50 82 Q44 34 100 32 Q156 34 150 82 Q140 56 100 58 Q60 56 50 82 Z" fill="${a.hair}" ${S()}/><path d="M68 44 L74 14 L88 32 L100 6 L112 32 L126 14 L132 44 Z" fill="${a.acc}" ${S(5)}/><path d="M100 22 l3 7 7 .5 -5.5 4.5 2 7 -6.5 -4 -6.5 4 2 -7 -5.5 -4.5 7 -.5z" fill="${a.acc2}"/>`,
 helmet:(a)=>`<path d="M40 112 Q30 28 100 24 Q170 28 160 112 L146 118 Q150 60 100 58 Q50 60 54 118 Z" fill="${a.acc}" ${S()}/><path d="M64 40 Q100 22 136 40" fill="none" stroke="#fff6" stroke-width="6" stroke-linecap="round"/><rect x="88" y="26" width="24" height="34" rx="8" fill="${a.acc2}" ${S(5)}/>`,
 goggles:(a)=>`<path d="M50 78 Q46 30 100 30 Q154 30 150 78 Q138 50 100 50 Q62 50 50 78 Z" fill="${a.hair}" ${S()}/><rect x="46" y="54" width="108" height="10" rx="5" fill="${a.acc}" ${S(4)}/><circle cx="80" cy="56" r="14" fill="#7fe7ff" ${S(5)}/><circle cx="120" cy="56" r="14" fill="#7fe7ff" ${S(5)}/><path d="M74 50 q4 -4 10 -2 M114 50 q4 -4 10 -2" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
 ears:(a)=>`<path d="M54 66 L50 20 L86 44 Z" fill="${a.hair}" ${S()}/><path d="M146 66 L150 20 L114 44 Z" fill="${a.hair}" ${S()}/><path d="M58 52 L56 32 L72 44 Z M142 52 L144 32 L128 44 Z" fill="${a.acc}"/><path d="M52 80 Q50 38 100 38 Q150 38 148 80 Q134 58 100 60 Q66 58 52 80 Z" fill="${a.hair}" ${S()}/><path d="M86 42 l6 14 l8 -14 l8 14 l6 -14" fill="none" stroke="${a.acc}" stroke-width="4" stroke-linejoin="round"/>`,
 visor:(a)=>`<path d="M52 80 Q48 34 100 34 Q152 34 148 80 L140 64 L128 72 L118 58 L104 70 L92 56 L80 70 L68 60 Z" fill="${a.hair}" ${S()}/><path d="M46 66 Q100 50 154 66 L152 76 Q100 62 48 76 Z" fill="${a.acc}" ${S(5)}/><path d="M60 72 Q100 60 172 82 Q176 92 150 90 Q100 74 56 82 Z" fill="${a.acc}" ${S(5)}/>`,
 mask:(a)=>`<path d="M50 84 Q40 30 100 28 Q160 30 150 84 Q144 54 100 54 Q56 54 50 84 Z" fill="${a.hair}" ${S()}/>`,
 bun:(a)=>`<circle cx="100" cy="26" r="20" fill="${a.hair}" ${S()}/><path d="M86 18 q14 -8 28 0" stroke="#fff5" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="82" y="38" width="36" height="9" rx="4" fill="${a.acc}" ${S(4)}/><path d="M52 84 Q46 42 100 42 Q154 42 148 84 Q138 60 100 62 Q62 60 52 84 Z" fill="${a.hair}" ${S()}/>`
};

/* ── Avatars de Ball Star ── */
const AVATARS=[
 {id:'pixel',  nom:'Pixel',  titre:'Le rookie',          niveau:0, skin:'#ffd3ae',hair:'#4a2b18',acc:'#7c4dff',acc2:'#ffe14a',shirt:'#7c4dff',head:'cap',     item:'paddle', item_c:'#ff3b5c',eyes:'normal'},
 {id:'shuttle',nom:'Shuttle',titre:'La fusée du volant', niveau:1, skin:'#c98b5e',hair:'#1b1230',acc:'#1fd1c9',acc2:'#fff',   shirt:'#1fd1c9',head:'headband',item:'racket', item_c:'#ffe14a',eyes:'normal'},
 {id:'topspin',nom:'Topspin',titre:'Le roi de l\'effet', niveau:2, skin:'#f2c38f',hair:'#ff8a00',acc:'#ffd400',acc2:'#fff',   shirt:'#ffcc00',head:'spiky',   item:'paddle', item_c:'#1fd1c9',eyes:'shades'},
 {id:'nova',   nom:'Nova',   titre:'La légende Star',    niveau:3, skin:'#8a5634',hair:'#ff3df2',acc:'#ffe14a',acc2:'#ff3df2',shirt:'#2a0f5c',head:'crown',   item:'racket', item_c:'#ffe14a',eyes:'star'},
 {id:'combo',  nom:'Combo',  titre:'Le boxeur en série', defi:'combo', skin:'#e8b48a',hair:'#222',acc:'#ff3b5c',acc2:'#ffe14a',shirt:'#ff3b5c',head:'helmet',item:'glove',item_c:'#ff3b5c',eyes:'angry'},
 {id:'globe',  nom:'Globe',  titre:'L\'explorateur', defi:'globe', skin:'#ffd9b8',hair:'#2d7bff',acc:'#2d7bff',acc2:'#fff',shirt:'#2d7bff',head:'goggles',item:'tennis',item_c:'#2d7bff',eyes:'normal'},
 {id:'lynx',   nom:'Lynx',   titre:'L\'œil qui voit tout', defi:'lynx', skin:'#f6c9a0',hair:'#ff9f1c',acc:'#ffe3c2',acc2:'#fff',shirt:'#8f5bff',head:'ears',item:'paddle',item_c:'#8f5bff',eyes:'cat'},
 {id:'turbo',  nom:'Turbo',  titre:'Le marathonien', defi:'turbo', skin:'#b97a4f',hair:'#39ff88',acc:'#ff6a00',acc2:'#fff',shirt:'#ff6a00',head:'visor',item:'shuttle',item_c:'#ff6a00',eyes:'normal'},
 {id:'titan',  nom:'Titan',  titre:'Le mur imprenable', defi:'titan', skin:'#9c6644',hair:'#120a22',acc:'#5b21d6',acc2:'#ffe14a',shirt:'#3a1a7a',head:'mask',item:'glove',item_c:'#ffe14a',eyes:'angry',mask:true},
 {id:'zen',    nom:'Zen',    titre:'La sage du tatami', defi:'zen', skin:'#ffe0c4',hair:'#1b1230',acc:'#ff3df2',acc2:'#fff',shirt:'#f4f1ff',head:'bun',item:'belt',item_c:'#1b1230',eyes:'calm'}
];

function eyes(a){
 if(a.eyes==='shades')return `<path d="M62 84 h76 v6 q0 18 -18 18 h-6 q-12 0 -14 -12 h-4 q-2 12 -14 12 h-6 q-18 0 -18 -18 z" fill="${OL}"/><path d="M70 90 l10 -4 M112 90 l10 -4" stroke="#7fe7ff" stroke-width="4" stroke-linecap="round"/>`;
 const brow=a.eyes==='angry'?`<path d="M66 72 L92 80 M134 72 L108 80" stroke="${OL}" stroke-width="7" stroke-linecap="round"/>`
  :a.eyes==='calm'?`<path d="M68 76 q12 -6 22 0 M110 76 q12 -6 22 0" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>`
  :`<path d="M68 74 q12 -6 22 -2 M110 72 q12 -4 22 2" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
 if(a.eyes==='calm')return brow+`<path d="M70 92 q10 8 20 0 M110 92 q10 8 20 0" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
 const pupil=a.eyes==='cat'?(x)=>`<ellipse cx="${x+2}" cy="92" rx="3.5" ry="9" fill="${OL}"/>`
  :a.eyes==='star'?(x)=>`<path transform="translate(${x+2} 92) scale(.9)" d="M0 -9 l2.6 6 6.4 .5 -4.9 4.1 1.5 6.3 -5.6 -3.4 -5.6 3.4 1.5 -6.3 -4.9 -4.1 6.4 -.5z" fill="#ff3df2"/>`
  :(x)=>`<circle cx="${x+3}" cy="93" r="6" fill="${OL}"/>`;
 return brow+[80,120].map(x=>`<ellipse cx="${x}" cy="92" rx="11" ry="13" fill="#fff" ${S(4)}/>${pupil(x)}<circle cx="${x+5}" cy="88" r="2.4" fill="#fff"/>`).join('');
}
function mouth(a){
 if(a.mask)return `<path d="M58 104 Q100 96 142 104 L140 126 Q100 140 60 126 Z" fill="${a.acc}" ${S(5)}/><path d="M70 112 h60" stroke="#fff5" stroke-width="3"/>`;
 if(a.eyes==='calm')return `<path d="M90 118 q10 6 20 0" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
 return `<path d="M84 112 Q100 130 118 112 Z" fill="#7a1530" ${S(4)}/><path d="M88 113 h26 v4 h-26z" fill="#fff"/>`;
}
function avatarSVG(a,opt={}){
 const id='g'+a.id+(opt.k||'');
 return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="ava${opt.locked?' locked':''}" role="img" aria-label="${a.nom}">
 <defs><radialGradient id="${id}" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
 <path d="M24 200 Q24 146 100 142 Q176 146 176 200 Z" fill="${a.shirt}" ${S()}/>
 <path d="M76 146 L100 170 L124 146" fill="none" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>
 <rect x="50" y="46" width="100" height="96" rx="40" fill="${a.skin}" ${S()}/>
 <ellipse cx="66" cy="112" rx="9" ry="6" fill="#ff7a9c55"/><ellipse cx="134" cy="112" rx="9" ry="6" fill="#ff7a9c55"/>
 <rect x="50" y="46" width="100" height="96" rx="40" fill="url(#${id})"/>
 ${HEADS[a.head](a)}${eyes(a)}${mouth(a)}${(ITEMS[a.item]||ITEMS.none)(a.item_c)}
</svg>`}

/* ── Niveaux ── */
const NIVEAUX=[
 {id:'bronze',nom:'Bronze',c1:'#ffb27a',c2:'#a85a24'},
 {id:'argent',nom:'Argent',c1:'#f1f4ff',c2:'#8a93b8'},
 {id:'or',    nom:'Or',    c1:'#fff27a',c2:'#d99a00'},
 {id:'star',  nom:'Star',  c1:'#ffe14a',c2:'#ff3df2'}
];
function badgeSVG(i,size){const n=NIVEAUX[i],g='bd'+i+Math.random().toString(36).slice(2,6);
 const inner=i===3?`<path d="M50 24 l7.6 15.8 17.4 2.2 -12.8 12 3.3 17.2 -15.5 -8.4 -15.5 8.4 3.3 -17.2 -12.8 -12 17.4 -2.2z" fill="#fff" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/>`
  :`<text x="50" y="66" text-anchor="middle" font-family="'Lilita One','Arial Black',sans-serif" font-size="38" fill="#fff" stroke="${OL}" stroke-width="3" paint-order="stroke">${'I'.repeat(i+1)}</text>`;
 return `<svg viewBox="0 0 100 110" width="${size||48}" height="${(size||48)*1.1}" xmlns="http://www.w3.org/2000/svg" class="badge" aria-label="Niveau ${n.nom}"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${n.c1}"/><stop offset="1" stop-color="${n.c2}"/></linearGradient></defs>
 <path d="M50 4 L92 20 L88 66 Q82 92 50 106 Q18 92 12 66 L8 20 Z" fill="url(#${g})" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/>
 <path d="M50 14 L82 26 L79 62 Q74 82 50 94" fill="none" stroke="#fff7" stroke-width="4" stroke-linecap="round"/>${inner}</svg>`}

/* ── Logo Ball Star (étoile + balle) ── */
function logoSVG(size){return `<svg viewBox="0 0 120 120" width="${size||56}" height="${size||56}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe14a"/><stop offset="1" stop-color="#ff9d00"/></linearGradient><radialGradient id="lg2" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#d9c4ff"/><stop offset="1" stop-color="#6a2cff"/></radialGradient></defs>
 <path d="M60 6 l15.5 32.5 35.5 4.5 -26 24.5 6.6 35 -31.6 -17.2 -31.6 17.2 6.6 -35 -26 -24.5 35.5 -4.5z" fill="url(#lg1)" stroke="${OL}" stroke-width="7" stroke-linejoin="round"/>
 <circle cx="60" cy="64" r="21" fill="url(#lg2)" stroke="${OL}" stroke-width="6"/><path d="M42 58 q18 10 36 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="52" cy="56" r="4" fill="#fff9"/></svg>`}

window.BSART={AVATARS,NIVEAUX,avatarSVG,badgeSVG,logoSVG};
})();
