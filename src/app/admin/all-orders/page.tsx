// All Orders Page.
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from 'xlsx';
import {
    Search,
    Calendar as CalendarIcon,
    Filter,
    Printer,
    Eye,
    Download,
    FileSpreadsheet,
    Trash2,
    CheckSquare,
    Square,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    X
} from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/lib/invoice";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type OrderItem = {
    id: string;
    quantity: number;
    price_at_order: number;
    menu_items: {
        name: string;
    };
};

type Order = {
    id: string;
    table_number: number;
    customer_name?: string;
    customer_phone?: string;
    biller_name?: string;
    status: string;
    total_price: number;
    created_at: string;
    payment_mode?: string;
    is_paid?: boolean;
    order_items: OrderItem[];
    invoices?: {
        cashier_name: string;
        invoice_number: string;
        customer_name?: string;
        customer_phone?: string;
    }[];
};

export default function AllOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [viewOrderId, setViewOrderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);
    const ordersPerPage = 20;

    const viewOrder = orders.find(o => o.id === viewOrderId);

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [orders, searchQuery, startDate, endDate, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("orders")
            .select(`
                *,
                invoices (
            cashier_name,
            invoice_number,
            customer_name,
            customer_phone
        ),
                order_items (
                    id,
                    quantity,
                    price_at_order,
                    menu_items (name)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            toast.error("Failed to load orders");
            setLoading(false);
        } else {
            setOrders(data || []);
            setLoading(false);
        }
    };

    const filterOrders = () => {
        let filtered = [...orders];

        // Filter by customer name
        if (searchQuery.trim()) {
            filtered = filtered.filter(order =>
                (order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                order.table_number.toString().includes(searchQuery)
            );
        }

        // Filter by date range
        if (startDate) {
            filtered = filtered.filter(order =>
                new Date(order.created_at) >= new Date(startDate)
            );
        }
        if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            filtered = filtered.filter(order =>
                new Date(order.created_at) <= endDateTime
            );
        }

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        setFilteredOrders(filtered);
        setCurrentPage(1);
    };

    const handleGenerateInvoice = (order: Order) => {
        generateInvoicePDF({
            invoiceNumber: order.id.slice(0, 8).toUpperCase(),
            tableNumber: order.table_number,
            customerName: order.customer_name,
            customerPhone: order.customer_phone,
            cashierName: order.biller_name,
            date: new Date(order.created_at).toLocaleString(),
            items: order.order_items.map(i => ({
                name: i.menu_items.name,
                quantity: i.quantity,
                price: Number(i.price_at_order)
            })),
            total: Number(order.total_price),
            paymentMode: order.payment_mode || 'cash'
        });
        toast.success("Invoice generated successfully");
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            new: "bg-blue-100 text-blue-700",
            preparing: "bg-orange-100 text-orange-700",
            ready: "bg-green-100 text-green-700",
            served: "bg-purple-100 text-purple-700",
            completed: "bg-green-100 text-green-700",
            cancelled: "bg-red-100 text-red-700"
        };
        return (
            <span className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                styles[status] || "bg-gray-100 text-gray-700"
            )}>
                {status}
            </span>
        );
    };

    const clearFilters = () => {
        setSearchQuery("");
        setStartDate("");
        setEndDate("");
        setStatusFilter("all");
    };

    const handleExportToExcel = () => {
        const dataToExport = filteredOrders.map(order => ({
            "Order ID": order.id.slice(0, 8).toUpperCase(),
            "Customer Name": order.customer_name || 'Walk-in Customer',
            "Customer Phone": order.customer_phone || 'N/A',
            "Biller/Cashier": order.biller_name || 'N/A',
            "Table Number": order.table_number,
            "Total Items": order.order_items.length,
            "Total Amount": `₹${Number(order.total_price).toFixed(2)}`,
            "Status": order.status,
            "Payment Mode": order.payment_mode || 'Pending',
            "Date & Time": formatDateTime(order.created_at),
            "Items Details": order.order_items.map(item => `${item.menu_items.name} (x${item.quantity})`).join(', ')
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
        XLSX.writeFile(workbook, "all_orders.xlsx");
        toast.success("Orders exported to Excel successfully!");
    };

    const handleDeleteOrders = async (ids: string[]) => {
        setIsDeleting(true);
        try {
            // 1. Get associated invoices to delete payments
            const { data: invoices } = await supabase
                .from("invoices")
                .select("id")
                .in("order_id", ids);

            if (invoices && invoices.length > 0) {
                const invoiceIds = invoices.map(inv => inv.id);
                // 2. Delete payments associated with these invoices
                await supabase
                    .from("payments")
                    .delete()
                    .in("invoice_id", invoiceIds);
            }

            // 3. Delete order items
            await supabase
                .from("order_items")
                .delete()
                .in("order_id", ids);

            // 4. Delete KOTs
            await supabase
                .from("kots")
                .delete()
                .in("order_id", ids);

            // 5. Delete invoices (FK linked to orders)
            await supabase
                .from("invoices")
                .delete()
                .in("order_id", ids);

            // 6. Delete the orders
            const { error } = await supabase
                .from("orders")
                .delete()
                .in("id", ids);

            if (error) throw error;

            toast.success(`${ids.length} order(s) deleted successfully`);
            setSelectedOrderIds([]);
            setDeleteTargetIds([]);
            fetchOrders();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete orders");
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedOrderIds.length === currentOrders.length) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(currentOrders.map(o => o.id));
        }
    };

    const toggleSelectOrder = (id: string) => {
        setSelectedOrderIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Pagination
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-serif font-bold">All Orders</h1>
                    <p className="text-muted-foreground">
                        {filteredOrders.length} orders found
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedOrderIds.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteTargetIds(selectedOrderIds)}
                            disabled={isDeleting}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Selected ({selectedOrderIds.length})
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleExportToExcel}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export to Excel
                    </Button>
                    <Button variant="outline" onClick={fetchOrders}>
                        <Download className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search by Customer Name */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Search Customer
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Customer name or table..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Start Date
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            End Date
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Status
                        </label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Clear Filters */}
                {(searchQuery || startDate || endDate || statusFilter !== "all") && (
                    <div className="mt-4 flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                            <X className="h-3 w-3 mr-1" />
                            Clear Filters
                        </Button>
                        <span className="text-xs text-muted-foreground">
                            Showing {filteredOrders.length} of {orders.length} orders
                        </span>
                    </div>
                )}
            </Card>

            {/* Orders Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <th className="px-6 py-4 w-10">
                                    <button onClick={toggleSelectAll} className="p-1 hover:bg-muted rounded">
                                        {selectedOrderIds.length === currentOrders.length && currentOrders.length > 0 ? (
                                            <CheckSquare className="h-4 w-4 text-primary" />
                                        ) : (
                                            <Square className="h-4 w-4" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Customer Name & Table</th>
                                <th className="px-6 py-4">Cashier</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Payment</th>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-12 text-center text-muted-foreground">
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : currentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-6 py-12 text-center text-muted-foreground">
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                currentOrders.map((order) => (
                                    <tr key={order.id} className={cn(
                                        "group hover:bg-muted/30 transition-colors",
                                        selectedOrderIds.includes(order.id) && "bg-primary/5"
                                    )}>
                                        <td className="px-6 py-4">
                                            <button onClick={() => toggleSelectOrder(order.id)} className="p-1 hover:bg-muted rounded">
                                                {selectedOrderIds.includes(order.id) ? (
                                                    <CheckSquare className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <Square className="h-4 w-4" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs">
                                                {order.id.slice(0, 8).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">
                                                    {order.invoices && order.invoices.length > 0 && order.invoices[0].customer_name
                                                        ? order.invoices[0].customer_name
                                                        : (order.customer_name || 'Walk-in')}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {order.invoices && order.invoices.length > 0 && order.invoices[0].customer_phone
                                                        ? `${order.invoices[0].customer_phone}`
                                                        : (order.customer_phone ? `${order.customer_phone}` : 'No Phone')}
                                                </span>
                                                <span className="text-[10px] text-primary/80 font-bold">
                                                    Table {order.table_number}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">
                                            {order.invoices && order.invoices.length > 0
                                                ? order.invoices[0].cashier_name
                                                : (order.biller_name || 'Admin')}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {order.order_items.length} items
                                        </td>
                                        <td className="px-6 py-4 font-bold text-primary">
                                            ₹{Number(order.total_price).toFixed(0)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs capitalize">
                                                {order.payment_mode || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <CalendarIcon className="h-3 w-3" />
                                                {formatDateTime(order.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setViewOrderId(order.id)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleGenerateInvoice(order)}
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => setDeleteTargetIds([order.id])}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t px-6 py-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {indexOfFirstOrder + 1} to {Math.min(indexOfLastOrder, filteredOrders.length)} of {filteredOrders.length} orders
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* View Order Dialog */}
            <Dialog open={!!viewOrderId} onOpenChange={() => setViewOrderId(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Order Details - {viewOrder?.customer_name || `Table ${viewOrder?.table_number}`}
                        </DialogTitle>
                    </DialogHeader>

                    {viewOrder && (
                        <div className="space-y-6">
                            <div className="rounded-xl border bg-muted/30 p-4">
                                <div className="space-y-3">
                                    {viewOrder.order_items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between text-sm">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{item.menu_items.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ₹{Number(item.price_at_order).toFixed(0)} x {item.quantity}
                                                </span>
                                            </div>
                                            <span className="font-bold">
                                                ₹{(item.quantity * item.price_at_order).toFixed(0)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-lg font-serif font-bold text-primary">
                                        <span>Total Amount</span>
                                        <span>₹{Number(viewOrder.total_price).toFixed(0)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-sm px-1">
                                    <span className="text-muted-foreground">Cashier</span>
                                    <span className="font-bold">
                                        {viewOrder.invoices && viewOrder.invoices.length > 0
                                            ? viewOrder.invoices[0].cashier_name
                                            : (viewOrder.biller_name || 'Admin')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm px-1">
                                    <span className="text-muted-foreground">Phone</span>
                                    <span className="font-mono">
                                        {viewOrder.invoices && viewOrder.invoices.length > 0 && viewOrder.invoices[0].customer_phone
                                            ? viewOrder.invoices[0].customer_phone
                                            : (viewOrder.customer_phone || 'N/A')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm px-1">
                                    <span className="text-muted-foreground">Customer Name</span>
                                    <span className="font-bold">
                                        {viewOrder.invoices && viewOrder.invoices.length > 0 && viewOrder.invoices[0].customer_name
                                            ? viewOrder.invoices[0].customer_name
                                            : (viewOrder.customer_name || 'Walk-in')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm px-1">
                                    <span className="text-muted-foreground">Status</span>
                                    {getStatusBadge(viewOrder.status)}
                                </div>
                                <div className="flex items-center justify-between text-sm px-1">
                                    <span className="text-muted-foreground">Payment Mode</span>
                                    <span className="capitalize">{viewOrder.payment_mode || 'Pending'}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm px-1">
                                    <span className="text-muted-foreground">Order ID</span>
                                    <span className="font-mono text-[10px] uppercase">
                                        {viewOrder.id.slice(0, 8)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm px-1">
                                    <span className="text-muted-foreground">Created</span>
                                    <span className="text-xs">{formatDateTime(viewOrder.created_at)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleGenerateInvoice(viewOrder)}
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </Button>
                                <Button
                                    variant="default"
                                    className="w-full"
                                    onClick={() => setViewOrderId(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Dialog */}
            <AlertDialog open={deleteTargetIds.length > 0} onOpenChange={(open) => !open && setDeleteTargetIds([])}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            Confirm Deletion
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {deleteTargetIds.length} order(s)?
                            This action will permanently remove the orders, their items, and any recorded invoices.
                            This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDeleteOrders(deleteTargetIds)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Deleting..." : "Confirm Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// sync: 2026-01-23 00:35:39
