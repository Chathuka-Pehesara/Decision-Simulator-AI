// src/screens/HistoryScreen.js
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import { SPACING, BORDER_RADIUS } from '../styles/theme';
import { getSimulations, deleteSimulation, clearAllSimulations } from '../services/storage';
import { useTheme } from '../context/ThemeContext';

export default function HistoryScreen({ navigation }) {
  const { theme, themeName } = useTheme();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { label: 'All', value: 'all' },
    { label: 'Career', value: 'career' },
    { label: 'Finance', value: 'finance' },
    { label: 'Relationships', value: 'relationships' },
    { label: 'Health', value: 'health' },
    { label: 'General', value: 'general' }
  ];

  const fetchHistory = async () => {
    setLoading(true);
    const data = await getSimulations();
    setHistory(data);
    setLoading(false);
  };

  useEffect(() => {
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

  const filteredHistory = selectedCategory === 'all' 
    ? history 
    : history.filter(item => (item.category || 'general') === selectedCategory);

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'career': return theme.colors.accentBlue;
      case 'finance': return '#f59e0b'; // Amber
      case 'relationships': return theme.colors.accentViolet;
      case 'health': return theme.colors.riskHigh;
      default: return theme.colors.textMuted;
    }
  };

  const renderItem = ({ item }) => {
    const date = new Date(item.timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const isResolved = item.outcome !== null && item.outcome !== undefined;
    const cat = item.category || 'general';

    return (
      <Card 
        style={[
          styles.historyCard, 
          { 
            borderColor: theme.colors.border,
            backgroundColor: themeName === 'accessibility' ? '#000000' : theme.colors.card,
            borderLeftWidth: 4,
            borderLeftColor: getCategoryColor(cat)
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.cardContent}
          onPress={() => handleSelectRecord(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>{date}</Text>
            
            <View style={styles.metaRow}>
              {isResolved && (
                <View style={[styles.resolvedBadge, { borderColor: theme.colors.accentBlue, backgroundColor: theme.colors.accentBlue + '18' }]}>
                  <Text style={[styles.resolvedBadgeText, { color: theme.colors.accentBlue }]}>✅ RESOLVED</Text>
                </View>
              )}
              <View style={[styles.badge, { borderColor: theme.colors.border }]}>
                <Text style={[styles.badgeText, { color: theme.colors.textSecondary }]}>
                  {item.risk?.toUpperCase()} RISK
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.decisionText, { color: theme.colors.textPrimary }]} numberOfLines={2}>
            {item.decision}
          </Text>
          
          <View style={styles.cardFooter}>
            <Text style={[styles.categoryLabel, { color: getCategoryColor(cat) }]}>
              🏷️ {cat.toUpperCase()}
            </Text>
            <Text style={[styles.tapPrompt, { color: theme.colors.accentBlue }]}>View Outcomes →</Text>
          </View>
        </TouchableOpacity>

        {/* Individual Delete Button */}
        <TouchableOpacity 
          style={[styles.deleteBtn, { borderLeftColor: theme.colors.divider }]}
          onPress={() => handleDelete(item.id, item.decision)}
          activeOpacity={0.6}
        >
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        
        {/* Category Filters Bar */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.subtext.fontFamily }]}>
            Filter By Category
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  activeOpacity={0.85}
                  onPress={() => setSelectedCategory(cat.value)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? theme.colors.accentBlue : theme.colors.surface,
                      borderColor: isActive ? theme.colors.accentBlue : theme.colors.border,
                    }
                  ]}
                >
                  <Text 
                    style={[
                      styles.filterChipText, 
                      { 
                        color: isActive 
                          ? (themeName === 'sci-fi' ? '#03050d' : '#FFFFFF') 
                          : theme.colors.textPrimary,
                        fontWeight: isActive ? 'bold' : '500'
                      }
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Header Summary Row */}
        {filteredHistory.length > 0 && (
          <View style={styles.headerRow}>
            <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
              {filteredHistory.length} Record{filteredHistory.length > 1 ? 's' : ''} Found
            </Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearAllLink}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔮</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>No Records Found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
              {history.length === 0 
                ? "Simulate decisions on the Home screen to view their generated futures here."
                : `No decisions found for category '${selectedCategory}'.`}
            </Text>
            {history.length === 0 && (
              <Button 
                title="Go Simulate" 
                onPress={() => navigation.navigate('Home')}
                style={styles.emptyBtn}
              />
            )}
          </View>
        ) : (
          <FlatList
            data={filteredHistory}
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
  },
  container: {
    flex: 1,
    padding: SPACING.md,
  },
  filterSection: {
    marginBottom: SPACING.md,
  },
  filterLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.2,
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: 'IBM Plex Mono',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  countText: {
    fontSize: 11,
    fontFamily: 'IBM Plex Mono',
    fontWeight: '700',
  },
  clearAllLink: {
    fontSize: 11,
    fontFamily: 'IBM Plex Mono',
    fontWeight: '600',
    color: '#EF4444',
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingRight: 0,
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
    flexWrap: 'wrap',
    gap: 8,
  },
  dateText: {
    fontSize: 10,
    fontFamily: 'IBM Plex Mono',
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  resolvedBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  resolvedBadgeText: {
    fontSize: 9,
    fontFamily: 'Orbitron',
    fontWeight: '900',
  },
  decisionText: {
    fontSize: 13,
    fontFamily: 'IBM Plex Mono',
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  categoryLabel: {
    fontSize: 9,
    fontFamily: 'Orbitron',
    fontWeight: '800',
  },
  tapPrompt: {
    fontSize: 10,
    fontFamily: 'Orbitron',
    fontWeight: '800',
  },
  deleteBtn: {
    width: 48,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
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
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Orbitron',
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'IBM Plex Mono',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  emptyBtn: {
    alignSelf: 'stretch',
  },
});
