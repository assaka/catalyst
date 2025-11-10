import React from 'react';
import { useQuery } from '@tanstack/react-query';
import abTestService from '@/services/abTestService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  CheckCircle2,
  DollarSign,
  BarChart3,
  Loader2,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ABTestResults({ testId, storeId }) {
  const { data: resultsData, isLoading, error } = useQuery({
    queryKey: ['ab-test-results', testId],
    queryFn: () => abTestService.getTestResults(storeId, testId),
    refetchInterval: 30000, // Refresh every 30 seconds for running tests
  });

  const results = resultsData?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading test results: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!results) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No results available yet
        </AlertDescription>
      </Alert>
    );
  }

  const controlVariant = results.variants?.find(v => v.is_control);
  const hasWinner = results.has_significant_winner;

  // Helper to safely convert to number
  const toNumber = (value, defaultValue = 0) => {
    if (value === null || value === undefined) return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Ensure all variants have default values
  const safeVariants = (results.variants || []).map(v => ({
    variant_id: v.variant_id || 'unknown',
    variant_name: v.variant_name || 'Unknown',
    total_assignments: toNumber(v.total_assignments, 0),
    total_conversions: toNumber(v.total_conversions, 0),
    conversion_rate: toNumber(v.conversion_rate, 0),
    avg_conversion_value: toNumber(v.avg_conversion_value, 0),
    total_conversion_value: toNumber(v.total_conversion_value, 0),
    lift: toNumber(v.lift, 0),
    is_control: v.is_control || false,
    is_significant: v.is_significant || false,
    p_value: toNumber(v.p_value, null),
    z_score: toNumber(v.z_score, null),
    confidence_interval: v.confidence_interval ? {
      lower: toNumber(v.confidence_interval.lower, 0),
      upper: toNumber(v.confidence_interval.upper, 0),
    } : null,
  }));

  const getLiftIcon = (lift) => {
    if (lift > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (lift < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatPercentage = (value, decimals = 2) => {
    if (value === null || value === undefined) return '0.00%';
    return (value * 100).toFixed(decimals) + '%';
  };

  const getSignificanceBadge = (variant) => {
    if (variant.is_control) {
      return <Badge className="bg-gray-100 text-gray-800">Control</Badge>;
    }
    if (!variant.is_significant) {
      return <Badge variant="outline">Not Significant</Badge>;
    }
    if (variant.lift > 0) {
      return <Badge className="bg-green-100 text-green-800">Winner</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">Loser</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Winner Banner */}
      {hasWinner && (
        <Alert className="bg-green-50 border-green-200">
          <Trophy className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            We found a statistically significant winner! The test results show meaningful differences between variants.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold">
                  {safeVariants.reduce((sum, v) => sum + (v.total_assignments || 0), 0).toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Conversions</p>
                <p className="text-2xl font-bold">
                  {safeVariants.reduce((sum, v) => sum + (v.total_conversions || 0), 0).toLocaleString()}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ${safeVariants.reduce((sum, v) => sum + (v.total_conversion_value || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variant Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Variant Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Participants</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead className="text-right">Conversion Rate</TableHead>
                <TableHead className="text-right">Lift vs Control</TableHead>
                <TableHead className="text-right">Avg Value</TableHead>
                <TableHead>Significance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeVariants.map((variant) => (
                <TableRow key={variant.variant_id} className={variant.is_control ? 'bg-gray-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{variant.variant_name}</span>
                      {variant.is_control && <Badge variant="outline">Control</Badge>}
                      {variant.is_significant && variant.lift > 0 && !variant.is_control && (
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{variant.total_assignments.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{variant.total_conversions.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPercentage(variant.conversion_rate)}
                  </TableCell>
                  <TableCell className="text-right">
                    {variant.is_control ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        {getLiftIcon(variant.lift)}
                        <span className={variant.lift > 0 ? 'text-green-600 font-medium' : variant.lift < 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {variant.lift > 0 ? '+' : ''}{variant.lift.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    ${variant.avg_conversion_value?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    {getSignificanceBadge(variant)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statistical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Statistical Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {safeVariants.filter(v => !v.is_control).map((variant) => (
            <div key={variant.variant_id} className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{variant.variant_name} vs Control</h4>
                {variant.is_significant ? (
                  <Badge className="bg-green-100 text-green-800">Statistically Significant</Badge>
                ) : (
                  <Badge variant="outline">Not Significant</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">P-value</p>
                  <p className="font-medium">
                    {variant.p_value !== null && variant.p_value !== undefined
                      ? variant.p_value < 0.0001
                        ? '< 0.0001'
                        : variant.p_value.toFixed(4)
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Z-score</p>
                  <p className="font-medium">
                    {variant.z_score !== null && variant.z_score !== undefined
                      ? variant.z_score.toFixed(2)
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Confidence Interval</p>
                  <p className="font-medium">
                    {variant.confidence_interval
                      ? `[${(variant.confidence_interval.lower * 100).toFixed(2)}%, ${(variant.confidence_interval.upper * 100).toFixed(2)}%]`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sample Size</p>
                  <p className="font-medium">{variant.total_assignments.toLocaleString()}</p>
                </div>
              </div>

              {variant.total_assignments < results.min_sample_size && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Need {results.min_sample_size - variant.total_assignments} more participants to reach minimum sample size
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Visual Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {safeVariants.map((variant) => (
            <div key={variant.variant_id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{variant.variant_name}</span>
                  {variant.is_control && <Badge variant="outline" className="text-xs">Control</Badge>}
                  {variant.is_significant && variant.lift > 0 && !variant.is_control && (
                    <Badge className="bg-green-100 text-green-800 text-xs">Winner</Badge>
                  )}
                </div>
                <span className="text-sm font-medium">{formatPercentage(variant.conversion_rate)}</span>
              </div>
              <Progress
                value={variant.conversion_rate * 100}
                className="h-3"
              />
              <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                <span>{variant.total_conversions} / {variant.total_assignments} conversions</span>
                {!variant.is_control && (
                  <span className={variant.lift > 0 ? 'text-green-600' : variant.lift < 0 ? 'text-red-600' : ''}>
                    {variant.lift > 0 ? '+' : ''}{variant.lift.toFixed(2)}% lift
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {hasWinner && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <p>
              • The test has reached statistical significance with a clear winner
            </p>
            <p>
              • Consider completing the test and implementing the winning variant
            </p>
            <p>
              • Monitor performance after implementation to ensure results hold
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
