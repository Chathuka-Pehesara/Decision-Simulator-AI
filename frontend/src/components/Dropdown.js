// src/components/Dropdown.js
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Modal, 
  FlatList, 
  SafeAreaView,
  Platform
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../styles/theme';

export default function Dropdown({ 
  label, 
  placeholder, 
  selectedValue, 
  onValueChange, 
  options = [] 
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(opt => opt.value === selectedValue);

  const handleSelect = (value) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        style={[styles.trigger, Platform.OS === 'web' && WEB_STYLES.trigger]}
      >
        <Text style={[styles.triggerText, !selectedOption && styles.placeholder]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={styles.arrow}>{modalVisible ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismiss} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const isSelected = item.value === selectedValue;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemActive
                      ]}
                      onPress={() => handleSelect(item.value)}
                    >
                      <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextActive
                      ]}>
                        {item.label}
                      </Text>
                      {isSelected && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Web-only Styles (bypass Hermes static parser validation inside StyleSheet.create)
const WEB_STYLES = {
  trigger: {
    transition: 'all 0.3s ease',
    boxShadow: 'inset 0 0 15px rgba(0, 229, 255, 0.03)',
  }
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontFamily: 'Orbitron',
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(0, 229, 255, 0.7)',
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  trigger: {
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#00e5ff',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(0, 229, 255, 0.04)',
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
    fontWeight: '600',
    color: '#00e5ff',
  },
  placeholder: {
    color: '#587396',
  },
  arrow: {
    fontSize: 10,
    color: '#00e5ff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 5, 13, 0.85)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    maxHeight: '50%',
  },
  safeArea: {
    paddingBottom: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  optionItemActive: {
    backgroundColor: COLORS.accentBlueLight,
  },
  optionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  optionTextActive: {
    color: COLORS.accentBlue,
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 16,
    color: COLORS.accentBlue,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
});
