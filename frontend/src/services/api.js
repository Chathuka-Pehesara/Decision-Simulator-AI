// src/services/api.js
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getSubscriptionTier } from './storage';

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
  return 'http://10.223.99.4:3000/simulate';
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
 * Local Monte Carlo Simulator (fallback for offline mode)
 */
function runMonteCarloLocal(baseProbability, riskTolerance) {
  const mean = parseFloat(baseProbability) || 50;
  let stdDev = 12;
  if (riskTolerance) {
    const r = riskTolerance.toLowerCase();
    if (r === 'low') stdDev = 8;
    else if (r === 'high') stdDev = 18;
  }
  const bins = new Array(10).fill(0);
  const numTrials = 10000;
  for (let i = 0; i < numTrials; i++) {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    let sample = mean + z0 * stdDev;
    if (sample < 0) sample = 0;
    if (sample > 100) sample = 100;
    let binIdx = Math.floor(sample / 10);
    if (binIdx > 9) binIdx = 9;
    if (binIdx < 0) binIdx = 0;
    bins[binIdx]++;
  }
  return bins;
}

/**
 * Programmatic mapper to enrich scenarios with 1 / 3 / 5 / 10 year temporal outcomes
 * and a branching consequence tree.
 */
function ensureTemporalAndTreeLocal(scenarios, risk, personality) {
  if (!scenarios || !Array.isArray(scenarios)) return [];
  return scenarios.map(s => {
    // 1. Ensure temporal_outcomes
    if (!s.temporal_outcomes || typeof s.temporal_outcomes !== 'object') {
      const baseProb = s.probability || 50;
      const baseRisk = s.risk_level || 'medium';
      const baseEmotion = s.emotional_impact || 'Measured';
      const baseDesc = s.description || 'Proceed with the action.';
      
      const r = risk || 'medium';
      const p = personality || 'balanced';
      
      const riskVal = baseRisk === 'high' ? 80 : baseRisk === 'medium' ? 50 : 25;
      const rewardVal = p === 'risk-taker' ? 85 : 60;
      
      s.temporal_outcomes = {
        "1": {
          description: `Year 1: ${baseDesc}`,
          probability: baseProb,
          risk_level: baseRisk,
          emotional_impact: baseEmotion,
          radar_metrics: { risk: riskVal, reward: rewardVal, time_cost: 40, emotional_toll: baseRisk === 'high' ? 70 : 40, reversibility: baseRisk === 'high' ? 35 : 75 }
        },
        "3": {
          description: `Year 3: The scenario outcome stabilizes, leading to ${baseRisk === 'high' ? 'heightened operational overhead and secondary complexity factors.' : 'gradual system normalization and compounding strategic returns.'}`,
          probability: Math.min(95, Math.max(5, baseProb + (baseRisk === 'high' ? 8 : -4))),
          risk_level: baseRisk === 'high' ? 'high' : 'low',
          emotional_impact: baseRisk === 'high' ? 'Anxious' : 'Fulfilled',
          radar_metrics: { risk: Math.min(100, riskVal + 5), reward: Math.min(100, rewardVal + 10), time_cost: 50, emotional_toll: baseRisk === 'high' ? 75 : 30, reversibility: Math.max(0, (baseRisk === 'high' ? 35 : 75) - 10) }
        },
        "5": {
          description: `Year 5: Structural path dependencies assert themselves. Results yield ${baseRisk === 'high' ? 'significant resource depletion and persistent systemic friction.' : 'deeply integrated long-term stability and maximized utility yield.'}`,
          probability: Math.min(95, Math.max(5, baseProb + (baseRisk === 'high' ? 12 : -8))),
          risk_level: baseRisk === 'high' ? 'high' : 'low',
          emotional_impact: baseRisk === 'high' ? 'Stressed' : 'Serene',
          radar_metrics: { risk: Math.min(100, riskVal + 10), reward: Math.min(100, rewardVal + 20), time_cost: 65, emotional_toll: baseRisk === 'high' ? 80 : 20, reversibility: Math.max(0, (baseRisk === 'high' ? 35 : 75) - 20) }
        },
        "10": {
          description: `Year 10: Generational timeline horizon fully realized. The decision is now ${baseRisk === 'high' ? 'a critical legacy bottleneck or a primary survival constraint.' : 'a foundational bedrock of system sustainability and compounding growth.'}`,
          probability: Math.min(95, Math.max(5, baseProb + (baseRisk === 'high' ? 18 : -12))),
          risk_level: baseRisk === 'high' ? 'high' : 'low',
          emotional_impact: baseRisk === 'high' ? 'Regretful' : 'Wise',
          radar_metrics: { risk: Math.min(100, riskVal + 15), reward: Math.min(100, rewardVal + 30), time_cost: 80, emotional_toll: baseRisk === 'high' ? 85 : 10, reversibility: Math.max(0, (baseRisk === 'high' ? 35 : 75) - 40) }
        }
      };
    }
    
    // 2. Ensure consequence_tree
    if (!s.consequence_tree || typeof s.consequence_tree !== 'object') {
      const chain = s.causal_chain || { title: 'Initiate scenario track', probability: 100 };
      
      const buildFromChain = (node, depth = 1) => {
        if (!node) return [];
        const nextNode = node.next;
        const subBranches = nextNode ? buildFromChain(nextNode, depth + 1) : [];
        if (depth === 1) {
          subBranches.push({
            title: `Alternative ${depth + 1}nd Order Consequence (Variance pathway)`,
            probability: Math.round(node.probability * 0.4),
            branches: []
          });
        }
        return [{
          title: node.title,
          probability: node.probability || 80,
          branches: subBranches
        }];
      };
      s.consequence_tree = {
        title: s.title || 'Scenario Node',
        probability: 100,
        branches: buildFromChain(chain)
      };
    }
    return s;
  });
}

