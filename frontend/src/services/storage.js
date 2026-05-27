// src/services/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@decision_simulator_history';

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
    
    const newRecord = {
      id: Date.now().toString(),
      decision,
      risk: result.risk || 'medium',
      personality: result.personality || 'balanced',
      timestamp: new Date().toISOString(),
      result: {
        ...result,
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
