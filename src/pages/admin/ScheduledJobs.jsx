import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  RefreshCw,
  PlayCircle,
  PauseCircle,
  Clock,
  Calendar,
  Timer,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSelection } from '@/contexts/StoreSelectionContext';
import apiClient from '@/api/client';

export default function ScheduledJobs() {
  const { selectedStore } = useStoreSelection();
  
  // Background job monitoring state
  const [jobManagerStatus, setJobManagerStatus] = useState({
    isRunning: false,
    initialized: false,
    processing: 0,
    maxConcurrent: 5,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [jobStats, setJobStats] = useState({
    total: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  });
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Background job monitoring functions
  const loadJobManagerStatus = async () => {
    try {
      const response = await apiClient.get('/background-jobs/status');
      if (response.data?.success) {
        setJobManagerStatus({
          isRunning: response.data.status?.is_running || false,
          initialized: response.data.status?.is_initialized || false,
          processing: response.data.status?.currently_processing || 0,
          maxConcurrent: response.data.status?.max_concurrent_jobs || 5
        });
        setJobStats({
          total: (response.data.queue?.pending || 0) + (response.data.queue?.running || 0),
          pending: response.data.queue?.pending || 0,
          running: response.data.queue?.running || 0,
          completed: response.data.statistics?.completed || 0,
          failed: response.data.statistics?.failed || 0
        });
      }
    } catch (error) {
      console.error('Failed to load job manager status:', error);
    }
  };

  const loadRecentJobs = async () => {
    try {
      setLoadingJobs(true);
      const storeId = selectedStore?.id;
      if (!storeId) return;

      const response = await apiClient.get(`/background-jobs/store/${storeId}?limit=20`);
      if (response.data?.success) {
        setRecentJobs(response.data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to load recent jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const cancelJob = async (jobId) => {
    try {
      const response = await apiClient.post(`/background-jobs/${jobId}/cancel`);
      if (response.data?.success) {
        toast.success('Job cancelled successfully');
        await loadRecentJobs();
        await loadJobManagerStatus();
      }
    } catch (error) {
      console.error('Failed to cancel job:', error);
      toast.error('Failed to cancel job');
    }
  };

  // Load background job data when store changes
  useEffect(() => {
    if (selectedStore?.id) {
      loadJobManagerStatus();
      loadRecentJobs();
    }
  }, [selectedStore?.id]);

  // Poll for job updates every 10 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (selectedStore?.id) {
        loadJobManagerStatus();
        loadRecentJobs();
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [selectedStore?.id]);

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Background Jobs</h1>
          <p className="text-gray-600 mt-2">
            Monitor scheduled jobs and background import processes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Background Job Manager
            </CardTitle>
            <CardDescription>
              Monitor scheduled jobs and background import processes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Manager Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        {jobManagerStatus.isRunning ? (
                          <>
                            <PlayCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">Running</span>
                          </>
                        ) : (
                          <>
                            <PauseCircle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium text-red-600">Stopped</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant={jobManagerStatus.initialized ? "default" : "secondary"}>
                      {jobManagerStatus.initialized ? "Initialized" : "Not Ready"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Processing</p>
                      <p className="text-2xl font-bold">
                        {jobManagerStatus.processing} / {jobManagerStatus.maxConcurrent}
                      </p>
                    </div>
                    <Timer className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Queue Status</p>
                      <p className="text-sm text-muted-foreground">
                        {jobStats.pending} pending • {jobStats.running} running
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600">{jobStats.completed} completed</p>
                      <p className="text-sm text-red-600">{jobStats.failed} failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Recent Jobs
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      loadJobManagerStatus();
                      loadRecentJobs();
                    }}
                    disabled={loadingJobs}
                  >
                    {loadingJobs ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingJobs ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading jobs...</span>
                  </div>
                ) : recentJobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No background jobs found</p>
                    <p className="text-sm">Jobs will appear here when imports are scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {job.status === 'running' && (
                              <PlayCircle className="h-4 w-4 text-blue-600 animate-pulse" />
                            )}
                            {job.status === 'pending' && (
                              <Clock className="h-4 w-4 text-yellow-600" />
                            )}
                            {job.status === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {job.status === 'failed' && (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            {job.status === 'cancelled' && (
                              <PauseCircle className="h-4 w-4 text-gray-600" />
                            )}
                            <Badge variant={
                              job.status === 'completed' ? 'default' :
                              job.status === 'running' ? 'default' :
                              job.status === 'failed' ? 'destructive' :
                              job.status === 'cancelled' ? 'secondary' :
                              'secondary'
                            }>
                              {job.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="font-medium">{job.type}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Priority: {job.priority}</span>
                              {job.progress > 0 && (
                                <span>Progress: {job.progress}%</span>
                              )}
                              <span>
                                {job.scheduled_at ? 
                                  `Scheduled: ${new Date(job.scheduled_at).toLocaleString()}` :
                                  `Created: ${new Date(job.created_at).toLocaleString()}`
                                }
                              </span>
                            </div>
                            {job.progress_message && (
                              <p className="text-sm text-muted-foreground mt-1">{job.progress_message}</p>
                            )}
                            {job.last_error && job.status === 'failed' && (
                              <p className="text-sm text-red-600 mt-1">Error: {job.last_error}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {job.progress > 0 && job.status === 'running' && (
                            <div className="w-32">
                              <Progress value={job.progress} className="h-2" />
                            </div>
                          )}
                          {(job.status === 'pending' || job.status === 'running') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelJob(job.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Polling Status */}
            <div className="text-sm text-muted-foreground text-center">
              <Clock className="h-4 w-4 inline mr-1" />
              Job status updates automatically every 10 seconds
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}