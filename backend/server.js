// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so your phone or browser can communicate with the server
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
 * Run a 10,000-run stochastic simulation using Box-Muller transform
 * Returns an array of 10 bin counts representing decile frequencies
 */
function runMonteCarlo(baseProbability, riskTolerance) {
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
    
    // Clip sample between 0 and 100
    if (sample < 0) sample = 0;
    if (sample > 100) sample = 100;
    
    // Determine decile bin index (0 to 9)
    let binIdx = Math.floor(sample / 10);
    if (binIdx > 9) binIdx = 9;
    if (binIdx < 0) binIdx = 0;
    
    bins[binIdx]++;
  }
  
  return bins;
}

const MEMORY_FILE_PATH = path.join(__dirname, 'data', 'memory.json');

function initMemoryDir() {
  const dir = path.dirname(MEMORY_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadMemory() {
  initMemoryDir();
  if (fs.existsSync(MEMORY_FILE_PATH)) {
    try {
      const data = fs.readFileSync(MEMORY_FILE_PATH, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('[MEMORY ERROR] Failed to parse memory.json', err.message);
      return [];
    }
  }
  return [];
}

function saveMemory(memory) {
  initMemoryDir();
  try {
    if (memory.length > 100) {
      memory = memory.slice(-100);
    }
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(memory, null, 2), 'utf8');
  } catch (err) {
    console.error('[MEMORY ERROR] Failed to write memory.json', err.message);
  }
}

function calculateDotProduct(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return dot;
}

async function generateGeminiEmbedding(text, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: {
        parts: [{ text: text }]
      }
    })
  });
  if (!response.ok) {
    throw new Error(`Embedding API returned status ${response.status}`);
  }
  const data = await response.json();
  return data.embedding?.values;
}

function findTemporalLink(newEmbedding, normalizedQuery, memory) {
  if (!newEmbedding || memory.length === 0) return null;
  let bestMatch = null;
  let highestSimilarity = 0;
  
  for (const item of memory) {
    const similarity = calculateDotProduct(newEmbedding, item.embedding);
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = item;
    }
  }
  
  if (highestSimilarity >= 0.82 && bestMatch) {
    return {
      decision: bestMatch.decision,
      timestamp: bestMatch.timestamp,
      similarity: Math.round(highestSimilarity * 100),
      outcome_summary: bestMatch.result_summary || bestMatch.decision
    };
  }
  return null;
}

function resolveModelConfig(modelString) {
  if (!modelString || !modelString.includes('/')) {
    return { provider: 'gemini', model: 'gemini-2.5-flash' };
  }
  const parts = modelString.split('/');
  const provider = parts[0].toLowerCase();
  const model = parts.slice(1).join('/');
  return { provider, model };
}

function getApiKeyForProvider(provider) {
  if (provider === 'gemini') return process.env.GEMINI_API_KEY;
  if (provider === 'groq') return process.env.GROQ_API_KEY;
  if (provider === 'openrouter') return process.env.OPENROUTER_API_KEY;
  if (provider === 'openai') return process.env.OPENAI_API_KEY;
  if (provider === 'anthropic' || provider === 'claude') return process.env.ANTHROPIC_API_KEY;
  return null;
}

function isKeyConfigured(key) {
  return key && key.trim() !== '' && !key.toLowerCase().includes('here') && !key.toLowerCase().includes('placeholder') && !key.toLowerCase().includes('your_');
}

function getModelDisplayName(modelString) {
  if (!modelString) return 'Unknown';
  if (modelString.includes('/')) {
    const parts = modelString.split('/');
    const provider = parts[0].toUpperCase();
    const model = parts.slice(1).join('/');
    
    if (model.includes('llama-3.3-70b') && provider === 'GROQ') return 'Llama 3.3 (Groq)';
    if (model.includes('llama-3.3-70b') && provider === 'OPENROUTER') return 'Llama 3.3 (OpenRouter)';
    if (model.includes('llama-3-8b')) return 'Llama 3 (OpenRouter)';
    if (model.includes('gemma-2-9b')) return 'Gemma 2 (OpenRouter)';
    if (model.includes('gemini-2.5-flash')) return 'Gemini 2.5 Flash';
    if (model.includes('gpt-4o-mini')) return 'GPT-4o Mini';
    if (model.includes('claude-3-5-sonnet')) return 'Claude 3.5 Sonnet';
    
    return `${model} (${provider})`;
  }
  return modelString;
}

