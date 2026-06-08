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
 * Input Normalization and Semantic Standardization Preprocessor
 */
const REFERENCE_VOCABULARY = [
  // Question & helper words
  'should', 'would', 'could', 'what', 'how', 'why', 'when', 'where', 'who', 'which', 'whether',
  'is', 'are', 'am', 'be', 'been', 'was', 'were', 'do', 'does', 'did', 'have', 'has', 'had',
  'can', 'will', 'shall', 'might', 'must',
  
  // Pronouns & basic structural words
  'i', 'me', 'my', 'myself', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'it', 'its', 'they', 'them', 'their', 'this', 'that', 'these', 'those', 'here', 'there',
  'the', 'a', 'an', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'in', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
  'don', 'should', 'now', 'if', 'or', 'and', 'but',
  
  // Basic adjectives & verbs
  'good', 'bad', 'better', 'best', 'worse', 'worst', 'think', 'thinking', 'thought', 'feel',
  'feeling', 'go', 'going', 'gone', 'went', 'stay', 'staying', 'make', 'making', 'take',
  'taking', 'get', 'getting', 'give', 'giving', 'find', 'finding', 'keep', 'keeping',
  'look', 'looking', 'come', 'coming', 'came', 'work', 'working', 'play', 'playing',
  
  // Everyday scenario vocabulary
  'tomorrow', 'today', 'tonight', 'yesterday',
  'resign', 'resignations', 'study', 'studying', 'quit', 'leave',
  'university', 'college', 'school', 'class', 'lecture', 'exam', 'test', 'homework', 'learn',
  'business', 'startup', 'career', 'job', 'offer', 'promote', 'promotion', 'interview',
  'salary', 'money', 'invest', 'invested', 'investment', 'crypto', 'cryptocurrency',
  'desert', 'rain', 'weather', 'land', 'live', 'living', 'house', 'move', 'rent', 'lease',
  'stomach', 'stomachache', 'ache', 'pain', 'fever', 'flu', 'cough', 'cold', 'sick', 'health',
  'medical', 'doctor', 'hospital', 'pill', 'diet', 'food', 'eat', 'drink', 'consume',
  'apple', 'meat', 'milk', 'water', 'coffee', 'mushroom', 'pathogen',
  'cat', 'dog', 'pet', 'animal', 'veterinary', 'vet', 'feed', 'bite', 'scratch',
  'game', 'games', 'gaming', 'watch', 'movie', 'sleep', 'relax',
  'marry', 'relationship', 'travel', 'car', 'buy', 'sell'
];

function getLevenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function correctWord(word) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean || clean.length < 3) return word;
  
  if (REFERENCE_VOCABULARY.includes(clean)) return word;
  
  let bestMatch = null;
  let minDistance = Infinity;
  
  for (const ref of REFERENCE_VOCABULARY) {
    const dist = getLevenshteinDistance(clean, ref);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = ref;
    }
  }
  
  const threshold = clean.length <= 4 ? 1 : 2;
  if (minDistance <= threshold && bestMatch) {
    const isCapitalized = word.charAt(0) === word.charAt(0).toUpperCase();
    let corrected = bestMatch;
    if (isCapitalized) {
      corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
    }
    const startPunct = word.match(/^[^a-zA-Z]+/)?.[0] || '';
    const endPunct = word.match(/[^a-zA-Z]+$/)?.[0] || '';
    return startPunct + corrected + endPunct;
  }
  
  return word;
}

