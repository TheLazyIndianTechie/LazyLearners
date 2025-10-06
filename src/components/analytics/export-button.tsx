"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useExport, ExportOptions, ExportType, ExportFormat } from '@/hooks/use-export';
import { cn } from '@/lib/utils';

interface ExportButtonProps {
  options: Omit<ExportOptions, 'format'>;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  disabled?: boolean;
}

const formatIcons = {
  [ExportFormat.CSV]: FileSpreadsheet,
  [ExportFormat.PDF]: FileText,
  [ExportFormat.JSON]: FileJson,
  [ExportFormat.XLSX]: FileSpreadsheet,
};

const formatLabels = {
  [ExportFormat.CSV]: 'CSV',
  [ExportFormat.PDF]: 'PDF',
  [ExportFormat.JSON]: 'JSON',
  [ExportFormat.XLSX]: 'Excel',
};

export function ExportButton({
  options,
  className,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  disabled = false,
}: ExportButtonProps) {
  const { startExport, currentJob, isExporting } = useExport();
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    try {
      await startExport({
        ...options,
        format,
        async: true,
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const isJobActive = currentJob && currentJob.id;
  const isCompleted = currentJob?.status === 'completed';
  const isFailed = currentJob?.status === 'failed';

  return (
    <div className={cn('relative', className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={disabled || isExporting}
            className={cn(
              'gap-2',
              isJobActive && 'relative'
            )}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isCompleted ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : isFailed ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {showLabel && (
              <>
                {isJobActive ? 'Exporting...' : 'Export'}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Export Format</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.values(ExportFormat).map((format) => {
            const Icon = formatIcons[format];
            return (
              <DropdownMenuItem
                key={format}
                onClick={() => handleExport(format)}
                disabled={isExporting}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {formatLabels[format]}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Progress indicator */}
      {isJobActive && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="relative">
            <div className="w-6 h-6 bg-background border rounded-full flex items-center justify-center">
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : isFailed ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              )}
            </div>
            {currentJob.status === 'processing' && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-background border rounded px-2 py-1 text-xs whitespace-nowrap">
                  {Math.round(currentJob.progress)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status badge */}
      {isJobActive && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <Badge
            variant={
              isCompleted ? 'default' :
              isFailed ? 'destructive' :
              'secondary'
            }
            className="text-xs"
          >
            {isCompleted ? 'Completed' :
             isFailed ? 'Failed' :
             'Processing...'}
          </Badge>
        </div>
      )}
    </div>
  );
}

// Specialized export buttons for different analytics types
export function RevenueExportButton({ className, ...props }: Omit<ExportButtonProps, 'options'>) {
  return (
    <ExportButton
      {...props}
      options={{
        type: ExportType.REVENUE,
      }}
      className={className}
    />
  );
}

export function VideoExportButton({ courseId, videoId, className, ...props }: Omit<ExportButtonProps, 'options'> & {
  courseId?: string;
  videoId?: string;
}) {
  return (
    <ExportButton
      {...props}
      options={{
        type: ExportType.VIDEO,
        resourceId: videoId || courseId,
      }}
      className={className}
    />
  );
}

export function PerformanceExportButton({ className, ...props }: Omit<ExportButtonProps, 'options'>) {
  return (
    <ExportButton
      {...props}
      options={{
        type: ExportType.PERFORMANCE,
      }}
      className={className}
    />
  );
}