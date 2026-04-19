# Arateki

<p align="center">
  <img src="./public/03_arateki_black.svg" alt="Arateki Logo" width="200" />
</p>

<p align="center">
  <a href="./README.pt-br.md">🇧🇷 PT</a> | <a href="./README.md">🇺🇸 EN</a> | <b>🇪🇸 ES</b> | <a href="./README.ja.md">🇯🇵 JA</a> | <a href="./README.zh.md">🇨🇳 ZH</a>
</p>

---

Este repositorio contiene la **Página de Inicio de Arateki**, el punto de entrada principal de la empresa. Su propósito principal es presentar nuestra visión y centralizar la información, incluido el sistema de captura de clientes potenciales para nuestros productos iniciales.

Arateki es una empresa de tecnología dedicada al desarrollo de soluciones **open-source**, enfocadas en la **privacidad** y construidas de forma **ética**. Creemos en el derecho a la reparación y en el control absoluto sobre sus propios datos e infraestructura.

## 🚀 Proyectos Clave Mencionados

- **SafraSense aqua**: Un sensor inteligente, autónomo y alimentado por energía solar para cultivos hidropónicos que monitorea métricas vitales como EC, pH y temperatura.
- **Raiznet**: Un ecosistema descentralizado para que los productores locales compartan conocimientos y datos de sensores de forma segura.

## 🛠 Stack Tecnológica Frontend

Las siguientes tecnologías se utilizaron exclusivamente para construir esta aplicación web:

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Herramienta de Construcción**: [Vite 6](https://vitejs.dev/)
- **Estilizado**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Pruebas**: [Vitest](https://vitest.dev/) (Unidad) & [Playwright](https://playwright.dev/) (E2E y Regresión Visual)
- **Calidad**: [ESLint](https://eslint.org/) & [Husky](https://typicode.github.io/husky/) (Git Hooks)

## 📦 Empezando

### Requisitos previos
- Node.js (se recomienda la última versión LTS)
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/Arateki/arateki-landing.git

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env # Asegúrese de que VITE_GOOGLE_SCRIPT_URL esté configurado
```

### Ejecución del Servidor de Desarrollo
```bash
npm run dev
```

## 🧪 Pruebas y Calidad

Seguimos altos estándares de ingeniería para garantizar la confiabilidad.

- **Pruebas de Unidad**: `npm test`
- **E2E y Regresión Visual**: `npm run test:e2e`
- **Informe de Cobertura**: `npm run test:coverage`
- **Ejecutar Todo**: `npm run test:all`

**Pre-commit Hook**: Husky está configurado para ejecutar automáticamente Lint y Pruebas de Unidad antes de cada commit para evitar que el código roto llegue al repositorio.

## 🛡 Licencia

Este proyecto es de código abierto. Consulte el repositorio para obtener detalles específicos sobre la licencia.

---
<p align="center">Construido con 🌿 por el equipo de Arateki</p>
