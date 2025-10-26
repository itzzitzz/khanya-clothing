import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export const GenerateStockImages = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      toast({
        title: "Generating Images",
        description: "This may take several minutes. Please don't close this page.",
      });

      const { data, error } = await supabase.functions.invoke('generate-stock-item-images');

      if (error) throw error;

      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const totalCount = data.results?.length || 0;

      toast({
        title: "Success",
        description: `Generated ${successCount} out of ${totalCount} images for ${data.totalItems} stock items.`,
      });

      setProgress(100);
    } catch (error: any) {
      console.error('Error generating images:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate images",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Generate AI Images</h3>
          <p className="text-sm text-muted-foreground">
            Generate 2 professional product images for each stock item using AI.
            This will create images based on the item's name, description, and age range.
          </p>
        </div>

        {isGenerating && progress > 0 && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Generating images... {progress}%
            </p>
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Images...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Generate All Stock Item Images
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Note: This will generate 2 images per stock item. The process may take several minutes.
          Make sure you have sufficient AI credits in your Lovable workspace.
        </p>
      </div>
    </Card>
  );
};
