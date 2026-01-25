import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { expensesApi, CreateExpenseData, Expense } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Receipt, Trash, Edit, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// Schema matching backend CreateExpenseData
const expenseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['feed', 'medicine', 'doctor', 'labor', 'equipment', 'maintenance', 'transport', 'other']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string().optional(),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const categoryLabels: Record<string, string> = {
  feed: 'cat_feed',
  medicine: 'cat_medicine',
  doctor: 'Doctor',
  labor: 'cat_labor',
  equipment: 'cat_equipment',
  maintenance: 'cat_maintenance',
  transport: 'cat_transport',
  other: 'cat_other',
};

// Helper to safely format dates
const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, 'MMM d, yyyy');
  } catch {
    return 'Invalid Date';
  }
};

const Expenses: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const dateParams = {
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', dateParams],
    queryFn: () => expensesApi.getAll(dateParams as Record<string, string>),
  });

  const { data: summary } = useQuery({
    queryKey: ['expenses-summary', dateParams],
    queryFn: () => expensesApi.getSummary(dateParams as Record<string, string>),
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: '',
      category: 'feed',
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateExpenseData) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      toast({ title: t('success'), description: 'Expense added successfully' });
      setIsAddOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExpenseData> }) => 
      expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      toast({ title: t('success'), description: 'Expense updated successfully' });
      setEditExpense(null);
      form.reset();
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      toast({ title: t('success'), description: 'Expense deleted successfully' });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const onSubmit = (formData: ExpenseFormData) => {
    const apiData: CreateExpenseData = {
      name: formData.name,
      category: formData.category,
      amount: formData.amount,
      date: formData.date || undefined,
      notes: formData.notes || undefined,
    };

    if (editExpense) {
      updateMutation.mutate({ id: editExpense._id, data: apiData });
    } else {
      createMutation.mutate(apiData);
    }
  };

  const handleDateChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleEdit = (expense: Expense) => {
    setEditExpense(expense);
    form.reset({
      name: expense.name,
      category: expense.category,
      amount: expense.amount,
      date: expense.date ? format(new Date(expense.date), 'yyyy-MM-dd') : '',
      notes: expense.notes || '',
    });
  };

  const handleAddOpen = (open: boolean) => {
    setIsAddOpen(open);
    if (open) {
      form.reset({
        name: '',
        category: 'feed',
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      });
    }
  };

  // Translate category for display
  const getCategoryLabel = (category: string) => {
    const key = categoryLabels[category];
    if (key) {
      // Try to translate, fallback to capitalize
      try {
        return t(key as any);
      } catch {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const pieData = summary?.byCategory?.map(item => ({
    name: getCategoryLabel(item.category),
    value: item.amount,
  })) || [];

  if (isLoading) {
    return (
      <AppLayout>
        <PageLoader message={t('loading')} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('expenses_title')}</h1>
            <p className="text-muted-foreground text-sm">Track and manage all your farm expenses</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={handleAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('add_expense')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('add_expense')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('name')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Cattle feed purchase" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('category')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="feed">{t('cat_feed')}</SelectItem>
                            <SelectItem value="medicine">{t('cat_medicine')}</SelectItem>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="labor">{t('cat_labor')}</SelectItem>
                            <SelectItem value="equipment">{t('cat_equipment')}</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="other">{t('cat_other')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('amount')} (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('expense_date')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {t('save')}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Total Expenses Summary Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('total_expenses')}</p>
                <p className="text-3xl font-bold text-foreground">
                  ₹{(summary?.total || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.data?.length || 0} expense(s) 
                  {(startDate || endDate || categoryFilter !== 'all') && ' (filtered)'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Chart */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('expense_summary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS[index % CHART_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `₹${value.toLocaleString()}`}
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
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateChange}
          />
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="feed">{t('cat_feed')}</SelectItem>
              <SelectItem value="medicine">{t('cat_medicine')}</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="labor">{t('cat_labor')}</SelectItem>
              <SelectItem value="equipment">{t('cat_equipment')}</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="transport">Transport</SelectItem>
              <SelectItem value="other">{t('cat_other')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expenses Table */}
        {!data?.data || data.data.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={t('no_data')}
            description="No expenses found. Add your first expense to get started."
            actionLabel={t('add_expense')}
            onAction={() => setIsAddOpen(true)}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('expense_date')}</TableHead>
                      <TableHead>{t('name')}</TableHead>
                      <TableHead>{t('category')}</TableHead>
                      <TableHead className="text-right">{t('amount')}</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((expense) => (
                      <TableRow key={expense._id}>
                        <TableCell>{formatDate(expense.date)}</TableCell>
                        <TableCell className="max-w-xs truncate font-medium">
                          {expense.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getCategoryLabel(expense.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{expense.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(expense._id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-3">
                {data.data.map((expense) => (
                  <div key={expense._id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="font-semibold text-base truncate">{expense.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatDate(expense.date)}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryLabel(expense.category)}
                        </Badge>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(expense._id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-sm text-muted-foreground">{t('amount')}</span>
                      <span className="text-lg font-bold text-primary">₹{expense.amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editExpense} onOpenChange={(open) => !open && setEditExpense(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('edit')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('category')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="feed">{t('cat_feed')}</SelectItem>
                          <SelectItem value="medicine">{t('cat_medicine')}</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="labor">{t('cat_labor')}</SelectItem>
                          <SelectItem value="equipment">{t('cat_equipment')}</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="transport">Transport</SelectItem>
                          <SelectItem value="other">{t('cat_other')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('amount')} (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('expense_date')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditExpense(null)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t('save')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title={t('delete')}
          description="Are you sure you want to delete this expense?"
          onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
          variant="destructive"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AppLayout>
  );
};

export default Expenses;
