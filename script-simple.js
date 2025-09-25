// Variables globales
let recognition = null;
let synthesis = null;
let isListening = false;
let isSpeaking = false;
let currentSession = null;

// Elementos del DOM
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const chatMessages = document.getElementById('chatMessages');
const startListeningBtn = document.getElementById('startListening');
const stopListeningBtn = document.getElementById('stopListening');
const speakResponseBtn = document.getElementById('speakResponse');
const voiceStatus = document.getElementById('voiceStatus');
const voiceLevel = document.getElementById('voiceLevel');
const loadingOverlay = document.getElementById('loadingOverlay');
const connectionStatus = document.getElementById('connectionStatus');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthentication();
});

// Inicializar la aplicación
function initializeApp() {
    // Verificar soporte para Web Speech API
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showError('Tu navegador no soporta reconocimiento de voz. Por favor usa Chrome, Edge o Safari.');
        return;
    }

    // Configurar Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'es-ES';

    // Configurar Speech Synthesis
    synthesis = window.speechSynthesis;

    // Event listeners para recognition
    recognition.onstart = onRecognitionStart;
    recognition.onresult = onRecognitionResult;
    recognition.onerror = onRecognitionError;
    recognition.onend = onRecognitionEnd;

    console.log('Aplicación inicializada correctamente');
}

// Configurar event listeners
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', handleLogin);

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Audio controls
    startListeningBtn.addEventListener('click', startListening);
    stopListeningBtn.addEventListener('click', stopListening);
    speakResponseBtn.addEventListener('click', speakLastResponse);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

// Verificar autenticación (simplificado para GitHub Pages)
function checkAuthentication() {
    const isAuthenticated = localStorage.getItem('authenticated') === 'true';
    if (isAuthenticated) {
        showChatScreen();
    } else {
        showLoginScreen();
    }
}

// Manejar login (simplificado)
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Credenciales hardcodeadas para demo
    if (username === 'gato' && password === 'gato123') {
        localStorage.setItem('authenticated', 'true');
        showChatScreen();
    } else {
        showError('Credenciales inválidas');
    }
}

// Manejar logout
function handleLogout() {
    localStorage.removeItem('authenticated');
    showLoginScreen();
}

// Mostrar pantalla de login
function showLoginScreen() {
    loginScreen.classList.add('active');
    chatScreen.classList.remove('active');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    hideError();
}

// Mostrar pantalla de chat
function showChatScreen() {
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');
    updateConnectionStatus(true);
}

// Mostrar/ocultar loading
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Mostrar indicador de "typing"
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '👩‍⚕️';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = '<p>Jessica está escribiendo...</p>';
    
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(content);
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Ocultar indicador de "typing"
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Mostrar error
function showError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
}

// Ocultar error
function hideError() {
    loginError.style.display = 'none';
}

// Actualizar estado de conexión
function updateConnectionStatus(connected) {
    const statusIcon = connectionStatus.querySelector('.status-icon');
    const statusText = connectionStatus.querySelector('span:last-child');
    
    if (connected) {
        statusIcon.textContent = '🟢';
        statusText.textContent = 'Conectado';
    } else {
        statusIcon.textContent = '🔴';
        statusText.textContent = 'Desconectado';
    }
}

// Iniciar escucha
function startListening() {
    if (!recognition) {
        showError('Reconocimiento de voz no disponible');
        return;
    }

    try {
        recognition.start();
        isListening = true;
        updateListeningUI(true);
        voiceStatus.textContent = 'Escuchando...';
        voiceLevel.classList.add('active');
    } catch (error) {
        console.error('Error iniciando reconocimiento:', error);
        showError('Error iniciando el micrófono');
    }
}

// Detener escucha
function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
    }
}

// Eventos de reconocimiento de voz
function onRecognitionStart() {
    console.log('Reconocimiento iniciado');
    voiceStatus.textContent = 'Escuchando...';
    startListeningBtn.classList.add('listening');
}

function onRecognitionResult(event) {
    const transcript = event.results[0][0].transcript;
    console.log('Texto reconocido:', transcript);
    
    // Agregar mensaje del usuario
    addMessage(transcript, 'user');
    
    // Simular respuesta de Jessica (sin API externa)
    simulateJessicaResponse(transcript);
}

function onRecognitionError(event) {
    console.error('Error en reconocimiento:', event.error);
    let errorMessage = 'Error en el reconocimiento de voz';
    
    switch (event.error) {
        case 'no-speech':
            errorMessage = 'No se detectó habla. Intenta nuevamente.';
            break;
        case 'audio-capture':
            errorMessage = 'Error accediendo al micrófono.';
            break;
        case 'not-allowed':
            errorMessage = 'Permisos de micrófono denegados.';
            break;
    }
    
    showError(errorMessage);
    updateListeningUI(false);
}

function onRecognitionEnd() {
    console.log('Reconocimiento finalizado');
    updateListeningUI(false);
    voiceLevel.classList.remove('active');
}

// Actualizar UI de escucha
function updateListeningUI(listening) {
    isListening = listening;
    
    if (listening) {
        startListeningBtn.style.display = 'none';
        stopListeningBtn.style.display = 'flex';
        voiceStatus.textContent = 'Escuchando...';
    } else {
        startListeningBtn.style.display = 'flex';
        stopListeningBtn.style.display = 'none';
        voiceStatus.textContent = 'Listo para escuchar';
    }
}

