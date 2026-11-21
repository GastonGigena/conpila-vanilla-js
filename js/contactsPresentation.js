import { checkAuth, initLogoutButtons, updateNavbarUser } from './auth.js';
import { ContactRepository } from './repositories/contactRepository.js';
import { UserRepository } from './repositories/userRepository.js';
import { PostRepository } from './repositories/postRepository.js';
import { showToast } from './utils/domUtils.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Proteger ruta
  if (!checkAuth()) return;
  initLogoutButtons();
  updateNavbarUser();

  const userRepo = new UserRepository();
  const contactRepo = new ContactRepository();
  const postRepo = new PostRepository();
  let currentFilter = 'all'; // Estado para mantener el filtro activo: 'all', 'following', 'followers'

  // 2. Cargar datos del usuario en el header del perfil
  const userInfoContainer = document.querySelector('.profile-header');
  const renderUserProfileHeader = () => {
    const currentUser = userRepo.getCurrentUser();
    if (userInfoContainer && currentUser) {
      userInfoContainer.innerHTML = currentUser.getUserPresentation();
    }
    updateNavbarUser();
  };
  renderUserProfileHeader();

  // Actualizar banner de seguidores
  const updateBanner = () => {
    const user = userRepo.getCurrentUser();
    const counters = document.querySelectorAll('.followers-counter');
    if (counters.length >= 2) {
      const num1 = counters[0].querySelector('.number-of-followers');
      const num2 = counters[1].querySelector('.number-of-followers');
      if (num1) num1.innerHTML = `<i class="fa-solid fa-user"></i> ${user.followingCount}`;
      if (num2) num2.innerHTML = `<i class="fa-solid fa-user"></i> ${user.followersCount}`;
    }
  };
  updateBanner();

  // Modal para Editar Perfil (si se abre desde contacts.html)
  const editProfileModal = document.getElementById('editProfileModal');
  const editProfileForm = document.getElementById('editProfileForm');
  const editNameInput = document.getElementById('edit-name-input');
  const editBioInput = document.getElementById('edit-bio-input');
  const editAvatarTrigger = document.getElementById('edit-avatar-trigger');
  const editAvatarFileInput = document.getElementById('edit-avatar-file');
  const editAvatarPreview = document.getElementById('edit-avatar-preview');

  let newAvatarDataUrl = '';

  if (editProfileModal) {
    editProfileModal.addEventListener('show.bs.modal', () => {
      const user = userRepo.getCurrentUser();
      if (editNameInput) editNameInput.value = user.name;
      if (editBioInput) editBioInput.value = user.bio;
      if (editAvatarPreview) editAvatarPreview.src = user.avatar;
      newAvatarDataUrl = user.avatar;
    });
  }

  if (editAvatarTrigger && editAvatarFileInput) {
    editAvatarTrigger.addEventListener('click', () => {
      editAvatarFileInput.click();
    });

    editAvatarFileInput.addEventListener('change', () => {
      const file = editAvatarFileInput.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newAvatarDataUrl = e.target?.result || '';
          if (editAvatarPreview) {
            editAvatarPreview.src = newAvatarDataUrl;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (editProfileForm) {
    editProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedName = editNameInput?.value.trim();
      const updatedBio = editBioInput?.value.trim() || '';

      if (!updatedName) {
        showToast('Por favor ingresa tu nombre.', 'warning');
        return;
      }

      const currentUser = userRepo.getCurrentUser();
      const finalAvatar = newAvatarDataUrl || currentUser.avatar;

      // 1. Actualizar datos del usuario activo
      userRepo.updateCurrentUser({
        name: updatedName,
        bio: updatedBio,
        avatar: finalAvatar
      });

      // 2. Actualizar avatar y nombre en todas las publicaciones del usuario
      if (typeof postRepo.updateUserPosts === 'function') {
        postRepo.updateUserPosts(currentUser.id, {
          userName: updatedName,
          userAvatar: finalAvatar
        });
      } else {
        // Fallback directo sobre las llaves de LocalStorage habitualmente usadas
        ['conpila_posts', 'posts'].forEach(key => {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const posts = JSON.parse(raw);
              const updatedPosts = posts.map(p => {
                if (String(p.userId) === String(currentUser.id)) {
                  return { ...p, userName: updatedName, userAvatar: finalAvatar };
                }
                return p;
              });
              localStorage.setItem(key, JSON.stringify(updatedPosts));
            } catch (err) {
              console.error(`Error actualizando posts en ${key}:`, err);
            }
          }
        });
      }

      renderUserProfileHeader();
      updateNavbarUser();
      showToast('¡Perfil actualizado con éxito!', 'success');

      if (window.bootstrap?.Modal) {
        const modalInstance = window.bootstrap.Modal.getInstance(editProfileModal);
        modalInstance?.hide();
      } else {
        editProfileModal.classList.remove('show');
        editProfileModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        document.querySelector('.modal-backdrop')?.remove();
      }
    });
  }

  // 3. Renderizar grilla de contactos
  const contactsContainer = document.querySelector('#contacts-container, .following-list');
  const searchInput = document.getElementById('search-input');

  const getFilteredContacts = () => {
    const currentUser = userRepo.getCurrentUser();
    const searchTerm = searchInput?.value.trim() || '';
    let contacts = contactRepo.getAll(currentUser?.id);

    // Aplicar filtro del banner
    if (currentFilter === 'following') {
      contacts = contacts.filter(c => c.isFollowing);
    } else if (currentFilter === 'followers') {
      // Filtrar usuarios que siguen al usuario activo
      const followingMap = contactRepo.getFollowingMap();
      contacts = contacts.filter(c => {
        const userFollows = followingMap[String(c.id)];
        return Array.isArray(userFollows) && userFollows.includes(String(currentUser?.id));
      });
    }

    // Aplicar término de búsqueda si existe
    if (searchTerm) {
      contacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.username && c.username.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return contacts;
  };

  const renderContactsList = () => {
    if (!contactsContainer) return;
    const contacts = getFilteredContacts();

    if (contacts.length === 0) {
      contactsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--cp-grey);">
          <i class="fa-solid fa-user-xmark" style="font-size: 3rem; margin-bottom: 1rem; color: var(--cp-grey);"></i>
          <p>No se encontraron contactos para esta categoría o búsqueda.</p>
        </div>
      `;
      return;
    }

    contactsContainer.innerHTML = contacts
      .map(contact => contact.getContactPresentation())
      .join('');

    // Asignar eventos de Seguir / Dejar de seguir
    const toggleButtons = contactsContainer.querySelectorAll('.action-toggle-follow');
    toggleButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        if (!id) return;

        const isNowFollowing = contactRepo.toggleFollow(id);
        updateBanner();

        btn.classList.toggle('btn-follow', !isNowFollowing);
        btn.classList.toggle('btn-unfollow', isNowFollowing);
        btn.textContent = isNowFollowing ? 'dejar de seguir' : 'seguir';

        showToast(isNowFollowing ? 'Has comenzado a seguir a este usuario' : 'Has dejado de seguir a este usuario', 'info');
        
        // Re-renderizar si estamos filtrando por 'following' para actualizar la vista
        if (currentFilter === 'following') {
          renderContactsList();
        }
      });
    });
  };

  // Event Listeners para las tarjetas de "Seguidos" y "Seguidores" en el banner
  const followerCounters = document.querySelectorAll('.followers-counter');
  if (followerCounters.length >= 2) {
    // Clic en "Seguidos"
    followerCounters[0].addEventListener('click', (e) => {
      e.preventDefault();
      currentFilter = currentFilter === 'following' ? 'all' : 'following';
      renderContactsList();
    });

    // Clic en "Seguidores"
    followerCounters[1].addEventListener('click', (e) => {
      e.preventDefault();
      currentFilter = currentFilter === 'followers' ? 'all' : 'followers';
      renderContactsList();
    });
  }

  // Carga inicial
  renderContactsList();

  // Búsqueda en tiempo real
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderContactsList();
    });
  }

  // Botón "Buscar" en el menú lateral
  const navSearchBtn = document.getElementById('nav-search-btn');
  if (navSearchBtn && searchInput) {
    navSearchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      searchInput.focus();
      const bar = searchInput.closest('.search-bar');
      if (bar) {
        bar.style.boxShadow = '0 0 15px rgba(94, 255, 0, 0.8)';
        setTimeout(() => { bar.style.boxShadow = ''; }, 1500);
      }
    });
  }

  // 4. Modal para Crear Publicación (#createPostModal)
  const createPostModal = document.getElementById('createPostModal');
  if (createPostModal) {
    const publishBtn = createPostModal.querySelector('.cp-btn-submit');
    const titleInput = document.getElementById('post-title-input');
    const bodyInput = document.getElementById('post-body-input');
    const fileInput = document.getElementById('file-upload');
    const previewContainer = document.getElementById('preview-container');

    // Previsualización opcional de la imagen seleccionada
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file && previewContainer) {
          const reader = new FileReader();
          reader.onload = (e) => {
            previewContainer.innerHTML = `<img src="${e.target?.result}" alt="Vista previa" style="max-height: 150px; border-radius: 8px; border: 1px solid var(--cp-border, #333);" />`;
            previewContainer.classList.remove('d-none');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (publishBtn) {
      publishBtn.addEventListener('click', (e) => {
        e.preventDefault();

        const title = titleInput?.value.trim() || '';
        const body = bodyInput?.value.trim() || '';

        if (!title || !body) {
          showToast('Por favor completa el título y el contenido.', 'warning');
          return;
        }

        const currentUser = userRepo.getCurrentUser();

        const saveAndClose = (imageDataUrl = '') => {
          postRepo.create({
            userId: currentUser?.id,
            userName: currentUser?.name || 'Usuario',
            userAvatar: currentUser?.avatar || 'images/user-solid.png',
            title: title,
            body: body,
            image: imageDataUrl
          });

          // Limpiar formulario
          if (titleInput) titleInput.value = '';
          if (bodyInput) bodyInput.value = '';
          if (fileInput) fileInput.value = '';
          if (previewContainer) {
            previewContainer.innerHTML = '';
            previewContainer.classList.add('d-none');
          }

          // Cerrar modal
          if (window.bootstrap?.Modal) {
            const modalInstance = window.bootstrap.Modal.getInstance(createPostModal) || new window.bootstrap.Modal(createPostModal);
            modalInstance.hide();
          } else {
            createPostModal.classList.remove('show');
            createPostModal.style.display = 'none';
          }

          document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
          document.body.classList.remove('modal-open');
          document.body.style.removeProperty('padding-right');
          document.body.style.removeProperty('overflow');

          showToast('¡Publicación creada exitosamente!', 'success');
        };

        const file = fileInput?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => saveAndClose(evt.target?.result || '');
          reader.readAsDataURL(file);
        } else {
          saveAndClose('');
        }
      });
    }
  }
});