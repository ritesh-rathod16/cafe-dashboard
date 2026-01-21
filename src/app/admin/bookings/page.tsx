"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
    Calendar,
    Clock,
    Users,
    Phone,
    Search,
    CheckCircle2,
    XCircle,
    Clock3,
    MessageSquare,
    Trash2
} from "lucide-react";
import { format } from "date-fns";

type Booking = {
    id: string;
    customer_name: string;
    phone_number: string;
    guest_count: number;
    booking_date: string;
    booking_time: string;
    special_request: string | null;
    status: "pending" | "confirmed" | "cancelled";
    created_at: string;
};

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [dateFilter, setDateFilter] = useState<"all" | "today" | "tomorrow" | "accepted">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [bookings, dateFilter, searchQuery]);

    const fetchBookings = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from("table_bookings")
            .select("*")
            .order("booking_date", { ascending: true })
            .order("booking_time", { ascending: true });

        if (error) {
            toast.error("Failed to load bookings");
        } else {
            setBookings(data || []);
        }
        setLoading(false);
    };

    const filterBookings = () => {
        let filtered = [...bookings];

        // Date filter
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        if (dateFilter === "today") {
            filtered = filtered.filter(b => b.booking_date === today);
        } else if (dateFilter === "tomorrow") {
            filtered = filtered.filter(b => b.booking_date === tomorrow);
        } else if (dateFilter === "accepted") {
            filtered = filtered.filter(b => b.status === "confirmed");
        }

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(b =>
                b.phone_number.includes(searchQuery) ||
                b.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredBookings(filtered);
    };

    const confirmBooking = async (id: string) => {
        console.log("Attempting to confirm booking:", id);

        const supabase = createClient();
        const { data, error } = await supabase
            .from("table_bookings")
            .update({ status: "confirmed" })
            .eq("id", id)
            .select();

        if (error) {
            console.error("Error confirming booking:", error);
            toast.error(`Failed to confirm booking: ${error.message}`);
        } else {
            console.log("Booking confirmed successfully:", data);
            toast.success("Booking confirmed");
            fetchBookings();
        }
    };

    const deleteBooking = async (id: string) => {
        console.log("Attempting to delete booking:", id);

        const supabase = createClient();
        const { error } = await supabase
            .from("table_bookings")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting booking:", error);
            toast.error(`Failed to delete booking: ${error.message}`);
        } else {
            console.log("Booking deleted successfully");
            toast.success("Booking deleted");
            fetchBookings();
        }
    };

    const toggleSelectBooking = (id: string) => {
        const newSelected = new Set(selectedBookings);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedBookings(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedBookings.size === filteredBookings.length) {
            setSelectedBookings(new Set());
        } else {
            setSelectedBookings(new Set(filteredBookings.map(b => b.id)));
        }
    };

    const deleteSelectedBookings = async () => {
        if (selectedBookings.size === 0) {
            toast.error("No bookings selected");
            return;
        }

        const supabase = createClient();
        const { error } = await supabase
            .from("table_bookings")
            .delete()
            .in("id", Array.from(selectedBookings));

        if (error) {
            console.error("Error deleting bookings:", error);
            toast.error(`Failed to delete bookings: ${error.message}`);
        } else {
            console.log(`Deleted ${selectedBookings.size} bookings`);
            toast.success(`${selectedBookings.size} booking(s) deleted`);
            setSelectedBookings(new Set());
            fetchBookings();
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
            confirmed: "bg-green-100 text-green-800 border-green-300",
            cancelled: "bg-red-100 text-red-800 border-red-300"
        };

        const icons = {
            pending: Clock3,
            confirmed: CheckCircle2,
            cancelled: XCircle
        };

        const Icon = icons[status as keyof typeof icons];

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
                <Icon className="h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-serif font-bold mb-2">Table Bookings</h1>
                <p className="text-muted-foreground">Manage customer reservations</p>
            </div>

            {/* Filters */}
            <div className="bg-card border rounded-xl p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Date Filter */}
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant={dateFilter === "all" ? "default" : "outline"}
                            onClick={() => setDateFilter("all")}
                            className="rounded-full"
                        >
                            All Dates
                        </Button>
                        <Button
                            variant={dateFilter === "today" ? "default" : "outline"}
                            onClick={() => setDateFilter("today")}
                            className="rounded-full"
                        >
                            Today
                        </Button>
                        <Button
                            variant={dateFilter === "tomorrow" ? "default" : "outline"}
                            onClick={() => setDateFilter("tomorrow")}
                            className="rounded-full"
                        >
                            Tomorrow
                        </Button>
                        <Button
                            variant={dateFilter === "accepted" ? "default" : "outline"}
                            onClick={() => setDateFilter("accepted")}
                            className="rounded-full"
                        >
                            Bookings accepted
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by phone or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {filteredBookings.length > 0 && (
                <div className="bg-card border rounded-xl p-4 mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            checked={selectedBookings.size === filteredBookings.length && filteredBookings.length > 0}
                            onCheckedChange={toggleSelectAll}
                            id="select-all"
                        />
                        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                            Select All ({filteredBookings.length})
                        </label>
                    </div>
                    {selectedBookings.size > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={deleteSelectedBookings}
                            className="gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Selected ({selectedBookings.size})
                        </Button>
                    )}
                </div>
            )}

            {/* Bookings List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="bg-card border rounded-xl p-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">No bookings found</p>
                    <p className="text-sm text-muted-foreground">
                        {searchQuery ? "Try a different search" : "No bookings for this date"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredBookings.map((booking) => (
                        <div key={booking.id} className="bg-card border rounded-xl p-6 hover:shadow-md transition-shadow">
                            <div className="flex gap-4">
                                {/* Checkbox */}
                                <div className="flex items-start pt-1">
                                    <Checkbox
                                        checked={selectedBookings.has(booking.id)}
                                        onCheckedChange={() => toggleSelectBooking(booking.id)}
                                        id={`booking-${booking.id}`}
                                    />
                                </div>

                                {/* Booking Content */}
                                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-lg">{booking.customer_name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                    <Phone className="h-4 w-4" />
                                                    {booking.phone_number}
                                                </div>
                                            </div>
                                            {getStatusBadge(booking.status)}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span>{format(new Date(booking.booking_date), "dd MMM yyyy")}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>{booking.booking_time}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span>{booking.guest_count} {booking.guest_count === 1 ? "Guest" : "Guests"}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Booked {format(new Date(booking.created_at), "dd MMM, HH:mm")}
                                            </div>
                                        </div>

                                        {booking.special_request && (
                                            <div className="flex items-start gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                                                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <span className="text-muted-foreground">{booking.special_request}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {booking.status === "pending" && (
                                            <Button
                                                size="sm"
                                                onClick={() => confirmBooking(booking.id)}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                                Confirm
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => deleteBooking(booking.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

