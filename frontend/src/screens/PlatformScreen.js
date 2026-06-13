import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Clipboard 
} from 'react-native';
import Card from '../components/Card';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../styles/theme';
import { getWebhooks, registerWebhook, deleteWebhook, testWebhook } from '../services/api';
import { getSubscriptionTier } from '../services/storage';

export default function PlatformScreen({ navigation }) {
  const { theme, themeName } = useTheme();
  
  const [tier, setTier] = useState('free');
  const [webhooks, setWebhooks] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  
  // Tester States
  const [testUrl, setTestUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const MOCK_API_KEY = 'ds_live_test_key';

  useEffect(() => {
    async function loadData() {
      const sub = await getSubscriptionTier();
      setTier(sub.tier);
      if (sub.tier === 'teams') {
        loadWebhooks();
      }
    }
    loadData();
  }, []);

  const loadWebhooks = async () => {
    try {
      const data = await getWebhooks();
      setWebhooks(data);
    } catch (err) {
      console.warn('Failed to load webhooks from server:', err.message);
    }
  };

  const handleRegisterWebhook = async () => {
    if (tier !== 'teams') {
      Alert.alert(
        'Feature Restricted',
        'Developer APIs and Webhook integrations require a Teams-level subscription. Please upgrade in the subscription deck.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Deck', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }

    if (!newUrl.trim() || !newUrl.trim().startsWith('http')) {
      Alert.alert('Validation Error', 'A valid HTTP/HTTPS Webhook URL is required.');
      return;
    }

    try {
      await registerWebhook(newUrl.trim());
      setNewUrl('');
      loadWebhooks();
      Alert.alert('Webhook Registered', 'Webhook registered successfully! It will now capture all simulation completions.');
    } catch (err) {
      Alert.alert('Error', 'Failed to register webhook on server.');
    }
  };

  const handleDeleteWebhook = async (id) => {
    try {
      await deleteWebhook(id);
      loadWebhooks();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete webhook.');
    }
  };

  const handleTestWebhook = async () => {
    const targetUrl = testUrl.trim() || (webhooks.length > 0 ? webhooks[0].url : '');
    if (!targetUrl || !targetUrl.startsWith('http')) {
      Alert.alert('Validation Error', 'Provide a valid target URL to dispatch test.');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const result = await testWebhook(targetUrl);
      setTestResult(result);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleCopyKey = () => {
    Clipboard.setString(MOCK_API_KEY);
    Alert.alert('Copied', 'API Authorization Key copied to clipboard!');
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={[styles.headerBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.headerLabel, { color: theme.colors.accentViolet }]}>DEVELOPER INTEGRATION DECK</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Developer Platform Console</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            Expose the simulation engine via APIs. Bind HTTP webhooks to fire diagnostic payloads when queries complete.
          </Text>
        </View>

        {tier !== 'teams' && (
          <Card style={[styles.lockCard, { borderColor: theme.colors.riskHigh }]} outlined shadowed={false}>
            <Text style={{ color: theme.colors.riskHigh, fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>🔒 TEAMS DECK LOCKED</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, lineHeight: 16 }}>
              Developer console tools and webhooks require a Teams subscription. Toggle subscription settings in the billing deck to authorize keys.
            </Text>
          </Card>
        )}

        {/* API KEY PANEL */}
        <Card style={[styles.kpiCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
          <Text style={[styles.sectionTitle, { color: theme.colors.accentBlue }]}>🔑 CLIENT AUTHORIZATION CREDENTIALS</Text>
          <Text style={[styles.panelSubtitle, { color: theme.colors.textMuted }]}>
            Provide this token in headers as "Authorization: Bearer &lt;key&gt;"
          </Text>
          <View style={[styles.keyRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.keyText, { color: tier === 'teams' ? theme.colors.textPrimary : theme.colors.textMuted }]} numberOfLines={1}>
              {tier === 'teams' ? MOCK_API_KEY : '••••••••••••••••••••••••••••••••'}
            </Text>
            <TouchableOpacity 
              disabled={tier !== 'teams'}
              onPress={handleCopyKey}
              style={[styles.copyBtn, { backgroundColor: theme.colors.accentBlue }]}
            >
              <Text style={{ color: '#03050d', fontSize: 9, fontWeight: 'bold' }}>COPY</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.codeSnippetLabel, { color: theme.colors.textSecondary }]}>CURL SIMULATION QUERY EXTREME CODE:</Text>
          <View style={[styles.codeBox, { backgroundColor: '#000000', borderColor: theme.colors.border }]}>
            <Text style={styles.codeText}>
              curl -X POST http://localhost:3000/api/v1/simulate \{'\n'}
              {'  '}-H "Authorization: Bearer {tier === 'teams' ? MOCK_API_KEY : '<your_api_key>'}" \{'\n'}
              {'  '}-H "Content-Type: application/json" \{'\n'}
              {'  '}-d '{'{"decision": "Should I learn Rust?", "risk": "medium"}'}'
            </Text>
          </View>
        </Card>

        {/* WEBHOOK REGISTER PANEL */}
        <Card style={[styles.kpiCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
          <Text style={[styles.sectionTitle, { color: theme.colors.accentViolet }]}>📡 CONFIGURE WEBHOOK ENDPOINTS</Text>
          <Text style={[styles.panelSubtitle, { color: theme.colors.textMuted }]}>
            Server will dispatch asynchronous JSON POST events here on simulation completion.
          </Text>
          
          <View style={styles.registerRow}>
            <TextInput
              style={[styles.textInput, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
              placeholder="https://api.yourdomain.com/webhooks"
              placeholderTextColor={theme.colors.textMuted}
              value={newUrl}
              onChangeText={setNewUrl}
              editable={tier === 'teams'}
            />
            <TouchableOpacity 
              disabled={tier !== 'teams'}
              onPress={handleRegisterWebhook}
              style={[styles.addBtn, { backgroundColor: theme.colors.accentViolet }]}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>REGISTER</Text>
            </TouchableOpacity>
          </View>

          {/* ACTIVE WEBHOOKS */}
          <Text style={[styles.subLabel, { color: theme.colors.textSecondary }]}>ACTIVE WEBHOOK LISTENERS ({webhooks.length})</Text>
          {webhooks.length > 0 ? (
            <View style={styles.webhookList}>
              {webhooks.map((w) => (
                <View key={w.id} style={[styles.webhookItem, { borderColor: theme.colors.border }]}>
                  <Text style={[styles.webhookUrl, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {w.url}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteWebhook(w.id)}>
                    <Text style={{ color: theme.colors.riskHigh, fontSize: 10, fontWeight: 'bold' }}>REMOVE</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No webhooks configured on this server context.</Text>
          )}
        </Card>

        {/* INTERACTIVE WEBHOOK TESTER TERMINAL */}
        <Card style={[styles.kpiCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
          <Text style={[styles.sectionTitle, { color: '#fbbf24' }]}>📟 INTERACTIVE WEBHOOK TEST TERMINAL</Text>
          <Text style={[styles.panelSubtitle, { color: theme.colors.textMuted }]}>
            Send a diagnostic probe to any target URL to verify server-to-server latency.
          </Text>

          <TextInput
            style={[styles.textInput, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
            placeholder="Target URL, e.g. https://webhook.site/..."
            placeholderTextColor={theme.colors.textMuted}
            value={testUrl}
            onChangeText={setTestUrl}
            editable={tier === 'teams'}
          />

          <TouchableOpacity
            disabled={testing || tier !== 'teams'}
            onPress={handleTestWebhook}
            style={[styles.testBtn, { backgroundColor: '#fbbf24' }]}
          >
            <Text style={{ color: '#03050d', fontSize: 11, fontWeight: 'bold' }}>
              {testing ? 'DISPATCHING TEST PAYLOAD...' : '⚡ FIRE TEST PAYLOAD'}
            </Text>
          </TouchableOpacity>

          {/* TERMINAL BOX */}
          <View style={[styles.terminalBox, { backgroundColor: '#020202', borderColor: theme.colors.border }]}>
            <Text style={[styles.terminalHeader, { color: '#00e5ff' }]}>=== STOCHASTIC WEBHOOK DECK TERMINAL ===</Text>
            {testResult ? (
              <View style={{ gap: 6, marginTop: 6 }}>
                <Text style={{ color: testResult.success ? '#10b981' : theme.colors.riskHigh, fontFamily: 'IBM Plex Mono', fontSize: 11 }}>
                  DISPATCH: {testResult.success ? 'SUCCESS (HTTP 200 OK)' : 'FAILED ERROR'}
                </Text>
                {testResult.status && (
                  <Text style={[styles.terminalLine, { color: '#a855f7' }]}>
                    HTTP STATUS: {testResult.status} {testResult.statusText}
                  </Text>
                )}
                {testResult.durationMs && (
                  <Text style={[styles.terminalLine, { color: '#ffff00' }]}>
                    LATENCY: {testResult.durationMs}ms
                  </Text>
                )}
                {testResult.responseBody ? (
                  <View style={{ marginTop: 4 }}>
                    <Text style={[styles.terminalLine, { color: '#587396' }]}>RESPONSE BODY:</Text>
                    <Text style={styles.terminalBodyText}>{testResult.responseBody}</Text>
                  </View>
                ) : testResult.error ? (
                  <Text style={[styles.terminalLine, { color: theme.colors.riskHigh }]}>
                    ERROR INFO: {testResult.error}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={[styles.terminalLine, { color: theme.colors.textMuted, marginTop: 6 }]}>
                Ready for testing. Dispatch payload to analyze connection metrics...
              </Text>
            )}
          </View>
        </Card>

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
  lockCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
  },
  kpiCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontFamily: 'Orbitron',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  panelSubtitle: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    marginBottom: SPACING.md,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  keyText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
    flex: 1,
  },
  copyBtn: {
    paddingHorizontal: 12,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeSnippetLabel: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 6,
  },
  codeBox: {
    padding: 10,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  codeText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 10,
    color: '#38bdf8',
    lineHeight: 14,
  },
  registerRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  textInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 10,
    fontFamily: 'IBM Plex Mono',
    fontSize: 13,
    flex: 1,
  },
  addBtn: {
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  subLabel: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  webhookList: {
    gap: SPACING.sm,
  },
  webhookItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    height: 40,
  },
  webhookUrl: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 12,
    flex: 1,
    marginRight: SPACING.md,
  },
  emptyText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    fontStyle: 'italic',
  },
  testBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  terminalBox: {
    padding: 12,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
    minHeight: 120,
  },
  terminalHeader: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  terminalLine: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
  },
  terminalBodyText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 10,
    color: '#00ff00',
    backgroundColor: '#0c0c0c',
    padding: 6,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#333',
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
