import React from 'react';
import { cn } from '@/lib/utils';
import { CardContent } from '../ui/card';

export interface BorderedCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  headerClassName?: string;
  contentClassName?: string;
}

export const BorderedCard: React.FC<BorderedCardProps> = ({
  title,
  description,
  icon,
  action,
  children,
  className,
  headerClassName,
  contentClassName,
  ...props
}) => {
  return (
    <div
      className={cn(
        "border border-border/80 rounded-xl bg-card overflow-hidden flex flex-col",
        className
      )}
      {...props}
    >
      <div className={cn("border-b border-border/80 p-6 flex flex-row justify-between items-center gap-4", headerClassName)}>
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {icon}
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <CardContent className={cn("space-y-4 px-6 pb-6 pt-4", contentClassName)}>
        {children}
      </CardContent>
    </div>
  );
};