async function callLLM(provider, model, apiKey, prompt, useJsonMode = true) {
  let url = '';
  const headers = { 'Content-Type': 'application/json' };
  let body = {};
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    if (provider === 'gemini') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const genConfig = useJsonMode ? { responseMimeType: 'application/json' } : {};
      body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: genConfig
      };
    } else if (provider === 'anthropic' || provider === 'claude') {
      url = 'https://api.anthropic.com/v1/messages';
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      body = {
        model: model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      };
    } else {
      // openai, groq, openrouter
      if (provider === 'openai') {
        url = 'https://api.openai.com/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else if (provider === 'groq') {
        url = 'https://api.groq.com/openai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else if (provider === 'openrouter') {
        url = 'https://openrouter.ai/api/v1/chat/completions';
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['HTTP-Referer'] = 'https://github.com/Chathuka-Pehesara/Decision-Simulator-AI';
        headers['X-Title'] = 'Decision Simulator AI';
      }
      
      body = {
        model: model,
        messages: [{ role: 'user', content: prompt }]
      };
      if (useJsonMode) {
        body.response_format = { type: 'json_object' };
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${provider.toUpperCase()} API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    let rawText = '';
    if (provider === 'gemini') {
      rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else if (provider === 'anthropic' || provider === 'claude') {
      rawText = data.content?.[0]?.text;
    } else {
      rawText = data.choices?.[0]?.message?.content;
    }

    if (!rawText) {
      throw new Error(`${provider.toUpperCase()} response was empty.`);
    }

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

async function generateModelSimulation(decision, risk, personality, provider, model, apiKey) {
  const systemPrompt = `You are a decision-science and cognitive-modeling expert system. 
Analyze this decision: "${decision}" (Risk Tolerance: ${risk || 'medium'}, Personality Lens: ${personality || 'balanced'}).
Evaluate cognitive bias (bias_score 0-100, detected_biases: list of name, severity, explanation, reframed_decision) and emotional intensity (intensity_score 0-100, primary_emotion, distortion_flag, cooldown_reframe).
Return a JSON object matching this structure:
{
  "decision_summary": "Standardized analytical decision query",
  "confidence_assessment": {
    "level": "Moderate Confidence",
    "score": 75,
    "limitations": ["Limitation 1", "Limitation 2", "Limitation 3"]
  },
  "emotional_analysis": {
    "intensity_score": 70,
    "primary_emotion": "stress",
    "distortion_flag": true,
    "cooldown_reframe": "Standardized objective rephrase without urgency"
  },
  "cognitive_analysis": {
    "bias_score": 50,
    "detected_biases": [
      { "name": "Present Bias", "severity": "medium", "explanation": "Academic explanation." }
    ],
    "reframed_decision": "Objective rephrased version"
  }
}
Return ONLY valid JSON. Do not wrap in markdown block. JSON ONLY.`;

  return await callLLM(provider, model, apiKey, systemPrompt, true);
}

function simulateModelResponse(geminiResult, modelName) {
  const scoreVariance = () => Math.round((Math.random() - 0.5) * 12);
  let simulatedBiasScore = Math.min(100, Math.max(0, (geminiResult.cognitive_analysis?.bias_score || 50) + scoreVariance()));
  let simulatedIntensityScore = Math.min(100, Math.max(0, (geminiResult.emotional_analysis?.intensity_score || 50) + scoreVariance()));
  
  return {
    decision_summary: geminiResult.decision_summary,
    confidence_assessment: {
      level: geminiResult.confidence_assessment?.level || 'Moderate Confidence',
      score: Math.min(100, Math.max(0, (geminiResult.confidence_assessment?.score || 75) + scoreVariance())),
      limitations: geminiResult.confidence_assessment?.limitations || []
    },
    emotional_analysis: {
      intensity_score: simulatedIntensityScore,
      primary_emotion: geminiResult.emotional_analysis?.primary_emotion || 'balanced',
      distortion_flag: simulatedIntensityScore > 50,
      cooldown_reframe: geminiResult.emotional_analysis?.cooldown_reframe || ''
    },
    cognitive_analysis: {
      bias_score: simulatedBiasScore,
      detected_biases: geminiResult.cognitive_analysis?.detected_biases || [],
      reframed_decision: geminiResult.cognitive_analysis?.reframed_decision || ''
    }
  };
}

function calculateConsensus(model1Result, model2Result, model3Result, name1, name2, name3) {
  const bias1 = model1Result.cognitive_analysis?.bias_score || 50;
  const bias2 = model2Result.cognitive_analysis?.bias_score || 50;
  const bias3 = model3Result.cognitive_analysis?.bias_score || 50;
  
  const intensity1 = model1Result.emotional_analysis?.intensity_score || 50;
  const intensity2 = model2Result.emotional_analysis?.intensity_score || 50;
  const intensity3 = model3Result.emotional_analysis?.intensity_score || 50;
  
  const avgBias = Math.round((bias1 + bias2 + bias3) / 3);
  const avgIntensity = Math.round((intensity1 + intensity2 + intensity3) / 3);
  
  const biasVariance = Math.sqrt(
    (Math.pow(bias1 - avgBias, 2) + Math.pow(bias2 - avgBias, 2) + Math.pow(bias3 - avgBias, 2)) / 3
  );
  const intensityVariance = Math.sqrt(
    (Math.pow(intensity1 - avgIntensity, 2) + Math.pow(intensity2 - avgIntensity, 2) + Math.pow(intensity3 - avgIntensity, 2)) / 3
  );
  
  const avgStdDev = (biasVariance + intensityVariance) / 2;
  let consensusLevel = "High Consensus";
  let consensusScore = 100 - Math.round(avgStdDev * 2.5);
  consensusScore = Math.min(100, Math.max(10, consensusScore));
  
  if (consensusScore < 60) {
    consensusLevel = "Strong Disagreement";
  } else if (consensusScore < 85) {
    consensusLevel = "Moderate Disagreement";
  }
  
  const variances = [];
  const maxBiasDiff = Math.max(Math.abs(bias1 - bias2), Math.abs(bias1 - bias3), Math.abs(bias2 - bias3));
  if (maxBiasDiff > 15) {
    const highest = Math.max(bias1, bias2, bias3);
    const lowest = Math.min(bias1, bias2, bias3);
    const highestModel = bias1 === highest ? name1 : bias2 === highest ? name2 : name3;
    const lowestModel = bias1 === lowest ? name1 : bias2 === lowest ? name2 : name3;
    variances.push(`${highestModel} detected higher cognitive bias (${highest}%) than ${lowestModel} (${lowest}%).`);
  }
  
  const maxIntensityDiff = Math.max(Math.abs(intensity1 - intensity2), Math.abs(intensity1 - intensity3), Math.abs(intensity2 - intensity3));
  if (maxIntensityDiff > 15) {
    const highest = Math.max(intensity1, intensity2, intensity3);
    const lowest = Math.min(intensity1, intensity2, intensity3);
    const highestModel = intensity1 === highest ? name1 : intensity2 === highest ? name2 : name3;
    const lowestModel = intensity1 === lowest ? name1 : intensity2 === lowest ? name2 : name3;
    variances.push(`${highestModel} evaluated emotional intensity at ${highest}%, while ${lowestModel} evaluated it at ${lowest}%.`);
  }
  
  const emotions = new Set([
    model1Result.emotional_analysis?.primary_emotion,
    model2Result.emotional_analysis?.primary_emotion,
    model3Result.emotional_analysis?.primary_emotion
  ].filter(Boolean));
  
  if (emotions.size > 1) {
    variances.push(`Models categorized the primary emotion differently (${name1}: ${model1Result.emotional_analysis?.primary_emotion || 'none'}, ${name2}: ${model2Result.emotional_analysis?.primary_emotion || 'none'}, ${name3}: ${model3Result.emotional_analysis?.primary_emotion || 'none'}).`);
  } else {
    variances.push(`All models agree that the primary emotional driver is "${model1Result.emotional_analysis?.primary_emotion || 'balanced'}".`);
  }
  
  if (variances.length === 0 || consensusScore > 90) {
    variances.unshift("Excellent alignment between all model reasoning structures. High confidence consensus.");
  }
  
  return {
    consensus_score: consensusScore,
    consensus_level: consensusLevel,
    details: [
      { model: name1, bias_score: bias1, intensity_score: intensity1, primary_emotion: model1Result.emotional_analysis?.primary_emotion || "balanced" },
      { model: name2, bias_score: bias2, intensity_score: intensity2, primary_emotion: model2Result.emotional_analysis?.primary_emotion || "balanced" },
      { model: name3, bias_score: bias3, intensity_score: intensity3, primary_emotion: model3Result.emotional_analysis?.primary_emotion || "balanced" }
    ],
    variances: variances.slice(0, 3)
  };
}

/**
 * Programmatic mapper to enrich scenarios with 1 / 3 / 5 / 10 year temporal outcomes
 * and a branching consequence tree. This acts as a fallback and normalization layer.
 */
function ensureTemporalAndTree(scenarios, risk, personality) {
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
        
        // Add an alternative dummy branch at depth 1 or 2 to make it look branching
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
 * POST /simulate
 * Receives: { decision, risk, personality }
 * Contacts Gemini API (and GPT-4 & Claude in parallel) to generate simulations.
 */
app.post('/simulate', async (req, res) => {
  const { decision, risk, personality } = req.body;

  if (!decision || !decision.trim()) {
    return res.status(400).json({ error: 'Decision string is required.' });
  }

  const normalized = normalizeInput(decision);
  console.log(`[PREPROCESSOR] Normalized: "${decision}" -> "${normalized}"`);

  // Parse models from environment variables
  const primaryModelStr = process.env.PRIMARY_MODEL || 'gemini/gemini-2.5-flash';
  const model1Str = process.env.CONSENSUS_MODEL_1 || 'groq/llama-3.3-70b-versatile';
  const model2Str = process.env.CONSENSUS_MODEL_2 || 'openrouter/meta-llama/llama-3.3-70b-instruct:free';

  const primaryConfig = resolveModelConfig(primaryModelStr);
  const model1Config = resolveModelConfig(model1Str);
  const model2Config = resolveModelConfig(model2Str);

  const primaryKey = getApiKeyForProvider(primaryConfig.provider);
  const model1Key = getApiKeyForProvider(model1Config.provider);
  const model2Key = getApiKeyForProvider(model2Config.provider);

  const primaryDisplayName = getModelDisplayName(primaryModelStr);
  const model1DisplayName = getModelDisplayName(model1Str);
  const model2DisplayName = getModelDisplayName(model2Str);

  // 1. Generate local vector embedding & memory search
  const embeddingKey = process.env.GEMINI_API_KEY;
  let embedding = null;
  try {
    if (isKeyConfigured(embeddingKey)) {
      embedding = await generateGeminiEmbedding(normalized, embeddingKey);
    }
  } catch (err) {
    console.error('[EMBEDDING ERROR] Failed to fetch embedding:', err.message);
  }
  
  const memory = loadMemory();
  const temporalLink = findTemporalLink(embedding, normalized, memory);

  // 2. Fetch primary simulation result
  let primaryResult = null;
  if (isKeyConfigured(primaryKey)) {
    console.log(`[AI MODE] Generating primary simulation (${primaryDisplayName}) for: "${normalized}"`);
    try {
      primaryResult = await generatePrimarySimulation(normalized, risk, personality, primaryConfig.provider, primaryConfig.model, primaryKey);
    } catch (err) {
      console.error(`[AI MODE ERROR] Failed calling ${primaryDisplayName}, falling back to Server Simulator...`, err.message);
      primaryResult = generateServerSimulation(normalized, risk, personality);
    }
  } else {
    console.log(`[SIMULATOR MODE] Serving local context scenarios for: "${normalized}"`);
    primaryResult = generateServerSimulation(normalized, risk, personality);
  }

  // Ensure scenarios contain temporal_outcomes and consequence_tree formats
  if (primaryResult.scenarios && Array.isArray(primaryResult.scenarios)) {
    primaryResult.scenarios = ensureTemporalAndTree(primaryResult.scenarios, risk, personality);
    
    // Generate Monte Carlo distribution for each timeline milestone
    primaryResult.scenarios = primaryResult.scenarios.map(s => {
      if (s.temporal_outcomes) {
        Object.keys(s.temporal_outcomes).forEach(year => {
          const outcome = s.temporal_outcomes[year];
          outcome.monte_carlo_distribution = runMonteCarlo(outcome.probability || 50, risk);
        });
      }
      return s;
    });
  }

  // 3. Parallel model consensus
  let model1Result = null;
  let model2Result = null;
  const promises = [];

  if (isKeyConfigured(model1Key)) {
    console.log(`[AI MODE] Querying ${model1DisplayName} in parallel...`);
    promises.push(
      generateModelSimulation(normalized, risk, personality, model1Config.provider, model1Config.model, model1Key)
        .then(res => { model1Result = res; })
        .catch(err => {
          console.error(`[${model1DisplayName.toUpperCase()} ERROR] Failed:`, err.message);
          model1Result = simulateModelResponse(primaryResult, model1DisplayName);
        })
    );
  } else {
    model1Result = simulateModelResponse(primaryResult, model1DisplayName);
  }

  if (isKeyConfigured(model2Key)) {
    console.log(`[AI MODE] Querying ${model2DisplayName} in parallel...`);
    promises.push(
      generateModelSimulation(normalized, risk, personality, model2Config.provider, model2Config.model, model2Key)
        .then(res => { model2Result = res; })
        .catch(err => {
          console.error(`[${model2DisplayName.toUpperCase()} ERROR] Failed:`, err.message);
          model2Result = simulateModelResponse(primaryResult, model2DisplayName);
        })
    );
  } else {
    model2Result = simulateModelResponse(primaryResult, model2DisplayName);
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  // 4. Calculate Consensus and combine payloads
  const consensus = calculateConsensus(primaryResult, model1Result, model2Result, primaryDisplayName, model1DisplayName, model2DisplayName);
  primaryResult.multi_model_comparison = consensus;
  
  if (temporalLink) {
    console.log(`[MEMORY RECALL] Found temporal link: "${temporalLink.decision}" (${temporalLink.similarity}% similarity)`);
    primaryResult.temporal_memory_recall = temporalLink;
  }

  // 5. Save current query into local memory JSON file
  if (embedding) {
    memory.push({
      id: Date.now().toString(),
      decision: normalized,
      timestamp: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
      embedding: embedding,
      result_summary: primaryResult.decision_summary
    });
    saveMemory(memory);
  }

  return res.json(primaryResult);
});

app.post('/transcribe', async (req, res) => {
  const { audio } = req.body;
  if (!audio) {
    return res.status(400).json({ error: 'Audio data is required.' });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!isKeyConfigured(groqKey)) {
    console.warn('[TRANSCRIBE] GROQ_API_KEY is not set or placeholder. Returning diagnostic text.');
    return res.json({ 
      text: "[Diagnostic Warning] Voice recorded successfully! However, GROQ_API_KEY is missing in backend/.env. Please obtain a free key at console.groq.com to activate AI speech-to-text." 
    });
  }

  let base64Data = audio;
  let fileExtension = 'webm';
  if (base64Data.includes(';base64,')) {
    const header = base64Data.split(';base64,')[0];
    if (header.includes('audio/m4a') || header.includes('audio/x-m4a') || header.includes('audio/mp4') || header.includes('audio/aac')) {
      fileExtension = 'm4a';
    } else if (header.includes('audio/wav') || header.includes('audio/x-wav')) {
      fileExtension = 'wav';
    }
    base64Data = base64Data.split(';base64,')[1];
  }

  const tempFilePath = path.join(__dirname, `temp_audio_${Date.now()}.${fileExtension}`);
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(tempFilePath, buffer);

    const fileBlob = new Blob([buffer], { type: `audio/${fileExtension}` });
    const formData = new FormData();
    formData.append('file', fileBlob, `audio.${fileExtension}`);
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');

    console.log('[TRANSCRIBE] Sending audio payload to Groq Whisper...');
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq Whisper returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    console.log(`[TRANSCRIBE] Successful! Text: "${data.text}"`);
    return res.json({ text: data.text });
  } catch (err) {
    console.error('[TRANSCRIBE ERROR] Failed to transcribe:', err.message);
    return res.status(500).json({ error: 'Failed to transcribe audio.', details: err.message });
  } finally {
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error('[TRANSCRIBE] Failed to delete temp file:', e.message);
      }
    }
  }
});

async function generatePrimarySimulation(decision, risk, personality, provider, model, apiKey) {
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
   - For each scenario, generate a 'temporal_outcomes' object containing forecasts for horizons "1" (1 year), "3" (3 years), "5" (5 years), and "10" (10 years).
   - Each horizon forecast MUST include:
     * 'description': Concise scenario outcome for this specific year (exactly 1-2 sentences).
     * 'probability': 0-100 expected percentage of this scenario version occurring, adjusted by Risk Tolerance (${risk}) and Personality (${personality}).
     * 'risk_level': "low", "medium", or "high" showing how risk exposure changes.
     * 'emotional_impact': Concise 1-2 words describing the user's emotional state.
     * 'radar_metrics': An object with five numerical values (0-100): 'risk', 'reward', 'time_cost', 'emotional_toll', 'reversibility'.
   - Every scenario MUST include a 'consequence_tree' representing branching 1st, 2nd, and 3rd order outcomes. A node has:
     * 'title': Text description (e.g. "Action taken" or "System reaction").
     * 'probability': 0-100 percentage.
     * 'branches': Array of child nodes with the same structure (each parent can branch into 1 or 2 child nodes, creating a real branching tree explorer. Max depth is 3 levels).
6. STRUCTURED PERSPECTIVE SIMULATION:
   - Refine the multi-agent debate into a structured analysis of conflicting viewpoints. Structure 'boardroom_debate' with exactly 2 expert perspectives:
     * "Logical & Behavioral Perspective": Analyzes cognitive patterns, immediate impulses, and emotional framing.
     * "Risk & Sustainability Perspective": Analyzes long-term viability, resource preservation, and environmental trade-offs.
   - Keep each perspective message limited to exactly 1-2 highly polished systems-thinking sentences. No dialogue tags, slang, or theatrical arguments.
   - Summarize their consensus into a single-sentence 'consensus_summary'.
7. KEY FACTORS:
   - Provide exactly 4 concise key factors to monitor, limited to exactly 6-8 words each.
8. AUTO-CATEGORIZATION:
   - Classify the decision statement into one of the following exact categories: "career", "finance", "relationships", "health", or "general".
   - Place this classification in the 'category' field at the root of the JSON.
9. CRITICAL LANGUAGE & TONE RULES:
   - Use objective, professional decision-science terminology (e.g. "temporal discounting", "marginal utility", "variance", "sustainability limit").
   - Strictly prohibit theatrical or dramatic AI words (e.g. "catastrophic", "dreaded collapse", "dopamine hit", "doom", "ruin").
   - Do NOT give direct advice or recommendations.

OUTPUT FORMAT:
Return response ONLY as a single valid JSON object following this structure:
{
  "category": "career",
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
      "temporal_outcomes": {
        "1": {
          "description": "Year 1 outcome description (1-2 sentences).",
          "probability": 65,
          "risk_level": "medium",
          "emotional_impact": "Measured",
          "radar_metrics": { "risk": 50, "reward": 45, "time_cost": 30, "emotional_toll": 40, "reversibility": 80 }
        },
        "3": {
          "description": "Year 3 outcome description (1-2 sentences).",
          "probability": 72,
          "risk_level": "low",
          "emotional_impact": "Optimistic",
          "radar_metrics": { "risk": 40, "reward": 65, "time_cost": 45, "emotional_toll": 30, "reversibility": 75 }
        },
        "5": {
          "description": "Year 5 outcome description (1-2 sentences).",
          "probability": 80,
          "risk_level": "low",
          "emotional_impact": "Fulfilled",
          "radar_metrics": { "risk": 30, "reward": 80, "time_cost": 50, "emotional_toll": 20, "reversibility": 70 }
        },
        "10": {
          "description": "Year 10 outcome description (1-2 sentences).",
          "probability": 85,
          "risk_level": "low",
          "emotional_impact": "Serene",
          "radar_metrics": { "risk": 20, "reward": 90, "time_cost": 55, "emotional_toll": 10, "reversibility": 60 }
        }
      },
      "consequence_tree": {
        "title": "Scenario Root Action",
        "probability": 100,
        "branches": [
          {
            "title": "1st Order Branch A",
            "probability": 75,
            "branches": [
              {
                "title": "2nd Order Sub-Branch A1",
                "probability": 60,
                "branches": [
                  {
                    "title": "3rd Order Final Branch A1a",
                    "probability": 40,
                    "branches": []
                  }
                ]
              }
            ]
          },
          {
            "title": "1st Order Branch B",
            "probability": 25,
            "branches": []
          }
        ]
      }
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

  return await callLLM(provider, model, apiKey, prompt, true);
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
        reasoning: `Probability Heuristic: The base rate of 75% is adjusted to ${p1}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Slowing physical velocity prevents triggering automated prey or chase reflexes in domesticated animals.`,
        causal_chain: {
          title: 'Maintain low movement profile',
          probability: 100,
          next: {
            title: 'Pet registers non-threatening visual cues',
            probability: 80,
            next: {
              title: 'Pet disengages/settles in neutral state',
              probability: 60
            }
          }
        }
      },
      {
        title: 'High-Energy Play / Chase Activation',
        description: `Sudden acceleration triggers the ${animalNoun}'s natural chasing drive, leading to an active chase or accidental play bite.`,
        timeline: '5-15 minutes',
        risk_level: 'medium',
        emotional_impact: 'Anxious',
        probability: p2,
        reasoning: `Probability Heuristic: The base rate of 45% is adjusted to ${p2}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Rapid movement triggers instinctual prey drive mechanisms.`,
        causal_chain: {
          title: 'Initiate sudden acceleration/flight response',
          probability: 100,
          next: {
            title: 'Pet activates instinctual chase response',
            probability: 85,
            next: {
              title: 'Accidental collision, bite, or scratch occurs',
              probability: 55
            }
          }
        }
      },
      {
        title: 'Guided Redirection',
        description: `Using a toy or treat redirects the ${animalNoun}'s attention to a safe object, neutralizing potential friction.`,
        timeline: '2-5 minutes',
        risk_level: 'low',
        emotional_impact: 'Optimistic',
        probability: p3,
        reasoning: `Probability Heuristic: The base rate of 80% is adjusted to ${p3}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Stimulus substitution effectively transfers focus from human movement to a primary reward.`,
        causal_chain: {
          title: 'Deploy high-value food or toy stimulus',
          probability: 100,
          next: {
            title: 'Pet shifts focus from human to object',
            probability: 90,
            next: {
              title: 'Safe distance established and behavior reset',
              probability: 80
            }
          }
        }
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
        reasoning: `Probability Heuristic: The base rate of 75% is adjusted to ${p1}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Minimizing physical exertion accelerates viral clearance and prevents contagion vectors.`,
        causal_chain: {
          title: 'Notify stakeholders & request remote options',
          probability: 100,
          next: {
            title: 'Reduce immediate physical/cognitive metabolic drain',
            probability: 95,
            next: {
              title: 'Accelerated recovery & zero community transmission',
              probability: 85
            }
          }
        }
      },
      {
        title: 'Pushing Through & Performance Deficit',
        description: `Ignoring the ${symptomNoun} to attend ${destNoun} causes cognitive impairment and longer recovery.`,
        timeline: '4-12 hours',
        risk_level: 'high',
        emotional_impact: 'Anxious',
        probability: p2,
        reasoning: `Probability Heuristic: The base rate of 35% is adjusted to ${p2}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Immunological resource diversion limits active focus and performance.`,
        causal_chain: {
          title: 'Attend workplace/school despite symptoms',
          probability: 100,
          next: {
            title: 'Symptom severity increases and attention lapses',
            probability: 70,
            next: {
              title: 'Prolonged recovery window & peer exposure occurs',
              probability: 60
            }
          }
        }
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
        reasoning: `Probability Heuristic: The base rate of 60% is adjusted to ${p1}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Temporal discounting favors short-term rewards over long-term task completion.`,
        causal_chain: {
          title: 'Initiate leisure activities/gaming immediately',
          probability: 100,
          next: {
            title: 'Stress levels temporarily drop while task backlog rises',
            probability: 90,
            next: {
              title: 'Severe panic/rushed execution at deadline',
              probability: 75
            }
          }
        }
      },
      {
        title: 'Disciplined Task Execution',
        description: 'Prioritizing work builds progress and secures peace of mind, though causing immediate fatigue.',
        timeline: '3-8 hours',
        risk_level: 'low',
        emotional_impact: 'Objective',
        probability: p2,
        reasoning: `Probability Heuristic: The base rate of 70% is adjusted to ${p2}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Delaying gratification minimizes deadline pressure and protects cognitive margins.`,
        causal_chain: {
          title: 'Begin structured productivity block',
          probability: 100,
          next: {
            title: 'Substantial progress achieved on critical deliverables',
            probability: 85,
            next: {
              title: 'Unlock guilt-free high-quality leisure hours later',
              probability: 80
            }
          }
        }
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
        reasoning: `Probability Heuristic: The base rate of 65% is adjusted to ${p1}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: External skin discoloration rarely correlates with systemic organic toxicity.`,
        causal_chain: {
          title: 'Consume item after trimming bruised exterior',
          probability: 100,
          next: {
            title: 'Gastrointestinal tract processes normal nutrients',
            probability: 95,
            next: {
              title: 'Zero metabolic disruption & zero food waste',
              probability: 90
            }
          }
        }
      },
      {
        title: 'Active Pathogen Ingestion',
        description: `The blemishes contain active microbial colonies, causing gastrointestinal distress.`,
        timeline: '2-12 hours',
        risk_level: 'high',
        emotional_impact: 'Skeptical',
        probability: p2,
        reasoning: `Probability Heuristic: The base rate of 25% is adjusted to ${p2}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Ingesting mold or bacterial strains overwhelms baseline digestive defenses.`,
        causal_chain: {
          title: 'Consume questionable food item containing rot',
          probability: 100,
          next: {
            title: 'Pathogenic colonies bypass stomach acid defenses',
            probability: 60,
            next: {
              title: 'Gastrointestinal distress & systemic performance depletion',
              probability: 50
            }
          }
        }
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
        reasoning: `Probability Heuristic: The base rate of 65% is adjusted to ${p1}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Active commitment of attention produces direct feedback but reduces overall flexibility.`,
        causal_chain: {
          title: 'Commit resources and execute immediate plans',
          probability: 100,
          next: {
            title: 'Encounter real-world friction and feedback loops',
            probability: 80,
            next: {
              title: 'Outcome realization with variable resource depletion',
              probability: 65
            }
          }
        }
      },
      {
        title: 'Defensive Deferral & Preservation',
        description: `Delaying or avoiding the action preserves current resources and avoids short-term volatility.`,
        timeline: '1 month',
        risk_level: 'low',
        emotional_impact: 'Objective',
        probability: p2,
        reasoning: `Probability Heuristic: The base rate of 75% is adjusted to ${p2}% based on a ${riskLabel} risk posture and a ${personalityLabel} decision lens. Systems Analysis: Maintaining the status quo minimizes risk exposure while information is incomplete.`,
        causal_chain: {
          title: 'Postpone action and monitor environment indicators',
          probability: 100,
          next: {
            title: 'Maintain current resource baseline and flexibility',
            probability: 90,
            next: {
              title: 'Avoid short-term volatility but defer potential yields',
              probability: 75
            }
          }
        }
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

  const getCategory = (text) => {
    const clean = text.toLowerCase();
    if (['job', 'offer', 'career', 'promote', 'resign', 'quit', 'interview', 'work', 'office', 'boss', 'manager', 'study', 'class', 'school', 'university', 'college', 'exam', 'test', 'homework', 'learn'].some(w => clean.includes(w))) {
      return 'career';
    }
    if (['money', 'invest', 'investment', 'crypto', 'coin', 'stock', 'finance', 'salary', 'buy', 'sell', 'cost', 'spend', 'price', 'bank', 'budget', 'rent', 'lease'].some(w => clean.includes(w))) {
      return 'finance';
    }
    if (['marry', 'relationship', 'friend', 'love', 'date', 'partner', 'divorce', 'family', 'wife', 'husband', 'kid', 'parent', 'cat', 'dog', 'pet', 'animal'].some(w => clean.includes(w))) {
      return 'relationships';
    }
    if (['stomach', 'pain', 'ache', 'sick', 'ill', 'fever', 'flu', 'cough', 'cold', 'health', 'medical', 'doctor', 'hospital', 'pill', 'diet', 'food', 'eat', 'drink', 'mushroom', 'symptom'].some(w => clean.includes(w))) {
      return 'health';
    }
    return 'general';
  };
  const category = getCategory(decision);

  return {
    category: category,
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
