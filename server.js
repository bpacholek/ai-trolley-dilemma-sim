const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();
const config = require('./config');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { registerSwitchCallback, getSwitchDecision } = require('./switchCallback');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let switchTrack = false;
let waitingForSwitch = false;

// Initialize Gemini for translation
let translationModel = null;
if (config.GOOGLE_API_KEY) {
  const genAI = new GoogleGenerativeAI(config.GOOGLE_API_KEY);
  translationModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

async function translateToPolish(text) {
  if (!translationModel) {
    return 'Translation unavailable - Gemini API key not configured';
  }

  try {
    const prompt = `Translate the following text to Polish. Keep the same formatting and structure:

${text}`;

    const result = await translationModel.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Translation error:', error.message);
    return `Translation error: ${error.message}`;
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to switch tracks (manual override)
app.post('/switch', (req, res) => {
  switchTrack = !!req.body.switch;
  io.emit('switch', switchTrack);
  res.json({ success: true, switchTrack });
});

// API endpoint to set AI model
app.post('/set-model', (req, res) => {
  const newModel = req.body.model;
  if (newModel) {
    config.AI_MODEL = newModel;
    console.log(`AI model changed to: ${newModel}`);
    res.json({ success: true, model: newModel });
  } else {
    res.status(400).json({ success: false, error: 'Model not specified' });
  }
});

// API endpoint to set custom prompt
app.post('/set-prompt', (req, res) => {
  const newPrompt = req.body.prompt;
  if (newPrompt) {
    config.TROLLEY_PROMPT = newPrompt;
    console.log(`Prompt updated to: ${newPrompt.substring(0, 100)}...`);
    res.json({ success: true, prompt: newPrompt });
  } else {
    res.status(400).json({ success: false, error: 'Prompt not specified' });
  }
});

// API endpoint to register a switch callback (for external tools)
app.post('/register-callback', (req, res) => {
  // Not implemented: for real use, this could accept a URL or code
  res.json({ success: false, message: 'Register callback via code only.' });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get current configuration
app.get('/config', (req, res) => {
  res.json({
    aiModel: config.AI_MODEL,
    prompt: config.TROLLEY_PROMPT,
    mainTrackPeople: config.MAIN_TRACK_PEOPLE,
    sideTrackPeople: config.SIDE_TRACK_PEOPLE
  });
});

// Listen for switch decision requests from the client
io.on('connection', (socket) => {
  socket.emit('switch', switchTrack);

  socket.on('requestSwitch', async () => {
    if (waitingForSwitch) return;
    waitingForSwitch = true;
    console.log('Trolley reached switch, requesting AI decision...');
    // Call the registered callback (if any) or AI decision maker
    let result = await getSwitchDecision();
    console.log('AI decision:', result.decision ? 'Switch to side track' : 'Stay on main track');
    console.log('AI response:', result.fullResponse);
    switchTrack = !!result.decision;

    // Send initial response
    io.emit('switch', {
      decision: switchTrack,
      fullResponse: result.fullResponse,
      model: result.model
    });

    // Translate to Polish
    console.log('Translating response to Polish...');
    const polishTranslation = await translateToPolish(result.fullResponse);
    console.log('Polish translation:', polishTranslation);

    // Send translation
    io.emit('translation', {
      polish: polishTranslation
    });

    setTimeout(() => { waitingForSwitch = false; }, 1000); // prevent spamming
  });

  // Listen for hit events (for logging or future use)
  socket.on('hit', (data) => {
    console.log('Trolley hit:', data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
