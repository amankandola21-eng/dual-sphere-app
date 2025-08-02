import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const timeSlots = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
];

interface DateTimeSelectionProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const DateTimeSelection = ({ data, onUpdate, onNext }: DateTimeSelectionProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(data.date);
  const [selectedTime, setSelectedTime] = useState(data.time);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onUpdate({ ...data, date });
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    onUpdate({ ...data, time });
  };

  // Don't allow past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">When do you need cleaning?</h3>
        <p className="text-sm text-muted-foreground">Select your preferred date and time</p>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => date < today}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      {/* Time Selection */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Select Time
            </CardTitle>
            <CardDescription>
              Available slots for {selectedDate.toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((time) => (
                <Badge
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  className="cursor-pointer justify-center py-2 text-xs"
                  onClick={() => handleTimeSelect(time)}
                >
                  {time}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DateTimeSelection;