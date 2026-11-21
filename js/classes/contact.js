import { escapeHTML } from '../utils/domUtils.js';

export class Contact {
  constructor(element = {}) {
    this.id = String(element.id);
    this.name = element.name || 'Usuario';
    let avatar = element.avatar;
    if (!avatar || avatar.trim() === '') {
      avatar = 'images/user-solid.png';
    }
    this.avatar = avatar;
    this.username = element.username || '';
    this.bio = element.bio || '';
    this.followersCount = element.followersCount !== undefined ? Number(element.followersCount) : null;
    this.followingCount = element.followingCount !== undefined ? Number(element.followingCount) : null;
    this.isFollowing = element.isFollowing !== undefined ? Boolean(element.isFollowing) : false;
    this.isRegisteredUser = Boolean(element.isRegisteredUser);
  }

  getContactPresentation() {
    const btnClass = this.isFollowing ? 'btn-unfollow' : 'btn-follow';
    const btnText = this.isFollowing ? 'dejar de seguir' : 'seguir';

    return `
      <div class="user-card card-post" data-contact-id="${escapeHTML(this.id)}">
        <a href="profile.html?id=${escapeHTML(this.id)}" class="user-img-name text-decoration-none text-reset" title="Ver perfil de ${escapeHTML(this.name)}">
          <img class="profile-avatar avatar-user-card" src="${escapeHTML(this.avatar)}" alt="foto de perfil de ${escapeHTML(this.name)}" />
          <h4 class="user-name">${escapeHTML(this.name)}</h4>
          ${this.username ? `<span class="contact-username" style="font-size: 0.8rem; opacity: 0.7; margin-top: -0.2rem; margin-bottom: 0.4rem;">@${escapeHTML(this.username)}</span>` : ''}
        </a>
        <button type="button" class="${btnClass} action-toggle-follow" data-id="${escapeHTML(this.id)}">${btnText}</button>
      </div>
    `;
  }
}