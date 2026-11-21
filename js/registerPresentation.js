import { UserRepository } from './repositories/userRepository.js';
import { showToast } from './utils/domUtils.js';

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('loginForm') || document.getElementById('registerForm');
  const passIcons = document.querySelectorAll('.conpila_password-icon');

  // Gestión de carga de imagen de avatar
  const avatarTrigger = document.getElementById('reg-avatar-trigger');
  const avatarFileInput = document.getElementById('reg-avatar-file');
  const avatarPreview = document.getElementById('reg-avatar-preview');
  let selectedAvatarDataUrl = '';

  if (avatarTrigger && avatarFileInput) {
    avatarTrigger.addEventListener('click', () => {
      avatarFileInput.click();
    });

    avatarFileInput.addEventListener('change', () => {
      const file = avatarFileInput.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          selectedAvatarDataUrl = e.target?.result || '';
          if (avatarPreview) {
            avatarPreview.src = selectedAvatarDataUrl;
            avatarPreview.style.objectFit = 'cover';
            avatarPreview.style.border = '2px solid var(--cp-green)';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // visibilidad de contraseñas
  passIcons.forEach((passIcon) => {
    passIcon.addEventListener('click', function () {
      const container = this.closest('.conpila_password-container');
      const input = container?.querySelector('input');
      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        this.classList.toggle('fa-eye', !isPassword);
        this.classList.toggle('fa-eye-slash', isPassword);
      }
    });
  });

  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = registerForm.querySelector('input[name="name"]') || document.getElementById('reg-name');
      const lastNameInput = registerForm.querySelector('input[name="lastname"]') || document.getElementById('reg-lastname');
      const usernameInput = registerForm.querySelector('input[name="username"]') || document.getElementById('reg-username');
      const emailInput = registerForm.querySelector('input[name="email"]') || document.getElementById('reg-email');
      const passInput = registerForm.querySelector('input[name="password"]') || document.getElementById('reg-password');
      const confirmPassInput = registerForm.querySelector('input[name="confirm_password"]') || document.getElementById('reg-confirm-password');

      const name = nameInput?.value.trim();
      const lastName = lastNameInput?.value.trim() || '';
      const username = usernameInput?.value.trim() || '';
      const email = emailInput?.value.trim();
      const pass = passInput?.value;
      const confirmPass = confirmPassInput?.value;

      if (!name || !email || !pass || !confirmPass) {
        showToast('Por favor completa todos los campos obligatorios.', 'warning');
        return;
      }

      if (pass !== confirmPass) {
        showToast('Las contraseñas no coinciden. Por favor verifícalas.', 'warning');
        return;
      }

      if (pass.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres.', 'warning');
        return;
      }

      // Registrar nuevo usuario en el repositorio
      const userRepo = new UserRepository();
      const fullName = `${name} ${lastName}`.trim();
      userRepo.registerUser({
        name: fullName,
        email: email,
        username: username || name.toLowerCase().replace(/\s+/g, ''),
        password: pass,
        avatar: selectedAvatarDataUrl || 'images/user-solid.png',
        bio: `Miembro de ConPila (@${username || name.toLowerCase().replace(/\s+/g, '')}). ¡Hola a toda la comunidad tech!`,
        followersCount: 0,
        followingCount: 0
      });

      // Crear token de sesión
      localStorage.setItem('token', 'token_simulado_conpila_' + Date.now());

      showToast('¡Cuenta creada con éxito! Bienvenido a ConPila.', 'success');
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 700);
    });
  }
});
