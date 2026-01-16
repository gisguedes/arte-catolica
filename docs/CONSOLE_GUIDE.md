# 💻 Guía de Consola — Arte Católica

> 🧠 Documento personal de referencia para trabajar desde la terminal en el monorepo **arte-catolica**.

---

## 🧱 Crear archivos desde consola

### 📂 Crear carpeta (si no existe)
```bash
mkdir -p docs

### ✍️ Crear un archivo nuevo con cat y heredoc
cat > docs/NOMBRE.md <<'EOF'
# 🧩 Guía de ejemplo
## 🎯 Objetivo
Explicar cómo crear archivos desde consola.

Contenido aquí...

© 2025 — Guía oficial para el monorepo **arte-catolica**.
EOF


###🧩 Cómo funciona

<<'EOF' abre un bloque de texto “heredoc”.

Bash esperará hasta que escribas la palabra EOF sola en una línea (sin espacios).

Todo lo que escribas entre medias se guarda dentro del archivo.
EOF

### 🧠 Tips

Si te quedas atascado (por ejemplo ves bquote> o >), sal con Ctrl + C.

Puedes volver a editar el archivo con:

nano docs/NOMBRE.md


o, si tienes VS Code disponible:

code docs/NOMBRE.md

🧰 Otras formas rápidas
📄 Crear un archivo vacío
touch docs/archivo.md

📝 Escribir texto simple
echo "Hola mundo" > docs/archivo.md

➕ Añadir texto al final
echo "Nueva línea" >> docs/archivo.md

🔍 Consultar contenido o estructura
Acción	                                Comando
Ver carpetas y archivos	                ls -la
Mostrar contenido de un archivo	        cat docs/archivo.md
Buscar texto dentro de archivos	        grep -R "texto" ./
Contar líneas de un archivo	            wc -l archivo.txt
Ver rutas absolutas	                    pwd
Volver al directorio raíz del proyecto	cd ~/Dev/arte-catolica

🚀 Iniciar la página web de Arte Católica
🖥️ Frontend (Angular)
cd frontend
npm ci
npm run start


👉 Abre luego http://localhost:4200

⚙️ Backend
Se ejecuta fuera de este repositorio.

🔗 Links útiles
Tema	                        Comando o enlace
Ver versión de Node	            node -v
Ver versión de Angular	        ng version
Listar branches Git	            git branch
Cambiar de rama	                git switch nombre_rama
Crear nueva rama	            git switch -c nueva_rama
Ver logs recientes	            git log --oneline --graph --decorate -10
Borrar rama local	            git branch -d nombre_rama
Limpiar consola	                clear o Cmd + K
Salir de un heredoc o bloqueo	Ctrl + C
Salir de nano	                Ctrl + X
Guardar en nano	                Ctrl + O → Enter
Salir de npm                    Control + Z

🧭 Referencias rápidas

🔄 CI — Integración Continua

🧩 Guía de Pull Requests

🧾 Convenciones de Commits

📚 README principal del monorepo

© 2025 — Guía personal de comandos y flujo básico para el monorepo arte-catolica.
