import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const GenerateStockImages = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPeople, setShowPeople] = useState(true);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      toast({
        title: "Generating Images",
        description: "This may take several minutes. Please don't close this page.",
      });

      const { data, error } = await supabase.functions.invoke('generate-stock-item-images', {
        body: { showPeople }
      });

      if (error) throw error;

      const successCount = data.successCount || 0;
      const totalCount = data.results?.length || 0;
      const errorDetails = data.errorMessage ? `\n\nAPI Error: ${data.errorMessage}` : '';

      // Check for specific errors
      if (data.creditError && successCount === 0) {
        toast({
          title: "Insufficient Credits",
          description: `Not enough AI credits available. Please add credits to your Lovable workspace in Settings > Workspace > Usage. Each image costs approximately 0.5-1 credits.${errorDetails}`,
          variant: "destructive",
        });
      } else if (data.creditError && successCount > 0) {
        toast({
          title: "Partial Success",
          description: `Generated ${successCount} images before running out of credits. Add more credits in Settings > Workspace > Usage to generate more.${errorDetails}`,
        });
      } else if (data.rateLimitError) {
        toast({
          title: "Rate Limit Exceeded",
          description: `Generated ${successCount} images before hitting rate limit. Please wait a few minutes and try again.${errorDetails}`,
          variant: successCount > 0 ? "default" : "destructive",
        });
      } else if (successCount === 0 && totalCount > 0) {
        toast({
          title: "Image Generation Failed",
          description: `Failed to generate any images. Check the edge function logs for details.${errorDetails}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Generated ${successCount} images across ${data.totalItems} stock items.`,
        });
      }

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
            Generate 1 professional product image per item, prioritizing items with no images first. This will create images based on the item's name, description, and age range.
          </p>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="people-toggle" className="text-sm font-medium">
              {showPeople ? "Images with models wearing clothes" : "Images of clothes only"}
            </Label>
            <p className="text-xs text-muted-foreground">
              {showPeople 
                ? "Generate images of black people wearing the clothes" 
                : "Generate images of just the clothes, without any people"}
            </p>
          </div>
          <Switch
            id="people-toggle"
            checked={showPeople}
            onCheckedChange={setShowPeople}
            disabled={isGenerating}
          />
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
          Note: Prioritizes items with no images first, then those with fewest images. 
          Generates 1 image per item per run. Make sure you have sufficient AI credits in your Lovable workspace.
        </p>
      </div>
    </Card>
  );
};
