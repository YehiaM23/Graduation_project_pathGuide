import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  internshipReviewApi,
  type CreateInternshipReviewRequest,
  type UpdateInternshipReviewRequest,
  type InternshipReviewDto,
} from '@/lib/api';
import { Star, AlertCircle } from 'lucide-react';

interface InternshipReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: number;
  internshipTitle: string;
  companyName: string;
  existingReview?: InternshipReviewDto | null;
  onSuccess: () => void;
}

export function InternshipReviewForm({
  open,
  onOpenChange,
  applicationId,
  internshipTitle,
  companyName,
  existingReview,
  onSuccess,
}: InternshipReviewFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [overallRating, setOverallRating] = useState(existingReview?.overallRating || 0);
  const [reviewText, setReviewText] = useState(existingReview?.reviewText || '');

  const isEditing = !!existingReview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (overallRating === 0) {
      setError('Please provide a rating');
      return;
    }

    try {
      setLoading(true);

      if (isEditing && existingReview) {
        const updateData: UpdateInternshipReviewRequest = {
          overallRating,
          reviewText: reviewText || undefined,
        };
        await internshipReviewApi.update(existingReview.reviewId, updateData);
      } else {
        const createData: CreateInternshipReviewRequest = {
          applicationId,
          overallRating,
          reviewText: reviewText || undefined,
        };
        await internshipReviewApi.create(createData);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Error submitting review:', err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (val: number) => void;
    label: string;
  }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star === value ? 0 : star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-6 w-6 ${
                star <= value
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-[var(--muted-foreground)]">{value}/5</span>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogClose onClick={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Your Review' : 'Write a Review'}</DialogTitle>
          <DialogDescription>
            Share your experience at {companyName} - {internshipTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Rating - Required */}
          <Card className="p-4 bg-[var(--muted)]/30">
            <StarRating
              value={overallRating}
              onChange={setOverallRating}
              label="Rating *"
            />
          </Card>

          {/* Review Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Your Review
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your overall experience, what you learned, and any advice for future interns..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-[var(--muted-foreground)] text-right">
              {reviewText.length}/2000
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || overallRating === 0}
              className="gradient-btn text-white"
            >
              {loading ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
