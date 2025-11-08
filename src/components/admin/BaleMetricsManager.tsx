import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RotateCcw, TrendingUp, ShoppingCart, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface BaleMetric {
  id: string;
  bale_id: number;
  view_count: number;
  add_to_cart_count: number;
  reset_date: string;
  bale: {
    bale_number: string;
    description: string;
    actual_selling_price: number;
    product_category: {
      name: string;
    };
  };
}

const BaleMetricsManager = () => {
  const [metrics, setMetrics] = useState<BaleMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bale_metrics')
        .select(`
          *,
          bale:bales!bale_id (
            bale_number,
            description,
            actual_selling_price,
            product_category:product_categories!product_category_id (
              name
            )
          )
        `)
        .order('view_count', { ascending: false });

      if (error) throw error;

      setMetrics(data || []);
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleResetMetrics = async () => {
    if (!confirm('Are you sure you want to reset all metrics? This will set all view counts and add-to-cart counts to 0.')) {
      return;
    }

    setResetting(true);
    try {
      const { error } = await supabase.functions.invoke('reset-bale-metrics');

      if (error) throw error;

      toast.success('Metrics reset successfully');
      await loadMetrics();
    } catch (error) {
      console.error('Error resetting metrics:', error);
      toast.error('Failed to reset metrics');
    } finally {
      setResetting(false);
    }
  };

  const calculateConversionRate = (addToCart: number, views: number) => {
    if (views === 0) return 0;
    return ((addToCart / views) * 100).toFixed(1);
  };

  const totalViews = metrics.reduce((sum, m) => sum + m.view_count, 0);
  const totalAddToCarts = metrics.reduce((sum, m) => sum + m.add_to_cart_count, 0);
  const overallConversionRate = totalViews > 0 ? ((totalAddToCarts / totalViews) * 100).toFixed(1) : '0';
  const resetDate = metrics.length > 0 ? metrics[0].reset_date : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bale Performance Metrics</h2>
          {resetDate && (
            <p className="text-sm text-muted-foreground mt-1">
              Last reset: {format(new Date(resetDate), 'PPP p')}
            </p>
          )}
        </div>
        <Button 
          onClick={handleResetMetrics} 
          disabled={resetting}
          variant="outline"
        >
          {resetting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Metrics
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Across {metrics.length} bales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Add to Carts</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAddToCarts}</div>
            <p className="text-xs text-muted-foreground">
              From all bales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallConversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Add-to-cart / Views
            </p>
          </CardContent>
        </Card>
      </div>

      {metrics.length === 0 ? (
        <Alert>
          <AlertDescription>
            No metrics data yet. Metrics will appear once customers start viewing and adding bales to cart.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Bale Performance Details</CardTitle>
            <CardDescription>
              View and add-to-cart metrics for each bale since the last reset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bale Number</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Add to Cart</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell className="font-medium">
                      {metric.bale.bale_number}
                    </TableCell>
                    <TableCell>
                      {metric.bale.product_category?.name || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {metric.bale.description}
                    </TableCell>
                    <TableCell className="text-right">
                      R{metric.bale.actual_selling_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {metric.view_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3" />
                        {metric.add_to_cart_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {calculateConversionRate(metric.add_to_cart_count, metric.view_count)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BaleMetricsManager;
