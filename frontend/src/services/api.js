// src/services/api.js
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Dynamically resolve machine IP for mobile testing, fallback to localhost for web
const getBackendUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/simulate';
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const hostname = hostUri.split(':')[0];
    const isIp = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname);
    if (isIp) {
      return `http://${hostname}:3000/simulate`;
    }
  }
  // Fallback to the discovered local Wi-Fi IP address of the development machine
  return 'http://10.188.179.4:3000/simulate';
};

const API_URL = getBackendUrl();

const api = axios.create({
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },
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
 * Simulates future outcomes for a decision
 * Calls POST /simulate. Falls back to a local generator on failure/network errors.
 */
export async function simulateDecision(decision, risk, personality) {
  const normalized = normalizeInput(decision);
  try {
    const response = await api.post(API_URL, {
      decision: normalized,
      risk,
      personality,
    });
    return response.data;
  } catch (error) {
    console.warn('Backend API connection failed, executing intelligent local simulation fallback...', error.message);
    
    // Artificial delay to simulate real network request and showcase loading state nicely
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    return generateOfflineSimulation(normalized, risk, personality);
  }
}

/**
 * Local simulation engine producing rich, context-aware scenarios
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

function generateOfflineSimulation(decision, riskTolerance, personality) {
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

  return {
    decision_summary: decision,
    confidence_assessment: {
      level: confidenceLevel,
      score: confidenceScore,
      limitations: confidenceLimitations
    },
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
