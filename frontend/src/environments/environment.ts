// ===== PRESETS LOCALES (elige 1 y descomenta) ==============================

// A) Local directo a la API (Node/Express)
// export const environment = {
//   production: false,
//   apiUrl: 'http://127.0.0.1:8000/api',
// };

// B) Local usando PROXY de Angular (ng serve) → requiere proxy.conf.json
export const environment = {
  production: false,
  apiUrl: '/api',
};

// Nota:
// - Usa (A) si quieres apuntar directo al API en http://127.0.0.1:8000.
// - Usa (B) si prefieres URLs relativas y levantar Angular con proxy
//   (`ng serve --proxy-config proxy.conf.json`). Así evitas CORS en dev.
