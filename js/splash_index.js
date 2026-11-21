import { UserRepository } from './repositories/userRepository.js';
import { showToast } from './utils/domUtils.js';

document.addEventListener("DOMContentLoaded", () => {
    const splash = document.getElementById("splash-screen");
    const login = document.getElementById("login-screen");
    const loginForm = document.getElementById('loginForm');
    const passIcons = document.querySelectorAll(".conpila_password-icon");

    // Función auxiliar para pausar la ejecución cronológicamente
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Lógica secuencial para la transición de pantallas
    if (splash && login) {
        (async () => {
            // 1. Mostrar el splash screen durante 1 segundo
            await delay(1000); 
            
            // 2. Transición de salida para desvanecer el splash
            splash.style.transition = "opacity 0.6s ease";
            splash.style.opacity = "0";
            
            // 3. Esperar que termine de desvanecer para quitarlo del flujo
            await delay(600); 
            splash.style.display = "none";
        })();
    }

    passIcons.forEach((passIcon) => {
        passIcon.addEventListener("click", function () {
            const container = this.closest(".conpila_password-container");
            const input = container ? container.querySelector("input") : null;

            if (input) {
                const isPassword = input.type === "password";
                input.type = isPassword ? "text" : "password";
                this.classList.toggle("fa-eye-slash", !isPassword);
                this.classList.toggle("fa-eye", isPassword);
            }
        });
    });

    // Control de envío del formulario de inicio de sesión
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const identifierInput = loginForm.querySelector('input[name="identifier"]');
            const passInput = loginForm.querySelector('input[name="password"]');

            const identifier = identifierInput?.value.trim();
            const passVal = passInput?.value;

            if (!identifier || !passVal) {
                showToast('Por favor completa el correo o nombre de usuario y la contraseña.', 'warning');
                return;
            }

            const userRepo = new UserRepository();
            const user = userRepo.loginWithEmailOrUsername(identifier, passVal);

            // Si las credenciales no coinciden o no existe el usuario, bloquea el inicio de sesión
            if (!user) {
                showToast('Correo, usuario o contraseña incorrectos.', 'warning');
                return;
            }

            localStorage.setItem("token", "token_simulado_conpila_" + Date.now());
            const theme = user.theme === 'light' ? 'light' : 'dark';
            localStorage.setItem('theme', theme);
            localStorage.setItem('conpila_theme', theme);
            // Redirige al home únicamente si las credenciales son correctas
            window.location.href = loginForm.getAttribute("action") || "home.html";
        });
    }
});

// Exponer funciones globales en consola
if (typeof window !== "undefined") {
    window.resetConPila = function() {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };
    window.clearCache = window.resetConPila;
}