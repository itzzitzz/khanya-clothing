import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
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
  quantity_in_stock: number;
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
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  const totalItems = bale.bale_items.reduce((sum, item) => sum + item.quantity, 0);
  const averagePricePerItem = totalItems > 0 ? bale.actual_selling_price / totalItems : 0;

  const discount = itemsTotal - bale.actual_selling_price;
  const hasDiscount = discount > 0;

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    resetZoom();
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    resetZoom();
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 1));
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetZoom();
      setCurrentImageIndex(0);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{bale.description}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] pr-4">
          {/* Image Gallery */}
          {allImages.length > 0 && (
            <div className="mb-6">
              <div 
                className="relative w-full max-w-xs aspect-[3/4] mx-auto bg-muted rounded-lg overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              >
                <img
                  src={allImages[currentImageIndex].image_url}
                  alt={`Bale item ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain transition-transform select-none"
                  style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  }}
                  draggable={false}
                />
                {allImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePrevious}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}
                {/* Zoom controls */}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-background/80 hover:bg-background"
                    onClick={handleZoomOut}
                    disabled={zoom <= 1}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-background/80 hover:bg-background"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-2 scrollbar-thin">
                  {allImages.map((image, idx) => (
                    <button
                      key={image.id}
                      onClick={() => {
                        setCurrentImageIndex(idx);
                        resetZoom();
                      }}
                      className={`flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden border-2 bg-gray-50 ${
                        idx === currentImageIndex ? 'border-primary ring-2 ring-primary/50' : 'border-transparent hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-contain"
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
              <div key={item.id} className="border rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm truncate">{item.stock_item.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 break-words">
                      {item.stock_item.description}
                    </p>
                    {item.stock_item.age_range && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Age: {item.stock_item.age_range}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 w-28 sm:w-32">
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    <p className="text-xs text-muted-foreground">
                      @R{item.stock_item.selling_price.toFixed(2)}
                    </p>
                    <p className="font-semibold text-sm">
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
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">Total Number of Items:</span>
              <span>{totalItems}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Price per Item:</span>
              <span>R{averagePricePerItem.toFixed(2)}</span>
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
              disabled={bale.quantity_in_stock === 0}
            >
              {bale.quantity_in_stock === 0 ? (
                "Out of Stock"
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Basket
                </>
              )}
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
