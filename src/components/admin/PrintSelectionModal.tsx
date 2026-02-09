import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Package, Files } from 'lucide-react';

interface PrintSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (option: 'packing-lists' | 'invoice' | 'both') => void;
  orderNumber: string;
}

export const PrintSelectionModal = ({
  open,
  onOpenChange,
  onSelect,
}: PrintSelectionModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Print Options</DialogTitle>
          <DialogDescription>
            Choose what to print for this order
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            onClick={() => onSelect('packing-lists')}
          >
            <Package className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Packing Lists Only</div>
              <div className="text-xs text-muted-foreground">
                Print on A5 paper - one page per bale
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            onClick={() => onSelect('invoice')}
          >
            <FileText className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Invoice Only</div>
              <div className="text-xs text-muted-foreground">
                Print on A4 paper
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-4"
            onClick={() => onSelect('both')}
          >
            <Files className="h-5 w-5 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Both</div>
              <div className="text-xs text-muted-foreground">
                Print packing lists (A5) and invoice (A4) separately
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
