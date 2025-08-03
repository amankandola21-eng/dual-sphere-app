import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Clock, Calendar as CalendarIcon, DollarSign } from "lucide-react";

interface DateTimeSelectionProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const timeSlots = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
];

const DateTimeSelection = ({ data, onUpdate, onNext }: DateTimeSelectionProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(data.date);
  const [selectedTime, setSelectedTime] = useState(data.time);
  const [estimatedHours, setEstimatedHours] = useState([data.estimatedHours || 2]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onUpdate({ ...data, date });
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onUpdate({ ...data, time });
  };

  const handleHoursChange = (value: number[]) => {
    setEstimatedHours(value);
    onUpdate({ ...data, estimatedHours: value[0] });
  };

  const totalCost = data.hourlyRate && estimatedHours[0] 
    ? (data.hourlyRate * estimatedHours[0]).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Schedule & Duration</h3>
        <p className="text-sm text-muted-foreground">When do you need cleaning and for how long?</p>
      </div>

      {/* Duration Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Estimated Duration
          </CardTitle>
          <CardDescription>
            How many hours will you need? ({estimatedHours[0]} hour{estimatedHours[0] !== 1 ? 's' : ''})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            value={estimatedHours}
            onValueChange={handleHoursChange}
            max={8}
            min={1}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 hour</span>
            <span>8 hours</span>
          </div>
          {data.hourlyRate && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Estimated Total:</span>
              <Badge variant="secondary" className="text-base">
                ${totalCost}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date()}
            className="rounded-md border w-full"
          />
        </CardContent>
      </Card>

      {/* Time Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Preferred Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.map((time) => (
              <Button
                key={time}
                variant={selectedTime === time ? "default" : "outline"}
                size="sm"
                onClick={() => handleTimeSelect(time)}
                className="justify-center"
              >
                {time}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DateTimeSelection;