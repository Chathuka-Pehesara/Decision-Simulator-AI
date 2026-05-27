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
  const prompt = `You are "Decision Simulator AI", an analytical decision-science system modeling future outcomes.
The user wants to simulate possible future paths of a decision.

Decision: "${decision}"
Risk Tolerance: "${risk || 'medium'}"
Personality Lens: "${personality || 'balanced'}"

INSTRUCTIONS:
1. Simulate exactly 3 highly realistic, context-specific scenarios.
2. For each scenario, generate:
   - A timeline (e.g. "24-48 hours", "1-3 months", "1 year")
   - A probability percentage (0-100) based on realistic statistical base rates.
   - A specific risk level (low, medium, high) reflecting the decision's parameters.
   - An emotional impact summary (concise, e.g. "Relieved", "Moderately stressed").
   - A logical "reasoning" paragraph (exactly 2-3 sentences) explaining the cause-and-effect chain. The reasoning MUST conclude with a clear probability justification: "The probability of X% is grounded in [specific base rate / logical heuristic]."
3. Extract exactly 4 concise "key_factors_to_consider" (maximum 10 words per factor).
4. COGNITIVE BIAS ANALYSIS:
   - Analyze the decision for common cognitive biases (e.g., Sunk Cost Fallacy, Present Bias, Loss Aversion, Status Quo Bias, Optimism Bias).
   - Calculate a "bias_score" (0-100) based on clear criteria: subjective words (+15), absence of alternatives (+20), lack of trade-offs (+20), and temporal discounting (+15).
   - List 1 to 3 "detected_biases" (each with "name", "severity": low/medium/high, and a concise "explanation" of exactly 1-2 sentences).
   - Provide a "reframed_decision": a completely objective, neutral rephrasing to aid clear thinking.
5. MULTI-AGENT BOARDROOM DEBATE:
   - Generate a brief debate transcript of exactly 3 turns (one message per advisor):
     * "The Visionary Optimist" (upside/growth opportunity).
     * "The Devil's Advocate" (risk mitigation/downside).
     * "The Cold Pragmatist" (objective trade-offs/current resources).
   - Keep each message strictly limited to 1-2 concise, highly realistic sentences. Avoid dramatic/theatrical arguments; speak like professional advisors.
   - Summarize the debate into a single-sentence "consensus_summary".
6. Conclude with a neutral, non-advice "final_note" disclaimer.
7. CRITICAL LANGUAGE & TONE RULES:
   - Keep outputs short, structured, and factual.
   - Do NOT use sensationalist, dramatic, or cliché AI words (e.g., "catastrophic", "dreaded collapse", "dopamine hit", "ruin", "doom", "elite", "profound").
   - Use objective decision-science terminology (e.g., "opportunity cost", "temporal discounting", "base rates", "marginal utility", "variance").
   - Avoid direct advice or recommendations (no "you should", "I recommend").

OUTPUT FORMAT:
Return response ONLY as a single valid JSON object with this exact structure:
{
  "decision_summary": "Short rephrased summary of the decision statement",
  "scenarios": [
    {
      "title": "Clear Title of Scenario",
      "description": "Short, realistic description of this future (max 2 sentences)",
      "timeline": "Timeline span",
      "risk_level": "low or medium or high",
      "emotional_impact": "Concise emotional state",
      "probability": 65,
      "reasoning": "Logical analysis concluding with: The probability of 65% is grounded in..."
    }
  ],
  "key_factors_to_consider": [
    "Concise factor 1 (max 10 words)",
    "Concise factor 2 (max 10 words)",
    "Concise factor 3 (max 10 words)",
    "Concise factor 4 (max 10 words)"
  ],
  "cognitive_analysis": {
    "bias_score": 45,
    "detected_biases": [
      {
        "name": "Sunk Cost Fallacy",
        "severity": "high",
        "explanation": "Short 1-2 sentence explanation."
      }
    ],
    "reframed_decision": "Objective rephrased version of the decision"
  },
  "boardroom_debate": {
    "advisors": [
      { "name": "The Visionary Optimist", "role": "Focuses on potential upside, growth, and bold opportunities" },
      { "name": "The Devil's Advocate", "role": "Focuses on risk mitigation, potential downside, failure points, and worst-case scenarios" },
      { "name": "The Cold Pragmatist", "role": "Focuses on objective, data-driven, practical steps, and current resource usage" }
    ],
    "debate_transcript": [
      { "speaker": "The Visionary Optimist", "message": "Dialogue text (max 2 sentences)." },
      { "speaker": "The Devil's Advocate", "message": "Dialogue text (max 2 sentences)." },
      { "speaker": "The Cold Pragmatist", "message": "Dialogue text (max 2 sentences)." }
    ],
    "consensus_summary": "Single sentence consensus summary."
  },
  "final_note": "A neutral analytical disclaimer."
}

Do NOT wrap the JSON inside markdown code blocks. Return raw JSON text only.`;

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

  // Matchers
  const healthSymptoms = ['stomach', 'stomacth', 'pain', 'ache', 'sick', 'ill', 'fever', 'flu', 'cough', 'cold', 'headache'];
  const destinations = ['school', 'class', 'lecture', 'college', 'university', 'office', 'work', 'job', 'meeting', 'party', 'exam'];
  const hasSymptom = healthSymptoms.some(word => cleanNorm.includes(word));
  const hasDestination = destinations.some(word => cleanNorm.includes(word));

  const foodItems = ['eat', 'drink', 'consume', 'apple', 'food', 'meat', 'milk', 'water', 'coffee', 'pill', 'diet', 'mushroom'];
  const hasFood = foodItems.some(word => cleanNorm.includes(word));

  const leisureWords = ['play', 'game', 'watch', 'movie', 'sleep', 'relax'];
  const productivityWords = ['study', 'learn', 'work', 'homework', 'exam', 'test'];
  const hasLeisure = leisureWords.some(word => cleanNorm.includes(word));
  const hasProductivity = productivityWords.some(word => cleanNorm.includes(word));

  const petWords = ['cat', 'dog', 'pet', 'animal', 'bird', 'fish', 'kitten', 'puppy', 'veterinary', 'vet', 'feed', 'bite', 'scratch'];
  const hasPet = petWords.some(word => cleanNorm.includes(word));

  const isCareer = ['job', 'offer', 'career', 'promote', 'resign', 'quit', 'interview'].some(w => cleanNorm.includes(w));

  // Heuristic calculation of cognitive bias score
  let biasScore = 15; 
  if (cleanNorm.includes('should i') || cleanNorm.includes('what if')) biasScore += 10;
  if (cleanNorm.includes('quit') || cleanNorm.includes('resign') || cleanNorm.includes('marry')) biasScore += 25;
  if (hasSymptom || hasFood) biasScore += 15;
  if (hasLeisure && hasProductivity) biasScore += 20;
  biasScore = Math.min(95, biasScore);

  if (hasPet) {
    let animalNoun = 'pet';
    if (cleanNorm.includes('cat') || cleanNorm.includes('kitten')) animalNoun = 'cat';
    else if (cleanNorm.includes('dog') || cleanNorm.includes('puppy')) animalNoun = 'dog';

    scenarios = [
      {
        title: 'Calm Observation & Boundary Recognition',
        description: `Remaining still or moving slowly prevents activating the ${animalNoun}'s protective or chase instincts.`,
        timeline: '1-10 minutes',
        risk_level: 'low',
        emotional_impact: 'Calm and secure',
        probability: 75,
        reasoning: `Slowing physical velocity prevents triggering automated prey or chase reflexes in domesticated animals. The probability of 75% is grounded in standard canine/feline threat assessment baselines.`
      },
      {
        title: 'High-Energy Play / Chase Activation',
        description: `Sudden acceleration triggers the ${animalNoun}'s natural chasing drive, leading to an active chase or accidental play bite.`,
        timeline: '5-15 minutes',
        risk_level: 'medium',
        emotional_impact: 'Moderately stressed',
        probability: 45,
        reasoning: `Rapid movement triggers instinctual prey drive mechanisms. The probability of 45% is grounded in domestic pet chase reactivity rates.`
      },
      {
        title: 'Guided Redirection',
        description: `Using a toy or treat redirects the ${animalNoun}'s attention to a safe object, neutralizing potential friction.`,
        timeline: '2-5 minutes',
        risk_level: 'low',
        emotional_impact: 'Balanced redirection',
        probability: 80,
        reasoning: `Stimulus substitution effectively transfers focus from human movement to a primary reward. The probability of 80% is grounded in positive reinforcement success rates.`
      }
    ];

    keyFactors = [
      `The ${animalNoun}'s current posture and tension level`,
      'Availability of a toy or treat for redirection',
      'Your physical distance and speed of movement',
      'Total indoor space safety to avoid slip hazards'
    ];

  } else if (hasSymptom && hasDestination) {
    let symptomNoun = 'discomfort';
    if (cleanNorm.includes('headache')) symptomNoun = 'headache';
    else if (cleanNorm.includes('fever')) symptomNoun = 'fever';

    let destNoun = 'school/work';
    if (cleanNorm.includes('school')) destNoun = 'school';
    else if (cleanNorm.includes('work') || cleanNorm.includes('office')) destNoun = 'work';

    scenarios = [
      {
        title: 'Recovery-First & Deferral',
        description: `Staying home and resting allows biological recovery and prevents infecting peers.`,
        timeline: '24-48 hours',
        risk_level: 'low',
        emotional_impact: 'Calm and focused on recovery',
        probability: 75,
        reasoning: `Minimizing physical exertion accelerates viral clearance and prevents contagion vectors. The probability of 75% is grounded in average recovery rate variances under active rest.`
      },
      {
        title: 'Pushing Through & Performance Deficit',
        description: `Ignoring the ${symptomNoun} to attend ${destNoun} causes cognitive impairment and longer recovery.`,
        timeline: '4-12 hours',
        risk_level: 'high',
        emotional_impact: 'Physically drained',
        probability: 35,
        reasoning: `Immunological resource diversion limits active focus and performance. The probability of 35% is grounded in typical sickness absence endurance baselines.`
      }
    ];

    keyFactors = [
      `Severity of the ${symptomNoun}`,
      `Contagion risk to others at ${destNoun}`,
      'Availability of makeup pathways or remote channels'
    ];

  } else if (hasLeisure && hasProductivity) {
    scenarios = [
      {
        title: 'Immediate Gratification & Deferral',
        description: 'Choosing immediate leisure provides short-term stress relief but increases task backlog and future pressure.',
        timeline: '2-6 hours',
        risk_level: 'high',
        emotional_impact: 'Short-term relief, long-term stress',
        probability: 60,
        reasoning: 'Temporal discounting favors short-term rewards over long-term task completion. The probability of 60% is grounded in behavioral hyperbolic discounting patterns.'
      },
      {
        title: 'Disciplined Task Execution',
        description: 'Prioritizing work builds progress and secures peace of mind, though causing immediate fatigue.',
        timeline: '3-8 hours',
        risk_level: 'low',
        emotional_impact: 'Satisfied but tired',
        probability: 70,
        reasoning: 'Delaying gratification minimizes deadline pressure and protects cognitive margins. The probability of 70% is grounded in structured productivity success rates.'
      }
    ];

    keyFactors = [
      'Hours remaining until critical deadlines',
      'Current cognitive stamina and attention levels',
      'Long-term yield of progress vs immediate entertainment value'
    ];

  } else if (hasFood) {
    let itemNoun = 'food';
    if (cleanNorm.includes('apple')) itemNoun = 'apple';
    else if (cleanNorm.includes('mushroom')) itemNoun = 'mushroom';

    scenarios = [
      {
        title: 'Superficial Bruising / Safe Intake',
        description: `Consuming the ${itemNoun} results in normal digestion as blemishes are purely superficial.`,
        timeline: '10 minutes - 4 hours',
        risk_level: 'low',
        emotional_impact: 'Physically neutral',
        probability: 65,
        reasoning: 'External skin discoloration rarely correlates with systemic organic toxicity. The probability of 65% is grounded in agricultural produce safety statistics.'
      },
      {
        title: 'Active Pathogen Ingestion',
        description: `The blemishes contain active microbial colonies, causing gastrointestinal distress.`,
        timeline: '2-12 hours',
        risk_level: 'high',
        emotional_impact: 'Anxious and regretful',
        probability: 25,
        reasoning: 'Ingesting mold or bacterial strains overwhelms baseline digestive defenses. The probability of 25% is grounded in raw food pathogen exposure rates.'
      }
    ];

    keyFactors = [
      'Depth and firmness of the blemishes (softness indicates rot)',
      'Immune system baseline and gut resilience',
      'Availability of spotless alternative items'
    ];

  } else {
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
        description: `Proceeding with the action commits resources, seeking immediate benefits while managing secondary operational overhead.`,
        timeline: '1-3 months',
        risk_level: 'medium',
        emotional_impact: 'Measured engagement',
        probability: 65,
        reasoning: `Active commitment of attention produces direct feedback but reduces overall flexibility. The probability of 65% is grounded in standard action-to-outcome statistics.`
      },
      {
        title: 'Defensive Deferral & Preservation',
        description: `Delaying or avoiding the action preserves current resources and avoids short-term volatility.`,
        timeline: '1 month',
        risk_level: 'low',
        emotional_impact: 'Calm and stable',
        probability: 75,
        reasoning: `Maintaining the status quo minimizes risk exposure while information is incomplete. The probability of 75% is grounded in status quo preference baselines.`
      }
    ];

    keyFactors = [
      `Total resource investment required to sustain: "${actionStatement}"`,
      `Reversibility of the choice if it triggers friction`,
      'Worst-case scenario impact on core safety and stability'
    ];
  }

  // Set up cognitive analysis details
  let detectedBiases = [];
  let reframedDecision = `Should I evaluate the exact trade-offs of proceeding with this decision objectively?`;
  let advisors = [
    { name: "The Visionary Optimist", role: "Focuses on potential upside, growth, and bold opportunities" },
    { name: "The Devil's Advocate", role: "Focuses on risk mitigation, potential downside, failure points, and worst-case scenarios" },
    { name: "The Cold Pragmatist", role: "Focuses on objective, data-driven, practical steps, and current resource usage" }
  ];
  let debateTranscript = [];
  let consensusSummary = "";

  if (hasPet) {
    detectedBiases = [{
      name: "Anthropomorphic Projection Bias",
      severity: "low",
      explanation: "Assuming that your pet interprets rapid physical movement (like sprinting away) with human-like understanding rather than animal threat/play reflexes."
    }];
    reframedDecision = `What are the physiological safety differences between staying calm or utilizing direct food distraction when managing animal behaviors?`;
    debateTranscript = [
      { speaker: "The Visionary Optimist", message: "Moving energetically may stimulate high-intensity engagement. It turns a static moment into active play." },
      { speaker: "The Devil's Advocate", message: "Sudden movements in a confined space risk physical collision and trigger protective biting. Prioritize static safety." },
      { speaker: "The Cold Pragmatist", message: "Food redirection offers a highly efficient transfer of focus at zero risk cost. Use structured positive reinforcement." }
    ];
    consensusSummary = "Use positive reinforcement or calm positioning as primary safety metrics, reserving physical play for outdoor spaces.";

  } else if (hasSymptom && hasDestination) {
    detectedBiases = [
      {
        name: "Loss Aversion / Sunk Cost Fallacy",
        severity: "high",
        explanation: "Fearing that staying home will result in irrecoverable progress loss, over-weighting short-term attendance over long-term immune recovery."
      }
    ];
    reframedDecision = `Should I prioritize biological healing today, or accept cognitive performance drops to maintain attendance?`;
    debateTranscript = [
      { speaker: "The Visionary Optimist", message: "Pushing through shows dedication and prevents falling behind. We should maintain our active streak." },
      { speaker: "The Devil's Advocate", message: "Pushing through drains your physiological reserves, doubling recovery duration and risking contagion. Stay isolated." },
      { speaker: "The Cold Pragmatist", message: "Verify remote access policies or medical deferrals. If remote work is possible, rest is the optimal strategy." }
    ];
    consensusSummary = "Prioritize immediate recovery to minimize long-term performance deficits, while securing remote accommodation options.";

  } else if (hasLeisure && hasProductivity) {
    detectedBiases = [
      {
        name: "Present Bias / Hyperbolic Discounting",
        severity: "high",
        explanation: "Valuing the immediate relaxation value of entertainment now while heavily discounting the upcoming stress and temporal debt of deadlines."
      }
    ];
    reframedDecision = `How should I divide my available hours between study tasks and leisure to maintain stress-free productivity?`;
    debateTranscript = [
      { speaker: "The Visionary Optimist", message: "Leisure will refresh your cognitive margins. A short game or movie session builds enthusiasm." },
      { speaker: "The Devil's Advocate", message: "Delaying work increases cognitive overhead and deadline anxiety. Procrastination is a net liability." },
      { speaker: "The Cold Pragmatist", message: "Implement a structured interval system: 90 minutes of focused task execution followed by a 20-minute leisure reward." }
    ];
    consensusSummary = "Execute a Pomodoro or structured split-time system to secure progress before unlocking guilt-free leisure rewards.";

  } else if (hasFood) {
    detectedBiases = [
      {
        name: "Optimism Bias & Sunk Cost",
        severity: "medium",
        explanation: "Believing you are biologically immune to potential bacterial pathogens because you do not want to throw away purchased food."
      }
    ];
    reframedDecision = `Should I consume this questionable item with potential mold markers, or utilize a safe nutritional alternative?`;
    debateTranscript = [
      { speaker: "The Visionary Optimist", message: "The blemishes look superficial. Trimming the minor spots protects the food from waste." },
      { speaker: "The Devil's Advocate", message: "A minor food poisoning incident will cost you 2 days of productive life. Discarding a low-cost item is far cheaper than medical costs." },
      { speaker: "The Cold Pragmatist", message: "Assess the structural firmness of the item. If it is soft or smells off, the fungal network is already deep. Discard it." }
    ];
    consensusSummary = "Do not consume if structural integrity has degraded; prioritize physical safety when spotless alternatives exist.";

  } else {
    let actionStr = cleanNorm.replace(/should i|should we|i want to|i need to|is it good to|what if i/gi, '').trim() || 'this action';
    detectedBiases = [
      {
        name: "Status Quo Bias / Framing Effect",
        severity: "medium",
        explanation: "Heavily favoring standard comfortable patterns or framing the choice around immediate fears instead of analyzing long-term compounding effects."
      }
    ];
    reframedDecision = `What are the clear resource expenditures, risks, and compounding advantages of choosing to: "${actionStr}"?`;
    debateTranscript = [
      { speaker: "The Visionary Optimist", message: `Executing "${actionStr}" opens new growth trajectories and breaks static patterns.` },
      { speaker: "The Devil's Advocate", message: `This commitment introduces resource volatility and reduces time margins. The downside risk remains high.` },
      { speaker: "The Cold Pragmatist", message: "Initiate a low-risk, low-cost pilot phase to gather outcome data before making a long-term commitment." }
    ];
    consensusSummary = "Pursue the action through small, low-risk experiments to validate outcomes before committing significant resources.";
  }

  return {
    decision_summary: decision,
    scenarios: scenarios,
    key_factors_to_consider: keyFactors,
    cognitive_analysis: {
      bias_score: biasScore,
      detected_biases: detectedBiases,
      reframed_decision: reframedDecision
    },
    boardroom_debate: {
      advisors: advisors,
      debate_transcript: debateTranscript,
      consensus_summary: consensusSummary
    },
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
