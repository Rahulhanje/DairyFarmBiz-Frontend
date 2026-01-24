import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { animalsApi, Animal, CreateAnimalData, SellAnimalData } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  PawPrint, 
  Search, 
  MoreVertical,
  Edit,
  Trash,
  DollarSign,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

// Schema matching backend CreateAnimalData
const animalSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required'),
  nickName: z.string().min(1, 'Name is required'),
  animalType: z.enum(['cow', 'buffalo']),
  gender: z.enum(['male', 'female']),
  identificationTag: z.string().optional(),
  breed: z.string().optional(),
  dateOfBirth: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  purchasePlace: z.string().optional(),
  notes: z.string().optional(),
});

// Schema matching backend SellAnimalData
const sellSchema = z.object({
  soldDate: z.string().optional(),
  soldPrice: z.number().optional(),
  soldTo: z.string().optional(),
  soldNotes: z.string().optional(),
});

type AnimalFormData = z.infer<typeof animalSchema>;
type SellFormData = z.infer<typeof sellSchema>;

// Helper to safely format dates
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'MMM d, yyyy');
  } catch {
    return '-';
  }
};

const Animals: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [page, setPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null);
  const [sellAnimal, setSellAnimal] = useState<Animal | null>(null);
  const [deleteAnimal, setDeleteAnimal] = useState<Animal | null>(null);

  // Map UI status filter to backend params
  const getStatusParams = () => {
    if (statusFilter === 'active') return { isActive: 'true', isSold: 'false' };
    if (statusFilter === 'sold') return { isSold: 'true' };
    return {};
  };

  const { data, isLoading } = useQuery({
    queryKey: ['animals', { animalType: typeFilter, status: statusFilter, search, page }],
    queryFn: () => animalsApi.getAll({
      animalType: typeFilter !== 'all' ? typeFilter : undefined,
      search: search || undefined,
      ...getStatusParams(),
      page: String(page),
      limit: '12',
    }),
  });

  const form = useForm<AnimalFormData>({
    resolver: zodResolver(animalSchema),
    defaultValues: {
      serialNumber: '',
      nickName: '',
      animalType: 'cow',
      gender: 'female',
      identificationTag: '',
      breed: '',
      dateOfBirth: '',
      purchaseDate: '',
      purchasePrice: undefined,
      purchasePlace: '',
      notes: '',
    },
  });

  const sellForm = useForm<SellFormData>({
    resolver: zodResolver(sellSchema),
    defaultValues: {
      soldDate: format(new Date(), 'yyyy-MM-dd'),
      soldPrice: undefined,
      soldTo: '',
      soldNotes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAnimalData) => animalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      toast({ title: t('success'), description: 'Animal added successfully' });
      setIsAddOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAnimalData> }) => 
      animalsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      toast({ title: t('success'), description: 'Animal updated successfully' });
      setEditAnimal(null);
      form.reset();
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const sellMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SellAnimalData }) => 
      animalsApi.sell(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      toast({ title: t('success'), description: 'Animal marked as sold' });
      setSellAnimal(null);
      sellForm.reset();
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => animalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      toast({ title: t('success'), description: 'Animal deleted successfully' });
      setDeleteAnimal(null);
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const onSubmit = (formData: AnimalFormData) => {
    const apiData: CreateAnimalData = {
      serialNumber: formData.serialNumber,
      nickName: formData.nickName,
      animalType: formData.animalType,
      gender: formData.gender,
      identificationTag: formData.identificationTag || undefined,
      breed: formData.breed || undefined,
      dateOfBirth: formData.dateOfBirth || undefined,
      purchaseDate: formData.purchaseDate || undefined,
      purchasePrice: formData.purchasePrice,
      purchasePlace: formData.purchasePlace || undefined,
      notes: formData.notes || undefined,
    };

    if (editAnimal) {
      updateMutation.mutate({ id: editAnimal._id, data: apiData });
    } else {
      createMutation.mutate(apiData);
    }
  };

  const onSellSubmit = (formData: SellFormData) => {
    if (sellAnimal) {
      const apiData: SellAnimalData = {
        soldDate: formData.soldDate || undefined,
        soldPrice: formData.soldPrice,
        soldTo: formData.soldTo || undefined,
        soldNotes: formData.soldNotes || undefined,
      };
      sellMutation.mutate({ id: sellAnimal._id, data: apiData });
    }
  };

  const handleEdit = (animal: Animal) => {
    setEditAnimal(animal);
    form.reset({
      serialNumber: animal.serialNumber,
      nickName: animal.nickName,
      animalType: animal.animalType,
      gender: animal.gender,
      identificationTag: animal.identificationTag || '',
      breed: animal.breed || '',
      dateOfBirth: animal.dateOfBirth ? format(new Date(animal.dateOfBirth), 'yyyy-MM-dd') : '',
      purchaseDate: animal.purchaseDate ? format(new Date(animal.purchaseDate), 'yyyy-MM-dd') : '',
      purchasePrice: animal.purchasePrice,
      purchasePlace: animal.purchasePlace || '',
      notes: animal.notes || '',
    });
  };

  const handleAddOpen = (open: boolean) => {
    setIsAddOpen(open);
    if (open) {
      form.reset({
        serialNumber: '',
        nickName: '',
        animalType: 'cow',
        gender: 'female',
        identificationTag: '',
        breed: '',
        dateOfBirth: '',
        purchaseDate: '',
        purchasePrice: undefined,
        purchasePlace: '',
        notes: '',
      });
    }
  };

  // Filter animals locally by search
  const filteredAnimals = data?.data?.filter(animal => 
    animal.nickName.toLowerCase().includes(search.toLowerCase()) ||
    animal.serialNumber.toLowerCase().includes(search.toLowerCase())
  ) || [];

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
            <h1 className="text-2xl font-bold text-foreground">{t('animals_title')}</h1>
            <p className="text-muted-foreground text-sm">
              {data?.total || 0} {t('total_animals')}
            </p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={handleAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('add_animal')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('add_animal')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tag_number')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., A001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nickName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('animal_name')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Lakshmi" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
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

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('gender')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="female">{t('female')}</SelectItem>
                              <SelectItem value="male">{t('male')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breed</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Jersey, HF" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('date_of_birth')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('purchase_date')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('purchase_price')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
                        <FormLabel>{t('health_notes')}</FormLabel>
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="active">{t('active')}</SelectItem>
              <SelectItem value="sold">{t('sold')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Animals Grid */}
        {filteredAnimals.length === 0 ? (
          <EmptyState
            icon={PawPrint}
            title={t('no_data')}
            description="No animals found. Add your first animal to get started."
            actionLabel={t('add_animal')}
            onAction={() => setIsAddOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAnimals.map((animal) => (
              <Card key={animal._id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{animal.nickName}</CardTitle>
                      <p className="text-sm text-muted-foreground">#{animal.serialNumber}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(animal)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('edit')}
                        </DropdownMenuItem>
                        {animal.isActive && !animal.isSold && (
                          <DropdownMenuItem onClick={() => setSellAnimal(animal)}>
                            <DollarSign className="h-4 w-4 mr-2" />
                            {t('sell_animal')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => setDeleteAnimal(animal)}
                          className="text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary">
                      {animal.animalType === 'cow' ? t('cow') : t('buffalo')}
                    </Badge>
                    <Badge variant="secondary">
                      {animal.gender === 'male' ? t('male') : t('female')}
                    </Badge>
                    <Badge variant={animal.isSold ? 'outline' : 'default'}>
                      {animal.isSold ? t('sold') : t('active')}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {animal.breed && <p>Breed: {animal.breed}</p>}
                    <p>{t('date_of_birth')}: {formatDate(animal.dateOfBirth)}</p>
                    {animal.purchasePrice && (
                      <p>{t('purchase_price')}: ₹{animal.purchasePrice.toLocaleString()}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 12 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t('previous')}
            </Button>
            <span className="flex items-center px-3 text-sm text-muted-foreground">
              Page {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page * 12 >= data.total}
            >
              {t('next')}
            </Button>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editAnimal} onOpenChange={(open) => !open && setEditAnimal(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('edit')}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('tag_number')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nickName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('animal_name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>{t('health_notes')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setEditAnimal(null)}>
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

        {/* Sell Dialog */}
        <Dialog open={!!sellAnimal} onOpenChange={(open) => !open && setSellAnimal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('sell_animal')}</DialogTitle>
            </DialogHeader>
            <Form {...sellForm}>
              <form onSubmit={sellForm.handleSubmit(onSellSubmit)} className="space-y-4">
                <FormField
                  control={sellForm.control}
                  name="soldDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sale_date')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sellForm.control}
                  name="soldPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sale_price')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sellForm.control}
                  name="soldTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('buyer_name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={sellForm.control}
                  name="soldNotes"
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
                  <Button type="button" variant="outline" onClick={() => setSellAnimal(null)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={sellMutation.isPending}>
                    {sellMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t('confirm')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteAnimal}
          onOpenChange={(open) => !open && setDeleteAnimal(null)}
          title={t('delete')}
          description={t('confirm_delete_animal')}
          onConfirm={() => deleteAnimal && deleteMutation.mutate(deleteAnimal._id)}
          variant="destructive"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </AppLayout>
  );
};

export default Animals;
