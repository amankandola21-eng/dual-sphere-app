import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Camera, MessageSquare, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  photos: string[];
  created_at: string;
  customer_name: string;
  cleaner_name: string;
  booking_date: string;
}

interface ReviewFormData {
  bookingId: string;
  cleanerId: string;
  rating: number;
  reviewText: string;
}

export const ReviewsAndRatings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchReviews();
      fetchCompletedBookings();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          customer:profiles!reviews_customer_id_fkey(display_name),
          cleaner:profiles!reviews_cleaner_id_fkey(display_name),
          booking:bookings!reviews_booking_id_fkey(scheduled_date)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsWithNames = data.map(review => ({
        ...review,
        customer_name: (review.customer as any)?.display_name || 'Unknown Customer',
        cleaner_name: (review.cleaner as any)?.display_name || 'Unknown Cleaner',
        booking_date: (review.booking as any)?.scheduled_date || ''
      }));

      setReviews(reviewsWithNames);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      });
    }
  };

  const fetchCompletedBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cleaner:profiles!bookings_cleaner_id_fkey(display_name),
          existing_review:reviews(id)
        `)
        .eq('user_id', user?.id)
        .eq('status', 'completed');

      if (error) throw error;

      // Filter out bookings that already have reviews
      const bookingsWithoutReviews = data.filter(booking => 
        !booking.existing_review || booking.existing_review.length === 0
      );

      setCompletedBookings(bookingsWithoutReviews);
    } catch (error) {
      console.error('Error fetching completed bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (formData: ReviewFormData) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: formData.bookingId,
          customer_id: user?.id,
          cleaner_id: formData.cleanerId,
          rating: formData.rating,
          review_text: formData.reviewText
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review submitted successfully!",
      });

      setShowReviewForm(false);
      setSelectedBooking(null);
      fetchReviews();
      fetchCompletedBookings();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  const ReviewForm = ({ booking, onSubmit, onCancel }: any) => {
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState("");

    const handleSubmit = () => {
      onSubmit({
        bookingId: booking.id,
        cleanerId: booking.cleaner_id,
        rating,
        reviewText
      });
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Rate Your Cleaner</CardTitle>
          <CardDescription>
            How was your cleaning service on {new Date(booking.scheduled_date).toLocaleDateString()}?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Rating</label>
            <div className="mt-2">
              {renderStars(rating, true, setRating)}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Review (Optional)</label>
            <Textarea
              placeholder="Tell others about your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSubmit}>Submit Review</Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Reviews */}
      {completedBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rate Your Recent Cleanings</CardTitle>
            <CardDescription>Share your experience to help other customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedBookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {booking.cleaner?.display_name || 'Unknown Cleaner'}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(booking.scheduled_date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>${booking.total_price}</span>
                    </div>
                  </div>
                  <Button onClick={() => {
                    setSelectedBooking(booking);
                    setShowReviewForm(true);
                  }}>
                    <Star className="h-4 w-4 mr-2" />
                    Rate Service
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      {showReviewForm && selectedBooking && (
        <ReviewForm
          booking={selectedBooking}
          onSubmit={submitReview}
          onCancel={() => {
            setShowReviewForm(false);
            setSelectedBooking(null);
          }}
        />
      )}

      {/* All Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>All Reviews</span>
          </CardTitle>
          <CardDescription>
            {reviews.length} reviews from our community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reviews yet</p>
              <p className="text-sm">Be the first to leave a review!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {review.customer_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{review.customer_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Cleaned by {review.cleaner_name}
                        </p>
                      </div>
                      <div className="text-right">
                        {renderStars(review.rating)}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {review.review_text && (
                      <p className="text-sm mt-3">{review.review_text}</p>
                    )}
                    
                    {review.photos && review.photos.length > 0 && (
                      <div className="flex items-center space-x-2 mt-3">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {review.photos.length} photo(s)
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        Verified Booking
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Service date: {new Date(review.booking_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};