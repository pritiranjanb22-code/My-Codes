import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { RootStackScreenProps } from '@/navigation/types';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '@/components/Button';
import { Card, CardContent } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type Props = RootStackScreenProps<'PollDetail'>;

export default function PollDetailScreen({ navigation }: Props) {
  const route = useRoute<Props['route']>();
  const { pollId } = route.params;
  const { polls, members } = useAppStore();

  const poll = polls.find(p => p.id === pollId);
  const currentUser = members.find(m => m.userId === useAppStore.getState().user?.id);
  const hasVoted = poll?.options.some(opt => opt.voterIds.includes(currentUser?.userId || ''));

  if (!poll) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>Poll not found</Text></View>;
  }

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  const handleVote = (optionId: string) => {
    console.log('Vote for:', optionId);
  };

  const handleClose = () => {
    console.log('Close poll');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Poll</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.pollCard} variant="elevated">
          <CardContent>
            <View style={styles.pollHeader}>
              <Avatar name={poll.user.name} size="sm" source={poll.user.avatar} />
              <View>
                <Text style={styles.pollAuthor}>{poll.user.name}</Text>
                <Text style={styles.pollTime}>{require('@/utils/helpers').formatRelativeTime(poll.createdAt)}</Text>
              </View>
              {poll.isClosed && (
                <View style={styles.closedBadge}>
                  <Text style={styles.closedText}>CLOSED</Text>
                </View>
              )}
            </View>

            <Text style={styles.pollQuestion}>{poll.question}</Text>

            <View style={styles.pollOptions}>
              {poll.options.map((option, index) => (
                <PollOptionRow
                  key={option.id}
                  option={option}
                  index={index}
                  totalVotes={totalVotes}
                  hasVoted={hasVoted}
                  userVote={option.voterIds.includes(currentUser?.userId || '')}
                  onPress={() => !hasVoted && !poll.isClosed && handleVote(option.id)}
                />
              ))}
            </View>

            <View style={styles.pollMeta}>
              <Text>{totalVotes} vote{totalVotes !== 1 ? 's' : ''} • {poll.isClosed ? 'Closed' : 'Active'}</Text>
            </View>

            {poll.isClosed && (
              <View style={styles.resultsNote}>
                <Ionicons name="information-circle" size={16} color={COLORS.textMuted} />
                <Text>Poll is closed. Final results shown above.</Text>
              </View>
            )}

            {!poll.isClosed && currentUser?.userId === poll.userId && (
              <Button title="Close Poll" variant="outline" onPress={handleClose} fullWidth style={{ marginTop: SPACING.md }} />
            )}
          </CardContent>
        </Card>

        {!poll.isClosed && !hasVoted && (
          <View style={styles.votePrompt}>
            <Text>Tap an option to vote</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const PollOptionRow = ({ option, index, totalVotes, hasVoted, userVote, onPress }: any) => {
  const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <TouchableOpacity style={[styles.optionRow, userVote && styles.optionRowVoted]} onPress={onPress} activeOpacity={0.8} disabled={hasVoted}>
      <View style={styles.optionLeft}>
        <View style={[styles.optionLetter, userVote && styles.optionLetterVoted]}>{letters[index]}</View>
        <Text style={styles.optionText}>{option.text}</Text>
      </View>
      <View style={styles.optionRight}>
        <View style={styles.optionBar}>
          <View style={[styles.optionFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.optionStats}>
          {option.votes} vote{option.votes !== 1 ? 's' : ''} ({percentage.toFixed(1)}%)
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
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
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  pollCard: {
    marginBottom: SPACING.lg,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  pollAuthor: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  pollTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closedBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.full,
  },
  closedText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  pollQuestion: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    lineHeight: 28,
  },
  pollOptions: {
    gap: SPACING.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionRowVoted: {
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterVoted: {
    backgroundColor: COLORS.accent,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  optionRight: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  optionBar: {
    width: 80,
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  optionFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  optionStats: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  pollMeta: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resultsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
  },
  votePrompt: {
    marginTop: SPACING.lg,
    textAlign: 'center',
    color: COLORS.textMuted,
  },
});