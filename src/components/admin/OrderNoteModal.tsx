import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface OrderNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber: string;
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (note: string) => Promise<void>;
  isLoading?: boolean;
}

const MAX_NOTE_LENGTH = 140;

export const OrderNoteModal = ({
  open,
  onOpenChange,
  orderNumber,
  title,
  description,
  submitLabel,
  onSubmit,
  isLoading = false,
}: OrderNoteModalProps) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(note);
      setNote('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit('');
      setNote('');
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const charactersRemaining = MAX_NOTE_LENGTH - note.length;
  const isOverLimit = charactersRemaining < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            <br />
            <span className="font-semibold">Order: {orderNumber}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="order-note">Note (optional)</Label>
          <Textarea
            id="order-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Tracking: ABC123 or Waybill: WB456..."
            className="mt-2"
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            disabled={isSubmitting || isLoading}
          />
          <p className={`text-xs mt-1 ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
            {charactersRemaining} characters remaining (max {MAX_NOTE_LENGTH} for SMS compatibility)
          </p>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting && !note ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Skip'
            )}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || isOverLimit || !note.trim()}
          >
            {isSubmitting && note ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderNoteModal;
