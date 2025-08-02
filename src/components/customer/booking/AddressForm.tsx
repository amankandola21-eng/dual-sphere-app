import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";

interface AddressFormProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

const AddressForm = ({ data, onUpdate, onNext }: AddressFormProps) => {
  const [address, setAddress] = useState(data.address || {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    aptUnit: "",
  });
  const [specialInstructions, setSpecialInstructions] = useState(data.specialInstructions || "");

  const handleAddressChange = (field: string, value: string) => {
    const updatedAddress = { ...address, [field]: value };
    setAddress(updatedAddress);
    onUpdate({ ...data, address: updatedAddress });
  };

  const handleInstructionsChange = (value: string) => {
    setSpecialInstructions(value);
    onUpdate({ ...data, specialInstructions: value });
  };

  // Saved addresses (mock data for now)
  const savedAddresses = [
    {
      id: "1",
      name: "Home",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Where should we clean?</h3>
        <p className="text-sm text-muted-foreground">Enter your address and any special instructions</p>
      </div>

      {/* Saved Addresses */}
      {savedAddresses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Saved Addresses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {savedAddresses.map((addr) => (
              <Card 
                key={addr.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => {
                  setAddress(addr);
                  onUpdate({ ...data, address: addr });
                }}
              >
                <CardContent className="pt-3 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{addr.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* New Address Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              placeholder="123 Main Street"
              value={address.street}
              onChange={(e) => handleAddressChange("street", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aptUnit">Apt/Unit (Optional)</Label>
            <Input
              id="aptUnit"
              placeholder="Apt 4B"
              value={address.aptUnit}
              onChange={(e) => handleAddressChange("aptUnit", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="New York"
                value={address.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="NY"
                value={address.state}
                onChange={(e) => handleAddressChange("state", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              placeholder="10001"
              value={address.zipCode}
              onChange={(e) => handleAddressChange("zipCode", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Special Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Special Instructions</CardTitle>
          <CardDescription>
            Any specific requests or important details for your cleaner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., Please use eco-friendly products, focus on the kitchen, pet-friendly home..."
            value={specialInstructions}
            onChange={(e) => handleInstructionsChange(e.target.value)}
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressForm;