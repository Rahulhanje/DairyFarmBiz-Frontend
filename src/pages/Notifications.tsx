import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { notificationsApi, CreateNotificationData } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Bell, Send, XCircle, CheckCircle, Clock, Loader2, Mail } from 'lucide-react';

const notificationSchema = z.object({
  type: z.enum(['pregnancy_check', 'vaccination', 'breeding_reminder', 'general']),
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  channel: z.enum(['email', 'sms', 'push', 'in_app']).optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

const typeLabels: Record<string, string> = {
  pregnancy_check: 'type_pregnancy_check',
  vaccination: 'type_vaccination',
  breeding_reminder: 'type_breeding_reminder',
  general: 'type_general',
};

const statusConfig = {
  pending: { label: 'status_pending', color: 'bg-amber-500', icon: Clock },
  sent: { label: 'status_sent', color: 'bg-emerald-500', icon: CheckCircle },
  cancelled: { label: 'status_cancelled', color: 'bg-muted', icon: XCircle },
};

const Notifications: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const params = {
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.getAll(params as Record<string, string>),
  });

  const { data: stats } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: () => notificationsApi.getStatistics(),
  });

  const { data: emailStatus } = useQuery({
    queryKey: ['email-status'],
    queryFn: () => notificationsApi.getEmailStatus(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateNotificationData) => notificationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      toast({ title: t('success'), description: 'Notification created successfully' });
      setIsAddOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      toast({ title: t('success'), description: 'Notification cancelled' });
      setCancelId(null);
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.send(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      if (data.sent) {
        toast({ title: t('success'), description: 'Notification sent successfully' });
      } else {
        toast({ title: t('failed'), description: data.error || 'Failed to send notification', variant: 'destructive' });
      }
    },
    onError: () => {
      toast({ title: t('failed'), description: t('error_occurred'), variant: 'destructive' });
    },
  });

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      type: 'general',
      subject: '',
      message: '',
      scheduledDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      channel: 'email',
    },
  });

  const onSubmit = (data: NotificationFormData) => {
    const apiData: CreateNotificationData = {
      type: data.type,
      message: data.message,
      scheduledDate: data.scheduledDate,
      subject: data.subject || undefined,
      channel: data.channel || 'email',
    };
    createMutation.mutate(apiData);
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
            <h1 className="text-2xl font-bold text-foreground">{t('notifications_title')}</h1>
            <p className="text-muted-foreground text-sm">
              {stats?.byStatus?.pending || 0} pending, {stats?.byStatus?.sent || 0} sent
            </p>
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('create_notification')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('create_notification')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('notification_type')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pregnancy_check">{t('type_pregnancy_check')}</SelectItem>
                            <SelectItem value="vaccination">{t('type_vaccination')}</SelectItem>
                            <SelectItem value="breeding_reminder">Breeding Reminder</SelectItem>
                            <SelectItem value="general">{t('type_general')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional subject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('message')}</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('scheduled_date')}</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats?.byStatus?.pending || 0}</p>
              <p className="text-sm text-muted-foreground">{t('status_pending')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats?.byStatus?.sent || 0}</p>
              <p className="text-sm text-muted-foreground">{t('status_sent')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Mail className={`h-5 w-5 ${emailStatus?.configured && emailStatus?.connected ? 'text-emerald-500' : 'text-destructive'}`} />
                <span className={`text-sm font-medium ${emailStatus?.configured && emailStatus?.connected ? 'text-emerald-600' : 'text-destructive'}`}>
                  {emailStatus?.configured && emailStatus?.connected ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{t('email_status')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('notification_type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="pregnancy_check">{t('type_pregnancy_check')}</SelectItem>
              <SelectItem value="vaccination">{t('type_vaccination')}</SelectItem>
              <SelectItem value="breeding_reminder">Breeding Reminder</SelectItem>
              <SelectItem value="general">{t('type_general')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t('notification_status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="pending">{t('status_pending')}</SelectItem>
              <SelectItem value="sent">{t('status_sent')}</SelectItem>
              <SelectItem value="cancelled">{t('status_cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notifications List */}
        {!data?.data || data.data.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={t('no_data')}
            description="No notifications found. Create your first notification to get started."
            actionLabel={t('create_notification')}
            onAction={() => setIsAddOpen(true)}
          />
        ) : (
          <div className="space-y-4">
            {data.data.map((notification) => {
              const StatusIcon = statusConfig[notification.status as keyof typeof statusConfig]?.icon || Clock;
              return (
                <Card key={notification._id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">
                            {t(typeLabels[notification.type] as any)}
                          </Badge>
                          <Badge 
                            variant="secondary"
                            className={`${statusConfig[notification.status as keyof typeof statusConfig]?.color} text-primary-foreground`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {t(statusConfig[notification.status as keyof typeof statusConfig]?.label as any)}
                          </Badge>
                        </div>
                        {notification.subject && (
                          <h3 className="font-medium text-foreground">{notification.subject}</h3>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('scheduled_date')}: {format(new Date(notification.scheduledDate), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      
                      {notification.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendMutation.mutate(notification._id)}
                            disabled={sendMutation.isPending}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            {t('send_now')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCancelId(notification._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {t('cancel_notification')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Cancel Confirmation */}
        <ConfirmDialog
          open={!!cancelId}
          onOpenChange={(open) => !open && setCancelId(null)}
          title={t('cancel_notification')}
          description="Are you sure you want to cancel this notification?"
          onConfirm={() => cancelId && cancelMutation.mutate(cancelId)}
          variant="destructive"
          isLoading={cancelMutation.isPending}
        />
      </div>
    </AppLayout>
  );
};

export default Notifications;
