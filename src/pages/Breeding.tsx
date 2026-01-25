import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { breedingApi, animalsApi, CreateBreedingData, BreedingRecord } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { formatDateDisplay } from '@/lib/utils';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Baby, Clock, CheckCircle, XCircle, Loader2, Calendar, Edit } from 'lucide-react';

// Schema matching backend CreateInseminationData
const breedingSchema = z.object({
  animalId: z.string().min(1, 'Animal is required'),
  inseminationDate: z.string().min(1, 'Insemination date is required'),
  doctorName: z.string().optional(),
  semenType: z.string().optional(),
  breed: z.string().optional(),
  notes: z.string().optional(),
});

type BreedingFormData = z.infer<typeof breedingSchema>;

// Status configuration matching backend PregnancyStatus enum
const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  check_pending: { label: 'status_pending', color: 'bg-amber-500', icon: Clock },
  pregnant_confirmed: { label: 'status_confirmed', color: 'bg-primary', icon: CheckCircle },
  failed: { label: 'status_failed', color: 'bg-destructive', icon: XCircle },
  delivered: { label: 'status_delivered', color: 'bg-emerald-500', icon: Baby },
};

// Helper to safely format dates
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return formatDateDisplay(date);
  } catch {
    return '-';
  }
};

const Breeding: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BreedingRecord | null>(null);
  const [updateRecord, setUpdateRecord] = useState<BreedingRecord | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['breeding', { status: statusFilter !== 'all' ? statusFilter : undefined }],
    queryFn: () => breedingApi.getAll(statusFilter !== 'all' ? { status: statusFilter } : {}),
  });

  const { data: pendingChecks } = useQuery({
    queryKey: ['breeding-pending-checks'],
    queryFn: () => breedingApi.getPendingChecks(),
  });

  const { data: animals } = useQuery({
    queryKey: ['animals-for-breeding'],
    queryFn: () => animalsApi.getAll({ gender: 'female', isActive: 'true', isSold: 'false' }),
  });

  const form = useForm<BreedingFormData>({
    resolver: zodResolver(breedingSchema),
    defaultValues: {
      animalId: '',
      inseminationDate: format(new Date(), 'yyyy-MM-dd'),
      doctorName: '',
      semenType: '',
      breed: '',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBreedingData) => breedingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding'] });
      queryClient.invalidateQueries({ queryKey: ['breeding-pending-checks'] });
      toast({ title: t('success'), description: 'Insemination record added successfully' });
      setIsAddOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBreedingData> }) => 
      breedingApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding'] });
      queryClient.invalidateQueries({ queryKey: ['breeding-pending-checks'] });
      toast({ title: t('success'), description: 'Insemination record updated successfully' });
      setIsEditOpen(false);
      setEditingRecord(null);
      form.reset();
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, deliveryDate, notes }: { id: string; status: string; deliveryDate?: string; notes?: string }) =>
      breedingApi.updateStatus(id, status, deliveryDate, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breeding'] });
      queryClient.invalidateQueries({ queryKey: ['breeding-pending-checks'] });
      toast({ title: t('success'), description: 'Status updated successfully' });
      setUpdateRecord(null);
      setNewStatus('');
      setStatusNotes('');
      setDeliveryDate('');
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const onSubmit = (formData: BreedingFormData) => {
    const apiData: CreateBreedingData = {
      animalId: formData.animalId,
      inseminationDate: formData.inseminationDate,
      doctorName: formData.doctorName || undefined,
      semenType: formData.semenType || undefined,
      breed: formData.breed || undefined,
      notes: formData.notes || undefined,
    };
    
    if (editingRecord) {
      // Update existing record
      updateMutation.mutate({ id: editingRecord._id, data: apiData });
    } else {
      // Create new record
      createMutation.mutate(apiData);
    }
  };

  const handleUpdateStatus = () => {
    if (updateRecord && newStatus) {
      // Validate delivery date is required when status is delivered
      if (newStatus === 'delivered' && !deliveryDate) {
        toast({ 
          title: t('failed'), 
          description: 'Delivery date is required when status is delivered', 
          variant: 'destructive' 
        });
        return;
      }

      updateStatusMutation.mutate({
        id: updateRecord._id,
        status: newStatus,
        deliveryDate: newStatus === 'delivered' ? deliveryDate : undefined,
        notes: statusNotes || undefined,
      });
    }
  };

  const handleAddOpen = (open: boolean) => {
    setIsAddOpen(open);
    if (open) {
      setEditingRecord(null);
      form.reset({
        animalId: '',
        inseminationDate: format(new Date(), 'yyyy-MM-dd'),
        doctorName: '',
        semenType: '',
        breed: '',
        notes: '',
      });
    }
  };

  const handleEditOpen = (record: BreedingRecord) => {
    setEditingRecord(record);
    form.reset({
      animalId: record.animal?._id || '',
      inseminationDate: record.inseminationDate ? format(new Date(record.inseminationDate), 'yyyy-MM-dd') : '',
      doctorName: record.doctorName || '',
      semenType: record.semenType || '',
      breed: record.breed || '',
      notes: record.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleEditClose = () => {
    setIsEditOpen(false);
    setEditingRecord(null);
    form.reset();
  };

  const getDaysSinceInsemination = (dateStr: string) => {
    try {
      const inseminationDate = new Date(dateStr);
      if (isNaN(inseminationDate.getTime())) return 0;
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - inseminationDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  // Use inseminations from backend response
  const records = data?.data || [];

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
            <h1 className="text-2xl font-bold text-foreground">{t('breeding_title')}</h1>
            <p className="text-muted-foreground text-sm">{t('breeding_records')}</p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={handleAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('add_insemination')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('add_insemination')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="animalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animal_name')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select animal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {animals?.data?.map((animal) => (
                              <SelectItem key={animal._id} value={animal._id}>
                                {animal.nickName} (#{animal.serialNumber})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inseminationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('insemination_date')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="doctorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('veterinarian')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Dr. Name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="semenType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semen Type</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Jersey, HF" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breed</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Target breed" />
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

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">{t('all')}</TabsTrigger>
            <TabsTrigger value="pending">{t('pending_checks')}</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {/* Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="check_pending">{t('status_pending')}</SelectItem>
                <SelectItem value="pregnant_confirmed">{t('status_confirmed')}</SelectItem>
                <SelectItem value="failed">{t('status_failed')}</SelectItem>
                <SelectItem value="delivered">{t('status_delivered')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Records */}
            {records.length === 0 ? (
              <EmptyState
                icon={Baby}
                title={t('no_data')}
                description="No breeding records found. Add your first insemination record."
                actionLabel={t('add_insemination')}
                onAction={() => setIsAddOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {records.map((record) => {
                  const config = statusConfig[record.pregnancyStatus] || statusConfig.check_pending;
                  const StatusIcon = config.icon;
                  return (
                    <Card key={record._id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {record.animal?.nickName || 'Unknown'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              #{record.animal?.serialNumber || '-'}
                            </p>
                          </div>
                          <Badge className={config.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {t(config.label as any)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('insemination_date')}</span>
                            <span>{formatDate(record.inseminationDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pregnancy Check</span>
                            <span>{formatDate(record.pregnancyCheckDate)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('days_since_insemination')}</span>
                            <span>{getDaysSinceInsemination(record.inseminationDate)} days</span>
                          </div>
                          {record.doctorName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('veterinarian')}</span>
                              <span>{record.doctorName}</span>
                            </div>
                          )}
                          {record.deliveryDate && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Delivery Date</span>
                              <span>{formatDate(record.deliveryDate)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEditOpen(record)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {t('edit')}
                          </Button>
                          {record.pregnancyStatus !== 'delivered' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setUpdateRecord(record);
                                setNewStatus('');
                                setStatusNotes('');
                                setDeliveryDate('');
                              }}
                            >
                              {t('update_status')}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {/* Pending Pregnancy Checks */}
            {!pendingChecks || pendingChecks.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No Pending Checks"
                description="No pregnancy checks are due at this time."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingChecks.map((record) => (
                  <Card key={record._id} className="border-amber-500/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {record.animal?.nickName || 'Unknown'}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            #{record.animal?.serialNumber || '-'}
                          </p>
                        </div>
                        <Badge className="bg-amber-500">
                          <Clock className="h-3 w-3 mr-1" />
                          Due
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('insemination_date')}</span>
                          <span>{formatDate(record.inseminationDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Check Due</span>
                          <span className="font-medium text-amber-600">
                            {formatDate(record.pregnancyCheckDate)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('days_since_insemination')}</span>
                          <span>{getDaysSinceInsemination(record.inseminationDate)} days</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => {
                          setUpdateRecord(record);
                          setNewStatus('');
                          setStatusNotes('');
                          setDeliveryDate('');
                        }}
                      >
                        Record Result
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Breeding Record Dialog */}
        <Dialog open={isEditOpen} onOpenChange={(open) => !open && handleEditClose()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Insemination Record</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="animalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('animal_name')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select animal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {animals?.data?.map((animal) => (
                            <SelectItem key={animal._id} value={animal._id}>
                              {animal.nickName} (#{animal.serialNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inseminationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('insemination_date')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="doctorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('veterinarian')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Dr. Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="semenType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semen Type</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Jersey, HF" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breed</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Target breed" />
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
                  <Button type="button" variant="outline" onClick={handleEditClose}>
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

        {/* Update Status Dialog */}
        <Dialog open={!!updateRecord} onOpenChange={(open) => !open && setUpdateRecord(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('update_status')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Animal</p>
                <p className="font-medium">
                  {updateRecord?.animal?.nickName} (#{updateRecord?.animal?.serialNumber})
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Status transitions based on current status */}
                    {updateRecord?.pregnancyStatus === 'check_pending' && (
                      <>
                        <SelectItem value="pregnant_confirmed">{t('status_confirmed')}</SelectItem>
                        <SelectItem value="failed">{t('status_failed')}</SelectItem>
                      </>
                    )}
                    {updateRecord?.pregnancyStatus === 'pregnant_confirmed' && (
                      <>
                        <SelectItem value="delivered">{t('status_delivered')}</SelectItem>
                        <SelectItem value="failed">{t('status_failed')}</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {updateRecord?.pregnancyStatus === 'check_pending' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    First confirm pregnancy, then mark as delivered later
                  </p>
                )}
              </div>

              {newStatus === 'delivered' && (
                <div>
                  <label className="text-sm font-medium">
                    Delivery Date <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="mt-1"
                    required
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Required. Format: YYYY-MM-DD (e.g., {format(new Date(), 'yyyy-MM-dd')})
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={2}
                  className="mt-1"
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setUpdateRecord(null)}>
                  {t('cancel')}
                </Button>
                <Button 
                  onClick={handleUpdateStatus} 
                  disabled={!newStatus || updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Breeding;
