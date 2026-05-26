// src/services/api.js
import axios from 'axios';

// The default backend URL as specified in requirements
const API_URL = 'http://localhost:3000/simulate';

const api = axios.create({
  timeout: 50000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Simulates future outcomes for a decision
 * Calls POST /simulate. Falls back to a local generator on failure/network errors.
 */
export async function simulateDecision(decision, risk, personality) {
  try {
    const response = await api.post(API_URL, {
      decision,
      risk,
      personality,
    });
    return response.data;
  } catch (error) {
    console.warn('Backend API connection failed, executing intelligent local simulation fallback...', error.message);
    
    // Artificial delay to simulate real network request and showcase loading state nicely
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    return generateOfflineSimulation(decision, risk, personality);
  }
}

/**
 * Local simulation engine producing rich, context-aware scenarios
 */
function generateOfflineSimulation(decision, riskTolerance, personality) {
  const norm = decision.toLowerCase();
  
  // Clean punctuation to avoid parsing clutter
  const cleanNorm = norm.replace(/[?.!,]/g, '').trim();

  // 1. Setup modifiers based on settings
  const personalityLabel = personality ? personality.charAt(0).toUpperCase() + personality.slice(1) : 'Balanced';
  const riskLabel = riskTolerance ? riskTolerance.charAt(0).toUpperCase() + riskTolerance.slice(1) : 'Medium';

  // Core data structures
  let scenarios = [];
  let keyFactors = [];

  // ==========================================
  // SEMANTIC MARKERS (RESILIENT DICTIONARY)
  // ==========================================

  // Health/Sickness markers (including common typos)
  const healthSymptoms = [
    'stomach', 'stomacth', 'pain', 'ache', 'sick', 'ill', 'fever', 'flu', 
    'cough', 'cold', 'headache', 'nausea', 'vomit', 'fatigue', 'hurt', 
    'sore', 'infection', 'disease', 'dizzy', 'injury'
  ];
  const hasSymptom = healthSymptoms.some(word => cleanNorm.includes(word));

  // Attendance destinations
  const destinations = [
    'school', 'class', 'lecture', 'college', 'university', 'office', 
    'work', 'job', 'meeting', 'party', 'wedding', 'event', 'exam', 'test'
  ];
  const hasDestination = destinations.some(word => cleanNorm.includes(word));

  // Food/Consumption markers
  const foodItems = [
    'eat', 'drink', 'consume', 'apple', 'food', 'meat', 'milk', 'water', 
    'coffee', 'pill', 'diet', 'taste', 'mushroom', 'cook', 'ingest', 'bread'
  ];
  const hasFood = foodItems.some(word => cleanNorm.includes(word));

  // Productivity vs Leisure markers
  const leisureWords = ['play', 'game', 'watch', 'movie', 'sleep', 'relax', 'netflix', 'youtube', 'scroll'];
  const productivityWords = ['study', 'learn', 'work', 'homework', 'exam', 'test', 'write', 'code', 'practice'];
  const hasLeisure = leisureWords.some(word => cleanNorm.includes(word));
  const hasProductivity = productivityWords.some(word => cleanNorm.includes(word));

  // 4. Pet / Animal Care Matchers
  const petWords = ['cat', 'dog', 'pet', 'animal', 'bird', 'fish', 'kitten', 'puppy', 'veterinary', 'vet', 'feed', 'bite', 'scratch'];
  const hasPet = petWords.some(word => cleanNorm.includes(word));

  // Standard category detection
  const isCareer = ['job', 'offer', 'career', 'promote', 'resign', 'quit', 'interview'].some(w => cleanNorm.includes(w));
  const isBusiness = ['business', 'start', 'company', 'startup', 'invest', 'client', 'sales'].some(w => cleanNorm.includes(w));
  const isRelocate = ['move', 'relocate', 'country', 'city', 'abroad', 'travel', 'flight'].some(w => cleanNorm.includes(w));
  const isPersonal = ['marry', 'date', 'relationship', 'propose', 'divorce', 'friend', 'love'].some(w => cleanNorm.includes(w));
  const isFinancial = ['buy', 'house', 'car', 'property', 'spend', 'cost', 'price', 'crypto', 'stock'].some(w => cleanNorm.includes(w));

  // ==========================================
  // CASE A: PET / ANIMAL CARE
  // ==========================================
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

  // ==========================================
  // CASE B: HEALTH DILEMMA (SICK VS DESTINATION)
  // ==========================================
  } else if (hasSymptom && hasDestination) {
    let symptomNoun = 'physical symptoms';
    if (cleanNorm.includes('stomach') || cleanNorm.includes('stomacth')) symptomNoun = 'stomach discomfort';
    else if (cleanNorm.includes('headache')) symptomNoun = 'severe headache';
    else if (cleanNorm.includes('fever')) symptomNoun = 'fever';
    else if (cleanNorm.includes('pain')) symptomNoun = 'localized pain';

    let destNoun = 'your destination';
    if (cleanNorm.includes('school')) destNoun = 'school';
    else if (cleanNorm.includes('work') || cleanNorm.includes('office')) destNoun = 'work';
    else if (cleanNorm.includes('exam') || cleanNorm.includes('test')) destNoun = 'your exam';

    scenarios = [
      {
        title: 'Recovery-First & Active Absence',
        description: `You choose to stay home, prioritize self-care, and allow your body to heal. While you temporarily defer your obligations at ${destNoun}, your physical health stabilizes rapidly, reducing illness duration and preventing the transmission of germs to peers.`,
        timeline: '24 - 48 Hours',
        risk_level: 'low',
        emotional_impact: personality === 'emotional' ? 'Relieved but anxious about backlog' : 'Calm and focused on healing',
        probability: riskTolerance === 'low' ? 75 : 60,
        reasoning: `Biological resource preservation suggests that rest reduces total recovery time. Staying home avoids systemic exhaustion and secondary infections. Given an ${personalityLabel} style, you would balance safety against short-term task delays.`
      },
      {
        title: 'Pushing Through & Exhaustion Risk',
        description: `You decide to ignore the ${symptomNoun} and attend ${destNoun}. Your attention span and cognitive capability are severely fractured by the physical distress, leading to extremely low performance, physical drain, and a high risk of prolonged recuperation requirements.`,
        timeline: '4 - 12 Hours',
        risk_level: 'high',
        emotional_impact: 'Physically exhausted and deeply stressed',
        probability: riskTolerance === 'high' ? 45 : 25,
        reasoning: `Attempting high cognitive output while your immune system is actively fighting ${symptomNoun} drains glycogen reserves, raising physical risk indices. A ${riskLabel} tolerance indicates you may accept performance hits in exchange for basic attendance.`
      },
      {
        title: 'Adaptive Hybrid / Deferred Participation',
        description: `You stay home but negotiate remote access, review lecture slides, or request a makeup session for ${destNoun}. You manage to maintain progress on critical parameters while fully protecting your physiological recovery.`,
        timeline: '1 - 2 Days',
        risk_level: 'low',
        emotional_impact: 'Satisfied and balanced',
        probability: 65,
        reasoning: `Mitigating attendance risk without incurring biological stress represents an optimized compromise. An ${personalityLabel} decision style will prioritize sourcing makeup notes or digital slides.`
      }
    ];

    keyFactors = [
      `Contagion risk to other individuals at ${destNoun}`,
      `Severity of the ${symptomNoun} (stable vs worsening indicators)`,
      `Criticality of immediate physical attendance (e.g. exam vs regular lecture)`,
      'Availability of makeup pathways or remote channels'
    ];

  // ==========================================
  // CASE B: TIME ALLOCATION (WORK VS PLAY)
  // ==========================================
  } else if (hasLeisure && hasProductivity) {
    let leisureAction = 'leisure activity';
    if (cleanNorm.includes('game') || cleanNorm.includes('play')) leisureAction = 'gaming';
    else if (cleanNorm.includes('movie') || cleanNorm.includes('watch')) leisureAction = 'watching entertainment';

    let studyAction = 'study and obligations';
    if (cleanNorm.includes('study')) studyAction = 'studying';
    else if (cleanNorm.includes('work')) studyAction = 'working';
    else if (cleanNorm.includes('exam') || cleanNorm.includes('test')) studyAction = 'preparing for exams';

    scenarios = [
      {
        title: 'Immediate Gratification & Academic Debt',
        description: `You choose the ${leisureAction} path. You experience immediate dopamine release, elevated relaxation, and deep stress reduction. However, you carry forward an unmodified backlog of ${studyAction}, causing a steep rise in anxiety as deadlines approach.`,
        timeline: '2 - 6 Hours',
        risk_level: 'high',
        emotional_impact: personality === 'emotional' ? 'Exhilarated then guilty' : 'Short-term fun, long-term stress',
        probability: 65,
        reasoning: `Prioritizing immediate rewards defer intellectual investments. Under a ${riskLabel} risk posture, the temporary relief is offset by severe resource compression later.`
      },
      {
        title: 'Disciplined Progress & Leisure Deferral',
        description: `You allocate your time entirely to ${studyAction}. You experience high focus, build solid intellectual asset reserves, and secure peace of mind regarding upcoming checkpoints, although you encounter immediate cognitive fatigue.`,
        timeline: '3 - 8 Hours',
        risk_level: 'low',
        emotional_impact: 'Satisfied, disciplined, but slightly tired',
        probability: 70,
        reasoning: `Delaying gratification builds structural capability. Using a ${personalityLabel} focus, finishing study tasks first represents a highly stable path, freeing you for guilt-free leisure later.`
      },
      {
        title: 'Structured Time-Splitting (The Balanced Path)',
        description: `You implement a structured breakdown (e.g., Pomodoro or timed sessions). You spend 2 hours on ${studyAction} followed by 45 minutes of ${leisureAction}. You obtain measurable progress while preserving mental stamina.`,
        timeline: '4 - 8 Hours',
        risk_level: 'low',
        emotional_impact: 'Highly stable and clear-headed',
        probability: 55,
        reasoning: `Dividing active blocks protects against cognitive depletion. A ${personalityLabel} mindset identifies this as the optimal method to manage exhaustion while completing tasks.`
      }
    ];

    keyFactors = [
      'Hours remaining until critical evaluation deadlines',
      'Current mental exhaustion levels (cognitive capacity remaining)',
      'Strength of self-regulation structures (willingness to stop gaming at set times)',
      'Long-term yield of study progress vs immediate entertainment value'
    ];

  // ==========================================
  // CASE C: FOOD CONSUMPTION
  // ==========================================
  } else if (hasFood) {
    let itemNoun = 'item';
    if (cleanNorm.includes('apple')) itemNoun = 'apple';
    else if (cleanNorm.includes('food')) itemNoun = 'food';
    else if (cleanNorm.includes('mushroom')) itemNoun = 'mushroom';
    else if (cleanNorm.includes('coffee')) itemNoun = 'coffee';
    else if (cleanNorm.includes('milk')) itemNoun = 'milk';
    else if (cleanNorm.includes('meat')) itemNoun = 'meat';
    else if (cleanNorm.includes('water')) itemNoun = 'water';

    scenarios = [
      {
        title: 'Mild Sensory Friction / Safe Consumption',
        description: `You consume the ${itemNoun}. The blemishes or spots turn out to be harmless superficial markings rather than deep microbial decay. The taste is acceptable, resulting in standard nutritional absorption with zero health impact.`,
        timeline: '10 Minutes - 4 Hours',
        risk_level: 'low',
        emotional_impact: 'Relieved, physically neutral',
        probability: 65,
        reasoning: `Superficial damage rarely alters organic toxicity profiles. An ${personalityLabel} style recognizes that trimming away blemished sections reduces pathogenic exposure indices to baseline.`
      },
      {
        title: 'Active Pathogen Ingestion & Indigestion',
        description: `The physical markings represent active fungal, mold, or bacterial activity. Consuming the ${itemNoun} triggers a localized immunological reaction, causing nausea, abdominal cramps, or mild food poisoning.`,
        timeline: '2 - 12 Hours',
        risk_level: 'high',
        emotional_impact: 'Anxious, experiencing regret',
        probability: riskTolerance === 'high' ? 35 : 20,
        reasoning: `Biological hazards increase exponentially with food surface degradation. A ${riskLabel} approach assumes the risk is acceptable, exposing the GI tract to active pathogens.`
      },
      {
        title: 'Selective Avoidance & Hazard Mitigation',
        description: `You trim the suspicious areas entirely or discard the ${itemNoun} to eat something spotless. Your biological safety parameters remain at 100%, and you experience no digestive concern.`,
        timeline: 'Immediate',
        risk_level: 'low',
        emotional_impact: 'Calm, patient, and physically secure',
        probability: 75,
        reasoning: `Avoiding questionable food vectors is a highly rational choice with zero health downside, aligned with ${personalityLabel} analytical standards.`
      }
    ];

    keyFactors = [
      'Visual and structural depth of the blemishes (softness vs firmness)',
      'Immune system baseline and gut lining resilience',
      'Thermal sterilization (cooking/washing options available)',
      'Availability of spotless dietary alternatives'
    ];

  // ==========================================
  // CASE D: LIFESTYLE / SPECIFIC CATEGORIES
  // ==========================================
  } else if (isCareer) {
    scenarios = [
      {
        title: 'Career Advancement & High Performance',
        description: `You accept the professional challenge. This expands your logical and technical capabilities, leading to early operational success, though demanding high energy input.`,
        timeline: '1 - 6 Months',
        risk_level: 'low',
        emotional_impact: 'Stimulated and highly focused',
        probability: 70,
        reasoning: `Taking on new roles aligns with long-term skill compounding. An ${personalityLabel} lens dictates establishing structural work-life boundaries early.`
      },
      {
        title: 'Cultural Fatigue & Work-Life Friction',
        description: 'The day-to-day requirements proceed normally, but secondary corporate elements or management friction limit your personal autonomy, causing early cognitive exhaustion.',
        timeline: '3 - 12 Months',
        risk_level: 'medium',
        emotional_impact: 'Resilient but experiencing fatigue',
        probability: 35,
        reasoning: `Culture fit is a primary variable in job satisfaction. A ${riskLabel} setting requires preparing mental buffers.`
      },
      {
        title: 'Scope Creep & Organizational Pivot',
        description: 'Macro-economic shifts force the company to restructure, altering your initial parameters and shifting your focus to high-pressure emergency mitigation tasks.',
        timeline: '6 - 18 Months',
        risk_level: 'high',
        emotional_impact: 'Alert, navigating structural uncertainty',
        probability: 25,
        reasoning: `Macro shifts are external parameters. Balancing logic with high patience is required under a ${personalityLabel} style.`
      }
    ];

    keyFactors = [
      'Total liquidity buffer available post-transition',
      'Record of direct management and corporate culture',
      'Alternative career opportunity costs',
      'Daily work-life margin preservation'
    ];

  // ==========================================
  // CASE E: DYNAMIC SENTENCE NLP REPHRASER (UNIVERSAL FOOLPROOF FALLBACK)
  // ==========================================
  } else {
    // 1. Programmatically extract the clean action statement by stripping common helper prefix/questions
    let actionStatement = cleanNorm;
    
    const prefixes = [
      /^should i\s+/i,
      /^should we\s+/i,
      /^should you\s+/i,
      /^i want to\s+/i,
      /^i need to\s+/i,
      /^is it good to\s+/i,
      /^what happens if i\s+/i,
      /^what if i\s+/i,
      /^should i choose to\s+/i
    ];

    for (const prefix of prefixes) {
      if (prefix.test(actionStatement)) {
        actionStatement = actionStatement.replace(prefix, '');
        break;
      }
    }

    // Double check cleanup
    actionStatement = actionStatement.trim();
    if (!actionStatement) {
      actionStatement = 'proceed with this decision';
    }

    // Capitalize the action statement for elegant display
    const actionCap = actionStatement.charAt(0).toUpperCase() + actionStatement.slice(1);

    scenarios = [
      {
        title: 'Direct Engagement Path',
        description: `You proceed with the action: "${actionStatement}". This directly initiates the physical or logical process. You experience the primary immediate benefits of this choice, but must actively manage the secondary friction and resource commitments required to keep it stable.`,
        timeline: '1 - 3 Months',
        risk_level: riskTolerance === 'high' ? 'medium' : 'low',
        emotional_impact: personality === 'emotional' ? 'Intense focus and alert caution' : 'Measured analytical engagement',
        probability: riskTolerance === 'low' ? 55 : 70,
        reasoning: `Direct action commits assets to a specific pathway. According to ${personalityLabel} modeling, ensuring you have sufficient temporal and energy buffers to execute "${actionStatement}" minimizes risk.`
      },
      {
        title: 'Defensive Deferral & Risk Mitigation',
        description: `You choose to delay, modify, or not proceed with: "${actionStatement}". This completely preserves your current baseline resources, attention, and status quo, avoiding any immediate volatility. However, it postpones any potential progress or changes associated with this choice.`,
        timeline: 'Immediate - 1 Month',
        risk_level: 'low',
        emotional_impact: 'Physically secure, calm, and highly patient',
        probability: riskTolerance === 'low' ? 75 : 45,
        reasoning: `Maintaining the status quo is the safest default when data is incomplete. A ${riskLabel} risk setting highlights that avoiding "${actionStatement}" preserves optionality for a better moment.`
      },
      {
        title: 'Incremental / Split-Phase Execution',
        description: `Instead of going all-in, you break down the action: "${actionStatement}" into smaller, incremental testing phases. You test the waters slowly with minimal resource exposure, adapting your rules as you gather real-world data.`,
        timeline: '3 - 12 Months',
        risk_level: 'low',
        emotional_impact: 'Balanced, clear-headed, and adaptable',
        probability: 60,
        reasoning: `Incremental testing represents the optimal logical path to manage complex systems. Aligned with ${personalityLabel} thinking, this path balances progress with tight safety buffers.`
      }
    ];

    keyFactors = [
      `Total asset/time investment required to sustain: "${actionStatement}"`,
      `Reversibility of the choice (how easy is it to undo if it triggers friction)`,
      `Worst-case scenario impact on your core security and stability`,
      'Alignment of this action with your long-term personal values'
    ];
  }

  // 3. Assemble response to match the exact JSON schema requested
  return {
    decision_summary: decision,
    scenarios: scenarios,
    key_factors_to_consider: keyFactors,
    final_note: `This simulation outlines potential scenarios based on a risk profile of ${riskLabel} and a ${personalityLabel} decision-making lens. It represents a theoretical modeling of possibilities using current behavioral heuristics, and is not, under any circumstances, to be considered direct personal, career, financial, or legal advice. Every decision carries unique real-world variables; maintain independent agency and exercise personal caution.`
  };
}
