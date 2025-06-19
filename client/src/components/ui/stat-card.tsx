import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
  cardClassName?: string;
}

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
  cardClassName,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", cardClassName)}>
      <CardContent className="p-6">
        <div className={cn("flex items-center space-x-4", className)}>
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline">
              <h2 className="text-2xl font-bold">{value}</h2>
              {trend && (
                <span 
                  className={cn(
                    "ml-2 text-xs",
                    trend.positive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend.positive ? '↑' : '↓'} {trend.value}% 
                  <span className="ml-1 text-muted-foreground">{trend.label}</span>
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatCardGridProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

export function StatCardGrid({ 
  children, 
  columns = 4, 
  className 
}: StatCardGridProps) {
  return (
    <div 
      className={cn(
        "grid gap-4",
        {
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4": columns === 4,
          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3": columns === 3,
          "grid-cols-1 sm:grid-cols-2": columns === 2,
          "grid-cols-1": columns === 1,
        },
        className
      )}
    >
      {children}
    </div>
  );
}
