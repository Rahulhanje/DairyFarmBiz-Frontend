import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { milkRatesApi, CreateMilkRateData, MilkRate } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/common/LoadingSpinner';import { formatDateDisplay } from '@/lib/utils';import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, DollarSign, Loader2, Edit, Trash } from 'lucide-react';

const rateSchema = z.object({
  animalType: z.enum(['cow', 'buffalo']),
  ratePerLiter: z.number().min(0, 'Rate must be positive'),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
});

type RateFormData = z.infer<typeof rateSchema>;

const MilkRates: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editRate, setEditRate] = useState<MilkRate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editRateValue, setEditRateValue] = useState<number>(0);
  const [lookupDate, setLookupDate] = useState('');
  const [lookupResult, setLookupResult] = useState<{ cowRate: number | null; buffaloRate: number | null } | null>(null);

  const { data: currentRates, isLoading: currentLoading } = useQuery({
    queryKey: ['milk-rates-current'],
    queryFn: () => milkRatesApi.getCurrent(),
  });

  const { data: rateHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['milk-rates'],
    queryFn: () => milkRatesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMilkRateData) => milkRatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-rates'] });
      queryClient.invalidateQueries({ queryKey: ['milk-rates-current'] });
      toast({ title: t('success'), description: 'Rate added successfully' });
      setIsAddOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ratePerLiter }: { id: string; ratePerLiter: number }) => 
      milkRatesApi.update(id, ratePerLiter),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-rates'] });
      queryClient.invalidateQueries({ queryKey: ['milk-rates-current'] });
      toast({ title: t('success'), description: 'Rate updated successfully' });
      setEditRate(null);
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => milkRatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-rates'] });
      queryClient.invalidateQueries({ queryKey: ['milk-rates-current'] });
      toast({ title: t('success'), description: 'Rate deleted successfully' });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const form = useForm<RateFormData>({
    resolver: zodResolver(rateSchema),
    defaultValues: {
      animalType: 'cow',
      ratePerLiter: 0,
      effectiveFrom: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = (data: RateFormData) => {
    createMutation.mutate({
      animalType: data.animalType,
      ratePerLiter: data.ratePerLiter,
      effectiveFrom: data.effectiveFrom,
    });
  };

  const handleEdit = (rate: MilkRate) => {
    setEditRate(rate);
    setEditRateValue(rate.ratePerLiter);
  };

  const handleUpdateRate = () => {
    if (editRate) {
      updateMutation.mutate({ id: editRate._id, ratePerLiter: editRateValue });
    }
  };

  const handleLookup = async () => {
    if (!lookupDate) return;
    try {
      const [cowResult, buffaloResult] = await Promise.allSettled([
        milkRatesApi.lookup(lookupDate, 'cow'),
        milkRatesApi.lookup(lookupDate, 'buffalo'),
      ]);
      
      setLookupResult({
        cowRate: cowResult.status === 'fulfilled' ? cowResult.value.ratePerLiter : null,
        buffaloRate: buffaloResult.status === 'fulfilled' ? buffaloResult.value.ratePerLiter : null,
      });
    } catch {
      toast({ title: t('failed'), description: 'Rate not found for this date', variant: 'destructive' });
    }
  };

  // Helper to format date safely
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return formatDateDisplay(dateStr);
    } catch {
      return 'Invalid date';
    }
  };

  if (currentLoading || historyLoading) {
    return (
      <AppLayout>
        <PageLoader message={t('loading')} />
      </AppLayout>
    );
  }

  // Get current rates from the response
  const cowRate = currentRates?.cow?.ratePerLiter ?? 0;
  const buffaloRate = currentRates?.buffalo?.ratePerLiter ?? 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('milk_rates_title')}</h1>
            <p className="text-muted-foreground text-sm">{t('current_rates')}</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('add_rate')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('add_rate')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="animalType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animal_type')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select animal type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cow">{t('cow')}</SelectItem>
                            <SelectItem value="buffalo">{t('buffalo')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ratePerLiter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('rate_per_liter')} (₹)</FormLabel>
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
                    name="effectiveFrom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('effective_date')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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

        {/* Current Rates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('cow_rate')}</p>
                  <p className="text-3xl font-bold text-foreground">
                    ₹{cowRate.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('rate_per_liter')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('buffalo_rate')}</p>
                  <p className="text-3xl font-bold text-foreground">
                    ₹{buffaloRate.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('rate_per_liter')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rate Lookup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('lookup_rate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="date"
                value={lookupDate}
                onChange={(e) => setLookupDate(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleLookup}>{t('search')}</Button>
            </div>
            {lookupResult && (
              <div className="mt-4 p-4 bg-accent rounded-lg">
                <p className="text-sm text-muted-foreground mb-3">
                  Rates for {formatDate(lookupDate)}:
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                  <div>
                    <span className="text-sm text-muted-foreground">{t('cow_rate')}:</span>{' '}
                    <span className="font-semibold text-foreground">
                      {lookupResult.cowRate !== null ? `₹${lookupResult.cowRate.toFixed(2)}` : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{t('buffalo_rate')}:</span>{' '}
                    <span className="font-semibold text-foreground">
                      {lookupResult.buffaloRate !== null ? `₹${lookupResult.buffaloRate.toFixed(2)}` : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rate History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('rate_history')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!rateHistory || rateHistory.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title={t('no_data')}
                description="No rate history available."
              />
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('animal_type')}</TableHead>
                        <TableHead>{t('effective_date')}</TableHead>
                        <TableHead className="text-right">{t('rate_per_liter')}</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rateHistory.map((rate: MilkRate) => (
                        <TableRow key={rate._id}>
                          <TableCell className="capitalize font-medium">{rate.animalType}</TableCell>
                          <TableCell>{formatDate(rate.effectiveFrom)}</TableCell>
                          <TableCell className="text-right font-semibold">₹{rate.ratePerLiter.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(rate)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(rate._id)}
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
                <div className="md:hidden space-y-3">
                  {rateHistory.map((rate: MilkRate) => (
                    <div key={rate._id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="capitalize font-semibold text-base">{rate.animalType}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(rate.effectiveFrom)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(rate)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(rate._id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-muted-foreground">{t('rate_per_liter')}</span>
                        <span className="text-lg font-bold">₹{rate.ratePerLiter.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Edit Rate Dialog */}
        <Dialog open={!!editRate} onOpenChange={(open) => !open && setEditRate(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('edit')} {t('rate')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('animal_type')}</p>
                <p className="font-medium capitalize">{editRate?.animalType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('effective_date')}</p>
                <p className="font-medium">{formatDate(editRate?.effectiveFrom)}</p>
              </div>
              <div>
                <label className="text-sm font-medium">{t('rate_per_liter')} (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editRateValue}
                  onChange={(e) => setEditRateValue(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditRate(null)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleUpdateRate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title={t('delete')}
          description="Are you sure you want to delete this rate? This action cannot be undone."
          onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
          variant="destructive"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AppLayout>
  );
};

export default MilkRates;
