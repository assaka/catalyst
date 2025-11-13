import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SaveButton from '@/components/ui/save-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import FlashMessage from '@/components/storefront/FlashMessage';
import {
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Calendar,
  RefreshCw,
  Code,
  Zap,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const JobScheduler = () => {
  const [flashMessage, setFlashMessage] = useState(null);
  const [cronJobs, setCronJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cron_expression: '0 0 * * *', // Daily at midnight
    job_type: 'webhook',
    configuration: {},
    is_active: true,
    plugin_id: null
  });

  useEffect(() => {
    loadCronJobs();
  }, []);

  const loadCronJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const storeId = localStorage.getItem('selectedStoreId');

      const res = await fetch(`/api/cron-jobs?store_id=${storeId}&limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          // API returns data.cron_jobs nested structure
          setCronJobs(result.data?.cron_jobs || []);
        }
      }
    } catch (error) {
      console.error('Failed to load cron jobs:', error);
      setFlashMessage({ type: 'error', message: 'Failed to load cron jobs' });
    }
  };

  const saveCronJob = async () => {
    try {
      const token = localStorage.getItem('token');
      const storeId = localStorage.getItem('selectedStoreId');

      const url = editingJob
        ? `/api/cron-jobs/${editingJob.id}`
        : '/api/cron-jobs';

      const method = editingJob ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          store_id: storeId
        })
      });

      const data = await res.json();
      if (data.success) {
        setFlashMessage({ type: 'success', message: 'Cron job saved successfully!' });
        setShowCreateForm(false);
        setEditingJob(null);
        resetForm();
        loadCronJobs();
      } else {
        setFlashMessage({ type: 'error', message: data.message });
      }
    } catch (error) {
      setFlashMessage({ type: 'error', message: 'Failed to save cron job' });
    }
  };

  const toggleJobActive = async (jobId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cron-jobs/${jobId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (res.ok) {
        setFlashMessage({ type: 'success', message: 'Job status updated' });
        loadCronJobs();
      }
    } catch (error) {
      setFlashMessage({ type: 'error', message: 'Failed to toggle job' });
    }
  };

  const deleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this cron job?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/cron-jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setFlashMessage({ type: 'success', message: 'Cron job deleted' });
        loadCronJobs();
      }
    } catch (error) {
      setFlashMessage({ type: 'error', message: 'Failed to delete job' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      cron_expression: '0 0 * * *',
      job_type: 'webhook',
      configuration: {},
      is_active: true,
      plugin_id: null
    });
  };

  const cronPresets = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every 5 minutes', value: '*/5 * * * *' },
    { label: 'Every 15 minutes', value: '*/15 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Daily at midnight', value: '0 0 * * *' },
    { label: 'Daily at 9 AM', value: '0 9 * * *' },
    { label: 'Weekly (Sunday midnight)', value: '0 0 * * 0' },
    { label: 'Monthly (1st at midnight)', value: '0 0 1 * *' }
  ];

  return (
    <div className="p-6 space-y-6">
      <FlashMessage message={flashMessage} onClose={() => setFlashMessage(null)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Scheduler</h1>
          <p className="text-gray-600 mt-1">Schedule recurring tasks and cron jobs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="w-4 h-4 mr-2" />
            New Cron Job
          </Button>
          <Button variant="outline" onClick={loadCronJobs}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Code className="w-4 h-4" />
        <AlertDescription>
          <strong>For Plugin Developers:</strong> Plugins can register cron jobs via the API.
          Use <code className="bg-gray-100 px-1 rounded">POST /api/cron-jobs</code> with your plugin_id to create scheduled tasks.
        </AlertDescription>
      </Alert>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingJob ? 'Edit' : 'Create'} Cron Job</CardTitle>
            <CardDescription>Schedule a recurring task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Job Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Daily Inventory Sync"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="What does this job do?"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="cron_expression">Schedule (Cron Expression)</Label>
              <div className="flex gap-2">
                <Input
                  id="cron_expression"
                  value={formData.cron_expression}
                  onChange={(e) => setFormData({...formData, cron_expression: e.target.value})}
                  placeholder="* * * * *"
                  className="font-mono"
                />
                <select
                  onChange={(e) => setFormData({...formData, cron_expression: e.target.value})}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">Presets...</option>
                  {cronPresets.map(preset => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Format: minute hour day month weekday. Example: <code>0 0 * * *</code> = daily at midnight
              </p>
            </div>

            <div>
              <Label htmlFor="job_type">Job Type</Label>
              <select
                id="job_type"
                value={formData.job_type}
                onChange={(e) => setFormData({...formData, job_type: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="webhook">Webhook (HTTP Request)</option>
                <option value="api_call">API Call</option>
                <option value="database_query">Database Query</option>
                <option value="email">Send Email</option>
                <option value="cleanup">Cleanup Task</option>
              </select>
            </div>

            {formData.job_type === 'webhook' && (
              <div>
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://example.com/webhook"
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, url: e.target.value }
                  })}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label>Active (job will run on schedule)</Label>
            </div>

            <div className="flex gap-2">
              <SaveButton onClick={saveCronJob} label={editingJob ? 'Update Job' : 'Create Job'} />
              <Button variant="outline" onClick={() => {
                setShowCreateForm(false);
                setEditingJob(null);
                resetForm();
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cron Jobs List */}
      <div className="space-y-3">
        {cronJobs.map(job => (
          <Card key={job.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${job.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {job.name}
                      {job.plugin_id && <Badge variant="outline">Plugin</Badge>}
                    </h3>
                    <p className="text-sm text-gray-600">{job.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {job.cron_expression}
                      </span>
                      <span>Type: {job.job_type}</span>
                      <span>Runs: {job.run_count}</span>
                      <span>Success: {job.success_count}</span>
                      {job.next_run_at && (
                        <span>Next: {new Date(job.next_run_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleJobActive(job.id, job.is_active)}
                  >
                    {job.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingJob(job);
                      setFormData(job);
                      setShowCreateForm(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!job.is_core && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteJob(job.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {cronJobs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No scheduled jobs yet</p>
              <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Job
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Plugin API Documentation */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Plugin Developer API
          </CardTitle>
          <CardDescription>Allow plugins to register scheduled jobs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Create Cron Job from Plugin:</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-md text-xs overflow-x-auto">
{`POST /api/cron-jobs

{
  "name": "My Plugin Daily Task",
  "description": "Runs daily cleanup",
  "cron_expression": "0 2 * * *",
  "job_type": "api_call",
  "configuration": {
    "url": "/api/my-plugin/daily-task",
    "method": "POST"
  },
  "plugin_id": "your-plugin-uuid",
  "store_id": "store-uuid"
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Supported Job Types:</h4>
            <ul className="text-sm space-y-1 text-gray-700">
              <li><code className="bg-white px-2 py-1 rounded">webhook</code> - Call external HTTP endpoint</li>
              <li><code className="bg-white px-2 py-1 rounded">api_call</code> - Call internal API route</li>
              <li><code className="bg-white px-2 py-1 rounded">database_query</code> - Execute SQL query</li>
              <li><code className="bg-white px-2 py-1 rounded">email</code> - Send scheduled email</li>
              <li><code className="bg-white px-2 py-1 rounded">cleanup</code> - Cleanup/maintenance task</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Common Cron Expressions:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {cronPresets.map(preset => (
                <div key={preset.value} className="bg-white p-2 rounded">
                  <code className="text-purple-600">{preset.value}</code>
                  <span className="text-gray-600 ml-2">= {preset.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobScheduler;
