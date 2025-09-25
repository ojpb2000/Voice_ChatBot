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

// Verificar autenticación
async function checkAuthentication() {
    try {
        const response = await fetch('/api/auth', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                showChatScreen();
            } else {
                showLoginScreen();
            }
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        showLoginScreen();
    }
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    showLoading(true);
    hideError();

    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            showChatScreen();
        } else {
            showError(data.message || 'Error en el login');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showError('Error de conexión. Intenta nuevamente.');
    } finally {
        showLoading(false);
    }
}

// Manejar logout
async function handleLogout() {
    try {
        await fetch('/api/auth', {
            method: 'DELETE',
            credentials: 'include'
        });
        showLoginScreen();
    } catch (error) {
        console.error('Error en logout:', error);
        showLoginScreen();
    }
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
    
    // Enviar a ChatGPT
    sendToChatGPT(transcript);
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

// Enviar mensaje a ChatGPT
async function sendToChatGPT(message) {
    showLoading(true);
    updateConnectionStatus(false);
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Agregar respuesta del bot
        addMessage(data.response, 'bot');
        
        // Hablar la respuesta
        speakText(data.response);
        
        updateConnectionStatus(true);
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        showError('Error comunicándose con Jessica. Intenta nuevamente.');
        updateConnectionStatus(false);
    } finally {
        showLoading(false);
    }
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
    utterance.rate = 0.9;
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

// Verificar conexión periódicamente
setInterval(async () => {
    if (chatScreen.classList.contains('active')) {
        try {
            const response = await fetch('/api/auth', {
                method: 'GET',
                credentials: 'include'
            });
            updateConnectionStatus(response.ok);
        } catch (error) {
            updateConnectionStatus(false);
        }
    }
}, 30000); // Cada 30 segundos
