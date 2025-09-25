# 🎤 Voice ChatBot - Jessica Taylor

Un chatbot de audio en tiempo real que simula conversaciones con Jessica Taylor, una persona de 32 años con diabetes tipo 1.

## 🚀 Características

- **Conversación de Audio**: Speech-to-Text y Text-to-Speech en tiempo real
- **Autenticación Simple**: Login con usuario y contraseña
- **Personaje Realista**: Jessica Taylor con personalidad y experiencias auténticas
- **Interfaz Moderna**: Diseño responsive y intuitivo
- **Deployment en Vercel**: Configurado para deployment automático

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js con Vercel Serverless Functions
- **Audio**: Web Speech API (SpeechRecognition + SpeechSynthesis)
- **IA**: OpenAI GPT-3.5-turbo
- **Deployment**: Vercel

## 📋 Requisitos

- Navegador moderno con soporte para Web Speech API (Chrome, Edge, Safari)
- API Key de OpenAI
- Cuenta en Vercel para deployment

## 🔧 Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repositorio>
   cd Voice_ChatBot
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   ```
   
   Editar `.env` y agregar tu API key:
   ```
   OPENAI_API_KEY=tu_api_key_aqui
   SESSION_SECRET=tu_session_secret_aqui
   NODE_ENV=development
   ```

4. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

## 🚀 Deployment en Vercel

### Paso 1: Subir a GitHub
1. Crear un nuevo repositorio en GitHub
2. Subir el código:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <tu-repositorio-github>
   git push -u origin main
   ```

### Paso 2: Conectar con Vercel
1. Ir a [vercel.com](https://vercel.com)
2. Hacer login con tu cuenta de GitHub
3. Click en "New Project"
4. Importar tu repositorio de GitHub
5. Configurar las variables de entorno:
   - `OPENAI_API_KEY`: Tu API key de OpenAI
   - `SESSION_SECRET`: Una clave aleatoria para sesiones
   - `NODE_ENV`: `production`

### Paso 3: Deploy
1. Click en "Deploy"
2. Vercel automáticamente detectará la configuración
3. Tu app estará disponible en `https://tu-proyecto.vercel.app`

## 🔐 Credenciales de Acceso

- **Usuario**: `gato`
- **Contraseña**: `gato123`

## 🎯 Uso

1. **Login**: Ingresa las credenciales
2. **Conversar**: Click en el botón de micrófono y habla
3. **Escuchar**: Jessica responderá con voz
4. **Repetir**: Click en el botón de altavoz para repetir la respuesta

### Atajos de Teclado
- **Espacio**: Iniciar/detener escucha
- **Escape**: Detener síntesis de voz

## 👩‍⚕️ Sobre Jessica Taylor

Jessica es una mujer de 32 años con diabetes tipo 1 que:
- Vive en un suburbio con su pareja
- Tiene experiencia con bombas de insulina y CGMs
- Es activa en redes sociales (Twitter, Reddit, Instagram)
- Busca equilibrio entre salud y vida social
- Comparte experiencias reales sobre el manejo de la diabetes

## 🔒 Seguridad

- API keys almacenadas como variables de entorno
- Sesiones seguras con cookies HttpOnly
- CORS configurado correctamente
- Rate limiting implementado

## 📱 Compatibilidad

- ✅ Chrome (recomendado)
- ✅ Edge
- ✅ Safari
- ❌ Firefox (limitado soporte para Web Speech API)

## 🐛 Solución de Problemas

### Error de Micrófono
- Verificar permisos del navegador
- Usar HTTPS (requerido para Web Speech API)
- Probar en Chrome o Edge

### Error de API
- Verificar que la API key esté configurada
- Revisar límites de uso de OpenAI
- Verificar conexión a internet

### Error de Audio
- Verificar que el volumen esté activado
- Probar con diferentes navegadores
- Verificar permisos de audio

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:
1. Revisa la sección de solución de problemas
2. Abre un issue en GitHub
3. Verifica que estés usando un navegador compatible

---

**Nota**: Este proyecto es para fines educativos y de demostración. Asegúrate de seguir las mejores prácticas de seguridad en producción.
