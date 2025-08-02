import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, DollarSign } from "lucide-react";

const services = [
  {
    id: "standard",
    name: "Standard Cleaning",
    description: "Surface cleaning, dusting, vacuuming, mopping, kitchen/bathroom cleaning, garbage removal",
    basePrice: 80,
    duration: 2,
  },
  {
    id: "deep",
    name: "Deep Cleaning",
    description: "Everything in Standard Cleaning plus baseboards, behind furniture, light fixtures, detailed scrubbing",
    basePrice: 150,
    duration: 4,
  },
  {
    id: "move",
    name: "Move In/Move Out Cleaning",
    description: "Deep cleaning for empty homes, inside cabinets, appliances, baseboards, closets, spot wall cleaning",
    basePrice: 200,
    duration: 5,
  },
  {
    id: "construction",
    name: "Post Construction Cleaning",
    description: "Removal of dust, debris, construction residue, window washing, detailed surfaces",
    basePrice: 250,
    duration: 6,
  },
  {
    id: "rental",
    name: "Short-Term Rental Turnover",
    description: "Hotel-style reset: linens, towels, toiletries, photo verification, fast turnaround",
    basePrice: 120,
    duration: 3,
  },
];

interface ServiceSelectionProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const ServiceSelection = ({ data, onUpdate, onNext }: ServiceSelectionProps) => {
  const [selectedService, setSelectedService] = useState(data.serviceType);

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    onUpdate({ ...data, serviceType: service });
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Choose Your Service</h3>
        <p className="text-sm text-muted-foreground">Select the type of cleaning you need</p>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
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
                  ${service.basePrice}
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
                  {service.duration}h
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Starting at ${service.basePrice}
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