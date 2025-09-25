import crypto from 'crypto';

// Simulamos una base de datos simple en memoria
const users = {
  'gato': {
    password: 'gato123',
    id: 1
  }
};

// Función para generar session ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// Almacenamiento simple de sesiones (en producción usar Redis o similar)
const sessions = {};

export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { username, password } = req.body;

    // Validar credenciales
    if (users[username] && users[username].password === password) {
      const sessionId = generateSessionId();
      sessions[sessionId] = {
        userId: users[username].id,
        username: username,
        createdAt: Date.now()
      };

      // Configurar cookie de sesión
      res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`);
      
      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        user: { username }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
  } else if (req.method === 'GET') {
    // Verificar sesión
    const sessionId = req.cookies?.sessionId;
    
    if (sessionId && sessions[sessionId]) {
      const session = sessions[sessionId];
      res.status(200).json({
        authenticated: true,
        user: { username: session.username }
      });
    } else {
      res.status(401).json({
        authenticated: false
      });
    }
  } else if (req.method === 'DELETE') {
    // Logout
    const sessionId = req.cookies?.sessionId;
    if (sessionId && sessions[sessionId]) {
      delete sessions[sessionId];
      res.setHeader('Set-Cookie', 'sessionId=; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    }
    res.status(200).json({ success: true, message: 'Logout exitoso' });
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}
