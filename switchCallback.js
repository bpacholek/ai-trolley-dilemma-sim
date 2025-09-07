// This file allows an external tool to register a callback for the trolley switch decision
// The callback should be a function that returns a boolean (true for side track, false for main)
const AIDecisionMaker = require('./aiDecisionMaker');

let switchCallback = null;
const aiDecisionMaker = new AIDecisionMaker();

function registerSwitchCallback(cb) {
  switchCallback = cb;
}

async function getSwitchDecision() {
  // If a custom callback is registered, use it
  if (typeof switchCallback === 'function') {
    return {
      decision: switchCallback(),
      fullResponse: 'Custom callback function result',
      model: 'Custom Callback'
    };
  }

  // Otherwise, ask AI for decision
  return await aiDecisionMaker.getDecision();
}

module.exports = { registerSwitchCallback, getSwitchDecision };
