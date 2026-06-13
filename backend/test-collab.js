// backend/test-collab.js
const assert = require('assert');

const API_BASE = 'http://localhost:3000';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Request to ${url} failed with status ${res.status}: ${txt}`);
  }
  return res.json();
}

async function runCollabTest() {
  console.log('🏁 Starting Collaborative Decision Room Integration Test...\n');
  
  try {
    // 1. Create Room (Host is Alice)
    console.log('Step 1: Alice creates a collaborative room...');
    const createRes = await request('/api/collab/create', {
      method: 'POST',
      body: {
        decision: 'Should the team migrate the core database to a distributed model?',
        risk: 'high',
        personality: 'analytical',
        hostName: 'Alice'
      }
    });

    assert(createRes.roomCode, 'Room code should be generated');
    assert(createRes.hostId, 'Host user ID should be generated');
    assert.strictEqual(createRes.room.status, 'lobby', 'Initial room status should be "lobby"');
    assert.strictEqual(createRes.room.participants.length, 1, 'Should have exactly 1 participant initially');
    assert.strictEqual(createRes.room.participants[0].name, 'Alice', 'First participant should be Alice');
    
    const code = createRes.roomCode;
    const hostId = createRes.hostId;
    console.log(`✅ Room Created Successfully. Code: ${code}, Host ID: ${hostId}`);
    
    const scenariosCount = createRes.room.scenarios.length;
    console.log(`   Scenarios Generated: ${scenariosCount}`);
    assert(scenariosCount > 0, 'Scenarios should be pre-generated for the room');

    // 2. Join Room (Bob joins)
    console.log('\nStep 2: Bob attempts to join the room...');
    const joinRes = await request('/api/collab/join', {
      method: 'POST',
      body: {
        code: code,
        participantName: 'Bob',
        personality: 'risk-taker'
      }
    });

    assert(joinRes.participantId, 'Bob should get a participant ID');
    assert.strictEqual(joinRes.room.participants.length, 2, 'Room should now have 2 participants');
    assert.strictEqual(joinRes.room.participants[1].name, 'Bob', 'Second participant should be Bob');
    const bobId = joinRes.participantId;
    console.log(`✅ Bob joined successfully. Participant ID: ${bobId}`);

    // 3. Start voting round
    console.log('\nStep 3: Alice starts the voting round...');
    const startRes = await request('/api/collab/start', {
      method: 'POST',
      body: {
        code: code,
        hostId: hostId
      }
    });
    
    assert.strictEqual(startRes.status, 'voting', 'Room status should update to "voting"');
    console.log('✅ Voting round successfully started.');

    // 4. Bob votes
    console.log('\nStep 4: Bob submits his votes...');
    // Create votes array for Bob
    const bobVotes = [];
    for (let i = 0; i < scenariosCount; i++) {
      bobVotes.push({ scenarioIndex: i, suitability: 5 }); // Bob likes risk
    }
    const bobVoteRes = await request('/api/collab/vote', {
      method: 'POST',
      body: {
        code: code,
        participantId: bobId,
        votes: bobVotes
      }
    });
    assert.strictEqual(bobVoteRes.status, 'voting', 'Room should still be in voting status as Alice has not voted');
    console.log('✅ Bob submitted votes. Room state verified.');

    // 5. Alice votes
    console.log('\nStep 5: Alice submits her votes...');
    const aliceVotes = [];
    for (let i = 0; i < scenariosCount; i++) {
      aliceVotes.push({ scenarioIndex: i, suitability: 3 }); // Alice is analytical/conservative
    }
    const aliceVoteRes = await request('/api/collab/vote', {
      method: 'POST',
      body: {
        code: code,
        participantId: hostId,
        votes: aliceVotes
      }
    });

    assert.strictEqual(aliceVoteRes.status, 'completed', 'Room status should be "completed" now that everyone voted');
    assert(aliceVoteRes.consensus, 'Consensus summary object should exist');
    assert(aliceVoteRes.consensus.agreementScore !== undefined, 'Agreement index score should be calculated');
    console.log(`✅ Alice submitted votes. Consensus reached!`);
    console.log(`📊 Consensus Level: ${aliceVoteRes.consensus.consensusLevel}`);
    console.log(`📊 Agreement Score: ${aliceVoteRes.consensus.agreementScore}%`);
    console.log(`📊 Winning Pathway: "${aliceVoteRes.consensus.winningPathTitle}"`);

    // 6. Get room state
    console.log('\nStep 6: Querying final room state via GET endpoint...');
    const finalState = await request(`/api/collab/room/${code}`);
    assert.strictEqual(finalState.status, 'completed', 'Fetched room state should be in completed status');
    console.log('✅ Room GET endpoint verified.');

    console.log('\n🎉 ALL COLLABORATIVE ROOM INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('\n❌ TEST FAILED!');
    console.error(err);
    process.exit(1);
  }
}

runCollabTest();
