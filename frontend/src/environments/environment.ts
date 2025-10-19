// ===== PRESETS LOCALES (elige 1 y descomenta) ==============================

// A) Local con Nginx en Docker (host: http://localhost:8080)
// export const environment = {
//   production: false,
//   apiBaseUrl: 'http://localhost:8080/api',
// };

// B) Local con php artisan serve (http://127.0.0.1:8000)
// export const environment = {
//   production: false,
//   apiBaseUrl: 'http://127.0.0.1:8000/api',
// };

// C) Local usando PROXY de Angular (ng serve) → requiere proxy.conf.json
export const environment = {
  production: false,
  apiUrl: '/api',
};

// Nota:
// - Usa (A) si tu backend corre en Docker con Nginx exponiendo 8080.
// - Usa (B) si levantas Laravel con `php artisan serve` (puerto 8000).
// - Usa (C) si prefieres URLs relativas y levantar Angular con proxy
//   (`ng serve --proxy-config proxy.conf.json`). Así evitas CORS en dev.

