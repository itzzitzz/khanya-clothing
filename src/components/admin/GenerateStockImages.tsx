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
            Generate 2 professional product images for stock items with no or few images.
            This will create images based on the item's name, description, and age range.
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
          Generates 2 images per item. Make sure you have sufficient AI credits in your Lovable workspace.
        </p>
      </div>
    </Card>
  );
};
