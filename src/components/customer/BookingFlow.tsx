import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ServiceSelection from "./booking/ServiceSelection";
import DateTimeSelection from "./booking/DateTimeSelection";
import AddressForm from "./booking/AddressForm";
import BookingSummary from "./booking/BookingSummary";

interface BookingFlowProps {
  onBack: () => void;
}

const BookingFlow = ({ onBack }: BookingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    serviceType: null,
    date: null,
    time: null,
    address: null,
    specialInstructions: "",
  });

  const steps = [
    { number: 1, title: "Service", component: ServiceSelection },
    { number: 2, title: "Date & Time", component: DateTimeSelection },
    { number: 3, title: "Address", component: AddressForm },
    { number: 4, title: "Summary", component: BookingSummary },
  ];

  const CurrentStepComponent = steps[currentStep - 1].component;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Book a Cleaner</h1>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            <CurrentStepComponent 
              data={bookingData}
              onUpdate={setBookingData}
              onNext={handleNext}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious}>
            {currentStep === 1 ? "Cancel" : "Previous"}
          </Button>
          {currentStep < steps.length && (
            <Button onClick={handleNext}>
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;