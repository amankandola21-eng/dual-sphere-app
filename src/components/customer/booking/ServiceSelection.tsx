import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, DollarSign, Loader2 } from "lucide-react";
import { useServices } from "@/hooks/useServices";

interface ServiceSelectionProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const ServiceSelection = ({ data, onUpdate, onNext }: ServiceSelectionProps) => {
  const [selectedService, setSelectedService] = useState(data.serviceType);
  const { data: services, isLoading, error } = useServices();

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    onUpdate({ ...data, serviceType: service });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading services...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load services. Please try again.</p>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Choose Your Service</h3>
        <p className="text-sm text-muted-foreground">Select the type of cleaning you need</p>
      </div>

      <div className="space-y-3">
        {services?.map((service) => (
          <Card 
            key={service.id}
            className={`cursor-pointer transition-all ${
              selectedService?.id === service.id 
                ? "border-primary bg-primary/5" 
                : "hover:border-primary/50"
            }`}
            onClick={() => handleServiceSelect(service)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {service.name}
                    {selectedService?.id === service.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="ml-2">
                  ${service.base_price}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs mb-3">
                {service.description}
              </CardDescription>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {service.duration_hours}h
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Starting at ${service.base_price}
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