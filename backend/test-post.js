// backend/test-post.js
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
console.log('🔍 Starting Google Gemini POST API Diagnostics...');
console.log(`🔑 Key: ${apiKey ? 'Loaded' : 'Missing'}`);

async function testPost() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = "Say 'Test Successful' and return raw JSON format: { \"status\": \"ok\" }";

  console.log('🌐 Fetching POST: ' + url);
  const start = Date.now();
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('⚠️ 15-second marker hit! Still waiting for Google...');
  }, 15000);

  try {
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
    const duration = Date.now() - start;
    console.log(`\n✅ Connection Successful in ${duration}ms!`);
    console.log(`📈 HTTP Status: ${response.status} ${response.statusText}`);
    const data = await response.text();
    console.log(`💬 Full Response Body:\n${data}`);
  } catch (err) {
    clearTimeout(timeoutId);
    const duration = Date.now() - start;
    console.log(`\n❌ POST Connection FAILED after ${duration}ms!`);
    console.log(`🚨 Error Code: ${err.code}`);
    console.log(`🚨 Error Message: ${err.message}`);
    console.log(`🚨 Stack: ${err.stack}`);
  }
}

testPost();
