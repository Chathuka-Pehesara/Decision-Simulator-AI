import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import Card from '../components/Card';
import { useTheme } from '../context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '../styles/theme';
import { getCustomAdvisors, saveCustomAdvisor, deleteCustomAdvisor, getSubscriptionTier } from '../services/storage';

export default function AdvisorsScreen({ navigation }) {
  const { theme, themeName } = useTheme();
  
  const [advisors, setAdvisors] = useState([]);
  const [tier, setTier] = useState('free');
  
  // Form States
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [riskAppetite, setRiskAppetite] = useState('medium');
  const [domainExpertise, setDomainExpertise] = useState('General');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function loadData() {
      const list = await getCustomAdvisors();
      setAdvisors(list);
      const sub = await getSubscriptionTier();
      setTier(sub.tier);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    if (tier === 'free') {
      Alert.alert(
        'Feature Locked',
        'Custom Boardroom Advisor Personas require a Pro or Teams subscription. Please upgrade in the subscription deck.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade Deck', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }

    if (!name.trim() || !domainExpertise.trim()) {
      Alert.alert('Validation Error', 'Name and Domain Expertise are required.');
      return;
    }

    const payload = {
      id: editingId,
      name: name.trim(),
      riskAppetite,
      domainExpertise: domainExpertise.trim(),
      description: description.trim()
    };

    try {
      await saveCustomAdvisor(payload);
      const list = await getCustomAdvisors();
      setAdvisors(list);
      
      // Reset form
      setEditingId(null);
      setName('');
      setRiskAppetite('medium');
      setDomainExpertise('General');
      setDescription('');
      
      Alert.alert('Persona Saved', 'Advisor persona was successfully configured for boardroom debates!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save advisor persona.');
    }
  };

  const handleEdit = (advisor) => {
    if (advisor.id.startsWith('pres_')) {
      Alert.alert('Immutable Preset', 'Preset advisors cannot be edited, but you can create custom ones!');
      return;
    }
    setEditingId(advisor.id);
    setName(advisor.name);
    setRiskAppetite(advisor.riskAppetite);
    setDomainExpertise(advisor.domainExpertise);
    setDescription(advisor.description);
  };

  const handleDelete = async (id) => {
    if (id.startsWith('pres_')) {
      Alert.alert('Immutable Preset', 'Preset advisors cannot be deleted.');
      return;
    }
    Alert.alert(
      'De-authorize Advisor',
      'Are you sure you want to delete this custom advisor persona from your boardroom panel?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm Deletion', onPress: async () => {
            try {
              await deleteCustomAdvisor(id);
              const list = await getCustomAdvisors();
              setAdvisors(list);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete advisor.');
            }
          } 
        }
      ]
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setRiskAppetite('medium');
    setDomainExpertise('General');
    setDescription('');
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Banner */}
        <View style={[styles.headerBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.headerLabel, { color: theme.colors.accentViolet }]}>BOARDROOM PERSONALIZATION PANEL</Text>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Named Advisor Personas</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
            Design custom cognitive viewpoints. Specify risk tolerances and domains to roleplay debates dynamically during simulations.
          </Text>
        </View>

        {tier === 'free' && (
          <Card style={[styles.lockCard, { borderColor: theme.colors.riskHigh }]} outlined shadowed={false}>
            <Text style={{ color: theme.colors.riskHigh, fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>🔒 PREMIUM FEATURE RESTRICTED</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, lineHeight: 16 }}>
              You are currently on the Free tier. Custom Boardroom advisors can only be simulated on Pro and Teams tiers. Toggle subscription settings to unlock.
            </Text>
          </Card>
        )}

        {/* ADVISOR CREATION FORM */}
        <Card style={[styles.formCard, { borderColor: theme.colors.border }]} outlined shadowed={false}>
          <Text style={[styles.formTitle, { color: theme.colors.accentBlue }]}>
            {editingId ? '⚡ MODIFY ADVISOR PERSONA' : '➕ CREATE ADVISOR PERSONA'}
          </Text>
          
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Advisor Name</Text>
          <TextInput
            style={[styles.textInput, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
            placeholder="e.g. Marcus Aurelius"
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
            editable={tier !== 'free'}
          />

          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Domain Expertise</Text>
          <TextInput
            style={[styles.textInput, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
            placeholder="e.g. Philosophy, Finance, Tech, Health"
            placeholderTextColor={theme.colors.textMuted}
            value={domainExpertise}
            onChangeText={setDomainExpertise}
            editable={tier !== 'free'}
          />

          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Risk Appetite</Text>
          <View style={styles.riskSelectorRow}>
            {['low', 'medium', 'high'].map((level) => {
              const isActive = riskAppetite === level;
              return (
                <TouchableOpacity
                  key={level}
                  activeOpacity={0.8}
                  onPress={() => setRiskAppetite(level)}
                  disabled={tier === 'free'}
                  style={[
                    styles.riskOption,
                    {
                      borderColor: isActive ? theme.colors.accentBlue : theme.colors.border,
                      backgroundColor: isActive ? theme.colors.accentBlueLight : theme.colors.surface,
                    }
                  ]}
                >
                  <Text style={[styles.riskOptionText, { color: isActive ? theme.colors.accentBlue : theme.colors.textSecondary }]}>
                    {level.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Perspectives & Description (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
            placeholder="e.g. Focuses on stoic control, path dependency, and emotional containment."
            placeholderTextColor={theme.colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            editable={tier !== 'free'}
          />

          <View style={styles.formBtnRow}>
            {editingId && (
              <TouchableOpacity
                onPress={handleCancelEdit}
                style={[styles.cancelBtn, { borderColor: theme.colors.border }]}
              >
                <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>CANCEL</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={handleSave}
              disabled={tier === 'free'}
              style={[
                styles.saveBtn,
                { 
                  backgroundColor: tier === 'free' ? theme.colors.border : theme.colors.accentBlue, 
                  opacity: tier === 'free' ? 0.6 : 1 
                }
              ]}
            >
              <Text style={{ color: themeName === 'sci-fi' ? '#03050d' : '#FFFFFF', fontWeight: 'bold' }}>
                {editingId ? 'UPDATE PERSONA' : 'ADD TO PANEL'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* LIST OF ADVISORS */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>ACTIVE BOARD MEMBERS</Text>
        <View style={styles.listContainer}>
          {advisors.map((advisor) => {
            const isPreset = advisor.id.startsWith('pres_');
            const riskColor = advisor.riskAppetite === 'high' ? theme.colors.riskHigh : advisor.riskAppetite === 'medium' ? theme.colors.riskMedium : theme.colors.riskLow;
            
            return (
              <Card 
                key={advisor.id} 
                style={[styles.advisorCard, { borderColor: theme.colors.border }]} 
                outlined 
                shadowed={false}
              >
                <View style={styles.advisorHeader}>
                  <View style={{ flex: 1, marginRight: SPACING.sm }}>
                    <Text style={[styles.advisorName, { color: theme.colors.textPrimary }]}>
                      ◆ {advisor.name}
                    </Text>
                    <Text style={[styles.advisorDomain, { color: theme.colors.accentViolet }]}>
                      {advisor.domainExpertise?.toUpperCase()} EXPERT
                    </Text>
                  </View>
                  <View style={[styles.riskBadge, { borderColor: riskColor, backgroundColor: riskColor + '10' }]}>
                    <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                      {advisor.riskAppetite?.toUpperCase()} RISK
                    </Text>
                  </View>
                </View>
                
                {advisor.description && (
                  <Text style={[styles.advisorDesc, { color: theme.colors.textMuted }]}>
                    {advisor.description}
                  </Text>
                )}

                <View style={styles.actionRow}>
                  {isPreset ? (
                    <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontStyle: 'italic' }}>SYSTEM DEFAULT PRESET</Text>
                  ) : (
                    <>
                      <TouchableOpacity 
                        onPress={() => handleEdit(advisor)} 
                        style={[styles.editBtn, { borderColor: theme.colors.accentBlue }]}
                      >
                        <Text style={{ color: theme.colors.accentBlue, fontSize: 10, fontWeight: 'bold' }}>EDIT</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleDelete(advisor.id)} 
                        style={[styles.deleteBtn, { borderColor: theme.colors.riskHigh }]}
                      >
                        <Text style={{ color: theme.colors.riskHigh, fontSize: 10, fontWeight: 'bold' }}>DELETE</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </Card>
            );
          })}
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
    marginBottom: SPACING.lg,
  },
  formTitle: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
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
  textArea: {
    height: 60,
    paddingTop: 8,
  },
  riskSelectorRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  riskOption: {
    flex: 1,
    height: 38,
    borderWidth: 1.5,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskOptionText: {
    fontFamily: 'Orbitron',
    fontSize: 9,
    fontWeight: '800',
  },
  formBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  saveBtn: {
    paddingHorizontal: 16,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  sectionTitle: {
    fontFamily: 'Orbitron',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  listContainer: {
    gap: SPACING.md,
  },
  advisorCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  advisorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  advisorName: {
    fontFamily: 'Orbitron',
    fontSize: 13,
    fontWeight: '850',
  },
  advisorDomain: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    flexShrink: 0,
  },
  riskBadgeText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 9,
    fontWeight: 'bold',
  },
  advisorDesc: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
  },
  editBtn: {
    paddingHorizontal: 12,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  deleteBtn: {
    paddingHorizontal: 12,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
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
