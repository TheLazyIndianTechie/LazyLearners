"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ExportJob {
  id: string;
  type: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileUrl?: string;
  fileSize?: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface ExportManagerProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ExportManager({
  className,
  autoRefresh = true,
  refreshInterval = 5000
}: ExportManagerProps) {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/analytics/export/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch export jobs');
      }
      const data = await response.json();
      setJobs(data.jobs || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load export jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    if (autoRefresh) {
      const interval = setInterval(fetchJobs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const handleDownload = (job: ExportJob) => {
    if (job.fileUrl) {
      window.open(job.fileUrl, '_blank');
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const response = await fetch(`/api/analytics/export/jobs/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete export job');
      }

      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge variant="default">Processing</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading export jobs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Jobs ({jobs.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchJobs}
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No export jobs found</p>
            <p className="text-sm">Your export history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(job.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">
                        {job.type} Export
                      </span>
                      {getStatusBadge(job.status)}
                      <span className="text-sm text-muted-foreground uppercase">
                        {job.format}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                      {job.completedAt && (
                        <span className="ml-2">
                          • Completed {formatDistanceToNow(new Date(job.completedAt), { addSuffix: true })}
                        </span>
                      )}
                      {job.fileSize && (
                        <span className="ml-2">
                          • {formatFileSize(job.fileSize)}
                        </span>
                      )}
                    </div>
                    {job.status === 'processing' && (
                      <div className="mt-2">
                        <Progress value={job.progress} className="h-2" />
                        <span className="text-xs text-muted-foreground mt-1">
                          {Math.round(job.progress)}% complete
                        </span>
                      </div>
                    )}
                    {job.error && (
                      <div className="mt-2 text-sm text-red-600">
                        Error: {job.error}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {job.status === 'completed' && job.fileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(job)}
                      className="gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(job.id)}
                    className="gap-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}