/**
 * Simulates future outcomes for a decision
 * Calls POST /simulate. Falls back to a local generator on failure/network errors.
 */
export async function simulateDecision(decision, risk, personality, advisors) {
  const normalized = normalizeInput(decision);
  const sub = await getSubscriptionTier();
  try {
    const response = await api.post(API_URL, {
      decision: normalized,
      risk,
      personality,
      advisors
    }, {
      headers: {
        'x-user-tier': sub.tier,
        'x-user-id': 'default_user'
      }
    });
    
    let result = response.data;
    // Client-side safety normalization check
    if (result.scenarios && Array.isArray(result.scenarios)) {
      result.scenarios = ensureTemporalAndTreeLocal(result.scenarios, risk, personality);
      result.scenarios.forEach(s => {
        if (s.temporal_outcomes) {
          Object.keys(s.temporal_outcomes).forEach(year => {
            const outcome = s.temporal_outcomes[year];
            if (!outcome.monte_carlo_distribution) {
              outcome.monte_carlo_distribution = runMonteCarloLocal(outcome.probability || 50, risk);
            }
          });
        }
      });
    }
    return result;
  } catch (error) {
    console.warn('Backend API connection failed, executing intelligent local simulation fallback...', error.message);
    
    // Artificial delay to simulate real network request and showcase loading state nicely
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    let offlineResult = generateOfflineSimulation(normalized, risk, personality, advisors);
    if (offlineResult.scenarios && Array.isArray(offlineResult.scenarios)) {
      offlineResult.scenarios = ensureTemporalAndTreeLocal(offlineResult.scenarios, risk, personality);
      offlineResult.scenarios.forEach(s => {
        if (s.temporal_outcomes) {
          Object.keys(s.temporal_outcomes).forEach(year => {
            const outcome = s.temporal_outcomes[year];
            outcome.monte_carlo_distribution = runMonteCarloLocal(outcome.probability || 50, risk);
          });
        }
      });
    }
    return offlineResult;
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

function generateOfflineSimulation(decision, riskTolerance, personality, customAdvisors) {
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
  let advisors = [];
  let debateTranscript = [];
  let consensusSummary = "";

  if (customAdvisors && Array.isArray(customAdvisors) && customAdvisors.length > 0) {
    advisors = customAdvisors.map(adv => ({
      name: adv.name,
      role: adv.description || `Expert lens on ${adv.domainExpertise}`
    }));
    customAdvisors.forEach(adv => {
      let message = "";
      const expertise = (adv.domainExpertise || '').toLowerCase();
      if (expertise.includes('finance') || expertise.includes('money') || expertise.includes('invest')) {
        message = `From a financial perspective, this choice requires careful capitalization trade-offs. We must minimize sunk cost exposure and secure a sound ${adv.riskAppetite}-risk margin.`;
      } else if (expertise.includes('tech') || expertise.includes('software') || expertise.includes('engineer') || expertise.includes('code')) {
        message = `Analyzing the technical variables, this action introduces path dependencies and design velocity constraints. Ensure adequate risk buffers for integration overhead.`;
      } else if (expertise.includes('health') || expertise.includes('medical') || expertise.includes('wellness')) {
        message = `Prioritize physical and cognitive wellness baselines. Short-term performance peaks should not trigger long-term biological metabolic deficits.`;
      } else if (expertise.includes('relation') || expertise.includes('personal') || expertise.includes('love')) {
        message = `Human capital networks and social stability indices are heavily impacted. We should establish clear boundary metrics and maintain high-fidelity feedback loops.`;
      } else {
        message = `Evaluating via my specialized profile. We should analyze immediate outcomes, preserve flexibility, and maintain a ${adv.riskAppetite === 'high' ? 'decisive expansion' : 'conservative boundary'} approach.`;
      }
      debateTranscript.push({ speaker: adv.name, message });
    });
    consensusSummary = `Synthesizing boardroom viewpoints suggests proceeding with structural parameters defined by ${customAdvisors.map(a => a.name).join(' and ')}.`;
  } else {
    advisors = [
      { name: "Logical & Behavioral Perspective", role: "Analyzes cognitive patterns, immediate impulses, and emotional framing" },
      { name: "Risk & Sustainability Perspective", role: "Analyzes long-term viability, resource preservation, and environmental trade-offs" }
    ];

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

/**
 * Fetch Socratic probing questions for a decision
 */
export async function getSocraticQuestions(decision) {
  const normalized = normalizeInput(decision);
  try {
    const socraticUrl = API_URL.replace('/simulate', '/socratic-questions');
    const response = await api.post(socraticUrl, { decision: normalized });
    return response.data;
  } catch (error) {
    console.warn('Backend Socratic connection failed, executing local fallback...', error.message);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return generateOfflineSocraticQuestions(normalized);
  }
}

/**
 * Generate local offline Socratic questions
 */
function generateOfflineSocraticQuestions(decision) {
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

/**
 * Send base64 audio payload to backend for transcription
 */
export async function transcribeAudio(base64Audio) {
  try {
    const transcribeUrl = API_URL.replace('/simulate', '/transcribe');
    const response = await api.post(transcribeUrl, { audio: base64Audio });
    return response.data;
  } catch (error) {
    console.error('Audio transcription request failed:', error.message);
    throw error;
  }
}

// --- COLLABORATIVE ROOMS ---
export async function createCollabRoom(decision, risk, personality, hostName) {
  const url = API_URL.replace('/simulate', '/api/collab/create');
  const response = await api.post(url, { decision, risk, personality, hostName });
  return response.data;
}

export async function joinCollabRoom(code, participantName, personality) {
  const url = API_URL.replace('/simulate', '/api/collab/join');
  const response = await api.post(url, { code, participantName, personality });
  return response.data;
}

export async function startCollabRoom(code, hostId) {
  const url = API_URL.replace('/simulate', '/api/collab/start');
  const response = await api.post(url, { code, hostId });
  return response.data;
}

export async function castCollabVote(code, participantId, votes) {
  const url = API_URL.replace('/simulate', '/api/collab/vote');
  const response = await api.post(url, { code, participantId, votes });
  return response.data;
}

export async function getCollabRoomState(code) {
  const url = API_URL.replace('/simulate', `/api/collab/room/${code}`);
  const response = await api.get(url);
  return response.data;
}

// --- DEVELOPER WEBHOOK CONSOLE ---
export async function getWebhooks() {
  const url = API_URL.replace('/simulate', '/api/webhooks');
  const response = await api.get(url);
  return response.data;
}

export async function registerWebhook(webhookUrl) {
  const url = API_URL.replace('/simulate', '/api/webhooks/register');
  const response = await api.post(url, { url: webhookUrl });
  return response.data;
}

export async function deleteWebhook(id) {
  const url = API_URL.replace('/simulate', `/api/webhooks/${id}`);
  const response = await api.delete(url);
  return response.data;
}

export async function testWebhook(webhookUrl) {
  const url = API_URL.replace('/simulate', '/api/webhooks/test');
  const response = await api.post(url, { url: webhookUrl });
  return response.data;
}

