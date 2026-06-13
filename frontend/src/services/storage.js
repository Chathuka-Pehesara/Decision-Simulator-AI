// src/services/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@decision_simulator_history';

/**
 * Helper to classify decisions into categories based on keywords
 */
export const getCategoryFromText = (text) => {
  if (!text) return 'general';
  const clean = text.toLowerCase();
  
  const rules = {
    career: ['job', 'offer', 'career', 'promote', 'promotion', 'resign', 'quit', 'leave', 'interview', 'work', 'office', 'boss', 'manager', 'study', 'class', 'school', 'university', 'college', 'exam', 'test', 'homework', 'learn', 'academic', 'degree', 'resume'],
    finance: ['money', 'invest', 'investment', 'crypto', 'coin', 'stock', 'finance', 'financial', 'salary', 'buy', 'sell', 'cost', 'spend', 'price', 'bank', 'budget', 'rent', 'lease', 'debt', 'loan', 'mortgage', 'portfolio'],
    relationships: ['marry', 'relationship', 'friend', 'friends', 'love', 'date', 'dating', 'partner', 'divorce', 'family', 'wife', 'husband', 'kid', 'kids', 'parent', 'parents', 'cat', 'dog', 'pet', 'animal', 'split', 'break up'],
    health: ['stomach', 'pain', 'ache', 'sick', 'ill', 'fever', 'flu', 'cough', 'cold', 'health', 'medical', 'doctor', 'hospital', 'pill', 'diet', 'food', 'eat', 'drink', 'mushroom', 'symptom', 'injury', 'therapy', 'exercise', 'sleep']
  };

  for (const [cat, keywords] of Object.entries(rules)) {
    if (keywords.some(word => clean.includes(word))) {
      return cat;
    }
  }
  return 'general';
};

/**
 * Get all saved simulations
 */
export async function getSimulations() {
  try {
    const rawData = await AsyncStorage.getItem(STORAGE_KEY);
    if (!rawData) return [];
    
    const list = JSON.parse(rawData);
    // Sort by timestamp descending (newest first)
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Failed to retrieve simulations from AsyncStorage:', error);
    return [];
  }
}

/**
 * Save a new simulation
 */
export async function saveSimulation(decision, result) {
  try {
    const list = await getSimulations();
    
    // Auto-categorize if not returned by server
    const category = result.category || getCategoryFromText(decision);
    
    const newRecord = {
      id: Date.now().toString(),
      decision,
      risk: result.risk || 'medium',
      personality: result.personality || 'balanced',
      timestamp: new Date().toISOString(),
      category,
      outcome: null, // Initial outcome is null
      result: {
        ...result,
        category,
        decision_summary: result.decision_summary || decision,
        scenarios: result.scenarios || [],
        key_factors_to_consider: result.key_factors_to_consider || [],
        cognitive_analysis: result.cognitive_analysis || { bias_score: 0, detected_biases: [], reframed_decision: "" },
        boardroom_debate: result.boardroom_debate || { advisors: [], debate_transcript: [], consensus_summary: "" },
        confidence_assessment: result.confidence_assessment || { level: "Low Confidence", score: 0, limitations: [] },
        final_note: result.final_note || '',
      }
    };

    const updatedList = [newRecord, ...list];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    return newRecord;
  } catch (error) {
    console.error('Failed to save simulation to AsyncStorage:', error);
    throw error;
  }
}

/**
 * Save / Update an outcome journal entry
 */
