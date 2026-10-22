/**
 * Ilustraciones de BULK para las piezas de Instagram (estilo sticker: plano, contorno negro grueso).
 * Uso en una pieza:  <svg class="il" viewBox="0 0 200 200" width="180"><use href="#il-carne"/></svg>
 * Todas están dibujadas en una caja de 200×200.
 */
const K = '#0a0a0a';
const s = `stroke="${K}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"`;

const ILUSTRACIONES = {
  // cucharita medidora con polvo
  scoop: `
    <rect x="104" y="92" width="92" height="20" rx="10" fill="#f3f3ef" ${s}/>
    <path d="M14 96 h104 l-10 62 a12 12 0 0 1 -12 10 h-60 a12 12 0 0 1 -12 -10 z" fill="#f3f3ef" ${s}/>
    <path d="M12 98 c8 -34 30 -50 54 -50 s46 16 54 50 z" fill="#ffffff" ${s}/>
    <path d="M40 78 q10 -12 24 -13" fill="none" stroke="#d9d9d2" stroke-width="6" stroke-linecap="round"/>
    <circle cx="150" cy="146" r="5" fill="#fff"/><circle cx="168" cy="164" r="3.5" fill="#fff"/><circle cx="140" cy="170" r="3" fill="#fff"/>`,

  carne: `
    <path d="M24 104 C20 60 60 34 104 38 C150 42 184 62 178 104 C174 140 146 162 112 158 C92 156 84 142 66 146 C40 152 26 134 24 104 Z" fill="#d9413a" ${s}/>
    <path d="M46 86 C58 62 90 54 122 58" fill="none" stroke="#f7dccf" stroke-width="13" stroke-linecap="round"/>
    <path d="M68 114 l24 -10 M104 128 l28 -12 M120 94 l26 -8 M148 116 l12 -6" fill="none" stroke="#f2a199" stroke-width="6" stroke-linecap="round"/>`,

  leche: `
    <path d="M78 22 h44 v34 c0 14 26 22 26 48 v66 a14 14 0 0 1 -14 14 h-68 a14 14 0 0 1 -14 -14 v-66 c0 -26 26 -34 26 -48 z" fill="#ffffff" ${s}/>
    <path d="M56 104 q22 -12 44 0 t44 0 v66 a12 12 0 0 1 -12 12 h-64 a12 12 0 0 1 -12 -12 z" fill="#e9e9e2"/>
    <rect x="72" y="12" width="56" height="20" rx="6" fill="#c8ff00" ${s}/>
    <path d="M72 124 v36" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,

  pollo: `
    <path d="M100 20 c38 0 70 36 66 84 c-4 44 -30 78 -66 78 c-34 0 -62 -30 -66 -76 c-4 -50 28 -86 66 -86 z" fill="#f6b8a6" ${s}/>
    <path d="M70 74 c8 -22 24 -32 40 -32" fill="none" stroke="#fde0d6" stroke-width="9" stroke-linecap="round"/>
    <path d="M96 150 c22 -6 36 -24 40 -48" fill="none" stroke="#e8998a" stroke-width="7" stroke-linecap="round"/>`,

  cerdo: `
    <path d="M26 88 c4 -40 44 -58 86 -54 c40 4 66 30 62 64 c-4 38 -36 66 -78 66 c-30 0 -40 -14 -52 -30 c-10 -14 -20 -26 -18 -46 z" fill="#fbe9df" ${s}/>
    <path d="M50 92 c4 -26 32 -40 62 -38 c28 2 46 20 44 44 c-2 26 -26 46 -56 46 c-20 0 -30 -8 -38 -20 c-8 -10 -14 -18 -12 -32 z" fill="#ee9590"/>
    <path d="M22 132 c-8 14 2 30 18 26 c6 14 26 12 28 -4 l-22 -34 z" fill="#f3f3ef" ${s}/>
    <path d="M86 84 q16 -10 34 -4" fill="none" stroke="#f9c3bd" stroke-width="6" stroke-linecap="round"/>`,

  salmon: `
    <path d="M20 118 c20 -56 70 -84 150 -80 c14 0 18 12 10 24 c-30 50 -78 86 -146 90 c-14 0 -20 -16 -14 -34 z" fill="#ff8a4c" ${s}/>
    <path d="M24 146 c66 -4 120 -42 152 -90" fill="none" stroke="#9aa3a8" stroke-width="9" stroke-linecap="round"/>
    <path d="M60 78 q14 24 6 54 M92 58 q16 26 8 62 M126 46 q14 22 8 52" fill="none" stroke="#ffd2b8" stroke-width="6" stroke-linecap="round"/>`,

  // shaker: el líquido toma el color de --liq (definilo en el <svg>)
  shaker: `
    <path d="M52 62 h96 l-10 114 a12 12 0 0 1 -12 10 h-52 a12 12 0 0 1 -12 -10 z" fill="#dfe5e2" ${s}/>
    <path d="M58 100 q21 -10 42 0 t42 0 l-7 74 a8 8 0 0 1 -8 7 h-54 a8 8 0 0 1 -8 -7 z" fill="var(--liq, #8fdcff)"/>
    <path d="M72 118 v40" stroke="#ffffff" stroke-opacity="0.75" stroke-width="6" stroke-linecap="round"/>
    <path d="M52 62 h96 l-10 114 a12 12 0 0 1 -12 10 h-52 a12 12 0 0 1 -12 -10 z" fill="none" ${s}/>
    <path d="M84 42 v-14 a8 8 0 0 1 8 -8 h16 a8 8 0 0 1 8 8 v14" fill="#f3f3ef" ${s}/>
    <rect x="42" y="40" width="116" height="26" rx="8" fill="#2a2a2a" ${s}/>
    <rect x="42" y="40" width="116" height="26" rx="8" fill="none" stroke="#f3f3ef" stroke-width="2.5"/>`,
};

const defs = Object.entries(ILUSTRACIONES)
  .map(([id, d]) => `<symbol id="il-${id}" viewBox="0 0 200 200">${d}</symbol>`)
  .join('');
document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute">${defs}</svg>`);

// Reels: el exportador llama a esto para ir a un instante exacto (ms)
window.irA = (ms) => {
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; }
};
