import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, MousePointer, Users, Target, TrendingUp } from 'lucide-react';
import apiClient from '@/api/client';

export default function ElementClickRanking({ storeId, pageUrl, dateRange, limit = 20 }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (storeId && pageUrl) {
      loadRankings();
    }
  }, [storeId, pageUrl, dateRange, limit]);

  const loadRankings = async () => {
    if (!storeId || !pageUrl) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page_url: pageUrl,
        limit: limit.toString()
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

      const response = await apiClient.get(`heatmap/element-rankings/${storeId}?${params}`);
      setRankings(response.data || []);
    } catch (err) {
      console.error('Error loading element rankings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-orange-600 text-white';
    return 'bg-gray-200 text-gray-700';
  };

  if (!pageUrl) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Enter a page URL to see element click rankings</p>
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
            <Target className="w-5 h-5" />
            Most Clicked Elements
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRankings}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-4 text-red-600">
            <p>Error loading rankings: {error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading element rankings...</p>
          </div>
        )}

        {!loading && !error && rankings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No click data available for this page</p>
            <p className="text-sm mt-2">Start collecting data to see element rankings</p>
          </div>
        )}

        {!loading && !error && rankings.length > 0 && (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <MousePointer className="w-4 h-4" />
                  <span className="text-xs font-medium">Total Clicks</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {rankings.reduce((sum, r) => sum + parseInt(r.click_count), 0).toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">Unique Users</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {Math.max(...rankings.map(r => parseInt(r.unique_users))).toLocaleString()}
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">Top Element</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {rankings[0]?.click_count || 0} clicks
                </div>
              </div>
            </div>

            {/* Rankings table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Element</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Text</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Clicks</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Users</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Avg Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rankings.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <Badge className={`${getRankBadgeColor(index + 1)} font-semibold`}>
                          {index + 1}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-1">
                          <div className="font-mono text-xs text-gray-900">
                            {truncateText(item.element_selector, 40)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {item.element_tag}
                            </Badge>
                            {item.element_id && (
                              <Badge variant="secondary" className="text-xs">
                                #{item.element_id}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-gray-600">
                          {truncateText(item.element_text, 30)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <MousePointer className="w-3 h-3 text-gray-400" />
                          <span className="font-semibold text-gray-900">
                            {parseInt(item.click_count).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-700">
                            {parseInt(item.unique_users).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="text-gray-600 text-xs font-mono">
                          ({Math.round(item.avg_x || 0)}, {Math.round(item.avg_y || 0)})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Click engagement percentage */}
            {rankings.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-semibold text-green-900 mb-2">Click Engagement Insights:</p>
                  <ul className="space-y-1 text-green-700">
                    <li>
                      • Top element received {rankings[0].click_count} clicks from {rankings[0].unique_users} unique users
                    </li>
                    {rankings.length >= 3 && (
                      <li>
                        • Top 3 elements account for{' '}
                        {Math.round(
                          (rankings.slice(0, 3).reduce((sum, r) => sum + parseInt(r.click_count), 0) /
                            rankings.reduce((sum, r) => sum + parseInt(r.click_count), 0)) *
                            100
                        )}% of all clicks
                      </li>
                    )}
                    {parseInt(rankings[0].click_count) > parseInt(rankings[0].unique_users) * 2 && (
                      <li>
                        • Top element has high repeat clicks - users may be having difficulty
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
