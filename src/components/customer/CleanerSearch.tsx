import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Star, MapPin, Clock, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CleanerProfile {
  id: string;
  user_id: string;
  hourly_rate: number;
  rating: number;
  experience_years: number;
  bio: string;
  available: boolean;
  total_jobs: number;
  display_name: string;
  city?: string;
}

export const CleanerSearch = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cleaners, setCleaners] = useState<CleanerProfile[]>([]);
  const [filteredCleaners, setFilteredCleaners] = useState<CleanerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchLocation, setSearchLocation] = useState("");
  const [priceRange, setPriceRange] = useState([15, 50]);
  const [minRating, setMinRating] = useState(4);
  const [experienceFilter, setExperienceFilter] = useState("any");
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    fetchCleaners();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [cleaners, searchLocation, priceRange, minRating, experienceFilter, sortBy]);

  const fetchCleaners = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaners')
        .select(`
          *,
          profile:profiles!cleaners_user_id_fkey(display_name)
        `)
        .eq('available', true);

      if (error) throw error;

      const cleanersWithProfiles = data.map(cleaner => ({
        ...cleaner,
        display_name: cleaner.profile?.display_name || 'Unknown Cleaner'
      }));

      setCleaners(cleanersWithProfiles);
    } catch (error) {
      console.error('Error fetching cleaners:', error);
      toast({
        title: "Error",
        description: "Failed to load cleaners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...cleaners];

    // Filter by location (if provided)
    if (searchLocation.trim()) {
      filtered = filtered.filter(cleaner => 
        cleaner.display_name.toLowerCase().includes(searchLocation.toLowerCase()) ||
        cleaner.bio?.toLowerCase().includes(searchLocation.toLowerCase())
      );
    }

    // Filter by price range
    filtered = filtered.filter(cleaner => 
      cleaner.hourly_rate >= priceRange[0] && cleaner.hourly_rate <= priceRange[1]
    );

    // Filter by minimum rating
    filtered = filtered.filter(cleaner => cleaner.rating >= minRating);

    // Filter by experience
    if (experienceFilter !== "any") {
      const minExp = experienceFilter === "beginner" ? 0 : 
                    experienceFilter === "experienced" ? 2 : 5;
      const maxExp = experienceFilter === "beginner" ? 1 : 
                    experienceFilter === "experienced" ? 4 : 100;
      
      filtered = filtered.filter(cleaner => 
        cleaner.experience_years >= minExp && cleaner.experience_years <= maxExp
      );
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "price_low":
          return a.hourly_rate - b.hourly_rate;
        case "price_high":
          return b.hourly_rate - a.hourly_rate;
        case "experience":
          return b.experience_years - a.experience_years;
        case "jobs":
          return b.total_jobs - a.total_jobs;
        default:
          return b.rating - a.rating;
      }
    });

    setFilteredCleaners(filtered);
  };

  const handleBookCleaner = (cleanerId: string) => {
    // Navigate to booking flow with selected cleaner
    toast({
      title: "Booking",
      description: "Redirecting to booking flow...",
    });
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
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Find Cleaners</span>
          </CardTitle>
          <CardDescription>Search and filter cleaners in your area</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Search */}
          <div>
            <label className="text-sm font-medium">Location</label>
            <Input
              placeholder="Enter city or area..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Price Range */}
          <div>
            <label className="text-sm font-medium">
              Price Range: ${priceRange[0]} - ${priceRange[1]} per hour
            </label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              min={15}
              max={75}
              step={5}
              className="mt-2"
            />
          </div>

          {/* Rating Filter */}
          <div>
            <label className="text-sm font-medium">Minimum Rating</label>
            <Select value={minRating.toString()} onValueChange={(value) => setMinRating(Number(value))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
                <SelectItem value="5">5 Stars Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Experience Filter */}
          <div>
            <label className="text-sm font-medium">Experience Level</label>
            <Select value={experienceFilter} onValueChange={setExperienceFilter}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Experience</SelectItem>
                <SelectItem value="beginner">Beginner (0-1 years)</SelectItem>
                <SelectItem value="experienced">Experienced (2-4 years)</SelectItem>
                <SelectItem value="expert">Expert (5+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-sm font-medium">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="experience">Most Experienced</SelectItem>
                <SelectItem value="jobs">Most Jobs Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {filteredCleaners.length} Cleaners Found
          </h3>
        </div>

        {filteredCleaners.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No cleaners match your criteria</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredCleaners.map((cleaner) => (
            <Card key={cleaner.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {cleaner.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{cleaner.display_name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium ml-1">{cleaner.rating}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {cleaner.total_jobs} jobs completed
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold">${cleaner.hourly_rate}</div>
                        <div className="text-sm text-muted-foreground">per hour</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {cleaner.experience_years} years experience
                      </div>
                      <Badge variant="secondary">Available</Badge>
                    </div>
                    
                    {cleaner.bio && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {cleaner.bio}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-4">
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                      <Button onClick={() => handleBookCleaner(cleaner.id)}>
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};