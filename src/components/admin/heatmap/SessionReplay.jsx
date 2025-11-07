import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Clock,
  MousePointer,
  Eye,
  ArrowRight,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import apiClient from '@/api/client';

export default function SessionReplay({ storeId, session, onClose }) {
  const [sessionDetails, setSessionDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentInteractionIndex, setCurrentInteractionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    if (storeId && session) {
      loadSessionDetails();
    }
  }, [storeId, session]);

  useEffect(() => {
    if (isPlaying && sessionDetails) {
      const interval = setInterval(() => {
        setCurrentInteractionIndex((prev) => {
          if (prev >= sessionDetails.interactions.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);

      return () => clearInterval(interval);
    }
  }, [isPlaying, playbackSpeed, sessionDetails]);

  const loadSessionDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`heatmap/sessions/${storeId}/${session.session_id}`);
      setSessionDetails(response.data);
    } catch (err) {
      console.error('Error loading session details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getInteractionIcon = (type) => {
    switch (type) {
      case 'click': return <MousePointer className="w-3 h-3" />;
      case 'hover': return <Eye className="w-3 h-3" />;
      case 'scroll': return <ArrowRight className="w-3 h-3 rotate-90" />;
      default: return <MousePointer className="w-3 h-3" />;
    }
  };

  const getInteractionColor = (type) => {
    switch (type) {
      case 'click': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'hover': return 'bg-green-100 text-green-700 border-green-300';
      case 'scroll': return 'bg-purple-100 text-purple-700 border-purple-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (!session) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getDeviceIcon(session.device_type)}
                <span>Session Replay</span>
              </div>
              <Badge variant="outline">
                {session.session_id.substring(0, 12)}...
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="text-gray-600">Loading session details...</div>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">
              <p>Error loading session: {error}</p>
            </div>
          )}

          {sessionDetails && (
            <div className="space-y-6">
              {/* Session summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-600 mb-1">Duration</div>
                  <div className="text-lg font-bold text-blue-900">
                    {formatDuration(Math.round(sessionDetails.summary.duration_ms / 1000))}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-600 mb-1">Pages Visited</div>
                  <div className="text-lg font-bold text-green-900">
                    {sessionDetails.summary.pages_visited}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-xs text-purple-600 mb-1">Total Interactions</div>
                  <div className="text-lg font-bold text-purple-900">
                    {sessionDetails.summary.total_interactions}
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-xs text-orange-600 mb-1">Device</div>
                  <div className="text-lg font-bold text-orange-900 capitalize">
                    {sessionDetails.summary.device_type || 'Desktop'}
                  </div>
                </div>
              </div>

              {/* Page flow */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Page Flow</h3>
                <div className="space-y-2">
                  {sessionDetails.pageFlow.map((page, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {page.page_title || 'Untitled Page'}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {page.page_url}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(page.time_on_page_seconds)}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {page.interactions.length} interactions
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Playback controls */}
              <div className="sticky bottom-0 bg-white border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentInteractionIndex(Math.max(0, currentInteractionIndex - 1))}
                      disabled={currentInteractionIndex === 0}
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>

                    <Button
                      variant={isPlaying ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentInteractionIndex(Math.min(sessionDetails.interactions.length - 1, currentInteractionIndex + 1))}
                      disabled={currentInteractionIndex >= sessionDetails.interactions.length - 1}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>

                    <div className="ml-4 flex items-center gap-2">
                      <span className="text-sm text-gray-600">Speed:</span>
                      {[0.5, 1, 2, 4].map(speed => (
                        <Button
                          key={speed}
                          variant={playbackSpeed === speed ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPlaybackSpeed(speed)}
                        >
                          {speed}x
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    {currentInteractionIndex + 1} / {sessionDetails.interactions.length}
                  </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{
                        width: `${((currentInteractionIndex + 1) / sessionDetails.interactions.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Current interaction details */}
              {sessionDetails.interactions[currentInteractionIndex] && (
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-blue-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded border ${getInteractionColor(sessionDetails.interactions[currentInteractionIndex].interaction_type)}`}>
                        {getInteractionIcon(sessionDetails.interactions[currentInteractionIndex].interaction_type)}
                      </div>
                      <div>
                        <div className="font-semibold capitalize">
                          {sessionDetails.interactions[currentInteractionIndex].interaction_type}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimestamp(sessionDetails.interactions[currentInteractionIndex].timestamp_utc)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 mb-1">Page</div>
                      <div className="font-mono text-xs truncate">
                        {sessionDetails.interactions[currentInteractionIndex].page_url}
                      </div>
                    </div>

                    {sessionDetails.interactions[currentInteractionIndex].element_selector && (
                      <div>
                        <div className="text-gray-600 mb-1">Element</div>
                        <div className="font-mono text-xs truncate">
                          {sessionDetails.interactions[currentInteractionIndex].element_selector}
                        </div>
                      </div>
                    )}

                    {sessionDetails.interactions[currentInteractionIndex].x_coordinate && (
                      <div>
                        <div className="text-gray-600 mb-1">Coordinates</div>
                        <div className="font-mono text-xs">
                          ({sessionDetails.interactions[currentInteractionIndex].x_coordinate}, {sessionDetails.interactions[currentInteractionIndex].y_coordinate})
                        </div>
                      </div>
                    )}

                    {sessionDetails.interactions[currentInteractionIndex].scroll_depth_percent != null && (
                      <div>
                        <div className="text-gray-600 mb-1">Scroll Depth</div>
                        <div className="font-mono text-xs">
                          {parseFloat(sessionDetails.interactions[currentInteractionIndex].scroll_depth_percent).toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interaction timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Interaction Timeline</h3>
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {sessionDetails.interactions.map((interaction, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        index === currentInteractionIndex
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setCurrentInteractionIndex(index)}
                    >
                      <div className={`p-1 rounded ${getInteractionColor(interaction.interaction_type)}`}>
                        {getInteractionIcon(interaction.interaction_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium capitalize">
                          {interaction.interaction_type}
                          {interaction.element_text && (
                            <span className="text-gray-600 ml-2 text-xs">
                              "{interaction.element_text.substring(0, 30)}"
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(interaction.timestamp_utc).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
