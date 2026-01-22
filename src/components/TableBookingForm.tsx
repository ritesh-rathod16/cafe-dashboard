"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Calendar, Clock, Users, MessageSquare, Loader2 } from "lucide-react";

type BookingFormData = {
    customerName: string;
    phoneNumber: string;
    guestCount: number;
    bookingDate: string;
    bookingTime: string;
    specialRequest: string;
};

export function TableBookingForm() {
    const [formData, setFormData] = useState<BookingFormData>({
        customerName: "",
        phoneNumber: "",
        guestCount: 2,
        bookingDate: new Date().toISOString().split('T')[0], // Today's date
        bookingTime: "",
        specialRequest: "",
    });
    const [guestCountInput, setGuestCountInput] = useState("2");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});

    // Get min date (today)
    const minDate = new Date().toISOString().split('T')[0];

    // Get min time (current time if today, otherwise 10:00)
    const getMinTime = () => {
        const now = new Date();
        const isToday = formData.bookingDate === minDate;

        if (isToday) {
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        }
        return "10:00";
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof BookingFormData, string>> = {};

        if (!formData.customerName.trim()) {
            newErrors.customerName = "Name is required";
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = "Phone number is required";
        } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
            newErrors.phoneNumber = "Enter a valid 10-digit phone number";
        }

        if (formData.guestCount < 1 || formData.guestCount > 10) {
            newErrors.guestCount = "Guest count must be between 1 and 10";
        }

        if (!formData.bookingDate) {
            newErrors.bookingDate = "Date is required";
        }

        if (!formData.bookingTime) {
            newErrors.bookingTime = "Time is required";
        } else {
            const selectedTime = formData.bookingTime;
            const minTime = getMinTime();

            if (formData.bookingDate === minDate && selectedTime < minTime) {
                newErrors.bookingTime = "Please select a future time";
            }

            if (selectedTime < "10:00" || selectedTime > "22:00") {
                newErrors.bookingTime = "Booking time must be between 10:00 AM and 10:00 PM";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        setIsSubmitting(true);

        try {
            console.log("Submitting booking with data:", {
                customer_name: formData.customerName,
                phone_number: formData.phoneNumber,
                guest_count: formData.guestCount,
                booking_date: formData.bookingDate,
                booking_time: formData.bookingTime,
                special_request: formData.specialRequest || null,
            });

            // Use server-side API route instead of direct Supabase client
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customer_name: formData.customerName,
                    phone_number: formData.phoneNumber,
                    guest_count: formData.guestCount,
                    booking_date: formData.bookingDate,
                    booking_time: formData.bookingTime,
                    special_request: formData.specialRequest || null,
                }),
            });

            const result = await response.json();

            console.log("API response:", result);

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create booking');
            }

            toast.success("🎉 Thank you for booking a table at our café!", {
                duration: 5000,
                description: "Your reservation has been confirmed successfully. We'll see you soon! ☕"
            });

            // Reset form
            setFormData({
                customerName: "",
                phoneNumber: "",
                guestCount: 2,
                bookingDate: new Date().toISOString().split('T')[0],
                bookingTime: "",
                specialRequest: "",
            });
            setGuestCountInput("2");
        } catch (error) {
            console.error("Booking error:", error);
            console.error("Error type:", typeof error);

            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to book table. Please try again.";

            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Your Name <span className="text-red-500">*</span>
                </label>
                <Input
                    type="text"
                    placeholder="Enter your name"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className={errors.customerName ? "border-red-500" : ""}
                />
                {errors.customerName && (
                    <p className="text-xs text-red-500">{errors.customerName}</p>
                )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                    Mobile Number <span className="text-red-500">*</span>
                </label>
                <Input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })}
                    maxLength={10}
                    className={errors.phoneNumber ? "border-red-500" : ""}
                />
                {errors.phoneNumber && (
                    <p className="text-xs text-red-500">{errors.phoneNumber}</p>
                )}
            </div>

            {/* Guest Count */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Number of Guests <span className="text-red-500">*</span>
                </label>
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="1-10 guests"
                    value={guestCountInput}
                    onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setGuestCountInput(value);
                        const num = parseInt(value) || 0;
                        setFormData({ ...formData, guestCount: num });
                    }}
                    onBlur={() => {
                        if (!guestCountInput || formData.guestCount < 1) {
                            setGuestCountInput("1");
                            setFormData({ ...formData, guestCount: 1 });
                        } else if (formData.guestCount > 10) {
                            setGuestCountInput("10");
                            setFormData({ ...formData, guestCount: 10 });
                        }
                    }}
                    className={errors.guestCount ? "border-red-500" : ""}
                />
                {errors.guestCount && (
                    <p className="text-xs text-red-500">{errors.guestCount}</p>
                )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="date"
                        min={minDate}
                        value={formData.bookingDate}
                        onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                        className={errors.bookingDate ? "border-red-500" : ""}
                    />
                    {errors.bookingDate && (
                        <p className="text-xs text-red-500">{errors.bookingDate}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Time <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="time"
                        min={getMinTime()}
                        value={formData.bookingTime}
                        onChange={(e) => setFormData({ ...formData, bookingTime: e.target.value })}
                        className={errors.bookingTime ? "border-red-500" : ""}
                    />
                    {errors.bookingTime && (
                        <p className="text-xs text-red-500">{errors.bookingTime}</p>
                    )}
                </div>
            </div>

            {/* Special Request */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Special Request (Optional)
                </label>
                <textarea
                    placeholder="Any special requirements?"
                    value={formData.specialRequest}
                    onChange={(e) => setFormData({ ...formData, specialRequest: e.target.value })}
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    maxLength={500}
                />
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Booking...
                    </>
                ) : (
                    "Confirm Booking"
                )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
                Operating Hours: 10:00 AM - 10:00 PM
            </p>
        </form>
    );
}

// sync: 2026-01-23 00:35:39
