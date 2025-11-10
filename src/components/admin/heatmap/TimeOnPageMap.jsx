import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, TrendingUp } from 'lucide-react';
import apiClient from '@/api/client';

export default function TimeOnPageMap({ storeId, pageUrl, dateRange }) {
  const [timeData, setTimeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (storeId && pageUrl) {
      loadTimeData();
    }
  }, [storeId, pageUrl, dateRange]);

  const loadTimeData = async () => {
    if (!storeId || !pageUrl) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page_url: pageUrl
      });

      // Add date range
      if (dateRange && dateRange !== 'all') {
        const now = new Date();
        let startDate;

        switch (dateRange) {
          case '1d':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }

        if (startDate) {
          params.append('start_date', startDate.toISOString());
          params.append('end_date', now.toISOString());
        }
      }

      const response = await apiClient.get(`heatmap/time-on-page/${storeId}?${params}`);
      setTimeData(response.data || null);
    } catch (err) {
      console.error('Error loading time-on-page data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const getEngagementLevel = (avgTime) => {
    if (avgTime >= 180) return { label: 'Excellent', color: 'text-green-700', bg: 'bg-green-100' };
    if (avgTime >= 120) return { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-100' };
    if (avgTime >= 60) return { label: 'Fair', color: 'text-yellow-700', bg: 'bg-yellow-100' };
    return { label: 'Low', color: 'text-red-700', bg: 'bg-red-100' };
  };

  if (!pageUrl) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Enter a page URL to see time-on-page analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time on Page Analytics
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTimeData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-4 text-red-600">
            <p>Error loading time data: {error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading time analytics...</p>
          </div>
        )}

        {!loading && !error && !timeData && (
          <div className="text-center py-8 text-gray-500">
            <p>No time data available for this page</p>
          </div>
        )}

        {!loading && !error && timeData && (
          <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-1">Average Time</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatDuration(timeData.avg_time_seconds)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
                <div className={`mt-2 px-2 py-1 rounded text-xs font-medium inline-block ${getEngagementLevel(timeData.avg_time_seconds).bg} ${getEngagementLevel(timeData.avg_time_seconds).color}`}>
                  {getEngagementLevel(timeData.avg_time_seconds).label} Engagement
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-600 font-medium mb-1">Median Time</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatDuration(timeData.median_time_seconds)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  50% of users spent at least this long
                </p>
              </div>
            </div>

            {/* Time Distribution */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Time Distribution</h4>
              <div className="space-y-3">
                {timeData.time_buckets?.map((bucket, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">
                        {bucket.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{bucket.count} sessions</span>
                        <span className="text-blue-600 font-semibold">
                          {bucket.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="relative w-full h-6 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                        style={{ width: `${bucket.percentage}%` }}
                      >
                        {bucket.percentage > 10 && (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white">
                            {bucket.percentage.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Total Sessions</p>
                <p className="text-lg font-bold text-gray-900">{timeData.total_sessions}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Max Time</p>
                <p className="text-lg font-bold text-gray-900">{formatDuration(timeData.max_time_seconds)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Min Time</p>
                <p className="text-lg font-bold text-gray-900">{formatDuration(timeData.min_time_seconds)}</p>
              </div>
            </div>

            {/* Insights */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="font-semibold text-amber-900 text-sm mb-2">💡 Insights:</p>
              <ul className="space-y-1 text-sm text-amber-800">
                {timeData.avg_time_seconds < 30 && (
                  <li>• Very low time on page - users are leaving quickly. Consider improving content above the fold.</li>
                )}
                {timeData.avg_time_seconds >= 30 && timeData.avg_time_seconds < 60 && (
                  <li>• Users spend less than a minute - content may need to be more engaging.</li>
                )}
                {timeData.avg_time_seconds >= 60 && timeData.avg_time_seconds < 180 && (
                  <li>• Good engagement time - users are interested in your content.</li>
                )}
                {timeData.avg_time_seconds >= 180 && (
                  <li>• Excellent engagement! Users are highly interested and reading your content thoroughly.</li>
                )}
                {Math.abs(timeData.avg_time_seconds - timeData.median_time_seconds) > 60 && (
                  <li>• Large gap between average and median suggests some users stay much longer than others.</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
