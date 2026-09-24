// Utilidades de navegador compartidas.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

let toastTimer;
export function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add('is-on'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
}

/** Abre un <dialog> como modal y bloquea el scroll del fondo */
export function abrirDialogo(d) {
  if (!d || d.open) return;
  d.showModal();
  document.documentElement.style.overflow = 'hidden';
  d.addEventListener('close', () => { document.documentElement.style.overflow = ''; }, { once: true });
}

/** Cierra el diálogo al hacer click en el fondo */
export function cerrarConFondo(d) {
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
}
