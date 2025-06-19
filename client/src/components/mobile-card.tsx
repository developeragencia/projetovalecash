import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  title?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function MobileCard({
  children,
  className,
  icon,
  title,
  onClick,
  variant = 'default',
  size = 'md',
}: MobileCardProps) {
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const variantClasses = {
    default: 'bg-white border shadow-sm hover:shadow-md text-sm',
    outline: 'bg-transparent border border-border hover:border-primary/40 text-sm',
    ghost: 'bg-transparent border-none shadow-none hover:bg-accent text-sm',
  };

  return (
    <Card 
      className={cn(
        'transition-all duration-200 ease-in-out rounded-lg', 
        variantClasses[variant],
        onClick && 'cursor-pointer active:scale-95',
        className
      )}
      onClick={onClick}
    >
      <CardContent className={cn('flex flex-col', sizeClasses[size])}>
        {(icon || title) && (
          <CardHeader className="p-0 pb-2 flex flex-row items-center gap-2">
            {icon && <div className="text-primary">{icon}</div>}
            {title && <CardTitle className="text-sm font-medium">{title}</CardTitle>}
          </CardHeader>
        )}
        <div>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export function MobileCardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-2 w-full', className)}>
      {children}
    </div>
  );
}

export function MobileCardList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 w-full px-1', className)}>
      {children}
    </div>
  );
}