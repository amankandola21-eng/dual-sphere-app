import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, DollarSign, Loader2, Star, User } from "lucide-react";
import { useAvailableCleaners } from "@/hooks/useServices";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ServiceSelectionProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const ServiceSelection = ({ data, onUpdate, onNext }: ServiceSelectionProps) => {
  const [selectedCleaner, setSelectedCleaner] = useState(data.cleaner);
  const { data: cleaners, isLoading, error } = useAvailableCleaners();

  const handleCleanerSelect = (cleaner: any) => {
    setSelectedCleaner(cleaner);
    onUpdate({ ...data, cleaner: cleaner, hourlyRate: cleaner.hourly_rate });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading cleaners...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load cleaners. Please try again.</p>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Choose Your Cleaner</h3>
        <p className="text-sm text-muted-foreground">Select from our available cleaners</p>
      </div>

      <div className="space-y-3">
        {cleaners?.map((cleaner) => (
          <Card 
            key={cleaner.id}
            className={`cursor-pointer transition-all ${
              selectedCleaner?.id === cleaner.id 
                ? "border-primary bg-primary/5" 
                : "hover:border-primary/50"
            }`}
            onClick={() => handleCleanerSelect(cleaner)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={cleaner.profiles?.avatar_url} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {cleaner.profiles?.display_name || 'Cleaner'}
                      {selectedCleaner?.id === cleaner.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-muted-foreground">{cleaner.rating}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{cleaner.total_jobs} jobs</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-2">
                  ${cleaner.hourly_rate}/hr
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs mb-3">
                {cleaner.bio || 'Professional cleaning service'}
              </CardDescription>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {cleaner.experience_years}+ years exp
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${cleaner.hourly_rate} per hour
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServiceSelection;