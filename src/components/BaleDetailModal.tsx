import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";

interface StockItemImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

interface StockItem {
  id: number;
  name: string;
  description: string;
  age_range: string;
  selling_price: number;
  images: StockItemImage[];
}

interface BaleItem {
  id: number;
  quantity: number;
  line_item_price: number;
  stock_item: StockItem;
}

interface Bale {
  id: number;
  description: string;
  actual_selling_price: number;
  bale_items: BaleItem[];
}

interface BaleDetailModalProps {
  bale: Bale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (bale: Bale) => void;
}

export function BaleDetailModal({ bale, open, onOpenChange, onAddToCart }: BaleDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!bale) return null;

  // Collect all images from all stock items
  const allImages: StockItemImage[] = [];
  bale.bale_items.forEach(item => {
    allImages.push(...item.stock_item.images);
  });

  // Calculate totals
  const itemsTotal = bale.bale_items.reduce((sum, item) => {
    return sum + (item.stock_item.selling_price * item.quantity);
  }, 0);

  const discount = itemsTotal - bale.actual_selling_price;
  const hasDiscount = discount > 0;

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{bale.description}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] pr-4">
          {/* Image Gallery */}
          {allImages.length > 0 && (
            <div className="mb-6">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={allImages[currentImageIndex].image_url}
                  alt={`Bale item ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevious}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full"
                    >
                      ←
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2 rounded-full"
                    >
                      →
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                  {allImages.map((image, idx) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stock Items List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Items Included</h3>
            {bale.bale_items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.stock_item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.stock_item.description}</p>
                    {item.stock_item.age_range && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Age Range: {item.stock_item.age_range}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    <p className="text-sm text-muted-foreground">
                      Unit Price: R{item.stock_item.selling_price.toFixed(2)}
                    </p>
                    <p className="font-semibold">
                      R{(item.stock_item.selling_price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="mt-6 border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Individual Items Total:</span>
              <span>R{itemsTotal.toFixed(2)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="font-semibold">You Save:</span>
                <span className="font-semibold">R{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Bale Price:</span>
              <span>R{bale.actual_selling_price.toFixed(2)}</span>
            </div>
          </div>

          {/* Add to Cart Button */}
          <div className="mt-6">
            <Button
              onClick={() => {
                onAddToCart(bale);
                onOpenChange(false);
              }}
              className="w-full"
              size="lg"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Basket
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
