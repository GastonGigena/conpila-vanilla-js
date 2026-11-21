import { checkAuth, initLogoutButtons, updateNavbarUser } from './auth.js';
import { UserRepository } from './repositories/userRepository.js';
import { PostRepository } from './repositories/postRepository.js';
import { showToast } from './utils/domUtils.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Proteger ruta
  if (!checkAuth()) return;
  initLogoutButtons();
  updateNavbarUser();

  const userRepo = new UserRepository();
  const postRepo = new PostRepository();

  // Detectar si venimos a ver el perfil de otro usuario mediante URL query: profile.html?id=XYZ
  const urlParams = new URLSearchParams(window.location.search);
  const targetUserId = urlParams.get('id');
  const loggedUser = userRepo.getCurrentUser();

  // Determinar si es mi propio perfil o el de otro contacto
  const isOwnProfile = !targetUserId || (loggedUser && String(targetUserId) === String(loggedUser.id));

  // Obtener el objeto usuario que se va a renderizar en pantalla
  let profileUser = loggedUser;
  if (!isOwnProfile && targetUserId) {
    if (typeof userRepo.getById === 'function') {
      profileUser = userRepo.getById(targetUserId);
    } else if (typeof userRepo.getRegisteredUsers === 'function') {
      const allUsers = userRepo.getRegisteredUsers() || [];
      profileUser = allUsers.find(u => String(u.id) === String(targetUserId));
    }
  }

  const userInfoContainer = document.querySelector('#grid-section-user-info, .profile-header');
  const userPostsContainer = document.querySelector('#grid-section-user-posts, .posts');

  // Renderizar datos de perfil en el DOM
  const renderUserProfile = () => {
    if (userInfoContainer && profileUser) {
      if (typeof profileUser.getUserPresentation === 'function') {
        userInfoContainer.innerHTML = profileUser.getUserPresentation();
      } else {
        // Fallback en caso de que profileUser sea un objeto plano
        userInfoContainer.innerHTML = `
          <div class="profile-avatar-large">
            <img class="profile-avatar avatar-profile" src="${profileUser.avatar || 'images/user-solid.png'}" alt="${profileUser.name || 'Usuario'}" />
          </div>
          <h2 class="user-name mt-2">${profileUser.name || 'Usuario'}</h2>
          <p class="user-bio">${profileUser.bio || 'Sin biografía'}</p>
        `;
      }

      // Si no es nuestro propio perfil, ocultamos el botón/disparador de editar perfil
      if (!isOwnProfile) {
        const editProfileBtn = userInfoContainer.querySelector('#edit-profile-btn, [data-bs-target="#editProfileModal"]');
        if (editProfileBtn) {
          editProfileBtn.style.display = 'none';
        }
      }
    }
    updateNavbarUser();
  };

  renderUserProfile();

  // Actualizar banner de seguidores
  const updateBanner = () => {
    if (!profileUser) return;
    const counters = document.querySelectorAll('.followers-counter');
    if (counters.length >= 2) {
      const num1 = counters[0].querySelector('.number-of-followers');
      const num2 = counters[1].querySelector('.number-of-followers');
      if (num1) num1.innerHTML = `<i class="fa-solid fa-user"></i> ${profileUser.followingCount || profileUser.following?.length || 0}`;
      if (num2) num2.innerHTML = `<i class="fa-solid fa-user"></i> ${profileUser.followersCount || profileUser.followers?.length || 0}`;
    }
  };
  updateBanner();

  // Modal para Editar Perfil (Foto, Nombre, Biografía)
  const editProfileModal = document.getElementById('editProfileModal');
  const editProfileForm = document.getElementById('editProfileForm');
  const editNameInput = document.getElementById('edit-name-input');
  const editBioInput = document.getElementById('edit-bio-input');
  const editAvatarTrigger = document.getElementById('edit-avatar-trigger');
  const editAvatarFileInput = document.getElementById('edit-avatar-file');
  const editAvatarPreview = document.getElementById('edit-avatar-preview');

  let newAvatarDataUrl = '';

  // Al abrir el modal, rellenar con los datos actualizados de la sesión
  if (editProfileModal && isOwnProfile) {
    editProfileModal.addEventListener('show.bs.modal', () => {
      const currentUser = userRepo.getCurrentUser();
      if (!currentUser) return;
      if (editNameInput) editNameInput.value = currentUser.name || currentUser.username || '';
      if (editBioInput) editBioInput.value = currentUser.bio || '';
      if (editAvatarPreview) editAvatarPreview.src = currentUser.avatar || 'images/user-solid.png';
      newAvatarDataUrl = currentUser.avatar || 'images/user-solid.png';
    });
  }

  // Previsualización y carga de nueva imagen de avatar
  if (editAvatarTrigger && editAvatarFileInput && isOwnProfile) {
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

  // Guardar cambios del perfil
  if (editProfileForm && isOwnProfile) {
    editProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedName = editNameInput?.value.trim();
      const updatedBio = editBioInput?.value.trim() || '';

      if (!updatedName) {
        showToast('Por favor ingresa tu nombre.', 'warning');
        return;
      }

      const currentUser = userRepo.getCurrentUser();
      const finalAvatar = newAvatarDataUrl || currentUser.avatar || 'images/user-solid.png';

      // 1. Actualizar en el repositorio y sesión de usuario
      userRepo.updateCurrentUser({
        name: updatedName,
        bio: updatedBio,
        avatar: finalAvatar
      });

      // 2. Propagar nombre y avatar a todos sus posteos y comentarios pasados
      postRepo.updateUserData(currentUser.id || updatedName, {
        name: updatedName,
        avatar: finalAvatar
      });

      profileUser = userRepo.getCurrentUser();
      renderUserProfile();
      renderUserPosts();
      showToast('¡Perfil actualizado con éxito!', 'success');

      // Cerrar modal de Bootstrap correctamente
      if (window.bootstrap?.Modal) {
        const modalInstance = window.bootstrap.Modal.getInstance(editProfileModal) || new window.bootstrap.Modal(editProfileModal);
        modalInstance?.hide();
      } else {
        editProfileModal.classList.remove('show');
        editProfileModal.style.display = 'none';
      }

      // Limpieza de backdrop de Bootstrap
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style.removeProperty('padding-right');
      document.body.style.removeProperty('overflow');
    });
  }

  // Cargar publicaciones del usuario visualizado
  function renderUserPosts() {
    if (!userPostsContainer || !profileUser) return;

    const allPosts = postRepo.getAll();

    // Filtrar por userId o por coincidencia de nombre
    const userPosts = allPosts.filter(post => {
      if (post.userId && profileUser.id) {
        return String(post.userId) === String(profileUser.id);
      }
      return post.userName && profileUser.name && post.userName.toLowerCase() === profileUser.name.toLowerCase();
    });

    if (userPosts.length === 0) {
      const emptyMessage = isOwnProfile
        ? 'Aún no has publicado nada. ¡Comparte tus conocimientos con la comunidad!'
        : 'Este usuario aún no ha realizado ninguna publicación.';

      userPostsContainer.innerHTML = `
        <div class="card-post text-center p-4">
          <p style="color: var(--cp-grey);">${emptyMessage}</p>
        </div>
      `;
      return;
    }

    userPostsContainer.innerHTML = userPosts
      .map(post => post.getPostPresentation())
      .join('');

    userPosts.forEach(post => {
      const postElement = userPostsContainer.querySelector(`[data-post-id="${post.id}"]`);
      if (postElement) {
        post.initCommentEvents(postElement);
        post.initReactionEvents(postElement, (updatedPost) => {
          postRepo.update(updatedPost);
        });
      }
    });

    updateNavbarUser();
  }

  renderUserPosts();

  // --- Lógica para Crear Nueva Publicación desde el Modal ---
  const createPostModal = document.getElementById('createPostModal');
  if (createPostModal) {
    const publishBtn = createPostModal.querySelector('.cp-btn-submit');
    const titleInput = document.getElementById('post-title-input');
    const bodyInput = document.getElementById('post-body-input');
    const fileInput = document.getElementById('file-upload');
    const previewContainer = document.getElementById('preview-container');

    if (publishBtn) {
      publishBtn.onclick = (e) => {
        e.preventDefault();

        const title = titleInput ? titleInput.value.trim() : '';
        const body = bodyInput ? bodyInput.value.trim() : '';

        if (!title || !body) {
          showToast('Por favor completa el título y el contenido de la publicación.', 'warning');
          return;
        }

        const currentUser = userRepo.getCurrentUser();

        const processAndCreate = (imageDataUrl = '') => {
          postRepo.create({
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            title: title,
            body: body,
            image: imageDataUrl
          });

          if (titleInput) titleInput.value = '';
          if (bodyInput) bodyInput.value = '';
          if (fileInput) fileInput.value = '';
          if (previewContainer) {
            previewContainer.innerHTML = '';
            previewContainer.classList.add('d-none');
          }

          const modalInstance = window.bootstrap?.Modal?.getInstance(createPostModal) 
                               || (window.bootstrap?.Modal ? new window.bootstrap.Modal(createPostModal) : null);
          if (modalInstance) {
            modalInstance.hide();
          }

          document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
          document.body.classList.remove('modal-open');
          document.body.style.removeProperty('padding-right');
          document.body.style.removeProperty('overflow');

          showToast('¡Publicación creada exitosamente!', 'success');
          if (isOwnProfile) {
            renderUserPosts();
          }
        };

        const file = fileInput?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => processAndCreate(evt.target?.result || '');
          reader.readAsDataURL(file);
        } else {
          processAndCreate('');
        }
      };
    }
  }
});