import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

interface ProductImage {
  id: number;
  image_path: string;
  image_alt_text: string;
  is_primary: boolean;
  display_order: number;
}

interface ProductImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: ProductImage[];
  productName: string;
  getImageUrl: (imagePath: string) => string;
}

export const ProductImageModal = ({
  open,
  onOpenChange,
  images,
  productName,
  getImageUrl,
}: ProductImageModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetZoom();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
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
      setCurrentIndex(0);
    }
    onOpenChange(newOpen);
  };

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden">
        <div className="relative w-full h-full bg-background">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-background/80 hover:bg-background"
            onClick={() => handleOpenChange(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Main image area */}
          <div
            className="relative w-full h-[calc(100%-120px)] flex items-center justify-center overflow-hidden bg-muted/30"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <img
              src={getImageUrl(currentImage.image_path)}
              alt={currentImage.image_alt_text || `${productName} - Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-transform select-none"
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              }}
              draggable={false}
            />

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/80 hover:bg-background"
                onClick={handleZoomOut}
                disabled={zoom <= 1}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/80 hover:bg-background"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            </div>

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-4 bg-background/80 px-3 py-1 rounded-full text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-0 w-full h-[120px] bg-background border-t">
              <div className="flex items-center justify-center h-full gap-2 px-4 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      resetZoom();
                    }}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      index === currentIndex
                        ? 'border-primary ring-2 ring-primary/50'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={getImageUrl(image.image_path)}
                      alt={image.image_alt_text || `Thumbnail ${index + 1}`}
                      className="w-full h-full object-contain bg-gray-50"
                    />
                    {image.is_primary && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] px-1 rounded-bl">
                        Primary
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
