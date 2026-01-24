import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  trendValue?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
  className,
}) => {
  const variantStyles = {
    default: 'bg-card',
    primary: 'bg-primary/10 border-primary/20',
    success: 'bg-emerald-500/10 border-emerald-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    destructive: 'bg-destructive/10 border-destructive/20',
  };

  const iconStyles = {
    default: 'text-muted-foreground bg-muted',
    primary: 'text-primary bg-primary/20',
    success: 'text-emerald-600 bg-emerald-500/20',
    warning: 'text-amber-600 bg-amber-500/20',
    destructive: 'text-destructive bg-destructive/20',
  };

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend === 'up' ? 'text-emerald-600' : 'text-destructive'
              )}>
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trendValue}
              </div>
            )}
          </div>
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
