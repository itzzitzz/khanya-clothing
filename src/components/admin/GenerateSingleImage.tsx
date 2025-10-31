import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface GenerateSingleImageProps {
  stockItemId: number;
  stockItemName: string;
  stockItemDescription: string;
  categoryName: string;
  ageRange: string;
  onImageGenerated: () => void;
}

export const GenerateSingleImage = ({
  stockItemId,
  stockItemName,
  stockItemDescription,
  categoryName,
  ageRange,
  onImageGenerated
}: GenerateSingleImageProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPeople, setShowPeople] = useState(true);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const { toast } = useToast();

  const buildPrompt = () => {
    const basePrompt = `Professional product photography of ${stockItemName}. ${stockItemDescription}. Category: ${categoryName}. Age range: ${ageRange || 'all ages'}.`;
    const stylePrompt = showPeople 
      ? 'Black model wearing the clothes, natural pose, clean white background, high quality, e-commerce style, well-lit, centered composition.'
      : 'Just the clothes without any people, flat lay or on mannequin, clean white background, high quality, e-commerce style, well-lit, centered composition.';
    return `${basePrompt} ${stylePrompt}`;
  };

  const handleOpenPromptModal = () => {
    const generatedPrompt = buildPrompt();
    setPrompt(generatedPrompt);
    setShowPromptModal(true);
  };

  const handleGenerate = async () => {
    setShowPromptModal(false);
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-single-stock-image', {
        body: { 
          stockItemId,
          prompt,
          showPeople 
        }
      });

      if (error) throw error;

      if (data.success) {
        setRemainingCredits(data.remainingCredits);
        toast({
          title: "Success",
          description: `Image generated successfully! ${data.remainingCredits !== null ? `Remaining credits: ${data.remainingCredits}` : ''}`,
        });
        onImageGenerated();
      } else if (data.creditError) {
        toast({
          title: "Insufficient Credits",
          description: `Not enough AI credits available. Please add credits to your Lovable workspace in Settings > Workspace > Usage.\n\nError: ${data.errorMessage || 'Unknown error'}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: data.errorMessage || "Failed to generate image",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
        <div>
          <h4 className="text-sm font-semibold mb-2">Generate AI Image</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Generate a professional product image using AI
          </p>
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="people-toggle" className="text-sm">
            {showPeople ? "With model wearing clothes" : "Clothes only"}
          </Label>
          <Switch
            id="people-toggle"
            checked={showPeople}
            onCheckedChange={setShowPeople}
            disabled={isGenerating}
          />
        </div>

        {remainingCredits !== null && (
          <div className="text-xs text-muted-foreground bg-background p-2 rounded border">
            Remaining credits: <span className="font-semibold">{remainingCredits}</span>
          </div>
        )}

        <Button
          type="button"
          onClick={handleOpenPromptModal}
          disabled={isGenerating}
          className="w-full"
          variant="outline"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Generate Image
            </>
          )}
        </Button>
      </div>

      <Dialog open={showPromptModal} onOpenChange={setShowPromptModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review AI Prompt</DialogTitle>
            <DialogDescription>
              Review and edit the prompt that will be sent to the AI to generate the image.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label>AI Prompt</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromptModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate}>
              Generate Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
