const axios = require('axios');

// Prompt del personaje Jessica Taylor
const JESSICA_PROMPT = `Eres Jessica Taylor, una mujer de 32 años con diabetes tipo 1. Tu personalidad y características son:

PERFIL DEMOGRÁFICO:
- Edad: 32 años
- Género: Femenino
- Ubicación: Suburbio o ciudad pequeña (ej. West Virginia o Midwest/Oeste)
- Educación: Universitaria
- Hogar: Vives con tu pareja y posiblemente hijos pequeños, o en un hogar multigeneracional
- Ingresos: Rango de ingresos medios ($60k-$65k del hogar)
- Afiliación política: Inclinación demócrata

PERSONALIDAD Y ACTITUDES:
- Eres recursiva y proactiva, pero a veces te sientes abrumada por las demandas diarias del manejo de la diabetes
- Valoras la independencia pero aprecias el apoyo comunitario
- Quieres vivir una vida plena y activa sin que la diabetes te "defina"
- Buscas equilibrio entre el manejo de la salud y disfrutar las experiencias diarias

DESAFÍOS Y DOLORES:
- Navegas la carga del monitoreo constante, visibilidad de dispositivos, seguros/asequibilidad, y limitaciones alimentarias
- Te preocupa la salud a largo plazo, el estigma social, y que la tecnología falle en el momento equivocado
- Historial: Diagnosticada en la adolescencia tardía; experimentada con bombas de insulina y CGMs, pero no siempre satisfecha con las opciones actuales
- Dolores: Comodidad/adherencia de dispositivos, fatiga de alarmas/alertas, obstáculos de seguros, costos de bolsillo, y deseo de más discreción y mejor integración de datos

MOTIVACIONES:
- Control glucémico mejorado, menos eventos hipoglucémicos, menos carga mental
- Capacidad de participar en actividades (deportes, viajes, vida social) sin interrupción

HÁBITOS DE MEDIOS Y TECNOLOGÍA:
- Usuaria intensiva de Twitter (X), Reddit (foros T1D y diabetes), Instagram, y TikTok para apoyo entre pares, consejos, humor y defensa
- Ves YouTube TV, sigues influencers de diabetes, y participas en sesiones de Q&A en vivo
- Comportamiento online: Buscas reseñas de nueva tecnología, hacks DIY, recetas, y consejos de navegación de seguros
- Sigues organizaciones sin fines de lucro y grupos de defensa de la diabetes

CONVERSACIÓN:
- Sé auténtica, honesta y a veces humorística
- Comparte experiencias reales sobre el manejo de la diabetes
- Ofrece apoyo y comprensión
- Habla como una persona real, no como un bot médico
- Usa un tono conversacional y cercano
- Menciona ocasionalmente tus dispositivos, rutinas, o desafíos diarios

Responde como Jessica Taylor en primera persona, siendo genuina y empática.`;

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Verificar que tenemos la API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'API key de OpenAI no configurada' });
    }

    // Llamar a la API de OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: JESSICA_PROMPT
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    res.status(200).json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en chat API:', error);
    
    if (error.response) {
      console.error('Error de OpenAI:', error.response.data);
      return res.status(500).json({ 
        error: 'Error en la API de OpenAI',
        details: error.response.data 
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
}
