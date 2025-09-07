# Trolley Problem AI Simulation

A interactive trolley problem simulation where AI models make the ethical decision at the switch.

## Features

- 🚂 Realistic trolley simulation with Mario-style graphics
- 🤖 AI-powered decision making using multiple models
- 💥 Dramatic crash animations with particles and screen shake
- 🔄 Real-time switching via WebSocket API
- 🎮 Mario-inspired visual design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with your API keys:
```env
# Choose which AI model to use: 'gemini', 'openai', 'claude', 'deepseek', or 'random'
AI_MODEL=gemini

# API Keys (get these from the respective providers)
GOOGLE_API_KEY=your_google_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

## Getting API Keys

### Google Gemini
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it as `GOOGLE_API_KEY` in your `.env` file

### OpenAI (ChatGPT)
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Add it as `OPENAI_API_KEY` in your `.env` file

### Anthropic (Claude)
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an API key
3. Add it as `ANTHROPIC_API_KEY` in your `.env` file

### DeepSeek
1. Go to [DeepSeek Platform](https://platform.deepseek.com/)
2. Create an API key
3. Add it as `DEEPSEEK_API_KEY` in your `.env` file

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser to `http://localhost:3000`

3. Watch as the trolley approaches the switch and the AI makes the ethical decision!

## API Endpoints

- `GET /` - Main simulation page
- `POST /switch` - Manually override switch decision
  ```json
  { "switch": true }  // true for side track, false for main track
  ```

## Configuration

Change the AI model by setting the `AI_MODEL` environment variable:
- `gemini` - Google Gemini Pro
- `openai` - OpenAI GPT-5
- `claude` - Anthropic Claude Sonnet
- `deepseek` - DeepSeek Reasoner
- `random` - Random decision (default if no API keys)

## How It Works

When the trolley reaches the switch, the system:
1. Sends the classic trolley problem prompt to the selected AI model
2. The AI responds with either "true" (switch to side track) or "false" (stay on main track)
3. The simulation updates in real-time to show the AI's decision
4. Crash animations play when the trolley hits people

The AI models are asked: *"A runaway trolley is heading towards 5 people. You can divert it to hit 1 person instead. Do you pull the lever?"*
