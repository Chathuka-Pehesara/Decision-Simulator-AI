import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Platform 
} from 'react-native';
import Card from '../components/Card';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../styles/theme';
import { 
  createCollabRoom, 
  joinCollabRoom, 
  startCollabRoom, 
  castCollabVote, 
  getCollabRoomState 
} from '../services/api';
import { getSubscriptionTier } from '../services/storage';

export default function CollabRoomScreen({ navigation }) {
  const { theme, themeName } = useTheme();

  // Setup / Mode states
  const [tier, setTier] = useState('free');
  const [mode, setMode] = useState('menu'); // 'menu' | 'create' | 'join' | 'active'
  
  // Lobby Setup Inputs
  const [userName, setUserName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [userPersonality, setUserPersonality] = useState('balanced');
  const [decisionText, setDecisionText] = useState('');
  const [roomRisk, setRoomRisk] = useState('medium');
  
  // Active Room States
  const [roomCode, setRoomCode] = useState('');
  const [userId, setUserId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [roomState, setRoomState] = useState(null);
  const [loading, setLoading] = useState(false);

  // Voting inputs: scenarioIndex -> suitability (1 to 5)
  const [myVotes, setMyVotes] = useState({});
  const [hasVoted, setHasVoted] = useState(false);

  const pollingTimerRef = useRef(null);

  useEffect(() => {
    async function loadTier() {
      const sub = await getSubscriptionTier();
      setTier(sub.tier);
    }
    loadTier();

    return () => {
      stopPolling();
    };
  }, []);

  const startPolling = (code) => {
    stopPolling();
    console.log(`[COLLAB] Initiating polling loop for room: ${code}`);
    pollingTimerRef.current = setInterval(async () => {
      try {
        const data = await getCollabRoomState(code);
        setRoomState(data);
        
        // If room status changed to voting in backend, reset loading states
        if (data.status === 'voting' && myVotes[0] === undefined) {
          // pre-initialize votes to 3 (neutral)
          const initial = {};
          data.scenarios.forEach((_, idx) => {
            initial[idx] = 3;
          });
          setMyVotes(initial);
        }

        // If room status completed, stop polling eventually or keep polling for final results
        if (data.status === 'completed') {
          // stopPolling(); // we keep it running for final visual updates
        }
      } catch (err) {
        console.warn('Polling error fetch room state:', err.message);
      }
    }, 2500); // Poll every 2.5 seconds for snappy updates
  };

  const stopPolling = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };

  const handleCreateRoom = async () => {
    if (tier !== 'teams') {
      Alert.alert(
        'Subscription Locked',
        'Collaborative rooms are an Enterprise Teams premium feature. Please toggle subscription tiers in settings to authorize.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Deck', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }

    if (!userName.trim()) {
      Alert.alert('Validation Error', 'Please enter your name first.');
      return;
    }

    if (!decisionText.trim()) {
      Alert.alert('Validation Error', 'Please enter the decision statement to co-simulate.');
      return;
    }

    setLoading(true);
    try {
      const res = await createCollabRoom(
        decisionText.trim(),
        roomRisk,
        userPersonality,
        userName.trim()
      );
      setRoomCode(res.roomCode);
      setUserId(res.hostId);
      setIsHost(true);
      setRoomState(res.room);
      setMode('active');
      startPolling(res.roomCode);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to initialize collaborative room.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!userName.trim() || !roomCodeInput.trim()) {
      Alert.alert('Validation Error', 'Name and 5-character Room Code are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await joinCollabRoom(
        roomCodeInput.trim().toUpperCase(),
        userName.trim(),
        userPersonality
      );
      setRoomCode(roomCodeInput.trim().toUpperCase());
      setUserId(res.participantId);
      setIsHost(false);
      setRoomState(res.room);
      setMode('active');
      startPolling(roomCodeInput.trim().toUpperCase());
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to join collab room. Check code.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartVoting = async () => {
    try {
      setLoading(true);
      await startCollabRoom(roomCode, userId);
      const data = await getCollabRoomState(roomCode);
      setRoomState(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to start voting round.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVotes = async () => {
    const formattedVotes = Object.entries(myVotes).map(([idx, suitability]) => ({
      scenarioIndex: parseInt(idx),
      suitability
    }));

    try {
      setLoading(true);
      const updated = await castCollabVote(roomCode, userId, formattedVotes);
      setRoomState(updated);
      setHasVoted(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit votes.');
    } finally {
      setLoading(false);
    }
  };

  const handleExitRoom = () => {
    stopPolling();
    setMode('menu');
    setRoomCode('');
    setUserId('');
    setIsHost(false);
    setRoomState(null);
    setHasVoted(false);
    setMyVotes({});
  };

  const getVoteRatingLabel = (score) => {
    if (score === 1) return '🔴 Oppose Strongly';
    if (score === 2) return '🔶 Skeptical';
    if (score === 3) return '🟡 Neutral';
    if (score === 4) return '🟢 Support';
    return '🌟 Highly Favorable';
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
      
      {/* MENU ROUTING */}
      {mode === 'menu' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={[styles.headerBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.headerLabel, { color: theme.colors.accentViolet }]}>COLLABORATIVE DECISION DECK</Text>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Co-Simulation Rooms</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
              Invite team members to rate generated futures. Evaluate pathways with personality-weighted consensus scores.
            </Text>
          </View>

          {tier !== 'teams' && (
            <Card style={[styles.lockCard, { borderColor: theme.colors.riskHigh }]} outlined shadowed={false}>
              <Text style={{ color: theme.colors.riskHigh, fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>🔒 COLLABORATION RESTRICTED</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 11, lineHeight: 16 }}>
                Collaborative Decision Rooms require a Teams tier. Toggle active subscriptions in the billing deck to create and join lobbies.
              </Text>
            </Card>
          )}

          <Card style={[styles.formCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Your Name</Text>
            <TextInput
              style={[styles.textInput, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
              placeholder="e.g. Alice"
              placeholderTextColor={theme.colors.textMuted}
              value={userName}
              onChangeText={setUserName}
            />

            <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Your Decision Personality Profile</Text>
            <View style={styles.personalityRow}>
              {[
                { label: 'Analytical', val: 'analytical' },
                { label: 'Risk-taker', val: 'risk-taker' },
                { label: 'Emotional', val: 'emotional' },
                { label: 'Balanced', val: 'balanced' }
              ].map(p => (
                <TouchableOpacity
                  key={p.val}
                  onPress={() => setUserPersonality(p.val)}
                  style={[
                    styles.personalityBadge,
                    {
                      borderColor: userPersonality === p.val ? theme.colors.accentBlue : theme.colors.border,
                      backgroundColor: userPersonality === p.val ? theme.colors.accentBlueLight : theme.colors.surface
                    }
                  ]}
                >
                  <Text style={[styles.personalityText, { color: userPersonality === p.val ? theme.colors.accentBlue : theme.colors.textSecondary }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          <View style={styles.menuActions}>
            {tier === 'teams' ? (
              <Card style={[styles.formCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Decision Statement to Co-Simulate</Text>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
                  placeholder="Should we acquire the startup or develop products internally?"
                  placeholderTextColor={theme.colors.textMuted}
                  value={decisionText}
                  onChangeText={setDecisionText}
                />

                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Risk Profile for simulation</Text>
                <View style={[styles.personalityRow, { marginBottom: SPACING.md }]}>
                  {[
                    { label: 'Low Risk', val: 'low' },
                    { label: 'Medium Risk', val: 'medium' },
                    { label: 'High Risk', val: 'high' }
                  ].map(r => (
                    <TouchableOpacity
                      key={r.val}
                      onPress={() => setRoomRisk(r.val)}
                      style={[
                        styles.personalityBadge,
                        {
                          borderColor: roomRisk === r.val ? theme.colors.accentBlue : theme.colors.border,
                          backgroundColor: roomRisk === r.val ? theme.colors.accentBlueLight : theme.colors.surface
                        }
                      ]}
                    >
                      <Text style={[styles.personalityText, { color: roomRisk === r.val ? theme.colors.accentBlue : theme.colors.textSecondary }]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleCreateRoom}
                  disabled={loading}
                  style={[styles.actionBtn, { backgroundColor: theme.colors.accentBlue }]}
                >
                  <Text style={[styles.actionBtnText, { color: themeName === 'sci-fi' ? '#03050d' : '#FFFFFF' }]}>
                    {loading ? 'INITIALIZING...' : '🏠 CREATE DECISION ROOM'}
                  </Text>
                </TouchableOpacity>
              </Card>
            ) : (
              <Card style={[styles.formCard, { borderColor: theme.colors.border, opacity: 0.65 }]} outlined shadowed={false}>
                <Text style={[styles.inputLabel, { color: theme.colors.textMuted }]}>🏠 Host Collaborative Room (Locked)</Text>
                <TouchableOpacity
                  onPress={handleCreateRoom}
                  style={[styles.actionBtn, { backgroundColor: theme.colors.accentBlue }]}
                >
                  <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                    🏠 CREATE DECISION ROOM
                  </Text>
                </TouchableOpacity>
              </Card>
            )}

            <View style={[styles.separatorRow, { marginVertical: SPACING.md }]}>
              <View style={[styles.separatorLine, { backgroundColor: theme.colors.divider }]} />
              <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontFamily: 'Orbitron' }}>OR JOIN EXISTING</Text>
              <View style={[styles.separatorLine, { backgroundColor: theme.colors.divider }]} />
            </View>

            <Card style={[styles.formCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>5-Character Room Code</Text>
              <TextInput
                style={[styles.textInput, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface, textTransform: 'uppercase' }]}
                placeholder="e.g. CD4X8"
                placeholderTextColor={theme.colors.textMuted}
                value={roomCodeInput}
                onChangeText={setRoomCodeInput}
                maxLength={5}
              />
              <TouchableOpacity
                onPress={handleJoinRoom}
                disabled={loading}
                style={[styles.actionBtn, { backgroundColor: theme.colors.accentViolet, marginTop: SPACING.sm }]}
              >
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                  {loading ? 'SEARCHING LOBBY...' : '🚪 ENTER ROOM LOBBY'}
                </Text>
              </TouchableOpacity>
            </Card>
          </View>
          
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Home')}
            style={[styles.closeBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }]}
          >
            <Text style={[styles.closeBtnText, { color: theme.colors.textPrimary }]}>
              CLOSE DECK
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ACTIVE ROOM VIEW */}
      {mode === 'active' && roomState && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header info */}
          <Card style={[styles.roomHeaderCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
            <View style={styles.roomHeaderTop}>
              <View>
                <Text style={{ color: theme.colors.accentViolet, fontSize: 9, fontFamily: 'Orbitron', fontWeight: 'bold' }}>COLLAB ROOM CODE</Text>
                <Text style={[styles.roomCodeText, { color: theme.colors.accentBlue }]}>{roomCode}</Text>
              </View>
              <TouchableOpacity onPress={handleExitRoom} style={[styles.exitBtn, { borderColor: theme.colors.riskHigh }]}>
                <Text style={{ color: theme.colors.riskHigh, fontSize: 10, fontWeight: 'bold' }}>EXIT ROOM</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.roomDivider, { backgroundColor: theme.colors.divider }]} />
            <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontFamily: 'Orbitron', fontWeight: 'bold', marginBottom: 2 }}>DECISION TASK:</Text>
            <Text style={[styles.roomDecisionText, { color: theme.colors.textPrimary }]}>"{roomState.decision}"</Text>
          </Card>

          {/* LOBBY LOBBY STATE */}
          {roomState.status === 'lobby' && (
            <View>
              <Card style={[styles.lobbyCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                <Text style={[styles.sectionTitle, { color: theme.colors.accentBlue }]}>👥 PARTICIPANTS IN LOBBY ({roomState.participants?.length})</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontFamily: 'IBM Plex Mono', marginBottom: 12 }}>
                  Waiting for host to launch the co-simulation...
                </Text>
                <View style={styles.participantsList}>
                  {roomState.participants?.map((p) => (
                    <View key={p.id} style={[styles.participantItem, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                      <Text style={{ color: theme.colors.textPrimary, fontSize: 13, fontWeight: 'bold' }}>
                        👤 {p.name} {p.isHost && '(Host)'}
                      </Text>
                      <View style={[styles.smallBadge, { borderColor: theme.colors.accentViolet }]}>
                        <Text style={{ color: theme.colors.accentViolet, fontSize: 9, fontFamily: 'Orbitron' }}>
                          {p.personality?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
                
                {isHost ? (
                  <TouchableOpacity
                    onPress={handleStartVoting}
                    disabled={loading}
                    style={[styles.actionBtn, { backgroundColor: theme.colors.accentBlue, marginTop: SPACING.lg }]}
                  >
                    <Text style={[styles.actionBtnText, { color: themeName === 'sci-fi' ? '#03050d' : '#FFFFFF' }]}>
                      🚀 START CO-SIMULATION
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.waitingContainer}>
                    <ActivityIndicator size="small" color={theme.colors.accentViolet} />
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontFamily: 'IBM Plex Mono' }}>
                      WAITING FOR HOST TO TRIGGER START...
                    </Text>
                  </View>
                )}
              </Card>
            </View>
          )}

          {/* VOTING STATE */}
          {roomState.status === 'voting' && (
            <View>
              {hasVoted ? (
                <Card style={[styles.lobbyCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                  <ActivityIndicator size="large" color={theme.colors.accentBlue} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.accentBlue, textAlign: 'center', marginTop: 12 }]}>
                    BALLOT REGISTERED
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', fontFamily: 'IBM Plex Mono', marginTop: 4 }}>
                    Waiting for remaining participants to submit votes. Standby...
                  </Text>
                  <View style={[styles.roomDivider, { backgroundColor: theme.colors.divider, marginVertical: SPACING.md }]} />
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 11, fontFamily: 'Orbitron', fontWeight: 'bold', marginBottom: 6 }}>VOTING STATUS SUMMARY:</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontFamily: 'IBM Plex Mono' }}>
                    ✔ Voted: {Object.keys(roomState.votes || {}).length} of {roomState.participants?.length} participants
                  </Text>
                </Card>
              ) : (
                <View style={{ gap: SPACING.md }}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>🗳️ SCENARIO SUITABILITY BALLOT</Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontFamily: 'IBM Plex Mono', marginTop: -8, marginBottom: 4 }}>
                    Evaluate how strategic and viable each future scenario is.
                  </Text>

                  {roomState.scenarios?.map((sc, scIdx) => {
                    const activeVote = myVotes[scIdx] || 3;
                    const accentColor = scIdx === 0 ? '#00e5ff' : scIdx === 1 ? '#a855f7' : '#ec4899';
                    const activeOutcome = sc.temporal_outcomes?.["3"] || sc;
                    
                    return (
                      <Card 
                        key={scIdx} 
                        style={[styles.scenarioVoteCard, { borderLeftColor: accentColor, borderLeftWidth: 4 }]} 
                        outlined 
                        shadowed={false}
                      >
                        <Text style={{ color: theme.colors.textMuted, fontSize: 9, fontFamily: 'Orbitron', fontWeight: 'bold' }}>PATH 0{scIdx + 1}</Text>
                        <Text style={{ color: theme.colors.textPrimary, fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>{sc.title}</Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontFamily: 'IBM Plex Mono', lineHeight: 18, marginBottom: SPACING.md }}>
                          {activeOutcome.description}
                        </Text>

                        {/* Suitability selector */}
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 10, fontFamily: 'Orbitron', fontWeight: 'bold', marginBottom: 6 }}>
                          RATE SUITABILITY: {getVoteRatingLabel(activeVote)}
                        </Text>
                        <View style={styles.suitabilitySelector}>
                          {[1, 2, 3, 4, 5].map((val) => {
                            const isSel = activeVote === val;
                            return (
                              <TouchableOpacity
                                key={val}
                                onPress={() => setMyVotes({ ...myVotes, [scIdx]: val })}
                                style={[
                                  styles.suitabilityNumberBtn,
                                  {
                                    borderColor: isSel ? accentColor : theme.colors.border,
                                    backgroundColor: isSel ? accentColor + '20' : theme.colors.surface
                                  }
                                ]}
                              >
                                <Text style={{ color: isSel ? accentColor : theme.colors.textPrimary, fontWeight: 'bold', fontSize: 12 }}>
                                  {val}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </Card>
                    );
                  })}

                  <TouchableOpacity
                    onPress={handleSubmitVotes}
                    disabled={loading}
                    style={[styles.actionBtn, { backgroundColor: theme.colors.accentBlue }]}
                  >
                    <Text style={[styles.actionBtnText, { color: themeName === 'sci-fi' ? '#03050d' : '#FFFFFF' }]}>
                      SUBMIT BALLOT BOX
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* COMPLETED STATE (Consensus Results Dashboard) */}
          {roomState.status === 'completed' && roomState.consensus && (
            <View style={{ gap: SPACING.md }}>
              <View style={[styles.consensusBadgeBox, { borderColor: theme.colors.accentBlue, backgroundColor: theme.colors.surface }]}>
                <Text style={{ color: theme.colors.accentViolet, fontSize: 9, fontFamily: 'Orbitron', fontWeight: 'bold' }}>DECISION ROOM CONSENSUS</Text>
                <Text style={[styles.consensusTitle, { color: theme.colors.textPrimary }]}>
                  {roomState.consensus.consensusLevel}
                </Text>
                <View style={styles.consensusMetrics}>
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: '900', fontFamily: 'Orbitron' }}>
                    {roomState.consensus.agreementScore}%
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontFamily: 'IBM Plex Mono', width: 140 }}>
                    AGREEMENT INDEX ACCUMULATED
                  </Text>
                </View>
              </View>

              {/* Group recommendation */}
              <Card style={[styles.recommendationCard, { borderColor: '#fbbf24', borderLeftWidth: 4 }]} outlined shadowed={false}>
                <Text style={{ color: '#fbbf24', fontSize: 10, fontFamily: 'Orbitron', fontWeight: 'bold' }}>⭐ GROUP ALIGNMENT PATHWAY</Text>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 15, fontWeight: 'bold', marginTop: 4 }}>
                  {roomState.consensus.winningPathTitle}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontFamily: 'IBM Plex Mono', marginTop: 4 }}>
                  This path has the highest cumulative suitability support weighted by participants' risk and cognitive personalities.
                </Text>
              </Card>

              {/* Path breakdown details */}
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>📊 CO-SIMULATED PATHWAY BREAKDOWN</Text>
              {roomState.consensus.results?.map((res, idx) => {
                const accentColor = idx === 0 ? '#00e5ff' : idx === 1 ? '#a855f7' : '#ec4899';
                
                return (
                  <Card key={idx} style={[styles.pathReportCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
                    <View style={styles.pathReportHeader}>
                      <Text style={{ color: accentColor, fontWeight: 'bold', fontSize: 14 }}>
                        Path 0{idx + 1}: {res.title}
                      </Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold', fontSize: 15, fontFamily: 'Orbitron' }}>
                          {res.weightedScore} / 5
                        </Text>
                        <Text style={{ color: theme.colors.textMuted, fontSize: 8 }}>WEIGHTED SUITABILITY</Text>
                      </View>
                    </View>
                    
                    <View style={[styles.roomDivider, { backgroundColor: theme.colors.divider, marginVertical: 8 }]} />
                    
                    {/* Participant individual ballots */}
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 9, fontFamily: 'Orbitron', fontWeight: 'bold', marginBottom: 4 }}>VOTING MATRIX BREAKDOWN:</Text>
                    <View style={styles.votesBreakdownGrid}>
                      {res.individualVotes?.map((vote, vIdx) => (
                        <View key={vIdx} style={styles.voteGridItem}>
                          <Text style={{ color: theme.colors.textPrimary, fontSize: 11, fontWeight: 'bold' }}>
                            {vote.name} ({vote.personality?.charAt(0).toUpperCase()})
                          </Text>
                          <Text style={{ color: theme.colors.textMuted, fontSize: 10 }}>
                            Vote: <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>{vote.rawVote}</Text> (Wt: {vote.weightedVote})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

        </ScrollView>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  headerBox: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  headerLabel: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'Orbitron',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    lineHeight: 16,
  },
  lockCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
  },
  formCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 10,
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
    marginBottom: SPACING.md,
  },
  personalityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  personalityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
  },
  personalityText: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
  },
  menuActions: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionBtn: {
    height: 48,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    justifyContent: 'center',
  },
  separatorLine: {
    height: 1,
    flex: 1,
  },
  closeBtn: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  closeBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  
  // Active Room UI Style
  roomHeaderCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  roomHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomCodeText: {
    fontFamily: 'Orbitron',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 2,
  },
  exitBtn: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 10,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomDivider: {
    height: 1,
    marginVertical: 10,
  },
  roomDecisionText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  lobbyCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  sectionTitle: {
    fontFamily: 'Orbitron',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  participantsList: {
    gap: SPACING.xs,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    height: 38,
  },
  smallBadge: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  waitingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  
  // Voting Panel styles
  scenarioVoteCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  suitabilitySelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  suitabilityNumberBtn: {
    flex: 1,
    height: 38,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Results view styles
  consensusBadgeBox: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  consensusTitle: {
    fontFamily: 'Orbitron',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  consensusMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  recommendationCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  pathReportCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  pathReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  votesBreakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  voteGridItem: {
    width: '47%',
    padding: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: BORDER_RADIUS.sm,
  }
});
