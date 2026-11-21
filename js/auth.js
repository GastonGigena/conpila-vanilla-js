/**
 * Módulo de autenticación de ConPila
 */
import { UserRepository } from './repositories/userRepository.js';

export function updateNavbarUser() {
  const userRepo = new UserRepository();
  const currentUser = userRepo.getCurrentUser();
  if (!currentUser) return;

  const currentAvatar = (currentUser.avatar && currentUser.avatar.trim() !== '')
    ? currentUser.avatar
    : 'images/user-solid.png';

  // Actualizar avatar en la barra de navegación (menú lateral e inferior)
  const navbarAvatars = document.querySelectorAll('.avatar-navbar');
  navbarAvatars.forEach(img => {
    img.src = currentAvatar;
    img.alt = `Foto de perfil de ${currentUser.name}`;
  });

  // Actualizar avatar en las cajas de comentarios
  const commentAvatars = document.querySelectorAll('.comment-input .avatar-comment');
  commentAvatars.forEach(img => {
    img.src = currentAvatar;
    img.alt = `Foto de perfil de ${currentUser.name}`;
  });
}

export function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token || token === 'undefined' || token === '') {
    window.location.href = 'index.html';
    return false;
  }
  // Sincronizar automáticamente el avatar del usuario en el navbar
  updateNavbarUser();
  return true;
}

export function logout() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

/**
 * Función de utilidad para consola (modo de pruebas del desarrollador)
 * Permite reiniciar los datos ejecutando resetConPila() en la consola
 */
export function resetAppData() {
  const confirmed = window.confirm('¿Deseas restablecer todos los datos de ConPila y borrar la caché local para comenzar desde cero?');
  if (confirmed) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'index.html';
  }
}

// Exponer funciones globales accesibles desde la consola del navegador
if (typeof window !== 'undefined') {
  window.resetConPila = resetAppData;
  window.clearCache = resetAppData;
}

export function initLogoutButtons() {
  const logoutButtons = document.querySelectorAll('.action-logout, [data-action="logout"]');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });
}


