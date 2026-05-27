// test-local.js
const testCases = [
  { decision: "When is the rain comming if in a desert.", risk: "medium", personality: "balanced" },
  { decision: "should i quit my desrt job now", risk: "high", personality: "rational" },
  { decision: "i think i should play game and study tommorow", risk: "low", personality: "emotional" },
  { decision: "Is it good to eat apple with stomacth ache?", risk: "medium", personality: "rational" }
];

async function runDiagnostics() {
  console.log("🚀 STARTING SIMULATOR LOCAL DIAGNOSTICS...\n");
  for (const tc of testCases) {
    console.log(`--------------------------------------------------`);
    console.log(`📥 Input Query: "${tc.decision}"`);
    console.log(`⚙️ Risk/Lens:  ${tc.risk} / ${tc.personality}`);
    try {
      const response = await fetch("http://localhost:3000/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tc)
      });
      const data = await response.json();
      console.log(`\n📤 Standardized Output Statement: "${data.decision_summary}"`);
      console.log(`🧠 Dynamic Cognitive Bias Score:   ${data.cognitive_analysis?.bias_score}%`);
      console.log(`🔍 Detected Bias:                  ${JSON.stringify(data.cognitive_analysis?.detected_biases?.[0])}`);
      console.log(`📈 Confidence:                     ${data.confidence_assessment?.score}% (${data.confidence_assessment?.level})`);
      console.log(`📈 Scenarios Count:                 ${data.scenarios?.length}`);
      console.log(`📈 Probabilities & Justifications:`);
      data.scenarios?.forEach((sc, idx) => {
        console.log(`   [Path ${idx+1}] Probability: ${sc.probability}% (Emotional Impact: ${sc.emotional_impact})`);
        console.log(`         Reasoning: "${sc.reasoning}"`);
      });
    } catch (err) {
      console.error(`❌ Fetch error:`, err.message);
    }
    console.log(`--------------------------------------------------\n`);
  }
}

runDiagnostics();
