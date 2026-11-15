import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, TextInput } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store';
import { formatRelativeTime } from '@/utils/helpers';

type Props = RootStackScreenProps<'AIAssistant'>;

export default function AIAssistantScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { tripId } = route.params;
  const { currentTrip, trips } = useAppStore();

  const trip = currentTrip?.id === tripId ? currentTrip : trips.find((t) => t.id === tripId);
  const [messages, setMessages] = React.useState([
    { id: '1', role: 'assistant' as const, content: 'Hi! I\'m RoadTrip AI. How can I help you with your trip?', timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = React.useState('');

  const suggestions = [
    'What\'s our current budget status?',
    'Find a good lunch stop nearby',
    'Who owes me money?',
    'How much fuel do we have left?',
    'Suggest a coffee break spot',
    'What\'s the weather like ahead?',
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = { id: Date.now().toString(), role: 'user' as const, content: input, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'Based on your trip data, you have ₹6,550 remaining in your trip wallet.',
        'There\'s a highly rated restaurant 4km ahead - "Coorg Cuisine" with 4.5 stars.',
        'Rahul owes you ₹420 and Amit owes you ₹350.',
        'Car 1 has 62% fuel (320km range), Car 2 has 45% fuel (280km range).',
        'Coffee Corner is 2km away - great reviews for their filter coffee!',
        'Weather looks clear for the next 6 hours. Temperature around 24°C.',
      ];
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  if (!trip) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>Trip not found</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.aiAvatar}>
            <Ionicons name="construct" size={24} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>RoadTrip AI</Text>
            <Text style={styles.headerSubtitle}>Trip Assistant</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
        inverted
      />

      {/* Suggestions */}
      {messages.length <= 2 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Try asking:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsList}>
            {suggestions.map((s) => (
              <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => { setInput(s); handleSend(); }}>
                <Text style={styles.suggestionChipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything about your trip..."
            onSubmitEditing={handleSend}
            maxLength={500}
          />
        </View>
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!input.trim()}>
          <Ionicons name="send" size={24} color={input.trim() ? COLORS.accent : COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const MessageBubble = ({ message }: any) => (
  <View style={[styles.messageContainer, message.role === 'user' && styles.messageOwn]}>
    {message.role === 'assistant' && (
      <View style={styles.aiAvatarSmall}>
        <Ionicons name="construct" size={16} color={COLORS.white} />
      </View>
    )}
    <View style={[styles.messageBubble, message.role === 'user' && styles.messageBubbleOwn]}>
      <Text style={[styles.messageText, message.role === 'user' && styles.messageTextOwn]}>{message.content}</Text>
      <Text style={[styles.messageTime, message.role === 'user' && styles.messageTimeOwn]}>{formatRelativeTime(message.timestamp)}</Text>
    </View>
    {message.role === 'user' && <View style={styles.messageSpacer} />}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  messagesContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  messageContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    maxWidth: '85%',
  },
  messageOwn: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageSpacer: {
    width: 28,
  },
  messageBubble: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: 4,
    ...SHADOWS.small,
  },
  messageBubbleOwn: {
    backgroundColor: COLORS.accent,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  messageTextOwn: {
    color: COLORS.white,
  },
  messageTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  suggestionsContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  suggestionsTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  suggestionsList: {
    gap: SPACING.sm,
  },
  suggestionChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.full,
    maxHeight: 100,
  },
  sendButton: {
    padding: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
  },
});