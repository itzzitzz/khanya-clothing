import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";

const AdminImportImages = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('add-product-images');
      
      if (invokeError) throw invokeError;
      
      if (data?.success) {
        setResult(data);
      } else {
        throw new Error(data?.error || 'Failed to import images');
      }
    } catch (err) {
      console.error('Error importing images:', err);
      setError(err instanceof Error ? err.message : 'Failed to import images');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <main className="container mx-auto py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Import Product Images</h1>
          
          <div className="bg-card border rounded-lg p-6 mb-6">
            <p className="text-muted-foreground mb-4">
              This will add 4 additional images to each of your products in the database. 
              The images have been generated and are ready to be linked.
            </p>
            
            <Button 
              onClick={handleImport} 
              disabled={loading || result?.success}
              size="lg"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {result?.success ? 'Images Already Imported' : 'Import Images to Database'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result?.success && (
            <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Success!</AlertTitle>
              <AlertDescription className="text-green-600">
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          {result?.results && (
            <div className="bg-card border rounded-lg p-6">
              <h2 className="font-semibold mb-4">Import Results:</h2>
              <div className="space-y-3">
                {result.results.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      {item.status === 'success' && (
                        <p className="text-sm text-muted-foreground">
                          Added {item.imagesAdded} images
                        </p>
                      )}
                      {item.status === 'skipped' && (
                        <p className="text-sm text-amber-600">{item.reason}</p>
                      )}
                    </div>
                    {item.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result?.success && (
            <div className="mt-6 text-center">
              <Button variant="outline" asChild>
                <a href="/view-order-bales">View Products with New Images</a>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminImportImages;
