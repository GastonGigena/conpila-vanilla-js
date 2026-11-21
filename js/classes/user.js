import { escapeHTML } from '../utils/domUtils.js';

export class User {
  constructor(element = {}) {
    this.id = element.id || 'usr_' + Date.now();
    this.name = element.name || 'Usuario';
    let avatar = element.avatar;
    if (!avatar || avatar.trim() === '') {
      avatar = 'images/user-solid.png';
    }
    this.avatar = avatar;
    this.bio = element.bio || 'Miembro de ConPila. ¡Hola a toda la comunidad tech!';
    this.followersCount = element.followersCount !== undefined ? Number(element.followersCount) : 0;
    this.followingCount = element.followingCount !== undefined ? Number(element.followingCount) : 0;
    this.email = element.email || '';
    this.username = element.username || '';
    this.theme = element.theme === 'light' ? 'light' : 'dark';
  }

  getUserPresentation() {
    return `
      <div class="profile-avatar-large">
        <img id="user-profile-avatar" class="profile-avatar avatar-profile" src="${escapeHTML(this.avatar)}" alt="Foto de perfil de ${escapeHTML(this.name)}" />
      </div>
      <h2 class="user-name mt-3" id="user-profile-name">${escapeHTML(this.name)}</h2>
      <p class="user-bio" id="user-profile-bio">${escapeHTML(this.bio)}</p>
      <div class="mt-3">
        <button type="button" class="btn cp-btn-submit px-4 py-2 rounded-2" id="btn-open-edit-profile" data-bs-toggle="modal" data-bs-target="#editProfileModal">
          <i class="fa-solid fa-pen-to-square me-2"></i> Editar perfil
        </button>
      </div>
    `;
  }
}
