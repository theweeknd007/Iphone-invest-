import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="fade-up flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <Icon className="size-6" strokeWidth={1.6} />
      </div>
      <p className="font-display text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="max-w-xs text-base text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  );
};
