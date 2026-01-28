import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { dashboardApi } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/common/StatCard';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { OnboardingTour } from '@/components/common/OnboardingTour';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  IndianRupee,
  Receipt,
  TrendingUp,
  PawPrint,
  Milk,
  Baby,
  Bell,
  Home
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const dateParams = {
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
  };

  const queryOptions = {
    retry: 0, // Don't retry failed requests
    staleTime: 30000, // Cache for 30 seconds
  };

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary', dateParams],
    queryFn: () => dashboardApi.getSummary(dateParams),
    ...queryOptions,
  });

  const { data: milkTrends } = useQuery({
    queryKey: ['milk-trends', dateParams],
    queryFn: () => dashboardApi.getMilkTrends(dateParams),
    ...queryOptions,
  });

  const { data: expenseTrends } = useQuery({
    queryKey: ['expense-trends', dateParams],
    queryFn: () => dashboardApi.getExpenseTrends(dateParams),
    ...queryOptions,
  });

  const { data: profitTrends } = useQuery({
    queryKey: ['profit-trends', dateParams],
    queryFn: () => dashboardApi.getProfitLossTrends(dateParams),
    ...queryOptions,
  });

  const handleDateChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (summaryLoading) {
    return (
      <AppLayout>
        <PageLoader message={t('loading')} />
      </AppLayout>
    );
  }

  const profitLoss = summary?.profitLoss?.netProfit ?? 0;
  const isProfitable = profitLoss >= 0;

  // Prepare expense breakdown data for pie chart from actual data
  const expenseBreakdown = summary?.expenses?.byCategory
    ? Object.entries(summary.expenses.byCategory).map(([name, value]) => {
      // Handle special cases like doctor, maintenance, transport
      let displayName: string;
      if (name === 'doctor') {
        displayName = 'Doctor';
      } else if (name === 'maintenance') {
        displayName = 'Maintenance';
      } else if (name === 'transport') {
        displayName = 'Transport';
      } else {
        // Try translation, fallback to capitalized name
        try {
          displayName = t(`cat_${name}` as any);
        } catch {
          displayName = name.charAt(0).toUpperCase() + name.slice(1);
        }
      }
      return { name: displayName, value };
    })
    : [];

  return (
    <AppLayout>
      <OnboardingTour />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('dashboard_title')}</h1>
            <p className="text-muted-foreground text-sm">{t('quick_stats')}</p>
          </div>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateChange}
          />
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('total_income')}
            value={`₹${(summary?.profitLoss?.totalIncome ?? 0).toLocaleString()}`}
            icon={IndianRupee}
            variant="success"
          />
          <StatCard
            title={t('total_expenses')}
            value={`₹${(summary?.profitLoss?.totalExpenses ?? 0).toLocaleString()}`}
            icon={Receipt}
            variant="warning"
          />
          <StatCard
            title={t('profit_loss')}
            value={`₹${Math.abs(profitLoss).toLocaleString()}`}
            subtitle={isProfitable ? 'Profit' : 'Loss'}
            icon={TrendingUp}
            variant={isProfitable ? 'success' : 'destructive'}
          />
          <StatCard
            title={t('total_animals')}
            value={(summary?.animals?.totalCows ?? 0) + (summary?.animals?.totalBuffaloes ?? 0)}
            subtitle={`${(summary?.animals?.activeCows ?? 0) + (summary?.animals?.activeBuffaloes ?? 0)} ${t('active')}`}
            icon={PawPrint}
            variant="primary"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Milk className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('total_liters')}</p>
                  <p className="text-xl font-bold text-foreground">
                    {summary?.milk?.total?.quantity?.toFixed(1) ?? 0} L
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span>{t('cows')}: {summary?.milk?.cow?.totalQuantity?.toFixed(1) ?? 0}L</span>
                <span>{t('buffalos')}: {summary?.milk?.buffalo?.totalQuantity?.toFixed(1) ?? 0}L</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Baby className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('breeding_title')}</p>
                  <p className="text-xl font-bold text-foreground">
                    {summary?.breeding?.confirmed ?? 0} {t('status_confirmed')}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span>{t('status_pending')}: {summary?.breeding?.pendingChecks ?? 0}</span>
                <span>{t('status_delivered')}: {summary?.breeding?.delivered ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('notifications_title')}</p>
                  <p className="text-xl font-bold text-foreground">
                    {summary?.breeding?.pendingChecks ?? 0}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Pending pregnancy checks
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Milk Collection Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('milk_trends')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={milkTrends?.trends?.map(t => ({
                    date: t.date,
                    cow: t.cow?.quantity ?? 0,
                    buffalo: t.buffalo?.quantity ?? 0,
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      formatter={(value: number) => value.toFixed(2)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="cow"
                      name={t('cows')}
                      stroke={CHART_COLORS[0]}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="buffalo"
                      name={t('buffalos')}
                      stroke={CHART_COLORS[1]}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Expense Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('expense_trends')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={expenseTrends?.trends?.map(t => ({
                    date: t.date,
                    value: t.value
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      formatter={(value: number) => `₹${value.toFixed(2)}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={t('total_expenses')}
                      stroke={CHART_COLORS[2]}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Profit/Loss Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('profit_trends')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitTrends?.trends?.map(t => ({
                    date: t.date,
                    value: t.value
                  })) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      formatter={(value: number) => `₹${value.toFixed(2)}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar
                      dataKey="value"
                      name={t('profit_loss')}
                      fill={CHART_COLORS[0]}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Expense Breakdown Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('expense_summary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expenseBreakdown.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `₹${value.toFixed(2)}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Animal Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('animals_title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-accent rounded-lg">
                <p className="text-2xl font-bold text-foreground">{summary?.animals?.totalCows ?? 0}</p>
                <p className="text-sm text-muted-foreground">{t('cows')}</p>
              </div>
              <div className="text-center p-4 bg-accent rounded-lg">
                <p className="text-2xl font-bold text-foreground">{summary?.animals?.totalBuffaloes ?? 0}</p>
                <p className="text-sm text-muted-foreground">{t('buffalos')}</p>
              </div>
              <div className="text-center p-4 bg-accent rounded-lg">
                <p className="text-2xl font-bold text-foreground">{(summary?.animals?.activeCows ?? 0) + (summary?.animals?.activeBuffaloes ?? 0)}</p>
                <p className="text-sm text-muted-foreground">{t('active_animals')}</p>
              </div>
              <div className="text-center p-4 bg-accent rounded-lg">
                <p className="text-2xl font-bold text-foreground">{summary?.animals?.soldAnimals ?? 0}</p>
                <p className="text-sm text-muted-foreground">{t('sold_animals')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
