const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI Deal Negotiator: Uses GPT to intelligently negotiate deal terms
 * Can act as middleman between buyer and seller to close deals
 */

async function generateDealProposal(dealDescription, buyerProfile, sellerProfile) {
  try {
    const prompt = `You are an expert deal broker. Analyze this deal opportunity and generate a professional proposal:

Deal: ${dealDescription}

Buyer Profile: ${JSON.stringify(buyerProfile)}
Seller Profile: ${JSON.stringify(sellerProfile)}

Provide a JSON response with:
- proposedPrice: reasonable middle-ground price
- paymentTerms: suggested terms (e.g., "50% upfront, 50% on completion")
- deliverables: key deliverables
- timeline: suggested timeline
- riskMitigation: 2-3 key risk mitigations
- commissionAmount: 3% of proposed price

Be concise and professional.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    try {
      const content = response.choices[0].message.content;
      // Extract JSON from response
      const jsonMatch = content.match(/\{[^{}]*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw: content };
    } catch (parseErr) {
      return { raw: response.choices[0].message.content };
    }
  } catch (err) {
    console.error('Deal proposal generation error:', err);
    throw err;
  }
}

async function negotiateTerms(currentTerms, party, counterPoints) {
  try {
    const prompt = `You are an expert deal negotiator. The ${party} has raised these counterpoints:

Current Terms: ${JSON.stringify(currentTerms)}
Counterpoints: ${counterPoints}

Respond with a JSON object containing:
- adjustedTerms: revised terms that address the counterpoints
- rationale: brief explanation
- nextSteps: what happens next

Aim for a win-win outcome.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    });

    try {
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[^{}]*\}/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw: content };
    } catch (parseErr) {
      return { raw: response.choices[0].message.content };
    }
  } catch (err) {
    console.error('Negotiation error:', err);
    throw err;
  }
}

async function generateDealClose(dealTerms, buyerName, sellerName) {
  try {
    const prompt = `Generate a professional deal closing summary email:

Buyer: ${buyerName}
Seller: ${sellerName}
Terms: ${JSON.stringify(dealTerms)}

Create a concise email that:
1. Confirms the deal terms
2. Thanks both parties
3. Provides next steps
4. Is professional and celebratory in tone

Keep it under 150 words.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 300,
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error('Deal close generation error:', err);
    throw err;
  }
}

module.exports = {
  generateDealProposal,
  negotiateTerms,
  generateDealClose,
};
