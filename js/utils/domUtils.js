/**
 * Utilidades DOM y sanitización XSS para ConPila
 */

/**
 * Escapa caracteres HTML peligrosos para prevenir ataques Cross-Site Scripting (XSS).
 * @param {string} str 
 * @returns {string}
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Muestra una notificación flotante estilo Toast.
 * @param {string} message 
 * @param {'success'|'info'|'warning'} type 
 */
export function showToast(message, type = 'info') {
  const existing = document.querySelector('.conpila-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'conpila-toast';
  const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHTML(message)}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
