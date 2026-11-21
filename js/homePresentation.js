import { checkAuth, initLogoutButtons, updateNavbarUser } from './auth.js';
import { PostRepository } from './repositories/postRepository.js';
import { UserRepository } from './repositories/userRepository.js';
import { showToast } from './utils/domUtils.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Proteger ruta
  if (!checkAuth()) return;
  initLogoutButtons();
  updateNavbarUser();

  const userRepo = new UserRepository();
  const postRepo = new PostRepository();
  const feedContainer = document.querySelector('#grid-section-user-posts');

  // Actualizar banner de seguidores y avatar del navbar
  const updateUserInfo = () => {
    const currentUser = userRepo.getCurrentUser();
    const counters = document.querySelectorAll('.followers-counter');
    if (counters.length >= 2) {
      const num1 = counters[0].querySelector('.number-of-followers');
      const num2 = counters[1].querySelector('.number-of-followers');
      if (num1) num1.innerHTML = `<i class="fa-solid fa-user"></i> ${currentUser.followingCount}`;
      if (num2) num2.innerHTML = `<i class="fa-solid fa-user"></i> ${currentUser.followersCount}`;
    }
    updateNavbarUser();
  };
  updateUserInfo();

  // Renderizar publicaciones
  const renderPosts = (posts = postRepo.getAll()) => {
    if (!feedContainer) return;

    if (posts.length === 0) {
      feedContainer.innerHTML = `
        <div class="card-post text-center p-4">
          <i class="fa-solid fa-magnifying-glass mb-2" style="font-size: 2.5rem; color: var(--cp-grey);"></i>
          <p style="color: var(--cp-grey);">No se encontraron publicaciones que coincidan con la búsqueda.</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = posts
      .map(post => post.getPostPresentation())
      .join('');

    posts.forEach(post => {
      const postElement = feedContainer.querySelector(`[data-post-id="${post.id}"]`);
      if (postElement) {
        post.initCommentEvents(postElement);
        post.initReactionEvents(postElement, (updatedPost) => {
          postRepo.update(updatedPost);
        });
      }
    });

    updateNavbarUser();
  };

  renderPosts();

  // Buscador de Publicaciones
  const searchInput = document.getElementById('post-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      const filtered = postRepo.search(query);
      renderPosts(filtered);
    });
  }

  // Botón "Buscar" en el menú lateral izquierdo
  const navSearchBtn = document.getElementById('nav-search-btn');
  if (navSearchBtn) {
    navSearchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (searchInput) {
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        searchInput.focus();
        const searchBar = searchInput.closest('.search-bar');
        if (searchBar) {
          searchBar.style.boxShadow = '0 0 15px rgba(94, 255, 0, 0.8)';
          setTimeout(() => {
            searchBar.style.boxShadow = '';
          }, 1500);
        }
      }
    });
  }

  // Modal para Crear Publicación
  const modalElement = document.getElementById('createPostModal');
  if (modalElement) {
    let isCreateModalShown = false;
    let closeAfterModalShown = false;

    modalElement.addEventListener('shown.bs.modal', () => {
      isCreateModalShown = true;
      if (closeAfterModalShown) {
        closeAfterModalShown = false;
        window.bootstrap?.Modal.getInstance(modalElement)?.hide();
      }
    });
    modalElement.addEventListener('hidden.bs.modal', () => {
      isCreateModalShown = false;
    });

    const titleInput = modalElement.querySelector('input[placeholder="Escribe tu título"]');
    const bodyInput = modalElement.querySelector('textarea[placeholder="¿Qué quieres compartir?"]');
    const fileInput = modalElement.querySelector('#file-upload');
    const previewContainer = document.getElementById('preview-container');
    const submitBtn = modalElement.querySelector('.cp-btn-submit');

    let currentImageDataUrl = '';

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            currentImageDataUrl = e.target?.result || '';
            if (previewContainer) {
              previewContainer.innerHTML = `
                <div class="position-relative d-inline-block">
                  <img src="${currentImageDataUrl}" alt="Previsualización" class="img-fluid rounded border" style="max-height: 180px; border-color: var(--cp-border) !important;" />
                  <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" id="btn-remove-preview" title="Quitar imagen">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                </div>
              `;
              previewContainer.classList.remove('d-none');
              const removeBtn = document.getElementById('btn-remove-preview');
              removeBtn?.addEventListener('click', () => {
                currentImageDataUrl = '';
                fileInput.value = '';
                previewContainer.innerHTML = '';
                previewContainer.classList.add('d-none');
              });
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const title = titleInput?.value.trim();
        const body = bodyInput?.value.trim();

        if (!title || !body) {
          showToast('Por favor completa el título y el cuerpo de la publicación.', 'warning');
          return;
        }

        const currentUser = userRepo.getCurrentUser();
        try {
          postRepo.create({
            title,
            body,
            image: currentImageDataUrl,
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar
          });
        } catch (error) {
          console.error('Error al guardar la publicación:', error);
          const storageIsFull = error instanceof DOMException && error.name === 'QuotaExceededError';
          showToast(
            storageIsFull
              ? 'No hay espacio suficiente en el almacenamiento del navegador. Prueba con imágenes más pequeñas.'
              : 'No se pudo guardar la publicación. Inténtalo nuevamente.',
            'warning'
          );
          return;
        }

        // Limpiar inputs
        if (titleInput) titleInput.value = '';
        if (bodyInput) bodyInput.value = '';
        if (fileInput) fileInput.value = '';
        currentImageDataUrl = '';
        if (previewContainer) {
          previewContainer.innerHTML = '';
          previewContainer.classList.add('d-none');
        }

        // Cerrar modal usando API Bootstrap o clase hide
        if (window.bootstrap?.Modal) {
          const modalInstance = window.bootstrap.Modal.getInstance(modalElement) || new window.bootstrap.Modal(modalElement);
          if (isCreateModalShown) {
            modalInstance.hide();
          } else {
            closeAfterModalShown = true;
          }
        } else {
          modalElement.classList.remove('show');
          modalElement.style.display = 'none';
          document.body.classList.remove('modal-open');
          document.querySelector('.modal-backdrop')?.remove();
        }

        showToast('¡Publicación creada exitosamente!', 'success');
        renderPosts();
      });
    }
  }
});