export async function saveSimulationOutcome(id, outcomeData) {
  try {
    const list = await getSimulations();
    const index = list.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Simulation record with ID ${id} not found.`);
    }
    
    list[index].outcome = {
      text: outcomeData.text || '',
      rating: outcomeData.rating || 'neutral', // 'positive' | 'neutral' | 'negative'
      timestamp: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list[index];
  } catch (error) {
    console.error(`Failed to save simulation outcome for ${id} in AsyncStorage:`, error);
    throw error;
  }
}

/**
 * Delete a specific simulation by ID
 */
export async function deleteSimulation(id) {
  try {
    const list = await getSimulations();
    const filteredList = list.filter(item => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredList));
    return filteredList;
  } catch (error) {
    console.error(`Failed to delete simulation ${id} from AsyncStorage:`, error);
    throw error;
  }
}

/**
 * Clear all saved simulations
 */
export async function clearAllSimulations() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear AsyncStorage history:', error);
    throw error;
  }
}

// --- CUSTOM ADVISOR PERSONAS ---
const ADVISORS_KEY = '@decision_simulator_custom_advisors';
const PRESET_ADVISORS = [
  { id: 'pres_1', name: 'Stoic Philosopher', riskAppetite: 'low', domainExpertise: 'Philosophy', description: 'Evaluates options through emotional control, path dependency, and long-term serenity.' },
  { id: 'pres_2', name: 'Venture Capitalist', riskAppetite: 'high', domainExpertise: 'Finance', description: 'Focuses on capital leverage, scale, risk-mitigation, and compound utility gains.' }
];

export async function getCustomAdvisors() {
  try {
    const raw = await AsyncStorage.getItem(ADVISORS_KEY);
    if (!raw) {
      // Pre-populate with defaults
      await AsyncStorage.setItem(ADVISORS_KEY, JSON.stringify(PRESET_ADVISORS));
      return PRESET_ADVISORS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load custom advisors:', err);
    return PRESET_ADVISORS;
  }
}

export async function saveCustomAdvisor(advisor) {
  try {
    const list = await getCustomAdvisors();
    const newAdvisor = {
      ...advisor,
      id: advisor.id || `adv_${Date.now()}`
    };
    
    const index = list.findIndex(a => a.id === newAdvisor.id);
    if (index > -1) {
      list[index] = newAdvisor;
    } else {
      list.push(newAdvisor);
    }
    
    await AsyncStorage.setItem(ADVISORS_KEY, JSON.stringify(list));
    return newAdvisor;
  } catch (err) {
    console.error('Failed to save advisor:', err);
    throw err;
  }
}

export async function deleteCustomAdvisor(id) {
  try {
    const list = await getCustomAdvisors();
    const filtered = list.filter(a => a.id !== id);
    await AsyncStorage.setItem(ADVISORS_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.error('Failed to delete advisor:', err);
    throw err;
  }
}

// --- SUBSCRIPTION & BILLING SANDBOX CONTROLS ---
const SUB_KEY = '@decision_simulator_subscription_status';

export async function getSubscriptionTier() {
  try {
    const raw = await AsyncStorage.getItem(SUB_KEY);
    const now = new Date();
    const defaultSub = {
      tier: 'free', // 'free' | 'pro' | 'teams'
      count: 0,
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
    };

    if (!raw) {
      await AsyncStorage.setItem(SUB_KEY, JSON.stringify(defaultSub));
      return defaultSub;
    }

    const sub = JSON.parse(raw);
    
    // Check if billing cycle has expired, reset usage if needed
    if (new Date(sub.resetDate) <= now) {
      sub.count = 0;
      sub.resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      await AsyncStorage.setItem(SUB_KEY, JSON.stringify(sub));
    }
    
    return sub;
  } catch (err) {
    console.warn('Failed to load subscription status:', err);
    return { tier: 'free', count: 0, resetDate: new Date().toISOString() };
  }
}

export async function setSubscriptionTier(tier) {
  try {
    const sub = await getSubscriptionTier();
    sub.tier = tier;
    await AsyncStorage.setItem(SUB_KEY, JSON.stringify(sub));
    return sub;
  } catch (err) {
    console.error('Failed to save subscription tier:', err);
    throw err;
  }
}

export async function incrementSimulationUsage() {
  try {
    const sub = await getSubscriptionTier();
    sub.count = (sub.count || 0) + 1;
    await AsyncStorage.setItem(SUB_KEY, JSON.stringify(sub));
    return sub;
  } catch (err) {
    console.error('Failed to increment usage:', err);
    throw err;
  }
}

