import { escapeHTML } from '../utils/domUtils.js';
import { CommentRepository } from '../repositories/commentRepository.js';
import { UserRepository } from '../repositories/userRepository.js';

export class Post {
  constructor(element = {}) {
    this.id = String(element.id);
    this.userId = element.userId ? String(element.userId) : null;
    this.userName = element.userName || 'Usuario';
    this.userAvatar = element.userAvatar || 'images/user-solid.png';
    this.date = element.date || 'Hace un momento';
    this.createdAt = element.createdAt || null;
    this.title = element.title || '';
    this.body = element.body || '';
    this.image = element.image || '';

    // Mapa de reacciones por usuario: { "usr_001": "like", "usr_002": "dislike" }
    this.reactions = element.reactions && typeof element.reactions === 'object' ? element.reactions : {};

    // Métodos de conteo basados en el mapa de reacciones
    this.likes = Number(element.likes) || this._countReactions('like');
    this.dislikes = Number(element.dislikes) || this._countReactions('dislike');
    this.isUserSolid = Boolean(element.isUserSolid);
  }

  _countReactions(type) {
    return Object.values(this.reactions).filter(r => r === type).length;
  }

  getRelativeDate() {
    const legacyTimestamp = /^\d{13}$/.test(this.id) ? this.id : null;
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

  getPostPresentation() {
    const avatarClass = this.isUserSolid ? 'profile-avatar avatar-post user-solid' : 'profile-avatar avatar-post';
    const imageHTML = this.image
      ? `<div class="img-post-container"><img class="img-post" alt="imagen de publicación" src="${escapeHTML(this.image)}" /></div>`
      : '';

    const isLongBody = this.body.length > 180;
    const shortBody = isLongBody ? this.body.slice(0, 180) + '...' : this.body;
    const seeMoreHTML = isLongBody
      ? `<div class="see-more-container"><button class="see-more-button" data-expanded="false">Ver más</button></div>`
      : '';

    let currentUserId = null;
    let currentAvatar = 'images/user-solid.png';
    let currentName = 'Usuario';
    try {
      const userRepo = new UserRepository();
      const currentUser = userRepo.getCurrentUser();
      if (currentUser?.id) currentUserId = String(currentUser.id);
      if (currentUser?.avatar && currentUser.avatar.trim() !== '') currentAvatar = currentUser.avatar;
      if (currentUser?.name) currentName = currentUser.name;
    } catch {}

    const userReaction = currentUserId ? this.reactions[currentUserId] : null;
    const likesCount = this._countReactions('like');
    const dislikesCount = this._countReactions('dislike');
    const totalVotes = likesCount + dislikesCount;
    const likePercent = totalVotes > 0 ? Math.round((likesCount / totalVotes) * 100) : 50;

    return `
      <article class="card-post" data-post-id="${escapeHTML(this.id)}">
        <section>
          <!-- Contenedor estático sin enlace de redirección al perfil -->
          <div class="user-img-name-date">
            <img class="${avatarClass}" src="${escapeHTML(this.userAvatar)}" alt="foto de perfil de ${escapeHTML(this.userName)}" />
            <div class="post-user-info user-row">
              <h3 class="user-name">${escapeHTML(this.userName)}</h3>
              <h4 class="publication-date">${escapeHTML(this.getRelativeDate())}</h4>
            </div>
          </div>

          <div class="post-title">
            <h2>${escapeHTML(this.title)}</h2>
          </div>

          <div class="post-text">
            <div>
              <p class="post-body-text" data-full-text="${escapeHTML(this.body)}" data-short-text="${escapeHTML(shortBody)}">${escapeHTML(shortBody)}</p>
            </div>
            ${seeMoreHTML}
            ${imageHTML}
          </div>
        </section>

        <section>
          <div class="reactions">
            <button class="reaction-like ${userReaction === 'like' ? 'active' : ''}" type="button" aria-label="Me gusta">
              <i class="fa-regular fa-thumbs-up"></i>
              <p>${likesCount}</p>
            </button>
            <div class="power-bar">
              <div class="power-bar-fill" style="width: ${likePercent}%"></div>
            </div>
            <button class="reaction-dislike ${userReaction === 'dislike' ? 'active' : ''}" type="button" aria-label="No me gusta">
              <i class="fa-regular fa-thumbs-down"></i>
              <p>${dislikesCount}</p>
            </button>
          </div>
        </section>

        <section>
          <h3>Comentarios</h3>
          <section class="comment-input">
            <img class="profile-avatar avatar-comment" src="${escapeHTML(currentAvatar)}" alt="Foto de perfil de ${escapeHTML(currentName)}" />
            <div class="input-group">
              <input type="text" placeholder="Escribe un comentario..." />
              <button type="button" class="btn-send-comment" aria-label="Enviar comentario">
                <i class="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </section>
          <section class="comments" id="comments-container-${escapeHTML(this.id)}">
            <!-- Carga dinámica -->
          </section>
        </section>
      </article>
    `;
  }

  initCommentEvents(postElement) {
    const commentRepo = new CommentRepository();
    const commentContainer = postElement.querySelector(`#comments-container-${this.id}`);
    const commentInput = postElement.querySelector('.comment-input input');
    const commentButton = postElement.querySelector('.btn-send-comment');

    const renderComments = () => {
      if (!commentContainer) return;
      const comments = commentRepo.getByPostId(this.id);
      commentContainer.innerHTML = comments
        .map(c => c.getCommentPresentation())
        .join('');
    };

    const handleAddComment = () => {
      const text = commentInput?.value.trim();
      if (!text) return;

      let currentUserName = 'Usuario';
      let currentUserAvatar = 'images/user-solid.png';
      try {
        const userRepo = new UserRepository();
        const currentUser = userRepo.getCurrentUser();
        if (currentUser?.name) currentUserName = currentUser.name;
        if (currentUser?.avatar && currentUser.avatar.trim() !== '') {
          currentUserAvatar = currentUser.avatar;
        }
      } catch {}

      commentRepo.create({
        postId: this.id,
        userName: currentUserName,
        userAvatar: currentUserAvatar,
        text: text
      });

      if (commentInput) commentInput.value = '';
      renderComments();
    };

    if (commentButton) {
      commentButton.addEventListener('click', (e) => {
        e.preventDefault();
        handleAddComment();
      });
    }

    if (commentInput) {
      commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddComment();
        }
      });
    }

    renderComments();
  }

  initReactionEvents(postElement, onReactionUpdate) {
    const likeBtn = postElement.querySelector('.reaction-like');
    const dislikeBtn = postElement.querySelector('.reaction-dislike');
    const likeCountP = likeBtn?.querySelector('p');
    const dislikeCountP = dislikeBtn?.querySelector('p');
    const fillEl = postElement.querySelector('.power-bar-fill');

    let currentUserId = 'guest';
    try {
      const userRepo = new UserRepository();
      const currentUser = userRepo.getCurrentUser();
      if (currentUser?.id) currentUserId = String(currentUser.id);
    } catch {}

    const updateUI = () => {
      const likes = this._countReactions('like');
      const dislikes = this._countReactions('dislike');
      const total = likes + dislikes;
      const likePct = total > 0 ? Math.round((likes / total) * 100) : 50;

      if (likeCountP) likeCountP.textContent = String(likes);
      if (dislikeCountP) dislikeCountP.textContent = String(dislikes);
      if (fillEl) fillEl.style.width = `${likePct}%`;

      const currentReaction = this.reactions[currentUserId];
      likeBtn?.classList.toggle('active', currentReaction === 'like');
      dislikeBtn?.classList.toggle('active', currentReaction === 'dislike');
    };

    if (likeBtn) {
      likeBtn.addEventListener('click', () => {
        if (this.reactions[currentUserId] === 'like') {
          delete this.reactions[currentUserId];
        } else {
          this.reactions[currentUserId] = 'like';
        }
        updateUI();
        if (typeof onReactionUpdate === 'function') {
          onReactionUpdate(this);
        }
      });
    }

    if (dislikeBtn) {
      dislikeBtn.addEventListener('click', () => {
        if (this.reactions[currentUserId] === 'dislike') {
          delete this.reactions[currentUserId];
        } else {
          this.reactions[currentUserId] = 'dislike';
        }
        updateUI();
        if (typeof onReactionUpdate === 'function') {
          onReactionUpdate(this);
        }
      });
    }

    const seeMoreBtn = postElement.querySelector('.see-more-button');
    const bodyTextEl = postElement.querySelector('.post-body-text');
    if (seeMoreBtn && bodyTextEl) {
      seeMoreBtn.addEventListener('click', () => {
        const isExpanded = seeMoreBtn.getAttribute('data-expanded') === 'true';
        if (isExpanded) {
          bodyTextEl.textContent = bodyTextEl.getAttribute('data-short-text') || '';
          seeMoreBtn.textContent = 'Ver más';
          seeMoreBtn.setAttribute('data-expanded', 'false');
        } else {
          bodyTextEl.textContent = bodyTextEl.getAttribute('data-full-text') || '';
          seeMoreBtn.textContent = 'Ver menos';
          seeMoreBtn.setAttribute('data-expanded', 'true');
        }
      });
    }
  }
}