import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, SegmentedControlIOS } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card, Button } from '@/components/common/InputField';
import { useFinanceStore } from '@/store';
import { formatCurrency, formatCompactCurrency, formatDate, getMonthStart, getMonthEnd, getYearStart, getYearEnd, groupTransactionsByCategory } from '@/utils/helpers';
import { CURRENCY_SYMBOL, CHART_COLORS } from '@/constants';
import { VictoryPie, VictoryChart, VictoryTheme, VictoryBar, VictoryAxis, VictoryLine, VictoryLabel, VictoryScatter } from 'victory-native';

type ReportsNavProp = NativeStackNavigationProp<RootStackParamList, 'Reports'>;

type Period = 'month' | 'year';
type ChartType = 'pie' | 'bar' | 'line';

export const ReportsScreen = () => {
  const navigation = useNavigation<ReportsNavProp>();
  const { transactions, categories, accounts } = useFinanceStore();
  const [period, setPeriod] = useState<Period>('month');
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const now = new Date();
  const startDate = period === 'month' ? getMonthStart(now) : getYearStart(now);
  const endDate = period === 'month' ? getMonthEnd(now) : getYearEnd(now);

  const periodTransactions = transactions.filter((t) => t.date >= startDate && t.date <= endDate);
  const incomeTxns = periodTransactions.filter((t) => t.type === 'income');
  const expenseTxns = periodTransactions.filter((t) => t.type === 'expense');

  const totalIncome = incomeTxns.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTxns.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const expenseByCategory = groupTransactionsByCategory(expenseTxns);
  const incomeByCategory = groupTransactionsByCategory(incomeTxns);

  const topExpenseCategories = Object.entries(expenseByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([categoryId, amount], index) => {
      const category = categories.find((c) => c.id === categoryId);
      return { categoryId, amount, category, color: CHART_COLORS[index % CHART_COLORS.length], percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0 };
    });

  const topIncomeCategories = Object.entries(incomeByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([categoryId, amount], index) => {
      const category = categories.find((c) => c.id === categoryId);
      return { categoryId, amount, category, color: CHART_COLORS[index % CHART_COLORS.length], percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0 };
    });

  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = getMonthStart(date);
    const monthEnd = getMonthEnd(date);
    const monthTxns = transactions.filter((t) => t.date >= monthStart && t.date <= monthEnd);
    const income = monthTxns.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTxns.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    monthlyTrend.push({
      month: formatDate(date, 'MMM'),
      income,
      expense,
      net: income - expense,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={styles.summaryValueIncome}>{formatCurrency(totalIncome)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Expense</Text>
            <Text style={styles.summaryValueExpense}>{formatCurrency(totalExpense)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net Savings</Text>
            <Text style={[styles.summaryValue, { color: netSavings >= 0 ? '#2ECC71' : '#E74C3C' }]}>
              {formatCurrency(netSavings)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Savings Rate</Text>
            <Text style={styles.summaryValue}>{savingsRate.toFixed(1)}%</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.periodCard}>
        <Text style={styles.sectionTitle}>Period</Text>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segment, period === 'month' && styles.segmentActive]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[styles.segmentText, period === 'month' && styles.segmentTextActive]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, period === 'year' && styles.segmentActive]}
            onPress={() => setPeriod('year')}
          >
            <Text style={[styles.segmentText, period === 'year' && styles.segmentTextActive]}>Year</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.periodRange}>
          {formatDate(startDate, 'dd MMM')} - {formatDate(endDate, 'dd MMM yyyy')}
        </Text>
      </Card>

      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>Expense Breakdown</Text>
          <View style={styles.chartTypeSelector}>
            {(['pie', 'bar'] as ChartType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chartTypeButton, chartType === type && styles.chartTypeButtonActive]}
                onPress={() => setChartType(type)}
              >
                <Ionicons name={type === 'pie' ? 'pie-chart' : 'bar-chart'} size={18} color={chartType === type ? '#fff' : '#666'} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {chartType === 'pie' ? (
          <View style={styles.pieChart}>
            <VictoryPie
              data={topExpenseCategories.map((item, index) => ({
                x: item.category?.name || 'Unknown',
                y: item.amount,
                fill: item.color,
              }))}
              width={350}
              height={300}
              innerRadius={80}
              labelComponent={<VictoryLabel />}
              labels={() => null}
              style={{ data: { stroke: '#fff', strokeWidth: 2 } }}
            />
            <View style={styles.pieCenter}>
              <Text style={styles.pieCenterLabel}>Expenses</Text>
              <Text style={styles.pieCenterAmount}>{formatCompactCurrency(totalExpense)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.barChart}>
            <VictoryChart domainPadding={{ x: 20, y: 20 }}>
              <VictoryAxis
                tickValues={topExpenseCategories.map((_, i) => i)}
                tickFormat={(t) => topExpenseCategories[t]?.category?.name?.substring(0, 8) || ''}
                style={{ axis: { stroke: '#E0E0E0' }, tickLabels: { fontSize: 10, fill: '#666', angle: -45 } }}
              />
              <VictoryAxis
                dependentAxis
                tickFormat={(t) => formatCompactCurrency(t as number)}
                style={{ axis: { stroke: '#E0E0E0' }, tickLabels: { fontSize: 10, fill: '#666' } }}
              />
              <VictoryBar
                data={topExpenseCategories.map((item, index) => ({ x: index, y: item.amount, fill: item.color }))}
                style={{ data: { width: 25 } }}
                labelComponent={<VictoryLabel />}
                labels={({ datum }) => formatCompactCurrency(datum.y)}
              />
            </VictoryChart>
          </View>
        )}
        <View style={styles.legend}>
          {topExpenseCategories.slice(0, 5).map((item, index) => (
            <TouchableOpacity key={item.categoryId} style={styles.legendItem} onPress={() => setSelectedCategory(selectedCategory === item.categoryId ? null : item.categoryId)}>
              <View style={[styles.legendColor, { backgroundColor: item.color, opacity: selectedCategory === item.categoryId ? 1 : 0.5 }]} />
              <Text style={[styles.legendLabel, { color: selectedCategory === item.categoryId ? '#1A1A2E' : '#666' }]}>{item.category?.name}</Text>
              <Text style={[styles.legendValue, { color: selectedCategory === item.categoryId ? '#1A1A2E' : '#666' }]}>
                {formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.trendCard}>
        <Text style={styles.sectionTitle}>Monthly Trend (6 Months)</Text>
        <View style={styles.lineChart}>
          <VictoryChart domainPadding={{ x: 20, y: 20 }}>
            <VictoryAxis
              tickValues={monthlyTrend.map((_, i) => i)}
              tickFormat={(t) => monthlyTrend[t]?.month || ''}
              style={{ axis: { stroke: '#E0E0E0' }, tickLabels: { fontSize: 11, fill: '#666' } }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(t) => formatCompactCurrency(t as number)}
              style={{ axis: { stroke: '#E0E0E0' }, tickLabels: { fontSize: 10, fill: '#666' } }}
            />
            <VictoryLine
              data={monthlyTrend.map((item, index) => ({ x: index, y: item.income }))}
              interpolation="natural"
              style={{ data: { stroke: '#2ECC71', strokeWidth: 2 } }}
            />
            <VictoryLine
              data={monthlyTrend.map((item, index) => ({ x: index, y: item.expense }))}
              interpolation="natural"
              style={{ data: { stroke: '#E74C3C', strokeWidth: 2 } }}
            />
            <VictoryLine
              data={monthlyTrend.map((item, index) => ({ x: index, y: item.net }))}
              interpolation="natural"
              style={{ data: { stroke: '#6C63FF', strokeWidth: 2, strokeDasharray: '5,5' } }}
            />
            <VictoryScatter
              data={monthlyTrend.map((item, index) => ({ x: index, y: item.income }))}
              size={6}
              symbol="circle"
              style={{ data: { fill: '#2ECC71' } }}
            />
            <VictoryScatter
              data={monthlyTrend.map((item, index) => ({ x: index, y: item.expense }))}
              size={6}
              symbol="circle"
              style={{ data: { fill: '#E74C3C' } }}
            />
          </VictoryChart>
        </View>
        <View style={styles.trendLegend}>
          <View style={styles.trendLegendItem}>
            <View style={[styles.trendLegendDot, { backgroundColor: '#2ECC71' }]} />
            <Text style={styles.trendLegendLabel}>Income</Text>
          </View>
          <View style={styles.trendLegendItem}>
            <View style={[styles.trendLegendDot, { backgroundColor: '#E74C3C' }]} />
            <Text style={styles.trendLegendLabel}>Expense</Text>
          </View>
          <View style={styles.trendLegendItem}>
            <View style={[styles.trendLegendDot, { backgroundColor: '#6C63FF' }]} />
            <Text style={styles.trendLegendLabel}>Net</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <Text style={styles.sectionTitle}>Top Expense Categories</Text>
        </View>
        {topExpenseCategories.length > 0 ? (
          <View style={styles.categoryList}>
            {topExpenseCategories.map((item, index) => (
              <TouchableOpacity key={item.categoryId} style={styles.categoryRow} onPress={() => setSelectedCategory(selectedCategory === item.categoryId ? null : item.categoryId)}>
                <View style={styles.categoryRank}>{index + 1}</View>
                <View style={[styles.categoryIconSmall, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.category?.icon || 'help'} size={18} color={item.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{item.category?.name}</Text>
                  <View style={styles.miniProgress}>
                    <View
                      style={{
                        ...styles.miniProgressFill,
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </View>
                </View>
                <View style={styles.categoryAmounts}>
                  <Text style={styles.categoryAmount}>{formatCurrency(item.amount)}</Text>
                  <Text style={styles.categoryPercent}>{item.percentage.toFixed(1)}%</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons name="pie-chart-outline" size={48} color="#CCC" />
            <Text style={styles.emptyChartText}>No expense data</Text>
          </View>
        )}
      </Card>

      <Card style={styles.insightsCard}>
        <Text style={styles.sectionTitle}>Insights</Text>
        <View style={styles.insightsList}>
          {totalExpense > totalIncome && (
            <View style={styles.insightItem}>
              <Ionicons name="alert-circle" size={20} color="#E74C3C" style={styles.insightIcon} />
              <Text style={styles.insightText}>You spent more than you earned this period. Consider reviewing your budgets.</Text>
            </View>
          )}
          {savingsRate > 20 && (
            <View style={styles.insightItem}>
              <Ionicons name="thumbs-up" size={20} color="#2ECC71" style={styles.insightIcon} />
              <Text style={styles.insightText}>Great job! Your savings rate is {savingsRate.toFixed(1)}%.</Text>
            </View>
          )}
          {topExpenseCategories.length > 0 && topExpenseCategories[0].percentage > 40 && (
            <View style={styles.insightItem}>
              <Ionicons name="information-circle" size={20} color="#3498DB" style={styles.insightIcon} />
              <Text style={styles.insightText}>
                {topExpenseCategories[0].category?.name} accounts for {topExpenseCategories[0].percentage.toFixed(1)}% of your expenses.
              </Text>
            </View>
          )}
          {topExpenseCategories.length > 1 && (
            <View style={styles.insightItem}>
              <Ionicons name="information-circle" size={20} color="#3498DB" style={styles.insightIcon} />
              <Text style={styles.insightText}>
                Top 3 categories make up {topExpenseCategories.slice(0, 3).reduce((sum, c) => sum + c.percentage, 0).toFixed(1)}% of spending.
              </Text>
            </View>
          )}
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 100 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  summaryCard: { marginBottom: 16 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryItem: { flex: 1, minWidth: '45%' },
  summaryLabel: { fontSize: 12, color: '#888' },
  summaryValueIncome: { fontSize: 18, fontWeight: '700', color: '#2ECC71', marginTop: 4 },
  summaryValueExpense: { fontSize: 18, fontWeight: '700', color: '#E74C3C', marginTop: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginTop: 4 },
  periodCard: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A2E', marginBottom: 12 },
  segmentedControl: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 12 },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: '#fff', borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  segmentText: { fontSize: 14, fontWeight: '500', color: '#666' },
  segmentTextActive: { color: '#1A1A2E', fontWeight: '600' },
  periodRange: { fontSize: 12, color: '#888', marginTop: 8, textAlign: 'center' },
  chartCard: { marginBottom: 16 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  chartTypeSelector: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 8 },
  chartTypeButton: { padding: 8, borderRadius: 6 },
  chartTypeButtonActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  pieChart: { alignItems: 'center', height: 300, position: 'relative' },
  pieCenter: { position: 'absolute', alignItems: 'center' },
  pieCenterLabel: { fontSize: 14, color: '#888' },
  pieCenterAmount: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  barChart: { height: 250 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, backgroundColor: '#F8F9FA' },
  legendColor: { width: 12, height: 12, borderRadius: 3 },
  legendLabel: { fontSize: 13, fontWeight: '500' },
  legendValue: { fontSize: 13, fontWeight: '500' },
  trendCard: { marginBottom: 16 },
  lineChart: { height: 200 },
  trendLegend: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 12 },
  trendLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendLegendDot: { width: 8, height: 8, borderRadius: 4 },
  trendLegendLabel: { fontSize: 12, color: '#666' },
  categoryCard: { marginBottom: 16 },
  categoryHeader: { marginBottom: 12 },
  categoryList: { gap: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  categoryRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  categoryIconSmall: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  categoryInfo: { flex: 1, gap: 4 },
  categoryName: { fontSize: 15, fontWeight: '500', color: '#1A1A2E' },
  miniProgress: { height: 4, borderRadius: 2, backgroundColor: '#F0F0F0' },
  miniProgressFill: { height: '100%', borderRadius: 2 },
  categoryAmounts: { alignItems: 'flex-end' },
  categoryAmount: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  categoryPercent: { fontSize: 12, color: '#888' },
  emptyChart: { alignItems: 'center', padding: 32, gap: 8 },
  emptyChartText: { fontSize: 14, color: '#888' },
  insightsCard: { marginBottom: 16 },
  insightsList: { gap: 12 },
  insightItem: { flexDirection: 'row', gap: 10, padding: 12, backgroundColor: '#F8F9FA', borderRadius: 10 },
  insightIcon: { marginTop: 2 },
  insightText: { flex: 1, fontSize: 13, color: '#333', lineHeight: 20 },
});