function normalizeInput(decision) {
  if (!decision || typeof decision !== 'string') return '';
  
  // 1. Remove common conversational fluff at the beginning
  let clean = decision.trim().replace(/^(hey AI|hey decision simulator|please help me decide if|i need help deciding if|i am thinking about whether i should|i don't know if i should|so like maybe should i|can you tell me if i should|should i|do i need to|is it good to|what if i)\s+/i, (match) => {
    const low = match.toLowerCase();
    if (low.includes('should i')) return 'Should I ';
    if (low.includes('what if i')) return 'What if I ';
    if (low.includes('do i need to')) return 'Do I need to ';
    return '';
  });
  
  // 2. Tokenize and apply phonetic/Levenshtein spelling correction
  const words = clean.split(/\s+/);
  const correctedWords = words.map(w => correctWord(w));
  let reconstructed = correctedWords.join(' ').replace(/\s+/g, ' ').trim();
  
  // 3. Sentence boundaries cleanup
  if (reconstructed.length > 0) {
    reconstructed = reconstructed.charAt(0).toUpperCase() + reconstructed.slice(1);
    const isQuestion = /^(should|would|could|is|can|what|how|why|if|whether)\b/i.test(reconstructed);
    if (isQuestion && !reconstructed.endsWith('?')) {
      if (reconstructed.endsWith('.')) reconstructed = reconstructed.slice(0, -1);
      reconstructed += '?';
    } else if (!isQuestion && !reconstructed.endsWith('.') && !reconstructed.endsWith('?')) {
      reconstructed += '.';
    }
  }
  
  return reconstructed;
}

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

  const normalized = normalizeInput(decision);
  console.log(`[PREPROCESSOR] Normalized: "${decision}" -> "${normalized}"`);

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    console.log(`[AI MODE] Generating real Generative AI simulations for: "${normalized}"`);
    try {
      const result = await generateGeminiSimulation(normalized, risk, personality, apiKey);
      return res.json(result);
    } catch (err) {
      console.error('[AI MODE ERROR] Failed calling Gemini, falling back to Server Simulator...', err.message);
      const fallbackResult = generateServerSimulation(normalized, risk, personality);
      return res.json(fallbackResult);
    }
  } else {
    console.log(`[SIMULATOR MODE] Serving local context scenarios for: "${normalized}"`);
    const fallbackResult = generateServerSimulation(normalized, risk, personality);
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
  const prompt = `You are "Decision Simulator AI", an industry-grade analytical decision-science and cognitive modeling system.
Your purpose is to generate realistic, explainable, and behaviorally grounded decision simulations.

Decision: "${decision}"
Risk Tolerance: "${risk || 'medium'}"
Personality Lens: "${personality || 'balanced'}"

INSTRUCTIONS:
1. INPUT STANDARDIZATION:
   - Formulate a clean, standardized, grammatically optimized analytical statement of the user's decision in the 'decision_summary' field.
2. CONFIDENCE & UNCERTAINTY ASSESSMENT:
   - Generate a rigorous confidence profile in the 'confidence_assessment' block:
     * 'level': "Low Confidence", "Moderate Confidence", or "High Confidence".
     * 'score': 0-100 calculated from input vagueness, completeness, and context volume.
     * 'limitations': A list of exactly 3 specific real-world limitations (e.g. self-reporting bias, unknown variables, environmental dependencies).
3. COGNITIVE BIAS ENGINE:
   - Analyze the decision text for emotionality, subjective phrasing, impulsivity, framing patterns, and black-and-white thinking.
   - Calculate a grounded 'bias_score' (0-100) based on loaded language (+15), temporal discounting (+20), loss aversion framing (+25), and absence of options (+20).
   - List 1 to 3 'detected_biases' (name, severity: low/medium/high, and a concise 1-2 sentence academic explanation of its manifestation).
   - Provide a 'reframed_decision' (highly objective systems-level rephrasing).
4. EMOTIONAL INTENSITY ENGINE:
   - Scan the decision text for indicators of stress, urgency, anxiety, fear, anger, excitement, or panic.
   - Calculate a grounded 'intensity_score' (0-100) based on vocabulary, word choice, punctuation, and structural pressure.
   - Detail the 'primary_emotion' (e.g., stress, urgency, fear, anxiety, anger, balanced).
   - Set 'distortion_flag' (boolean) to true if the intensity_score is above 50.
   - Formulate a 'cooldown_reframe' (a calm, systems-level, highly objective rephrasing of the decision query that strips away all subjective urgency or anxiety).
5. SCENARIO DIVERSIFICATION ENGINE:
   - Model exactly 3 highly realistic, distinct future scenarios representing tradeoffs, conflicting outcomes, and alternative behavioral tracks.
   - Keep each scenario's 'description' limited to exactly 1-2 concise, analytical sentences.
   - Keep 'emotional_impact' to a concise 1-2 word professional state.
   - Every scenario's 'reasoning' block MUST be formatted exactly as:
     "Probability Heuristic: [Explain how the X% probability is derived from a base rate adjusted by the selected Risk Tolerance (${risk}) and Personality (${personality})]. Systems Analysis: [Explain the concise systems cause-and-effect chain (max 2 sentences)]."
6. STRUCTURED PERSPECTIVE SIMULATION:
   - Refine the multi-agent debate into a structured analysis of conflicting viewpoints. Structure 'boardroom_debate' with exactly 2 expert perspectives:
     * "Logical & Behavioral Perspective": Analyzes cognitive patterns, immediate impulses, and emotional framing.
     * "Risk & Sustainability Perspective": Analyzes long-term viability, resource preservation, and environmental trade-offs.
   - Keep each perspective message limited to exactly 1-2 highly polished systems-thinking sentences. No dialogue tags, slang, or theatrical arguments.
   - Summarize their consensus into a single-sentence 'consensus_summary'.
7. KEY FACTORS:
   - Provide exactly 4 concise key factors to monitor, limited to exactly 6-8 words each.
8. CRITICAL LANGUAGE & TONE RULES:
   - Use objective, professional decision-science terminology (e.g. "temporal discounting", "marginal utility", "variance", "sustainability limit").
   - Strictly prohibit theatrical or dramatic AI words (e.g. "catastrophic", "dreaded collapse", "dopamine hit", "doom", "ruin").
   - Do NOT give direct advice or recommendations.

OUTPUT FORMAT:
Return response ONLY as a single valid JSON object following this structure:
{
  "decision_summary": "Standardized analytical decision query",
  "confidence_assessment": {
    "level": "Moderate Confidence",
    "score": 75,
    "limitations": [
      "Limitation 1",
      "Limitation 2",
      "Limitation 3"
    ]
  },
  "emotional_analysis": {
    "intensity_score": 70,
    "primary_emotion": "Urgency & Stress",
    "distortion_flag": true,
    "cooldown_reframe": "Standardized objective rephrase without urgency"
  },
  "scenarios": [
    {
      "title": "Scenario Title",
      "description": "Concise scenario outcome (1-2 sentences).",
      "timeline": "Timeline span",
      "risk_level": "low or medium or high",
      "emotional_impact": "Concise state",
      "probability": 45,
      "reasoning": "Probability Heuristic: The probability of 45% is derived from... Systems Analysis: ..."
    }
  ],
  "key_factors_to_consider": [
    "Short factor 1",
    "Short factor 2",
    "Short factor 3",
    "Short factor 4"
  ],
  "cognitive_analysis": {
    "bias_score": 50,
    "detected_biases": [
      {
        "name": "Present Bias",
        "severity": "medium",
        "explanation": "Concise explanation."
      }
    ],
    "reframed_decision": "Objective rephrased version"
  },
  "boardroom_debate": {
    "advisors": [
      { "name": "Logical & Behavioral Perspective", "role": "Analyzes cognitive patterns, immediate impulses, and emotional framing" },
      { "name": "Risk & Sustainability Perspective", "role": "Analyzes long-term viability, resource preservation, and environmental trade-offs" }
    ],
    "debate_transcript": [
      { "speaker": "Logical & Behavioral Perspective", "message": "Short 1-2 sentence perspective summary." },
      { "speaker": "Risk & Sustainability Perspective", "message": "Short 1-2 sentence perspective summary." }
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
function calculateHeuristicBiasScore(text) {
  if (!text) return 0;
  const clean = text.toLowerCase();
  
  let score = 15; // baseline rational state
  
  // 1. Emotional Wording Detection
  const emotionalPatterns = [
    /\b(sad|happy|angry|hate|love|scared|terrify|afraid|ruin|dump|escape|regret|feel|feeling|bad|good|worst|best|perfect)\b/g,
    /\b(anxious|nervous|worry|dread|panic|excited|thrilled|depressed|stress|stressed)\b/g,
    /!+/g
  ];
  let emotionalMatches = 0;
  emotionalPatterns.forEach(pattern => {
    const matches = clean.match(pattern);
    if (matches) emotionalMatches += matches.length;
  });
  score += emotionalMatches * 8;
  
  // 2. Ambiguity & Vagueness
  const vaguePatterns = [
    /\b(something|stuff|someone|somehow|maybe|maybe not|whatever|sort of|kind of|anywhere|anything)\b/g
  ];
  let vagueMatches = 0;
  vaguePatterns.forEach(pattern => {
    const matches = clean.match(pattern);
    if (matches) vagueMatches += matches.length;
  });
  score += vagueMatches * 10;
  
  if (text.length < 20) {
    score += 15;
  }
  
  // 3. Uncertainty Indicators
  const uncertaintyPatterns = [
    /\b(probably|possibly|perhaps|not sure|doubt|wonder|guess|confuse|not certain|assume|assumption)\b/g
  ];
  let uncertaintyMatches = 0;
  uncertaintyPatterns.forEach(pattern => {
    const matches = clean.match(pattern);
    if (matches) uncertaintyMatches += matches.length;
  });
  score += uncertaintyMatches * 6;
  
  // 4. Impulsive Phrasing
  const impulsivePatterns = [
    /\b(now|immediate|fast|quick|run|instantly|rush|today|tonight|right away|quit|resign|leave)\b/g
  ];
  let impulsiveMatches = 0;
  impulsivePatterns.forEach(pattern => {
    const matches = clean.match(pattern);
    if (matches) impulsiveMatches += matches.length;
  });
  score += impulsiveMatches * 12;
  
  // 5. Framing Patterns
  const binaryPatterns = [
    /\b(either|or|versus|vs)\b/g,
    /should i\b/g,
    /what if i\b/g,
    /do i have to\b/g
  ];
  let binaryMatches = 0;
  binaryPatterns.forEach(pattern => {
    const matches = clean.match(pattern);
    if (matches) binaryMatches += matches.length;
  });
  score += binaryMatches * 10;
  
  const lossPatterns = [
    /\b(lose|lose out|cost|waste|fail|fail to|afraid of|risk|threat|danger|damage|expense|losing)\b/g
  ];
  let lossMatches = 0;
  lossPatterns.forEach(pattern => {
    const matches = clean.match(pattern);
    if (matches) lossMatches += matches.length;
  });
  score += lossMatches * 10;
  
  return Math.min(95, Math.max(5, score));
}

function getHeuristicBiases(text, biasScore) {
  const clean = text.toLowerCase();
  const detected = [];
  
  if (biasScore >= 50) {
    if (clean.includes('now') || clean.includes('immediate') || clean.includes('fast') || clean.includes('quit') || clean.includes('resign') || clean.includes('leave')) {
      detected.push({
        name: "Present Bias & Temporal Discounting",
        severity: "high",
        explanation: "Over-weighting immediate payoff or relief of a transition while discounting long-term compounding effects and resource preservation requirements."
      });
    }
    
    if (clean.includes('lose') || clean.includes('waste') || clean.includes('fail') || clean.includes('afraid') || clean.includes('risk') || clean.includes('cost')) {
      detected.push({
        name: "Loss Aversion Bias",
        severity: "medium",
        explanation: "Asymmetrical weighting of potential losses over equivalent strategic gains, creating defensive over-reactions to baseline risks."
      });
    }
    
    if (clean.includes('either') || clean.includes('or') || clean.includes('should i') || clean.includes('vs')) {
      detected.push({
        name: "Binary Framing / False Dichotomy",
        severity: "medium",
        explanation: "Structuring the action space into mutually exclusive binary options, ignoring alternative systems-level paths and hybrid options."
      });
    }
    
    if (detected.length === 0) {
      detected.push({
        name: "Confirmation & Overconfidence Heuristics",
        severity: "medium",
        explanation: "Evaluating system dynamics based on prior assumptions rather than complete baseline datasets."
      });
    }
  } else {
    if (clean.match(/\b(feel|feeling|good|bad|sad|happy|angry)\b/)) {
      detected.push({
        name: "Affect Heuristic",
        severity: "low",
        explanation: "Allowing subjective immediate emotional feedback or visceral responses to influence risk tolerance bounds."
      });
    }
    
    if (detected.length === 0) {
      detected.push({
        name: "Baseline Cognitive Heuristics",
        severity: "low",
        explanation: "Standard mental shortcuts used to maintain operational velocity in decision modeling, without significant distortion."
      });
    }
  }
  
  return detected;
}

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

  // 1. Dynamic Cognitive Bias Engine
  const biasScore = calculateHeuristicBiasScore(decision);
  const detectedBiases = getHeuristicBiases(decision, biasScore);

  // 2. Confidence & Uncertainty Framework
  let confidenceScore = 90;
  if (decision.length < 25) confidenceScore -= 15;
  if (!hasPet && !hasSymptom && !hasFood && !hasLeisure && !isCareer) confidenceScore -= 20;
  if (riskTolerance === 'high') confidenceScore -= 10;
  confidenceScore = Math.max(35, confidenceScore);
  
  let confidenceLevel = 'High Confidence';
  if (confidenceScore < 60) confidenceLevel = 'Low Confidence';
  else if (confidenceScore < 80) confidenceLevel = 'Moderate Confidence';

  let confidenceLimitations = [];
  if (hasPet) {
    confidenceLimitations = [
      "Animal behavioral history and specific socialization baseline are unquantified.",
      "Indoor physical layout, slip factors, and exit routes are unspecified.",
      "Self-reported phrasing lacks active visual threat indicators or body posture cues."
    ];
  } else if (hasSymptom && hasDestination) {
    confidenceLimitations = [
      "Biological symptom severity is purely self-reported and lacks direct clinical metrics.",
      "Specific workplace/academic penalty frameworks for absenteeism are unquantified.",
      "Individual immunological baseline and vaccine history parameters are omitted."
    ];
  } else if (hasLeisure && hasProductivity) {
    confidenceLimitations = [
      "Impending assessment deadline rigidity and exact grading weights are unspecified.",
      "Subject's exact learning baseline and daily cognitive stamina limits are missing.",
      "Total study syllabus volume and remaining preparation assets are unquantified."
    ];
  } else if (hasFood) {
    confidenceLimitations = [
      "Microbial pathogen presence cannot be clinically measured from text descriptions.",
      "Food washing hygiene, thermal sterilization options, and cook level are missing.",
      "Subject's gastrointestinal tract resilience and immune thresholds are unquantified."
    ];
  } else {
    confidenceLimitations = [
      "Vague decision query limits the semantic focus of systems simulations.",
      "Contextual baseline assets, capital, and resource thresholds are unquantified.",
      "Reversibility indices of the planned action are missing."
    ];
  }

  // Helper to adjust probabilities dynamically based on Risk & Personality
  const getDynamicProbability = (baseRate, riskWeight, isPositivePath) => {
    let prob = baseRate;
    if (riskTolerance === 'low') {
      prob += isPositivePath ? 10 : -15;
    } else if (riskTolerance === 'high') {
      prob += isPositivePath ? -10 : 15;
    }
    if (personality === 'rational') {
      prob += isPositivePath ? 5 : -5;
    } else if (personality === 'emotional') {
      prob += isPositivePath ? -10 : 10;
    }
    return Math.min(90, Math.max(10, prob));
  };

  if (hasPet) {
    let animalNoun = 'pet';
    if (cleanNorm.includes('cat') || cleanNorm.includes('kitten')) animalNoun = 'cat';
    else if (cleanNorm.includes('dog') || cleanNorm.includes('puppy')) animalNoun = 'dog';

    const p1 = getDynamicProbability(75, 'low', true);
    const p2 = getDynamicProbability(45, 'medium', false);
    const p3 = getDynamicProbability(80, 'low', true);

    scenarios = [
      {
        title: 'Calm Observation & Boundary Recognition',
        description: `Remaining still or moving slowly prevents activating the ${animalNoun}'s protective or chase instincts.`,
        timeline: '1-10 minutes',
        risk_level: 'low',
        emotional_impact: 'Measured',
        probability: p1,
        reasoning: `Probability Heuristic: The base rate of 75% is adjusted to ${p1}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Slowing physical velocity prevents triggering automated prey or chase reflexes in domesticated animals.`
      },
      {
        title: 'High-Energy Play / Chase Activation',
        description: `Sudden acceleration triggers the ${animalNoun}'s natural chasing drive, leading to an active chase or accidental play bite.`,
        timeline: '5-15 minutes',
        risk_level: 'medium',
        emotional_impact: 'Anxious',
        probability: p2,
        reasoning: `Probability Heuristic: The base rate of 45% is adjusted to ${p2}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Rapid movement triggers instinctual prey drive mechanisms.`
      },
      {
        title: 'Guided Redirection',
        description: `Using a toy or treat redirects the ${animalNoun}'s attention to a safe object, neutralizing potential friction.`,
        timeline: '2-5 minutes',
        risk_level: 'low',
        emotional_impact: 'Optimistic',
        probability: p3,
        reasoning: `Probability Heuristic: The base rate of 80% is adjusted to ${p3}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Stimulus substitution effectively transfers focus from human movement to a primary reward.`
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

    const p1 = getDynamicProbability(75, 'low', true);
    const p2 = getDynamicProbability(35, 'high', false);

    scenarios = [
      {
        title: 'Recovery-First & Deferral',
        description: `Staying home and resting allows biological recovery and prevents infecting peers.`,
        timeline: '24-48 hours',
        risk_level: 'low',
        emotional_impact: 'Measured',
        probability: p1,
        reasoning: `Probability Heuristic: The base rate of 75% is adjusted to ${p1}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Minimizing physical exertion accelerates viral clearance and prevents contagion vectors.`
      },
      {
        title: 'Pushing Through & Performance Deficit',
        description: `Ignoring the ${symptomNoun} to attend ${destNoun} causes cognitive impairment and longer recovery.`,
        timeline: '4-12 hours',
        risk_level: 'high',
        emotional_impact: 'Anxious',
        probability: p2,
        reasoning: `Probability Heuristic: The base rate of 35% is adjusted to ${p2}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Immunological resource diversion limits active focus and performance.`
      }
    ];

    keyFactors = [
      `Severity of the ${symptomNoun}`,
      `Contagion risk to others at ${destNoun}`,
      'Availability of makeup pathways or remote channels',
      'Cognitive density of immediate obligations'
    ];

  } else if (hasLeisure && hasProductivity) {
    const p1 = getDynamicProbability(60, 'high', false);
    const p2 = getDynamicProbability(70, 'low', true);

    scenarios = [
      {
        title: 'Immediate Gratification & Deferral',
        description: 'Choosing immediate leisure provides short-term stress relief but increases task backlog and future pressure.',
        timeline: '2-6 hours',
        risk_level: 'high',
        emotional_impact: 'Impulsive',
        probability: p1,
        reasoning: `Probability Heuristic: The base rate of 60% is adjusted to ${p1}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Temporal discounting favors short-term rewards over long-term task completion.`
      },
      {
        title: 'Disciplined Task Execution',
        description: 'Prioritizing work builds progress and secures peace of mind, though causing immediate fatigue.',
        timeline: '3-8 hours',
        risk_level: 'low',
        emotional_impact: 'Objective',
        probability: p2,
        reasoning: `Probability Heuristic: The base rate of 70% is adjusted to ${p2}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Delaying gratification minimizes deadline pressure and protects cognitive margins.`
      }
    ];

    keyFactors = [
      'Hours remaining until critical deadlines',
      'Current cognitive stamina and attention levels',
      'Long-term yield of progress vs immediate leisure',
      'Presence of environmental distractions'
    ];

  } else if (hasFood) {
    let itemNoun = 'food';
    if (cleanNorm.includes('apple')) itemNoun = 'apple';
    else if (cleanNorm.includes('mushroom')) itemNoun = 'mushroom';

    const p1 = getDynamicProbability(65, 'low', true);
    const p2 = getDynamicProbability(25, 'high', false);

    scenarios = [
      {
        title: 'Superficial Bruising / Safe Intake',
        description: `Consuming the ${itemNoun} results in normal digestion as blemishes are purely superficial.`,
        timeline: '10 minutes - 4 hours',
        risk_level: 'low',
        emotional_impact: 'Objective',
        probability: p1,
        reasoning: `Probability Heuristic: The base rate of 65% is adjusted to ${p1}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: External skin discoloration rarely correlates with systemic organic toxicity.`
      },
      {
        title: 'Active Pathogen Ingestion',
        description: `The blemishes contain active microbial colonies, causing gastrointestinal distress.`,
        timeline: '2-12 hours',
        risk_level: 'high',
        emotional_impact: 'Skeptical',
        probability: p2,
        reasoning: `Probability Heuristic: The base rate of 25% is adjusted to ${p2}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Ingesting mold or bacterial strains overwhelms baseline digestive defenses.`
      }
    ];

    keyFactors = [
      'Depth and firmness of the blemishes (softness indicates rot)',
      'Immune system baseline and gut resilience',
      'Availability of spotless alternative items',
      'Thermal sterilization options'
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

    const p1 = getDynamicProbability(65, 'medium', true);
    const p2 = getDynamicProbability(75, 'low', true);

    scenarios = [
      {
        title: 'Direct Engagement Path',
        description: `Proceeding with the action commits resources, seeking immediate benefits while managing secondary operational overhead.`,
        timeline: '1-3 months',
        risk_level: 'medium',
        emotional_impact: 'Measured',
        probability: p1,
        reasoning: `Probability Heuristic: The base rate of 65% is adjusted to ${p1}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Active commitment of attention produces direct feedback but reduces overall flexibility.`
      },
      {
        title: 'Defensive Deferral & Preservation',
        description: `Delaying or avoiding the action preserves current resources and avoids short-term volatility.`,
        timeline: '1 month',
        risk_level: 'low',
        emotional_impact: 'Objective',
        probability: p2,
        reasoning: `Probability Heuristic: The base rate of 75% is adjusted to ${p2}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Maintaining the status quo minimizes risk exposure while information is incomplete.`
      }
    ];

    keyFactors = [
      `Total resource investment required to sustain: "${actionStatement}"`,
      `Reversibility of the choice if it triggers friction`,
      'Worst-case scenario impact on core safety and stability',
      'Value of waiting for complete information parameters'
    ];
  }

  let reframedDecision = `Should I evaluate the exact trade-offs of proceeding with this decision objectively?`;
  let advisors = [
    { name: "Logical & Behavioral Perspective", role: "Analyzes cognitive patterns, immediate impulses, and emotional framing" },
    { name: "Risk & Sustainability Perspective", role: "Analyzes long-term viability, resource preservation, and environmental trade-offs" }
  ];
  let debateTranscript = [];
  let consensusSummary = "";

  if (hasPet) {
    reframedDecision = `What are the physiological safety differences between staying calm or utilizing direct food distraction when managing animal behaviors?`;
    debateTranscript = [
      { speaker: "Logical & Behavioral Perspective", message: "Moving energetically stimulates protective threat assessments or play-chase reflexes in domestic animals." },
      { speaker: "Risk & Sustainability Perspective", message: "Confinement limits mobility margins, amplifying collision hazards and protective scratch probabilities. Static positioning reduces system volatility." }
    ];
    consensusSummary = "Use positive reinforcement or calm positioning as primary safety metrics, reserving physical play for outdoor spaces.";

  } else if (hasSymptom && hasDestination) {
    reframedDecision = `Should I prioritize biological healing today, or accept cognitive performance drops to maintain attendance?`;
    debateTranscript = [
      { speaker: "Logical & Behavioral Perspective", message: "Pushing through cognitive thresholds under physiological distress creates temporal performance depletion, leading to severe resource degradation." },
      { speaker: "Risk & Sustainability Perspective", message: "Active viral shedding under high-density spatial exposure elevates systemic contagion variance, causing net productivity drops." }
    ];
    consensusSummary = "Prioritize immediate recovery to minimize long-term performance deficits, while securing remote accommodation options.";

  } else if (hasLeisure && hasProductivity) {
    reframedDecision = `How should I divide my available hours between study tasks and leisure to maintain stress-free productivity?`;
    debateTranscript = [
      { speaker: "Logical & Behavioral Perspective", message: "Temporal discounting heavily weights immediate recreational utilities over distant academic goals. Burning baseline study windows creates deadline-pressure spikes." },
      { speaker: "Risk & Sustainability Perspective", message: "System performance is highly correlated with cumulative preparation assets. Trading preparation for leisure compounds downside risks of subpar grading outcomes." }
    ];
    consensusSummary = "Execute a Pomodoro or structured split-time system to secure progress before unlocking guilt-free leisure rewards.";

  } else if (hasFood) {
    reframedDecision = `Should I consume this questionable item with potential mold markers, or utilize a safe nutritional alternative?`;
    debateTranscript = [
      { speaker: "Logical & Behavioral Perspective", message: "Loss aversion framing over food expenditure bias prompts ingestion of questionable produce, ignoring severe systemic biological hazards." },
      { speaker: "Risk & Sustainability Perspective", message: "Microbial toxicity ingestion creates immediate physiological operational risks, yielding high resource deficits that far outweigh produce replacement costs." }
    ];
    consensusSummary = "Do not consume if structural integrity has degraded; prioritize physical safety when spotless alternatives exist.";

  } else {
    let actionStr = cleanNorm.replace(/should i|should we|i want to|i need to|is it good to|what if i/gi, '').trim() || 'this action';
    reframedDecision = `What are the clear resource expenditures, risks, and compounding advantages of choosing to: "${actionStr}"?`;
    debateTranscript = [
      { speaker: "Logical & Behavioral Perspective", message: "Status quo preservation prevents immediate asset dissipation but caps potential utility upside and growth margins." },
      { speaker: "Risk & Sustainability Perspective", message: "Resource commitment under incomplete informational variance introduces systemic exposure. Pilot phases limit capital degradation." }
    ];
    consensusSummary = "Pursue the action through small, low-risk experiments to validate outcomes before committing significant resources.";
  }

  // Heuristic Emotional Analysis
  const emotionalWords = ['now', 'immediate', 'fast', 'quit', 'resign', 'leave', 'stress', 'stressed', 'anxious', 'nervous', 'panic', 'urgent', 'urgency', 'scared', 'afraid', 'fever', 'pain', 'ache', 'sick'];
  let intensityScore = 15;
  let primaryEmotion = 'balanced';
  
  const matches = cleanNorm.split(' ').filter(w => emotionalWords.includes(w));
  if (matches.length > 0) {
    intensityScore = Math.min(95, 30 + matches.length * 15);
    if (cleanNorm.includes('now') || cleanNorm.includes('immediate') || cleanNorm.includes('urgent')) {
      primaryEmotion = 'urgency';
    } else if (cleanNorm.includes('stress') || cleanNorm.includes('anxious') || cleanNorm.includes('panic')) {
      primaryEmotion = 'stress / anxiety';
    } else if (cleanNorm.includes('scared') || cleanNorm.includes('afraid')) {
      primaryEmotion = 'fear';
    } else {
      primaryEmotion = 'heightened arousal';
    }
  }
  
  const emotionalAnalysis = {
    intensity_score: intensityScore,
    primary_emotion: primaryEmotion,
    distortion_flag: intensityScore > 50,
    cooldown_reframe: reframedDecision
  };

  return {
    decision_summary: decision,
    confidence_assessment: {
      level: confidenceLevel,
      score: confidenceScore,
      limitations: confidenceLimitations
    },
    emotional_analysis: emotionalAnalysis,
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

/**
 * POST /socratic-questions
 * Receives: { decision }
 * Contacts Gemini API to generate 3 to 5 custom probing questions.
 */
app.post('/socratic-questions', async (req, res) => {
  const { decision } = req.body;
  if (!decision || !decision.trim()) {
    return res.status(400).json({ error: 'Decision string is required.' });
  }

  const normalized = normalizeInput(decision);
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    console.log(`[AI MODE] Generating Socratic questions for: "${normalized}"`);
    try {
      const result = await generateGeminiSocraticQuestions(normalized, apiKey);
      return res.json(result);
    } catch (err) {
      console.error('[AI MODE ERROR] Failed calling Gemini for Socratic questions, falling back...', err.message);
      const fallbackResult = generateLocalSocraticQuestions(normalized);
      return res.json(fallbackResult);
    }
  } else {
    console.log(`[SIMULATOR MODE] Serving local Socratic questions for: "${normalized}"`);
    const fallbackResult = generateLocalSocraticQuestions(normalized);
    return res.json(fallbackResult);
  }
});

/**
 * Call Gemini 2.5 Flash API to generate Socratic questions
 */
async function generateGeminiSocraticQuestions(decision, apiKey) {
  const modelName = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const prompt = `You are "Decision Simulator AI", a Socratic guide and decision scientist.
Generate exactly 3 to 5 highly relevant, probing, analytical questions for a user contemplating this decision query:
Decision: "${decision}"

INSTRUCTIONS:
1. Target hidden assumptions, unstated constraints, personal preferences, and risk boundaries.
2. Keep questions concise (max 12-15 words each).
3. Do not be generic (e.g. "What is your budget?"). Customize to the specific decision.

OUTPUT FORMAT:
Return response ONLY as a single valid JSON object following this structure:
{
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3"
  ]
}

Do NOT wrap the JSON inside markdown code blocks. Return raw JSON text only.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => { controller.abort(); }, 20000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
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
    if (!rawText) throw new Error('Empty API response');

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
 * Generate local Socratic questions as fallback
 */
function generateLocalSocraticQuestions(decision) {
  const norm = decision.toLowerCase();
  const healthSymptoms = ['stomach', 'pain', 'ache', 'sick', 'ill', 'fever', 'flu', 'cough', 'cold', 'headache'];
  const careerWords = ['job', 'offer', 'career', 'promote', 'resign', 'quit', 'interview'];
  const petWords = ['cat', 'dog', 'pet', 'animal', 'bird', 'vet', 'feed'];
  const foodItems = ['eat', 'drink', 'consume', 'apple', 'food', 'meat', 'milk'];

  if (healthSymptoms.some(word => norm.includes(word))) {
    return {
      questions: [
        "How long have you experienced these symptoms, and have they worsened?",
        "Do you have critical tasks today that require your physical presence?",
        "Have you consulted a medical professional or taken any diagnostic actions?",
        "What are the immediate consequences if you take a sick day today?"
      ]
    };
  } else if (careerWords.some(word => norm.includes(word))) {
    return {
      questions: [
        "What is the primary driver of this career transition (financial, cultural, or burn-out)?",
        "How many months of financial runway do you have saved in your stability reserve?",
        "Have you secured a formal written contract or just a verbal offer?",
        "How does this move align with your long-term 3-year professional roadmap?"
      ]
    };
  } else if (petWords.some(word => norm.includes(word))) {
    return {
      questions: [
        "Have you observed similar behavior from this pet in the past?",
        "Is there a safe treat or toy immediately available to redirect its focus?",
        "Does the animal show indicators of anxiety or defensive posturing?",
        "Is the immediate physical environment free of other hazards?"
      ]
    };
  } else if (foodItems.some(word => norm.includes(word))) {
    return {
      questions: [
        "Does the food item show visible decay, mold, or an off smell?",
        "How critical is this consumption to your immediate metabolic/energy needs?",
        "Do you have alternative, spotless food items readily available?",
        "Is there any thermal sterilization (cooking/boiling) option available?"
      ]
    };
  }

  return {
    questions: [
      "What is the worst-case scenario if you proceed with this decision immediately?",
      "Are there alternative options that do not involve a binary 'yes' or 'no' path?",
      "What is the reversibility index of this choice if you encounter friction?",
      "What critical information is currently missing from your decision-making equation?"
    ]
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
