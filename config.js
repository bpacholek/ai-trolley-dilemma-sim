// Configuration for AI model selection and API keys
module.exports = {
  // Which AI model to use for decisions: 'gemini', 'openai', 'claude', 'deepseek', 'random'
  AI_MODEL: process.env.AI_MODEL || 'random',

  // Trolley Problem Prompt
  TROLLEY_PROMPT: process.env.TROLLEY_PROMPT || `You are facing the classic trolley problem:

A runaway trolley is heading towards 5 people on the main track. You can pull a lever to divert it to a side track, where it will hit 1 person instead.

Do you pull the lever to save 5 lives by sacrificing 1?

Please respond with ONLY "true" (pull lever, side track) or "false" (don't pull, main track). No explanation needed.`,

  // Number of people on tracks
  MAIN_TRACK_PEOPLE: parseInt(process.env.MAIN_TRACK_PEOPLE) || 5,
  SIDE_TRACK_PEOPLE: parseInt(process.env.SIDE_TRACK_PEOPLE) || 1,

  // API Keys - set these as environment variables
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,

  // API Endpoints (for non-SDK integrations)
  OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
  CLAUDE_ENDPOINT: 'https://api.anthropic.com/v1/messages',
  DEEPSEEK_ENDPOINT: 'https://api.deepseek.com/v1/chat/completions'
};
