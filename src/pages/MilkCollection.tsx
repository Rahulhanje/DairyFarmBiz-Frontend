import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { milkCollectionApi, CreateMilkCollectionData, MilkCollection as MilkCollectionType } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Milk, Trash, Edit, Loader2 } from 'lucide-react';

const collectionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  session: z.enum(['morning', 'evening']),
  animalType: z.enum(['cow', 'buffalo']),
  totalMilk: z.number().min(0.1, 'Quantity must be greater than 0'),
  notes: z.string().optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

// Helper to safely format dates
const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return format(date, 'MMM d, yyyy');
  } catch {
    return 'Invalid Date';
  }
};

// Helper to get YYYY-MM-DD format for date input
const getDateInputValue = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return format(new Date(), 'yyyy-MM-dd');
    }
    return format(date, 'yyyy-MM-dd');
  } catch {
    return format(new Date(), 'yyyy-MM-dd');
  }
};

const MilkCollection: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCollection, setEditCollection] = useState<MilkCollectionType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dailyDate, setDailyDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Check if any filter is active
  const hasFilters = Boolean(startDate || endDate || sessionFilter !== 'all' || typeFilter !== 'all');

  const dateParams = {
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    session: sessionFilter !== 'all' ? sessionFilter : undefined,
    animalType: typeFilter !== 'all' ? typeFilter : undefined,
  };

  // Use regular query when filters are applied (fetch all)
  const { data: filteredData, isLoading: isFilteredLoading } = useQuery<{ data: MilkCollectionType[]; total: number; page: number; limit: number; totalPages: number }>({
    queryKey: ['milk-collection-filtered', dateParams],
    queryFn: () => milkCollectionApi.getAll({ 
      ...dateParams as Record<string, string>,
      limit: '0' // Fetch all when filters are applied
    }),
    enabled: hasFilters,
  });

  // Use infinite query when no filters (pagination with scroll)
  const {
    data: infiniteData,
    isLoading: isInfiniteLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['milk-collection-infinite'],
    queryFn: ({ pageParam = 1 }) => milkCollectionApi.getAll({ 
      page: String(pageParam), 
      limit: '10' 
    }),
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page || 1;
      const totalPages = lastPage.totalPages || 1;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !hasFilters,
  });

  // Flatten infinite data pages
  const allCollections = hasFilters 
    ? filteredData?.data || []
    : infiniteData?.pages.flatMap(page => page.data) || [];

  const isLoading = hasFilters ? isFilteredLoading : isInfiniteLoading;

  // Infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage && !hasFilters) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, hasFilters]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const { data: dailySummary } = useQuery({
    queryKey: ['milk-collection-daily', dailyDate],
    queryFn: () => milkCollectionApi.getDailySummary(dailyDate),
  });

  const form = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      session: 'morning',
      animalType: 'cow',
      totalMilk: 0,
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateMilkCollectionData) => milkCollectionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-collection-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['milk-collection-filtered'] });
      queryClient.invalidateQueries({ queryKey: ['milk-collection-daily'] });
      toast({ title: t('success'), description: 'Collection added successfully' });
      setIsAddOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateMilkCollectionData> }) => 
      milkCollectionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-collection-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['milk-collection-filtered'] });
      queryClient.invalidateQueries({ queryKey: ['milk-collection-daily'] });
      toast({ title: t('success'), description: 'Collection updated successfully' });
      setEditCollection(null);
      form.reset();
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => milkCollectionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milk-collection-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['milk-collection-filtered'] });
      queryClient.invalidateQueries({ queryKey: ['milk-collection-daily'] });
      toast({ title: t('success'), description: 'Collection deleted successfully' });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const onSubmit = (formData: CollectionFormData) => {
    const apiData: CreateMilkCollectionData = {
      date: formData.date,
      session: formData.session,
      animalType: formData.animalType,
      totalMilk: formData.totalMilk,
      notes: formData.notes,
    };

    if (editCollection) {
      updateMutation.mutate({ id: editCollection._id, data: apiData });
    } else {
      createMutation.mutate(apiData);
    }
  };

  const handleDateChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleEdit = (collection: MilkCollectionType) => {
    setEditCollection(collection);
    form.reset({
      date: getDateInputValue(collection.date),
      session: collection.session,
      animalType: collection.animalType,
      totalMilk: collection.totalMilk,
      notes: collection.notes || '',
    });
  };

  const handleAddOpen = (open: boolean) => {
    setIsAddOpen(open);
    if (open) {
      form.reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        session: 'morning',
        animalType: 'cow',
        totalMilk: 0,
        notes: '',
      });
    }
  };

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
            <h1 className="text-2xl font-bold text-foreground">{t('milk_collection_title')}</h1>
            <p className="text-muted-foreground text-sm">{t('collection_history')}</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={handleAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('add_collection')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('add_collection')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('collection_date')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="session"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('session')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="morning">{t('morning')}</SelectItem>
                              <SelectItem value="evening">{t('evening')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="animalType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('animal_type')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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
                  </div>

                  <FormField
                    control={form.control}
                    name="totalMilk"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('quantity')} (Liters)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
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
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('notes')} ({t('optional')})</FormLabel>
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

        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">{t('daily_summary')}</TabsTrigger>
            <TabsTrigger value="history">{t('collection_history')}</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="max-w-xs"
              />
            </div>

            {dailySummary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Morning Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">{t('morning')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      {(dailySummary.cowMorning + dailySummary.buffaloMorning).toFixed(1)} L
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{t('cows')}: {dailySummary.cowMorning.toFixed(1)}L</span>
                      <span>{t('buffalos')}: {dailySummary.buffaloMorning.toFixed(1)}L</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Evening Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">{t('evening')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      {(dailySummary.cowEvening + dailySummary.buffaloEvening).toFixed(1)} L
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{t('cows')}: {dailySummary.cowEvening.toFixed(1)}L</span>
                      <span>{t('buffalos')}: {dailySummary.buffaloEvening.toFixed(1)}L</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Summary */}
                <Card className="bg-primary/10 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">{t('total_liters')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">
                      {dailySummary.grandTotal.toFixed(1)} L
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{t('cows')}: {dailySummary.cowTotal.toFixed(1)}L</span>
                      <span>{t('buffalos')}: {dailySummary.buffaloTotal.toFixed(1)}L</span>
                    </div>
                    <p className="text-sm font-semibold text-primary mt-1">
                      ₹{dailySummary.grandAmount.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onDateChange={handleDateChange}
              />
              
              <Select value={sessionFilter} onValueChange={setSessionFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={t('session')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="morning">{t('morning')}</SelectItem>
                  <SelectItem value="evening">{t('evening')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder={t('animal_type')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="cow">{t('cow')}</SelectItem>
                  <SelectItem value="buffalo">{t('buffalo')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Collection Table */}
            {allCollections.length === 0 ? (
              <EmptyState
                icon={Milk}
                title={t('no_data')}
                description="No milk collection records found."
                actionLabel={t('add_collection')}
                onAction={() => setIsAddOpen(true)}
              />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('collection_date')}</TableHead>
                          <TableHead>{t('session')}</TableHead>
                          <TableHead>{t('animal_type')}</TableHead>
                          <TableHead className="text-right">{t('quantity')}</TableHead>
                          <TableHead className="text-right">{t('rate')}</TableHead>
                          <TableHead className="text-right">{t('amount')}</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allCollections.map((collection) => (
                          <TableRow key={collection._id}>
                            <TableCell>{formatDate(collection.date)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {collection.session === 'morning' ? t('morning') : t('evening')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {collection.animalType === 'cow' ? t('cow') : t('buffalo')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{collection.totalMilk.toFixed(1)} L</TableCell>
                            <TableCell className="text-right">₹{collection.rateApplied.toFixed(2)}/L</TableCell>
                            <TableCell className="text-right">₹{collection.totalAmount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(collection)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteId(collection._id)}
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
                  
                  {/* Infinite scroll loader - only show when no filters */}
                  {!hasFilters && (
                    <div ref={loadMoreRef} className="py-4 flex justify-center">
                      {isFetchingNextPage ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading more...</span>
                        </div>
                      ) : hasNextPage ? (
                        <span className="text-sm text-muted-foreground">Scroll for more</span>
                      ) : allCollections.length > 10 ? (
                        <span className="text-sm text-muted-foreground">All records loaded</span>
                      ) : null}
                    </div>
                  )}
                  
                  {/* Show total count when filters are applied */}
                  {hasFilters && allCollections.length > 0 && (
                    <div className="py-3 px-4 text-sm text-muted-foreground border-t">
                      Showing {allCollections.length} record(s)
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editCollection} onOpenChange={(open) => !open && setEditCollection(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('edit')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('collection_date')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="session"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('session')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="morning">{t('morning')}</SelectItem>
                            <SelectItem value="evening">{t('evening')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="animalType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animal_type')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                </div>

                <FormField
                  control={form.control}
                  name="totalMilk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('quantity')} (Liters)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('notes')} ({t('optional')})</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditCollection(null)}>
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
          description="Are you sure you want to delete this collection record?"
          onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
          variant="destructive"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AppLayout>
  );
};

export default MilkCollection;
