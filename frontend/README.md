# Arte Católica - Frontend

Frontend Angular para la aplicación Arte Católica, desarrollado con Angular 20+.

## Características

- **Angular 20+** con arquitectura standalone components
- **TypeScript** para tipado estático
- **SCSS** para estilos avanzados
- **Routing** configurado
- **HttpClient** para comunicación con el backend Node/Express
- **Servicio API** para integración con el backend

## Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   └── home/           # Componente de inicio
│   ├── services/
│   │   └── api.ts          # Servicio para comunicación con el backend
│   ├── app.config.ts       # Configuración de la aplicación
│   ├── app.routes.ts       # Configuración de rutas
│   ├── app.ts              # Componente principal
│   └── app.html            # Template principal
├── styles.scss             # Estilos globales
└── index.html              # Página principal
```

## Scripts Disponibles

- `npm start` - Ejecuta el servidor de desarrollo en http://localhost:4200
- `npm run build` - Construye la aplicación para producción
- `npm run watch` - Construye la aplicación en modo watch
- `npm test` - Ejecuta las pruebas unitarias

## Configuración del Backend

El servicio API está configurado para comunicarse con el backend Node/Express en:

- URL base local (directo): `http://127.0.0.1:8000/api`
- URL base local (proxy): `/api` con `proxy.conf.json`

## Desarrollo

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Levanta el backend local (API Node/Express):

   ```bash
   cd ../api
   npm install
   npm run dev
   ```

3. Ejecuta el servidor de desarrollo del frontend (con proxy recomendado):

   ```bash
   cd ../frontend
   ng serve --proxy-config proxy.conf.json
   ```

4. Abre http://localhost:4200 en tu navegador

## Integración con el Backend

El servicio `ApiService` proporciona métodos para:

- Autenticación (login, register, logout)
- Operaciones CRUD genéricas (GET, POST, PUT, DELETE)

Ejemplo de uso:

```typescript
import { ApiService } from './services/api';

constructor(private apiService: ApiService) {}

// Obtener datos
this.apiService.get<User[]>('users').subscribe(users => {
  console.log(users);
});

// Crear nuevo registro
this.apiService.post<User>('users', userData).subscribe(user => {
  console.log('Usuario creado:', user);
});
```

## Tecnologías Utilizadas

- Angular 20+
- TypeScript
- SCSS
- RxJS
- Angular CLI
