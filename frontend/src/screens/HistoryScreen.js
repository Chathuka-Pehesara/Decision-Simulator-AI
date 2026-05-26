// src/screens/HistoryScreen.js
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert 
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';
import { getSimulations, deleteSimulation, clearAllSimulations } from '../services/storage';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    const data = await getSimulations();
    setHistory(data);
    setLoading(false);
  };

  useEffect(() => {
    // Reload history whenever this screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchHistory();
    });

    return unsubscribe;
  }, [navigation]);

  const handleDelete = (id, decisionText) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete the simulation for:\n"${decisionText}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await deleteSimulation(id);
              setHistory(updated);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete simulation history.');
            }
          }
        }
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All History',
      'This will permanently delete all decision simulations. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllSimulations();
              setHistory([]);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear history.');
            }
          }
        }
      ]
    );
  };

  const handleSelectRecord = (item) => {
    navigation.navigate('Result', {
      simulation: item.result,
      decision: item.decision,
      recordId: item.id
    });
  };

  const renderItem = ({ item }) => {
    const date = new Date(item.timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <Card style={styles.historyCard}>
        <TouchableOpacity 
          style={styles.cardContent}
          onPress={() => handleSelectRecord(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.dateText}>{date}</Text>
            <View style={styles.metaRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.risk?.toUpperCase()} RISK
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.decisionText} numberOfLines={2}>
            {item.decision}
          </Text>
          
          <Text style={styles.tapPrompt}>Tap to view simulation outcomes →</Text>
        </TouchableOpacity>

        {/* Individual Delete Button */}
        <TouchableOpacity 
          style={styles.deleteBtn}
          onPress={() => handleDelete(item.id, item.decision)}
          activeOpacity={0.6}
        >
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Header Summary Row */}
        {history.length > 0 && (
          <View style={styles.headerRow}>
            <Text style={styles.countText}>{history.length} Saved Simulation{history.length > 1 ? 's' : ''}</Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearAllLink}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History List */}
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔮</Text>
            <Text style={styles.emptyTitle}>No History Found</Text>
            <Text style={styles.emptySubtitle}>
              Simulate decisions on the Home screen to view their generated futures here.
            </Text>
            <Button 
              title="Go Simulate" 
              onPress={() => navigation.navigate('Home')}
              style={styles.emptyBtn}
            />
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  countText: {
    ...TYPOGRAPHY.subtext,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  clearAllLink: {
    ...TYPOGRAPHY.subtext,
    fontWeight: '600',
    color: '#EF4444', // Minimal red for critical actions, but wait - let's stay simple, or standard text.
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingRight: 0, // Enable delete button alignment
  },
  cardContent: {
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingLeft: SPACING.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dateText: {
    ...TYPOGRAPHY.subtext,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  decisionText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  tapPrompt: {
    ...TYPOGRAPHY.subtext,
    color: COLORS.accentBlue,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 50,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.divider,
  },
  deleteText: {
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  emptyBtn: {
    alignSelf: 'stretch',
  },
});
