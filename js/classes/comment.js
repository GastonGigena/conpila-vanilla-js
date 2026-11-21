import { escapeHTML } from '../utils/domUtils.js';

export class Comment {
  constructor(element = {}) {
    this.id = String(element.id);
    this.postId = String(element.postId);
    this.userName = element.userName || 'Usuario';
    let avatar = element.userAvatar;
    if (!avatar || avatar.trim() === '') {
      avatar = 'images/user-solid.png';
    }
    this.userAvatar = avatar;
    this.date = element.date || 'Hace un momento';
    this.createdAt = element.createdAt || null;
    this.text = element.text || '';
  }

  getRelativeDate() {
    const legacyTimestamp = /^c\d{13}$/.test(this.id) ? this.id.slice(1) : null;
    const dateValue = this.createdAt || legacyTimestamp;
    const timestamp = typeof dateValue === 'number'
      ? dateValue
      : /^\d{13}$/.test(dateValue || '')
        ? Number(dateValue)
        : Date.parse(dateValue || '');
    if (!Number.isFinite(timestamp)) return this.date;

    const elapsedMinutes = Math.floor(Math.max(0, Date.now() - timestamp) / 60000);
    if (elapsedMinutes < 1) return 'Hace un momento';
    if (elapsedMinutes < 60) {
      return `Hace ${elapsedMinutes} ${elapsedMinutes === 1 ? 'minuto' : 'minutos'}`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
      return `Hace ${elapsedHours} ${elapsedHours === 1 ? 'hora' : 'horas'}`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    return `Hace ${elapsedDays} ${elapsedDays === 1 ? 'día' : 'días'}`;
  }

  getCommentPresentation() {
    return `
      <section class="card-comment" data-comment-id="${escapeHTML(this.id)}">
        <div class="user-img-name-date">
          <img
            class="profile-avatar avatar-comment"
            src="${escapeHTML(this.userAvatar)}"
            alt="Foto de perfil de ${escapeHTML(this.userName)}"
          />
          <div class="post-user-info user-row">
            <h4 class="user-name">${escapeHTML(this.userName)}</h4>
            <span class="publication-date">${escapeHTML(this.getRelativeDate())}</span>
          </div>
        </div>
        <p class="text-comment">${escapeHTML(this.text)}</p>
      </section>
    `;
  }
}
