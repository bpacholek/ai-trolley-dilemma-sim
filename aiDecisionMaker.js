const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');

class AIDecisionMaker {
  constructor() {
    // Don't store the prompt here - get it dynamically when needed

    // Initialize Google Generative AI
    if (config.GOOGLE_API_KEY) {
      this.genAI = new GoogleGenerativeAI(config.GOOGLE_API_KEY);
      this.geminiModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    }
  }

  // Get the current prompt dynamically
  getCurrentPrompt() {
    return config.TROLLEY_PROMPT;
  }

  async askGemini() {
    try {
      if (!this.geminiModel) {
        throw new Error('Gemini model not initialized - check API key');
      }

      const prompt = this.getCurrentPrompt();
      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      var firstLine = text.split('\n')[0];
      console.log('Gemini response:', text);
      return {
        decision: firstLine.toLowerCase().includes('true'),
        fullResponse: text,
        model: 'Gemini'
      };
    } catch (error) {
      console.error('Gemini API error:', error.message);
      return {
        decision: Math.random() < 0.5,
        fullResponse: `Error: ${error.message}`,
        model: 'Gemini (Error)'
      };
    }
  }

  async askOpenAI() {
    try {
      const prompt = this.getCurrentPrompt();
      const response = await axios.post(
        config.OPENAI_ENDPOINT,
        {
          model: 'gpt-5',
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );


      const text = response.data.choices[0].message.content.trim();
      return {
        decision: text.toLowerCase().includes('true'),
        fullResponse: text,
        model: 'OpenAI GPT-5'
      };
    } catch (error) {
      console.log(error);
      console.error('OpenAI API error:', error.message);
      return {
        decision: Math.random() < 0.5,
        fullResponse: `Error: ${error.message}`,
        model: 'OpenAI (Error)'
      };
    }
  }

  async askClaude() {
    try {
      const prompt = this.getCurrentPrompt();
      const response = await axios.post(
        config.CLAUDE_ENDPOINT,
        {
          model: 'claude-opus-4-1-20250805',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'x-api-key': config.ANTHROPIC_API_KEY,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      );

      const text = response.data.content[0].text.trim();
      var firstLine = text.split('\n')[0];
      console.log('Claude response:', text);
      return {
        decision: firstLine.toLowerCase().includes('true'),
        fullResponse: text,
        model: 'Claude Opus'
      };
    } catch (error) {
      console.error('Claude API error:', error.message);
      if (error.response) {
        console.error('Claude API response data:', error.response.data);
      }
      return {
        decision: Math.random() < 0.5,
        fullResponse: `Error: ${error.message}`,
        model: 'Claude (Error)'
      };
    }
  }

  async askDeepseek() {
    try {
      const prompt = this.getCurrentPrompt();
      const response = await axios.post(
        config.DEEPSEEK_ENDPOINT,
        {
          model: 'deepseek-reasoner',
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            'Authorization': `Bearer ${config.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const text = response.data.choices[0].message.content.trim();
      var firstLine = text.split('\n')[0];
      console.log('Deepseek response:', text);
      return {
        decision: firstLine.toLowerCase().includes('true'),
        fullResponse: text,
        model: 'DeepSeek'
      };
    } catch (error) {
      console.error('Deepseek API error:', error.message);
      return {
        decision: Math.random() < 0.5,
        fullResponse: `Error: ${error.message}`,
        model: 'DeepSeek (Error)'
      };
    }
  }

  async getDecision() {
    console.log(`Getting decision from AI model: ${config.AI_MODEL}`);

    switch (config.AI_MODEL.toLowerCase()) {
      case 'gemini':
        return await this.askGemini();
      case 'openai':
        return await this.askOpenAI();
      case 'claude':
        return await this.askClaude();
      case 'deepseek':
        return await this.askDeepseek();
      case 'random':
      default:
        return {
          decision: Math.random() < 0.5,
          fullResponse: 'Random decision (no AI model configured)',
          model: 'Random'
        };
    }
  }
}

module.exports = AIDecisionMaker;
