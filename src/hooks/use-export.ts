"use client";

import { useState, useCallback } from 'react';
import { ExportType, ExportFormat } from '@prisma/client';

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  courseIds?: string[];
  courseId?: string;
  videoId?: string;
  includeArchived?: boolean;
  [key: string]: any;
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
}

export interface ExportOptions {
  type: ExportType;
  resourceId?: string;
  format: ExportFormat;
  filters?: ExportFilters;
  async?: boolean;
}

export function useExport() {
  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const startExport = useCallback(async (options: ExportOptions): Promise<string | null> => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: options.type.toLowerCase(),
          resourceId: options.resourceId,
          format: options.format.toLowerCase(),
          filters: options.filters,
          async: options.async ?? true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start export');
      }

      const result = await response.json();

      if (result.success) {
        if (options.async) {
          // Start polling for status
          const jobId = result.jobId;
          pollExportStatus(jobId);
          return jobId;
        } else {
          // Synchronous export - return download URL directly
          return result.downloadUrl;
        }
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const pollExportStatus = useCallback((jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/analytics/export?jobId=${jobId}`);
        const result = await response.json();

        if (result.success) {
          const job = result.job;
          setCurrentJob(job);

          if (job.status === 'completed' && job.downloadUrl) {
            // Export completed successfully
            window.open(job.downloadUrl, '_blank');
            setCurrentJob(null);
          } else if (job.status === 'failed') {
            // Export failed
            console.error('Export failed:', job.error);
            setCurrentJob(null);
          } else {
            // Continue polling
            setTimeout(poll, 1000);
          }
        } else {
          console.error('Failed to get export status:', result.error);
          setCurrentJob(null);
        }
      } catch (error) {
        console.error('Failed to poll export status:', error);
        setCurrentJob(null);
      }
    };

    poll();
  }, []);

  const cancelExport = useCallback(() => {
    setCurrentJob(null);
    setIsExporting(false);
  }, []);

  return {
    startExport,
    cancelExport,
    currentJob,
    isExporting,
  };
}