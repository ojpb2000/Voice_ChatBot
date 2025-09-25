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

// Initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthentication();
    detectBackend();
});

// Initialize app
function initializeApp() {
    // Check Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showError('Your browser does not support speech recognition. Please use Chrome, Edge, or Safari.');
        return;
    }

    // Configure Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // Configure Speech Synthesis
    synthesis = window.speechSynthesis;

    // Event listeners para recognition
    recognition.onstart = onRecognitionStart;
    recognition.onresult = onRecognitionResult;
    recognition.onerror = onRecognitionError;
    recognition.onend = onRecognitionEnd;

    console.log('App initialized');
}

// Setup event listeners
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

// Check authentication (simplified for GitHub Pages)
function checkAuthentication() {
    // Force login screen by default
    localStorage.removeItem('authenticated');
    showLoginScreen();
}

// Handle login (demo)
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Demo credentials
    if (username === 'gato' && password === 'gato123') {
        localStorage.setItem('authenticated', 'true');
        showChatScreen();
    } else {
        showError('Invalid credentials');
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('authenticated');
    showLoginScreen();
}

// Show login screen
function showLoginScreen() {
    loginScreen.classList.add('active');
    chatScreen.classList.remove('active');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    hideError();
}

// Show chat screen
function showChatScreen() {
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');
    updateConnectionStatus(backendAvailable);
}

// Show/hide loading
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '👩‍⚕️';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = '<p>Jessica is typing...</p>';
    
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(content);
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Show error
function showError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
}

// Hide error
function hideError() {
    loginError.style.display = 'none';
}

// Update connection status
function updateConnectionStatus(connected) {
    const statusIcon = connectionStatus.querySelector('.status-icon');
    const statusText = connectionStatus.querySelector('span:last-child');
    
    if (connected) {
        statusIcon.textContent = '🟢';
        statusText.textContent = 'Connected';
    } else {
        statusIcon.textContent = '🔴';
        statusText.textContent = 'Disconnected';
    }
}

// Start listening
function startListening() {
    if (!recognition) {
        showError('Speech recognition not available');
        return;
    }

    try {
        recognition.start();
        isListening = true;
        updateListeningUI(true);
        voiceStatus.textContent = 'Listening...';
        voiceLevel.classList.add('active');
    } catch (error) {
        console.error('Error starting recognition:', error);
        showError('Error starting the microphone');
    }
}

// Stop listening
function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
    }
}

// Recognition events
function onRecognitionStart() {
    console.log('Recognition started');
    voiceStatus.textContent = 'Listening...';
    startListeningBtn.classList.add('listening');
}

function onRecognitionResult(event) {
    const transcript = event.results[0][0].transcript;
    console.log('Recognized text:', transcript);
    
    // Agregar mensaje del usuario
    addMessage(transcript, 'user');
    
    // Usar backend si está disponible; si falla, simular
    handleResponse(transcript);
}

function onRecognitionError(event) {
    console.error('Recognition error:', event.error);
    let errorMessage = 'Speech recognition error';
    
    switch (event.error) {
        case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
        case 'audio-capture':
            errorMessage = 'Error accessing the microphone.';
            break;
        case 'not-allowed':
            errorMessage = 'Microphone permissions denied.';
            break;
    }
    
    showError(errorMessage);
    updateListeningUI(false);
}

function onRecognitionEnd() {
    console.log('Recognition ended');
    updateListeningUI(false);
    voiceLevel.classList.remove('active');
}

// Update listening UI
function updateListeningUI(listening) {
    isListening = listening;
    
    if (listening) {
        startListeningBtn.style.display = 'none';
        stopListeningBtn.style.display = 'flex';
        voiceStatus.textContent = 'Listening...';
    } else {
        startListeningBtn.style.display = 'flex';
        stopListeningBtn.style.display = 'none';
        voiceStatus.textContent = 'Ready to listen';
    }
}

async function handleResponse(userMessage) {
    // Intentar backend primero
    if (backendAvailable) {
        showTypingIndicator();
        const backendReply = await sendToBackend(userMessage);
        if (backendReply) {
            addMessage(backendReply, 'bot');
            speakText(backendReply);
            hideTypingIndicator();
            return;
        }
        hideTypingIndicator();
    }

    // Simular respuesta de Jessica (sin API externa)
    simulateJessicaResponse(userMessage);
}

