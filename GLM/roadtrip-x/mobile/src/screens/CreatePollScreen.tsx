import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { generateId } from '@/utils/helpers';

type Props = RootStackScreenProps<'CreatePoll'>;

export default function CreatePollScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId } = route.params;
  const { addPoll } = useAppStore();

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    setOptions(prev => prev.map((opt, i) => i === index ? value : opt));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!question.trim()) newErrors.question = 'Question is required';
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) newErrors.options = 'At least 2 options required';
    options.forEach((opt, i) => {
      if (!opt.trim()) newErrors[`option-${i}`] = 'Option cannot be empty';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm() || !tripId) return;

    const poll = {
      id: generateId(),
      tripId,
      userId: useAppStore.getState().user?.id || '',
      user: useAppStore.getState().user!,
      question,
      options: options.filter(opt => opt.trim()).map((text, index) => ({
        id: `opt-${index}`,
        pollId: '',
        text,
        votes: 0,
        voterIds: [],
      })),
      isClosed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addPoll(poll);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Poll</Text>
        </View>

        <View style={styles.content}>
          <Card style={styles.formCard} variant="elevated">
            <CardContent>
              <Input
                label="Question"
                value={question}
                onChangeText={setQuestion}
                error={errors.question}
                placeholder="What should we eat for lunch?"
                autoCapitalize="sentences"
              />

              <View style={styles.sectionRow}>
                <Text style={styles.inputLabel}>Options</Text>
                <Text style={styles.optionsCount}>{options.filter(o => o.trim()).length}/6</Text>
              </View>

              {options.map((option, index) => (
                <View key={index} style={styles.optionInputRow}>
                  <TextInput
                    style={styles.optionInput}
                    value={option}
                    onChangeText={value => updateOption(index, value)}
                    placeholder={`Option ${index + 1}`}
                    autoCapitalize="words"
                  />
                  {options.length > 2 && (
                    <TouchableOpacity onPress={() => removeOption(index)} style={styles.removeButton}>
                      <Ionicons name="close" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {errors.options && <Text style={styles.errorText}>{errors.options}</Text>}
              {options.map((option, index) => errors[`option-${index}`] && (
                <Text key={index} style={styles.errorText}>{errors[`option-${index}`]}</Text>
              ))}

              {options.length < 6 && (
                <TouchableOpacity onPress={addOption} style={styles.addOptionButton}>
                  <Ionicons name="add" size={20} color={COLORS.accent} />
                  <Text style={styles.addOptionText}>Add Option</Text>
                </TouchableOpacity>
              )}
            </CardContent>
          </Card>

          <Card style={styles.previewCard} variant="outlined">
            <CardContent>
              <Text style={styles.previewTitle}>Preview</Text>
              <Text style={styles.previewQuestion}>{question || 'Your question...'}</Text>
              <View style={styles.previewOptions}>
                {options.map((option, index) => (
                  <Text key={index} style={styles.previewOption}>
                    {String.fromCharCode(65 + index)}. {option || `Option ${index + 1}`}
                  </Text>
                ))}
              </View>
            </CardContent>
          </Card>

          <Button title="Create Poll" onPress={handleCreate} fullWidth size="lg" style={{ marginTop: SPACING.md, marginBottom: SPACING.xxl }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  content: {
    paddingVertical: SPACING.md,
  },
  formCard: {},
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionsCount: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  optionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  optionInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  addOptionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.accent,
  },
  previewCard: {
    marginTop: SPACING.lg,
  },
  previewTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  previewQuestion: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  previewOptions: {
    gap: SPACING.xs,
  },
  previewOption: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
});