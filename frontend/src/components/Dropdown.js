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
import { useTheme } from '../context/ThemeContext';

export default function Dropdown({ 
  label, 
  placeholder, 
  selectedValue, 
  onValueChange, 
  options = [] 
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const { theme, themeName } = useTheme();

  const selectedOption = options.find(opt => opt.value === selectedValue);

  const handleSelect = (value) => {
    onValueChange(value);
    setModalVisible(false);
  };

  const WEB_STYLES = {
    trigger: {
      transition: 'all 0.3s ease',
      boxShadow: themeName === 'sci-fi' ? 'inset 0 0 15px rgba(0, 229, 255, 0.03)' : 'none',
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[
          styles.label,
          {
            color: theme.colors.textSecondary,
            fontFamily: themeName === 'minimal' ? 'sans-serif' : 'Orbitron',
            fontWeight: themeName === 'accessibility' ? '900' : '700',
          }
        ]}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        style={[
          styles.trigger,
          {
            borderColor: theme.colors.border,
            borderLeftColor: theme.colors.accentBlue,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            borderWidth: themeName === 'accessibility' ? 2 : 1,
            borderLeftWidth: themeName === 'accessibility' ? 5 : 4,
          },
          Platform.OS === 'web' && WEB_STYLES.trigger
        ]}
      >
        <Text style={[
          styles.triggerText,
          {
            color: selectedOption ? theme.colors.accentBlue : theme.colors.textMuted,
            fontWeight: themeName === 'accessibility' ? 'bold' : '600',
          }
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={[styles.arrow, { color: theme.colors.accentBlue }]}>
          {modalVisible ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <TouchableOpacity 
            style={styles.modalDismiss} 
            activeOpacity={1} 
            onPress={() => setModalVisible(false)}
          />
          <View style={[
            styles.modalContent,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderWidth: themeName === 'accessibility' ? 2.5 : 1.5,
              borderTopLeftRadius: theme.borderRadius.lg,
              borderTopRightRadius: theme.borderRadius.lg,
            }
          ]}>
            <SafeAreaView style={styles.safeArea}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.divider }]}>
                <Text style={[
                  styles.modalTitle,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: themeName === 'minimal' ? 'sans-serif' : 'Orbitron',
                    fontWeight: themeName === 'accessibility' ? '900' : '800',
                  }
                ]}>
                  {label || 'Select Option'}
                </Text>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={[styles.closeButtonText, { color: theme.colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                ItemSeparatorComponent={() => (
                  <View style={[styles.separator, { backgroundColor: theme.colors.divider }]} />
                )}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const isSelected = item.value === selectedValue;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.optionItem,
                        { borderRadius: theme.borderRadius.md },
                        isSelected && { backgroundColor: theme.colors.accentBlueLight }
                      ]}
                      onPress={() => handleSelect(item.value)}
                    >
                      <Text style={[
                        styles.optionText,
                        {
                          color: isSelected ? theme.colors.accentBlue : theme.colors.textPrimary,
                          fontWeight: isSelected ? '700' : themeName === 'accessibility' ? 'bold' : '500',
                          fontSize: themeName === 'accessibility' ? 16 : 14,
                        }
                      ]}>
                        {item.label}
                      </Text>
                      {isSelected && (
                        <Text style={[styles.checkmark, { color: theme.colors.accentBlue }]}>✓</Text>
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  trigger: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    fontFamily: 'IBM Plex Mono',
    fontSize: 14,
  },
  arrow: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    maxHeight: '50%',
  },
  safeArea: {
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1.5,
  },
  modalTitle: {
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  optionText: {
    fontFamily: 'IBM Plex Mono',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
  },
});
