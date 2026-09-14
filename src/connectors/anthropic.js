// Very small Anthropic connector stub. Replace with real API calls when you have an ANTHROPIC_API_KEY.

async function complete(prompt, model = 'claude-2') {
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      // TODO: implement real Anthropics API call (their client/HTTP interface)
      // For now, fall through to a stub response to keep the broker functional.
      return `Anthropic response (stub): ${prompt.slice(0, 200)}`;
    }
    return `Anthropic stub: ${prompt.slice(0, 200)}`;
  } catch (err) {
    console.error('Anthropic connector error:', err);
    throw new Error(`Anthropic service error: ${err.message}`);
  }
}

module.exports = { complete };
