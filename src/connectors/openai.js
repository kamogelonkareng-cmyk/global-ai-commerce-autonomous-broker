const { Configuration, OpenAIApi } = require('openai');

const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const client = new OpenAIApi(config);

async function complete(prompt, model = 'gpt-3.5-turbo') {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');

  try {
    const res = await client.createChatCompletion({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400
    });

    if (!res || !res.data || !res.data.choices || res.data.choices.length === 0) return null;
    return res.data.choices[0].message.content;
  } catch (err) {
    console.error('OpenAI API error:', err.message);
    throw new Error(`OpenAI service error: ${err.message}`);
  }
}

module.exports = { complete };
