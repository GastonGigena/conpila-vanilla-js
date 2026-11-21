/**
 * Módulo de alternancia de tema Claro / Oscuro (ConPila Mode)
 */

// Ejecutar inmediatamente antes de pintar para evitar parpadeos (FOUC)
(function() {
  const isLight = localStorage.getItem("theme") === "light" || localStorage.getItem("conpila_theme") === "light";
  if (isLight) {
    document.documentElement.classList.add("light");
    if (document.body) {
      document.body.classList.add("light");
    }
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const botonMode = document.getElementById("mode");
  const logoImgs = document.querySelectorAll('.header-logo img, .login-logo, .splash-logo');

  let isLightMode = localStorage.getItem("theme") === "light" || localStorage.getItem("conpila_theme") === "light";

  function saveUserTheme(theme) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('conpila_user') || 'null');
      if (!currentUser?.id) return;

      currentUser.theme = theme;
      localStorage.setItem('conpila_user', JSON.stringify(currentUser));

      const users = JSON.parse(localStorage.getItem('conpila_registered_users') || '[]');
      const userIndex = users.findIndex(user => String(user.id) === String(currentUser.id));
      if (userIndex !== -1) {
        users[userIndex].theme = theme;
        localStorage.setItem('conpila_registered_users', JSON.stringify(users));
      }
    } catch (error) {
      console.error('No se pudo guardar la preferencia de tema del usuario:', error);
    }
  }

  function aplicarTema(activarModoClaro) {
    const theme = activarModoClaro ? 'light' : 'dark';
    if (activarModoClaro) {
      document.body.classList.add("light");
      document.documentElement.classList.add("light");

      logoImgs.forEach(img => {
        img.src = "images/logo compilamodelight.png";
      });
    } else {
      document.body.classList.remove("light");
      document.documentElement.classList.remove("light");

      logoImgs.forEach(img => {
        img.src = "images/logo_horizontal.png";
      });
    }
    localStorage.setItem("theme", theme);
    localStorage.setItem("conpila_theme", theme);
    saveUserTheme(theme);
  }

  // Aplicar tema guardado
  aplicarTema(isLightMode);

  // Remover la clase no-transition con un micro retardo para permitir transiciones fluidas en clics manuales
  setTimeout(() => {
    document.documentElement.classList.remove("no-transition");
  }, 60);

  if (botonMode) {
    botonMode.addEventListener("click", () => {
      isLightMode = !document.documentElement.classList.contains("light");
      aplicarTema(isLightMode);
    });
  }
});