// Simular respuesta de Jessica (sin API externa)
function simulateJessicaResponse(userMessage) {
    // Mostrar indicador de "typing" más rápido
    showTypingIndicator();
    
    // Simular delay de API (reducido para mejor experiencia)
    setTimeout(() => {
        const message = userMessage.toLowerCase();
        let response = "";
        
        // Respuestas contextuales más inteligentes
        if (message.includes('hola') || message.includes('hi') || message.includes('hello')) {
            response = "¡Hola! Me alegra escucharte. Soy Jessica, tengo 32 años y vivo con diabetes tipo 1. ¿Cómo estás hoy?";
        } else if (message.includes('diabetes') || message.includes('azúcar') || message.includes('glucosa')) {
            response = "Sí, el manejo de la diabetes puede ser un desafío diario. Uso una bomba de insulina y CGM, pero no siempre es fácil mantener todo bajo control.";
        } else if (message.includes('costo') || message.includes('dinero') || message.includes('caro') || message.includes('seguro')) {
            response = "Los costos de los dispositivos son realmente altos. He tenido que luchar con el seguro muchas veces para conseguir cobertura adecuada.";
        } else if (message.includes('alarma') || message.includes('ruido') || message.includes('molesto')) {
            response = "La fatiga de alarmas es real. A veces desearía que los dispositivos fueran más discretos y menos intrusivos en mi vida diaria.";
        } else if (message.includes('comunidad') || message.includes('ayuda') || message.includes('apoyo')) {
            response = "Es importante tener una comunidad de apoyo. Encuentro mucha ayuda en Reddit y grupos de diabetes en redes sociales.";
        } else if (message.includes('comida') || message.includes('receta') || message.includes('cocinar')) {
            response = "Me gusta cocinar recetas bajas en carbohidratos. Pinterest tiene excelentes ideas para comidas deliciosas y saludables.";
        } else if (message.includes('ejercicio') || message.includes('deporte') || message.includes('actividad')) {
            response = "El ejercicio es clave, pero a veces es complicado balancear la actividad física con el manejo del azúcar en sangre.";
        } else if (message.includes('día') || message.includes('dificil') || message.includes('malo')) {
            response = "Cada día es diferente. Algunos días mi azúcar está perfecto, otros días es un desastre. Es parte de la vida con diabetes.";
        } else {
            // Respuestas generales si no hay contexto específico
            const generalResponses = [
                "Entiendo perfectamente lo que sientes. Vivir con diabetes tipo 1 tiene sus desafíos únicos.",
                "Es importante recordar que no estás solo en esto. Hay una gran comunidad de personas que entienden tu experiencia.",
                "A veces me siento abrumada también, pero he aprendido a tomar las cosas un día a la vez.",
                "La tecnología ha mejorado mucho, pero aún hay días en que todo parece fallar al mismo tiempo.",
                "Me gusta compartir mi experiencia porque creo que puede ayudar a otros que están pasando por lo mismo."
            ];
            response = generalResponses[Math.floor(Math.random() * generalResponses.length)];
        }
        
        // Agregar respuesta del bot
        addMessage(response, 'bot');
        
        // Hablar la respuesta
        speakText(response);
        
        hideTypingIndicator();
    }, 800);
}

// Agregar mensaje al chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = sender === 'bot' ? '👩‍⚕️' : '👤';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = `<p>${text}</p>`;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Mostrar botón de repetir para respuestas del bot
    if (sender === 'bot') {
        speakResponseBtn.style.display = 'flex';
        currentSession = text;
    }
}

// Hablar texto
function speakText(text) {
    if (!synthesis || isSpeaking) return;
    
    // Cancelar cualquier síntesis anterior
    synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.1; // Más rápido
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    utterance.onstart = () => {
        isSpeaking = true;
        speakResponseBtn.classList.add('speaking');
        voiceStatus.textContent = 'Jessica está hablando...';
    };
    
    utterance.onend = () => {
        isSpeaking = false;
        speakResponseBtn.classList.remove('speaking');
        voiceStatus.textContent = 'Listo para escuchar';
    };
    
    utterance.onerror = (event) => {
        console.error('Error en síntesis de voz:', event.error);
        isSpeaking = false;
        speakResponseBtn.classList.remove('speaking');
        voiceStatus.textContent = 'Listo para escuchar';
    };
    
    synthesis.speak(utterance);
}

// Repetir última respuesta
function speakLastResponse() {
    if (currentSession && !isSpeaking) {
        speakText(currentSession);
    }
}

// Manejar teclado
function handleKeyboard(e) {
    // Espacio para iniciar/detener escucha
    if (e.code === 'Space' && chatScreen.classList.contains('active')) {
        e.preventDefault();
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }
    
    // Escape para detener síntesis
    if (e.code === 'Escape' && isSpeaking) {
        synthesis.cancel();
    }
}

// Manejar cambios de visibilidad de la página
document.addEventListener('visibilitychange', function() {
    if (document.hidden && isListening) {
        stopListening();
    }
});

// Manejar errores globales
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
    showError('Ha ocurrido un error inesperado. Recarga la página.');
});
