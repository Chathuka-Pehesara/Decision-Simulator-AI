// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so your phone or browser can communicate with the server
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

/**
 * POST /simulate
 * Receives: { decision, risk, personality }
 * Contacts Gemini API to generate context-rich JSON scenarios.
 */
app.post('/simulate', async (req, res) => {
  const { decision, risk, personality } = req.body;

  if (!decision || !decision.trim()) {
    return res.status(400).json({ error: 'Decision string is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    console.log(`[AI MODE] Generating real Generative AI simulations for: "${decision}"`);
    try {
      const result = await generateGeminiSimulation(decision, risk, personality, apiKey);
      return res.json(result);
    } catch (err) {
      console.error('[AI MODE ERROR] Failed calling Gemini, falling back to Server Simulator...', err.message);
      const fallbackResult = generateServerSimulation(decision, risk, personality);
      return res.json(fallbackResult);
    }
  } else {
    console.log(`[SIMULATOR MODE] No GEMINI_API_KEY found in .env. Serving local context scenarios for: "${decision}"`);
    const fallbackResult = generateServerSimulation(decision, risk, personality);
    return res.json(fallbackResult);
  }
});

/**
 * Call Gemini 2.5 Flash API and instruct it to return a clean JSON payload matching our schema
 */
async function generateGeminiSimulation(decision, risk, personality, apiKey) {
  const modelName = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  // Formulate a strict system instruction prompt
  const prompt = `You are "Decision Simulator AI", a sophisticated, neutral, and analytical future-outcome modeling system.
The user wants to simulate the possible future paths of a real-life decision.

Decision: "${decision}"
Risk Tolerance: "${risk || 'medium'}"
Personality Lens: "${personality || 'balanced'}"

INSTRUCTIONS:
1. Simulate 3 to 5 highly realistic, context-specific future scenarios (do NOT use corporate templates unless the decision is explicitly about business/career!).
2. For each scenario, generate:
   - A timeline (e.g. "1 - 6 months", "2 hours", "1 year")
   - A probability percentage (number between 0 and 100)
   - A specific risk level (low, medium, high)
   - An emotional impact summary
   - A logical "reasoning" paragraph explaining why this path occurs based on the selected decision-making lens (${personality}) and risk posture (${risk}).
3. Extract 4 crucial "key factors to consider" that the user should monitor.
4. Conclude with a strictly neutral, non-advice "final note".
5. IMPORTANT BEHAVIOR RULES:
   - Do NOT give advice or recommendations.
   - Do NOT use the words "you should", "I recommend", "you ought to", or "it is best to".
   - The tone must remain completely objective, logical, and analytical.

OUTPUT FORMAT:
Return your response ONLY as a single valid JSON object following this exact structure:
{
  "decision_summary": "Short rephrased summary of the decision statement",
  "scenarios": [
    {
      "title": "Clear Title of Scenario",
      "description": "Detailed, highly customized description of what happens in this future",
      "timeline": "Timeline span",
      "risk_level": "low or medium or high",
      "emotional_impact": "Emotional descriptor",
      "probability": 75,
      "reasoning": "Logical analysis of why this outcome manifests"
    }
  ],
  "key_factors_to_consider": [
    "Factor 1 text...",
    "Factor 2 text..."
  ],
  "final_note": "A neutral analytical disclaimer reminding the user that this is a simulator, not advice."
}

Do NOT wrap the JSON inside markdown code blocks (like \`\`\`json ... \`\`\`). Return raw JSON text only.`;

  // Setup a 45-second abort timeout on the server side to accommodate deep reasoning AI
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 45000);

  try {
    // Make standard Node fetch request
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini API response contained empty generation candidate.');
    }

    // Clean and parse JSON safely
    let cleanText = rawText.trim();
    if (cleanText.includes('```json')) {
      cleanText = cleanText.split('```json')[1].split('```')[0].trim();
    } else if (cleanText.includes('```')) {
      cleanText = cleanText.split('```')[1].split('```')[0].trim();
    }

    return JSON.parse(cleanText);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Server-Side Contextual Fallback Simulator (runs offline or if API key is missing)
 */
function generateServerSimulation(decision, riskTolerance, personality) {
  const norm = decision.toLowerCase();
  const cleanNorm = norm.replace(/[?.!,]/g, '').trim();

  const personalityLabel = personality ? personality.charAt(0).toUpperCase() + personality.slice(1) : 'Balanced';
  const riskLabel = riskTolerance ? riskTolerance.charAt(0).toUpperCase() + riskTolerance.slice(1) : 'Medium';

  let scenarios = [];
  let keyFactors = [];

  // 1. Symptom & Attendance Matchers
  const healthSymptoms = ['stomach', 'stomacth', 'pain', 'ache', 'sick', 'ill', 'fever', 'flu', 'cough', 'cold', 'headache'];
  const destinations = ['school', 'class', 'lecture', 'college', 'university', 'office', 'work', 'job', 'meeting', 'party', 'exam'];
  
  const hasSymptom = healthSymptoms.some(word => cleanNorm.includes(word));
  const hasDestination = destinations.some(word => cleanNorm.includes(word));

  // 2. Food Matchers
  const foodItems = ['eat', 'drink', 'consume', 'apple', 'food', 'meat', 'milk', 'water', 'coffee', 'pill', 'diet', 'mushroom'];
  const hasFood = foodItems.some(word => cleanNorm.includes(word));

  // 3. Time Allocation Matchers
  const leisureWords = ['play', 'game', 'watch', 'movie', 'sleep', 'relax'];
  const productivityWords = ['study', 'learn', 'work', 'homework', 'exam', 'test'];
  const hasLeisure = leisureWords.some(word => cleanNorm.includes(word));
  const hasProductivity = productivityWords.some(word => cleanNorm.includes(word));

  // 4. Pet / Animal Care Matchers [NEW]
  const petWords = ['cat', 'dog', 'pet', 'animal', 'bird', 'fish', 'kitten', 'puppy', 'veterinary', 'vet', 'feed', 'bite', 'scratch'];
  const hasPet = petWords.some(word => cleanNorm.includes(word));

  // Standard category detection
  const isCareer = ['job', 'offer', 'career', 'promote', 'resign', 'quit', 'interview'].some(w => cleanNorm.includes(w));
  const isBusiness = ['business', 'start', 'company', 'startup', 'invest', 'client', 'sales'].some(w => cleanNorm.includes(w));
  const isRelocate = ['move', 'relocate', 'country', 'city', 'abroad', 'travel', 'flight'].some(w => cleanNorm.includes(w));
  const isPersonal = ['marry', 'date', 'relationship', 'propose', 'divorce', 'friend', 'love'].some(w => cleanNorm.includes(w));
  const isFinancial = ['buy', 'house', 'car', 'property', 'spend', 'cost', 'price', 'crypto', 'stock'].some(w => cleanNorm.includes(w));

  if (hasPet) {
    let animalNoun = 'pet';
    if (cleanNorm.includes('cat') || cleanNorm.includes('kitten')) animalNoun = 'cat';
    else if (cleanNorm.includes('dog') || cleanNorm.includes('puppy')) animalNoun = 'dog';

    scenarios = [
      {
        title: 'Calm Observation & Boundary Recognition',
        description: `You choose to remain calm and static in the house. Animals react heavily to sudden human movement. By moving slowly or staying still, the ${animalNoun} remains relaxed, preventing the activation of their defensive or chase instincts.`,
        timeline: 'Immediate - 10 Minutes',
        risk_level: 'low',
        emotional_impact: 'Patient, calm, and safe',
        probability: 75,
        reasoning: `Animal behaviorists emphasize that running triggers predatory chase drives in cats and dogs alike. Staying calm shows you are not a threat or prey, neutralizing volatile reactions.`
      },
      {
        title: 'High-Energy Play / Chase Activation',
        description: `You decide to run. This sudden acceleration acts as a stimulus for the ${animalNoun}, triggering their natural chasing reflex. They sprint after you, which may result in an overly excited play session or accidental defensive scratches/bites.`,
        timeline: '5 - 15 Minutes',
        risk_level: 'medium',
        emotional_impact: personality === 'emotional' ? 'Exhilarated but nervous' : 'High energy alert',
        probability: 50,
        reasoning: `Sprinting inside an animal's environment changes their play metrics. A ${riskLabel} approach accepts that physical chase play introduces high unpredictability.`
      },
      {
        title: 'Guided Distraction (Toy/Treat Sourcing)',
        description: `Instead of running or reacting, you grab a toy or feed the ${animalNoun} a treat, redirecting their focus. They satisfy their engagement needs completely while you maintain absolute physical safety and structural control.`,
        timeline: '2 - 5 Minutes',
        risk_level: 'low',
        emotional_impact: 'Satisfied and intelligent redirection',
        probability: 80,
        reasoning: `Positive redirection is the most effective logical technique in pet management. Aligned with ${personalityLabel} analysis, this path satisfies both parties.`
      }
    ];

    keyFactors = [
      `The ${animalNoun}'s current posture (dilated pupils, low tail vs relaxed ears)`,
      'Presence of toys or treats to redirect chase energy',
      'Your physical distance and speed of movement',
      'Total indoor safety (slip hazards while running)'
    ];

  } else if (hasSymptom && hasDestination) {
    let symptomNoun = 'stomach discomfort';
    if (cleanNorm.includes('headache')) symptomNoun = 'headache';
    else if (cleanNorm.includes('fever')) symptomNoun = 'fever';

    let destNoun = 'school/work';
    if (cleanNorm.includes('school')) destNoun = 'school';
    else if (cleanNorm.includes('work') || cleanNorm.includes('office')) destNoun = 'work';

    scenarios = [
      {
        title: 'Recovery-First & Active Absence',
        description: `You choose to stay home, prioritize self-care, and allow your body to heal. While you temporarily defer your obligations at ${destNoun}, your physical health stabilizes rapidly, reducing illness duration and preventing the transmission of germs.`,
        timeline: '24 - 48 Hours',
        risk_level: 'low',
        emotional_impact: 'Calm and focused on healing',
        probability: 75,
        reasoning: `Biological resource preservation suggests that rest reduces total recovery time. Staying home avoids systemic exhaustion and secondary infections.`
      },
      {
        title: 'Pushing Through & Exhaustion Risk',
        description: `You decide to ignore the ${symptomNoun} and attend ${destNoun}. Your attention span and cognitive capability are severely fractured by the physical distress, leading to extremely low performance and a high risk of prolonged recuperation.`,
        timeline: '4 - 12 Hours',
        risk_level: 'high',
        emotional_impact: 'Physically exhausted and deeply stressed',
        probability: 30,
        reasoning: `Attempting high cognitive output while your immune system is actively fighting ${symptomNoun} drains glycogen reserves, raising physical risk indices.`
      }
    ];

    keyFactors = [
      `Contagion risk to other individuals at ${destNoun}`,
      `Severity of the ${symptomNoun} (stable vs worsening indicators)`,
      'Availability of makeup pathways or remote channels'
    ];

  } else if (hasLeisure && hasProductivity) {
    scenarios = [
      {
        title: 'Immediate Gratification & Backlog Accumulation',
        description: 'You choose immediate relaxation. You experience dopamine release and deep stress reduction, but carry forward a backlog of studies, causing anxiety later.',
        timeline: '2 - 6 Hours',
        risk_level: 'high',
        emotional_impact: 'Short-term fun, long-term stress',
        probability: 60,
        reasoning: 'Prioritizing immediate rewards defers active investments, causing resource compression as deadlines approach.'
      },
      {
        title: 'Disciplined Progress & Leisure Deferral',
        description: 'You focus entirely on studies. You build solid knowledge assets and secure peace of mind regarding upcoming checkpoints, although you encounter immediate cognitive fatigue.',
        timeline: '3 - 8 Hours',
        risk_level: 'low',
        emotional_impact: 'Satisfied, disciplined, but slightly tired',
        probability: 70,
        reasoning: 'Delaying gratification builds structural capability and enables guilt-free leisure later.'
      }
    ];

    keyFactors = [
      'Hours remaining until critical deadlines',
      'Current cognitive stamina remaining',
      'Long-term yield of study progress vs immediate entertainment'
    ];

  } else if (hasFood) {
    let itemNoun = 'food';
    if (cleanNorm.includes('apple')) itemNoun = 'apple';
    else if (cleanNorm.includes('mushroom')) itemNoun = 'mushroom';

    scenarios = [
      {
        title: 'Safe Consumption / Superficial Bruising',
        description: `You consume the ${itemNoun}. The blemishes turn out to be harmless superficial markings. The taste is acceptable, resulting in standard nutritional intake with zero health consequences.`,
        timeline: '10 Minutes - 4 Hours',
        risk_level: 'low',
        emotional_impact: 'Relieved, physically neutral',
        probability: 65,
        reasoning: 'Superficial damage rarely alters organic toxicity. Trimming blemishes reduces exposure to near zero.'
      },
      {
        title: 'Active Pathogen Ingestion & Food Poisoning',
        description: `The markings contain active mold or bacterial colonies. Consuming the ${itemNoun} triggers a localized immune reaction, causing nausea, stomach cramps, or mild food poisoning.`,
        timeline: '2 - 12 Hours',
        risk_level: 'high',
        emotional_impact: 'Anxious, experiencing regret',
        probability: 25,
        reasoning: 'Biological hazards increase exponentially with cellular food degradation, exposing your digestive tract to active pathogens.'
      }
    ];

    keyFactors = [
      'Depth and firmness of the blemishes (soft indicates rot)',
      'Immune system baseline and gut resilience',
      'Availability of spotless alternative items'
    ];

  } else {
    // Dynamic Sentence action-extractor for general queries
    let actionStatement = cleanNorm;
    const prefixes = [
      /^should i\s+/i,
      /^should we\s+/i,
      /^i want to\s+/i,
      /^i need to\s+/i,
      /^is it good to\s+/i,
      /^what if i\s+/i
    ];
    for (const prefix of prefixes) {
      if (prefix.test(actionStatement)) {
        actionStatement = actionStatement.replace(prefix, '');
        break;
      }
    }
    actionStatement = actionStatement.trim() || 'proceed with this decision';

    scenarios = [
      {
        title: 'Direct Engagement Path',
        description: `You proceed with the action: "${actionStatement}". This directly initiates the physical or logical process. You experience the primary immediate benefits of this choice, but must actively manage the secondary friction and resource commitments required to keep it stable.`,
        timeline: '1 - 3 Months',
        risk_level: 'medium',
        emotional_impact: 'Measured analytical engagement',
        probability: 65,
        reasoning: `Direct action commits assets to a specific pathway. According to ${personalityLabel} modeling, ensuring you have sufficient buffers to execute "${actionStatement}" minimizes risk.`
      },
      {
        title: 'Defensive Deferral & Status Quo',
        description: `You choose to delay, modify, or not proceed with: "${actionStatement}". This completely preserves your current baseline resources, attention, and status quo, avoiding any immediate volatility. However, it postpones any potential changes associated with this choice.`,
        timeline: 'Immediate - 1 Month',
        risk_level: 'low',
        emotional_impact: 'Calm, patient, and highly secure',
        probability: 75,
        reasoning: `Maintaining the status quo is the safest default when data is incomplete. A ${riskLabel} risk setting highlights that avoiding "${actionStatement}" preserves optionality.`
      }
    ];

    keyFactors = [
      `Total resource investment required to sustain: "${actionStatement}"`,
      `Reversibility of the choice if it triggers friction`,
      'Worst-case scenario impact on your core safety and stability'
    ];
  }

  return {
    decision_summary: decision,
    scenarios: scenarios,
    key_factors_to_consider: keyFactors,
    final_note: `This simulation outlines potential scenarios based on a risk profile of ${riskLabel} and a ${personalityLabel} decision-making lens. It represents a theoretical modeling of possibilities using current behavioral heuristics, and is not, under any circumstances, to be considered direct personal, career, financial, or legal advice. Every decision carries unique real-world variables; maintain independent agency and exercise personal caution.`
  };
}

// Start the backend server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🤖 DECISION SIMULATOR AI BACKEND SERVER ACTIVE`);
  console.log(`🚀 Listening on: http://localhost:${PORT}`);
  console.log(`👉 Primary Endpoint: POST http://localhost:${PORT}/simulate`);
  console.log(`======================================================\n`);
});