// Local simulation
function simulateJessicaResponse(userMessage) {
    // Mostrar indicador de "typing" más rápido
    showTypingIndicator();
    
    // Simular delay de API (reducido para mejor experiencia)
    setTimeout(() => {
        const message = userMessage.toLowerCase();
        let response = "";
        
        // Authentic contextual responses (English)
        if (message.includes('hola') || message.includes('hi') || message.includes('hello')) {
            response = "Hi! I'm Jessica, 32, living in West Virginia. I was diagnosed with Type 1 in my teens. How are you managing things today?";
        } else if (message.includes('diabetes') || message.includes('azúcar') || message.includes('glucosa')) {
            response = "I've used pumps and CGMs for years. Tech helps, but some days are still tough and the mental load is real.";
        } else if (message.includes('costo') || message.includes('dinero') || message.includes('caro') || message.includes('seguro')) {
            response = "Costs are tough. On a $60–65k household income, every device is a big decision, and insurance paperwork can be exhausting.";
        } else if (message.includes('alarma') || message.includes('ruido') || message.includes('molesto') || message.includes('fatiga')) {
            response = "Alarm fatigue is real. I want devices that are discreet and reliable so diabetes doesn’t take over every moment.";
        } else if (message.includes('comunidad') || message.includes('ayuda') || message.includes('apoyo') || message.includes('reddit')) {
            response = "Reddit and T1D Twitter help a lot—hacks, honest chats, and support for the rough days. Community matters.";
        } else if (message.includes('comida') || message.includes('receta') || message.includes('cocinar') || message.includes('pinterest')) {
            response = "I love finding low‑carb recipes on Pinterest. My partner and I try to keep things tasty but balanced.";
        } else if (message.includes('ejercicio') || message.includes('deporte') || message.includes('actividad') || message.includes('viaje')) {
            response = "I want an active life without diabetes getting in the way—exercise and travel take extra planning, which can be tiring.";
        } else if (message.includes('día') || message.includes('dificil') || message.includes('malo') || message.includes('estres')) {
            response = "Some days my numbers are great, others are chaos. I try not to be too hard on myself—diabetes is part of life, not all of it.";
        } else if (message.includes('tecnologia') || message.includes('dispositivo') || message.includes('bomba') || message.includes('cgm')) {
            response = "I follow new tech on Reddit/Twitter—there’s excitement and skepticism. I care most about reliability, discretion, and easy data sharing.";
        } else if (message.includes('trabajo') || message.includes('carrera') || message.includes('profesional')) {
            response = "I’m a college grad and work in a suburban area. Managing alarms during meetings can be awkward, so I plan ahead.";
        } else {
            // General authentic responses
            const generalResponses = [
                "As someone with T1D, I get the unique challenges. The constant monitoring can be draining, so I stay proactive.",
                "I value independence but also community—people on Reddit and Twitter really understand this life.",
                "I’m always balancing health with enjoying life. I don’t want diabetes to define me, even if it shapes my days.",
                "Tech helps a lot, but some days everything seems to fail at once. Having a Plan B keeps me sane.",
                "Authenticity matters. We want brands and people to truly get it without sugarcoating."
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

// ==========================
// Backend opcional (Render)
// ==========================
let backendAvailable = false;
let BACKEND_URL = '';

function detectBackend() {
    // Configurable: asigna aquí tu URL de Render cuando esté desplegado
    // Ej: https://voice-chatbot-backend.onrender.com
    BACKEND_URL = window.BACKEND_URL || '';

    if (!BACKEND_URL) {
        console.log('Backend no configurado. Usando simulación local.');
        backendAvailable = false;
        return;
    }

    fetch(`${BACKEND_URL}/api/health`, { method: 'GET' })
        .then(r => r.json())
        .then(data => {
            backendAvailable = !!data?.ok;
            updateConnectionStatus(backendAvailable);
        })
        .catch(() => {
            backendAvailable = false;
            updateConnectionStatus(false);
        });
}

async function sendToBackend(message) {
    if (!backendAvailable || !BACKEND_URL) {
        return null;
    }
    try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        if (!response.ok) throw new Error('Bad response');
        const data = await response.json();
        return data?.reply || null;
    } catch (e) {
        console.error('Fallo llamando al backend:', e);
        return null;
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

// Speak text
function speakText(text) {
    if (!synthesis || isSpeaking) return;
    
    // Cancelar cualquier síntesis anterior
    synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0; // natural speed
    utterance.pitch = 1.05; // slightly higher
    utterance.volume = 0.8;
    
    // Intentar usar una voz femenina si está disponible
    const voices = synthesis.getVoices();
    const femaleVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Zira') || voice.name.includes('Aria'))
    );
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }
    
    utterance.onstart = () => {
        isSpeaking = true;
        speakResponseBtn.classList.add('speaking');
        voiceStatus.textContent = 'Jessica is speaking...';
    };
    
    utterance.onend = () => {
        isSpeaking = false;
        speakResponseBtn.classList.remove('speaking');
        voiceStatus.textContent = 'Ready to listen';
    };
    
    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        isSpeaking = false;
        speakResponseBtn.classList.remove('speaking');
        voiceStatus.textContent = 'Ready to listen';
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
