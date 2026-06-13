import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import Card from '../components/Card';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../styles/theme';
import { getSubscriptionTier, setSubscriptionTier } from '../services/storage';

export default function SubscriptionScreen({ navigation }) {
  const { theme, themeName } = useTheme();
  const [currentSub, setCurrentSub] = useState({ tier: 'free', count: 0 });

  useEffect(() => {
    async function loadSub() {
      const sub = await getSubscriptionTier();
      setCurrentSub(sub);
    }
    loadSub();
  }, []);

  const handleSelectTier = async (tier) => {
    try {
      const updated = await setSubscriptionTier(tier);
      setCurrentSub(updated);
      Alert.alert(
        'Billing Sandbox Updated',
        `Switched to the ${tier.toUpperCase()} subscription tier. Premium triggers and usage counters will adapt instantly!`,
        [{ text: 'Acknowledge' }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to update subscription tier.');
    }
  };

  const getTierBorderColor = (tier, activeTier) => {
    if (tier === activeTier) {
      return tier === 'free' ? theme.colors.accentBlue : tier === 'pro' ? theme.colors.accentViolet : '#fbbf24';
    }
    return theme.colors.border;
  };

  const getTierBg = (tier, activeTier) => {
    if (tier === activeTier) {
      return tier === 'free' ? theme.colors.surface : 'rgba(168, 85, 247, 0.08)';
    }
    return theme.colors.card;
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={[styles.headerBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.headerLabel, { color: theme.colors.accentViolet }]}>SUBSCRIPTION SANDBOX DECK</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Choose Simulation Tier</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            Toggle tiers in real-time to inspect paywall blocks, custom advisor options, and collaborative voting rooms.
          </Text>
        </View>

        {/* Current Status KPI Card */}
        <Card style={[styles.statusCard, { borderColor: theme.colors.accentBlue }]} outlined shadowed={false}>
          <Text style={[styles.statusLabel, { color: theme.colors.textMuted }]}>ACTIVE TIER INDEX</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusValue, { color: theme.colors.textPrimary }]}>
              {currentSub.tier?.toUpperCase()} TIER
            </Text>
            <View style={[styles.usageBadge, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.usageText, { color: theme.colors.accentBlue }]}>
                {currentSub.tier === 'free' ? `${currentSub.count || 0}/5 Simulations` : 'Unlimited Sims'}
              </Text>
            </View>
          </View>
        </Card>

        {/* TIERS DECK */}
        <View style={styles.deckList}>
          
          {/* FREE TIER CARD */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => handleSelectTier('free')}
          >
            <Card 
              style={[
                styles.tierCard, 
                { 
                  borderColor: getTierBorderColor('free', currentSub.tier),
                  backgroundColor: getTierBg('free', currentSub.tier),
                  borderLeftWidth: 5,
                  borderLeftColor: theme.colors.accentBlue
                }
              ]} 
              outlined 
              shadowed={false}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.tierTitle, { color: theme.colors.textPrimary }]}>Free Core</Text>
                <Text style={[styles.tierPrice, { color: theme.colors.accentBlue }]}>$0 / MO</Text>
              </View>
              <Text style={[styles.tierDesc, { color: theme.colors.textMuted }]}>
                Ideal for basic objective self-assessment.
              </Text>
              <View style={styles.bulletList}>
                <Text style={[styles.bullet, { color: theme.colors.textPrimary }]}>◆ Max 5 simulations per month limit</Text>
                <Text style={[styles.bullet, { color: theme.colors.textPrimary }]}>◆ Single model intelligence simulation</Text>
                <Text style={[styles.bullet, { color: theme.colors.textPrimary }]}>◆ Local historical timeline logs</Text>
                <Text style={[styles.bullet, { color: theme.colors.textMuted, textDecorationLine: 'line-through' }]}>◇ AI Voice transcription inputs</Text>
                <Text style={[styles.bullet, { color: theme.colors.textMuted, textDecorationLine: 'line-through' }]}>◇ Custom named boardroom advisors</Text>
              </View>
              <View style={[
                styles.selectButton, 
                { backgroundColor: currentSub.tier === 'free' ? theme.colors.accentBlueLight : theme.colors.surface, borderColor: theme.colors.border }
              ]}>
                <Text style={[styles.selectText, { color: currentSub.tier === 'free' ? theme.colors.accentBlue : theme.colors.textPrimary }]}>
                  {currentSub.tier === 'free' ? '✓ ACTIVE SUBSCRIPTION' : 'SELECT FREE TIER'}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>

          {/* PRO TIER CARD */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => handleSelectTier('pro')}
          >
            <Card 
              style={[
                styles.tierCard, 
                { 
                  borderColor: getTierBorderColor('pro', currentSub.tier),
                  backgroundColor: getTierBg('pro', currentSub.tier),
                  borderLeftWidth: 5,
                  borderLeftColor: theme.colors.accentViolet
                }
              ]} 
              outlined 
              shadowed={false}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.tierTitle, { color: theme.colors.textPrimary }]}>Professional</Text>
                <Text style={[styles.tierPrice, { color: theme.colors.accentViolet }]}>$19 / MO</Text>
              </View>
              <Text style={[styles.tierDesc, { color: theme.colors.textMuted }]}>
                For advanced practitioners mapping complex paths.
              </Text>
              <View style={styles.bulletList}>
                <Text style={[styles.bullet, { color: theme.colors.textPrimary }]}>◆ Unlimited monthly simulations</Text>
                <Text style={[styles.bullet, { color: theme.colors.textPrimary }]}>◆ Multi-Model Consensus (Gemini, Llama, GPT)</Text>
                <Text style={[styles.bullet, { color: theme.colors.textPrimary }]}>◆ Voice Dictation inputs via Groq Whisper</Text>
                <Text style={[styles.bullet, { color: theme.colors.textPrimary }]}>◆ Create and reuse custom advisor personas</Text>
                <Text style={[styles.bullet, { color: theme.colors.textMuted, textDecorationLine: 'line-through' }]}>◇ Collaborative rooms & group consensus</Text>
              </View>
              <View style={[
                styles.selectButton, 
                { backgroundColor: currentSub.tier === 'pro' ? theme.colors.accentBlueLight : theme.colors.surface, borderColor: theme.colors.border }
              ]}>
                <Text style={[styles.selectText, { color: currentSub.tier === 'pro' ? theme.colors.accentViolet : theme.colors.textPrimary }]}>
                  {currentSub.tier === 'pro' ? '✓ ACTIVE SUBSCRIPTION' : 'SELECT PRO TIER'}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>

          {/* TEAMS TIER CARD */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => handleSelectTier('teams')}
          >
            <Card 
              style={[
                styles.tierCard, 
                { 
                  borderColor: getTierBorderColor('teams', currentSub.tier),
                  backgroundColor: getTierBg('teams', currentSub.tier),
                  borderLeftWidth: 5,
                  borderLeftColor: '#fbbf24'
                }
              ]} 
              outlined 
              shadowed={false}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.tierTitle, { color: theme.colors.textPrimary }]}>Enterprise Teams</Text>
                <Text style={[styles.tierPrice, { color: '#fbbf24' }]}>$79 / MO</Text>
              </View>
              <Text style={[styles.tierDesc, { color: theme.colors.textMuted }]}>
                Co-simulate and align organizational goals.
              </Text>
              <View style={styles.bulletList}>
                <Text style={[styles.bullet, { color: theme.colors.textPrimary }]}>◆ Everything in Pro included</Text>
                <Text style={[styles.bullet, { color: theme.colors.textPrimary }]}>◆ Collaborative Rooms (create/join room codes)</Text>
                <Text style={[styles.bullet, { color: theme.colors.textPrimary }]}>◆ Weighted personality voting & consensus models</Text>
                <Text style={[styles.bullet, { color: theme.colors.textPrimary }]}>◆ Organization-Level Bias Analytics</Text>
                <Text style={[styles.bullet, { color: theme.colors.textPrimary }]}>◆ Dedicated developer APIs & Webhook integrations</Text>
              </View>
              <View style={[
                styles.selectButton, 
                { backgroundColor: currentSub.tier === 'teams' ? theme.colors.accentBlueLight : theme.colors.surface, borderColor: theme.colors.border }
              ]}>
                <Text style={[styles.selectText, { color: currentSub.tier === 'teams' ? '#fbbf24' : theme.colors.textPrimary }]}>
                  {currentSub.tier === 'teams' ? '✓ ACTIVE SUBSCRIPTION' : 'SELECT TEAMS TIER'}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Home')}
          style={[styles.closeBtn, { backgroundColor: theme.colors.accentBlue }]}
        >
          <Text style={[styles.closeBtnText, { color: themeName === 'sci-fi' ? '#03050d' : '#FFFFFF' }]}>
            RETURN TO SIMULATOR
          </Text>
        </TouchableOpacity>

      </ScrollView>
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
  statusCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  statusLabel: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusValue: {
    fontFamily: 'Orbitron',
    fontSize: 18,
    fontWeight: '900',
  },
  usageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  usageText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    fontWeight: 'bold',
  },
  deckList: {
    gap: SPACING.md,
  },
  tierCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tierTitle: {
    fontFamily: 'Orbitron',
    fontSize: 15,
    fontWeight: '900',
  },
  tierPrice: {
    fontFamily: 'Orbitron',
    fontSize: 14,
    fontWeight: '900',
  },
  tierDesc: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    marginBottom: SPACING.md,
  },
  bulletList: {
    gap: 6,
    marginBottom: SPACING.md,
  },
  bullet: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
  },
  selectButton: {
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  selectText: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeBtn: {
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  closeBtnText: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
});
