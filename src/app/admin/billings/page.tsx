"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
    Search,
    Receipt,
    User,
    Phone,
    Table as TableIcon,
    Printer,
    X,
    Loader2,
    CheckCircle2,
    FileText,
    Edit3,
    History,
    Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/lib/invoice";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
    order_items: OrderItem[];
};

type Invoice = {
    id: string;
    invoice_number: string;
    table_number: number;
    subtotal: number;
    cgst: number;
    sgst: number;
    rounding: number;
    total: number;
    payment_mode: string;
    cashier_name?: string;
    generated_at: string;
};

export default function BillingsPage() {
    const [tableNumber, setTableNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [cashierName, setCashierName] = useState("");
    const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card">("cash");

    const [showInvoice, setShowInvoice] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
    const [generating, setGenerating] = useState(false);

    const [editableCustomerName, setEditableCustomerName] = useState("");
    const [editableCustomerPhone, setEditableCustomerPhone] = useState("");

    const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
    const [editingInvoice, setEditingInvoice] = useState<any>(null);
    const [updating, setUpdating] = useState(false);

    const invoiceRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedSession = localStorage.getItem('employee_session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                setCashierName(session.name);
            } catch (e) {
                console.error("Failed to parse session");
            }
        }
        fetchRecentInvoices();
    }, []);

    const fetchRecentInvoices = async () => {
        const { data, error } = await supabase
            .from("invoices")
            .select(`
                *,
                orders (
                    customer_name,
                    customer_phone
                )
            `)
            .order("generated_at", { ascending: false })
            .limit(10);

        if (!error && data) {
            setRecentInvoices(data);
        }
    };

    const searchTable = async () => {
        if (!tableNumber) return;
        setLoading(true);
        setActiveOrder(null);

        const { data: table, error: tableError } = await supabase
            .from("cafe_tables")
            .select("current_order_id")
            .eq("id", parseInt(tableNumber))
            .single();

        if (tableError || !table?.current_order_id) {
            toast.error("No active order found for this table");
            setLoading(false);
            return;
        }

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_order,
          menu_items (name)
        )
      `)
            .eq("id", table.current_order_id)
            .single();

        if (orderError || !order) {
            toast.error("Failed to fetch order details");
        } else {
            setActiveOrder(order as Order);
            setEditableCustomerName(order.customer_name || "");
            setEditableCustomerPhone(order.customer_phone || "");
        }
        setLoading(false);
    };

    const printInvoice = () => {
        const printContent = invoiceRef.current;
        if (!printContent) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - Cafe Republic</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .logo { font-size: 24px; font-weight: bold; }
          .tagline { font-size: 10px; margin-top: 4px; }
          .legal { font-size: 8px; margin-top: 8px; }
          .meta { font-size: 10px; margin: 10px 0; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .items { margin: 10px 0; }
          .item { display: flex; justify-content: space-between; font-size: 11px; margin: 4px 0; }
          .totals { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
          .total-row { display: flex; justify-content: space-between; font-size: 11px; margin: 4px 0; }
          .grand-total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
          .footer { text-align: center; font-size: 10px; border-top: 2px dashed #000; padding-top: 10px; margin-top: 15px; }
          @media print { body { padding: 0; } }
          .text-primary { color: #000 !important; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleBillGeneration = async () => {
        if (!activeOrder) return;

        if (!editableCustomerName.trim()) {
            toast.error("Please enter customer name");
            return;
        }
        if (!editableCustomerPhone.trim()) {
            toast.error("Please enter customer phone");
            return;
        }

        setGenerating(true);

        try {
            const subtotal = Number(activeOrder.total_price);
            const cgst = Math.round(subtotal * 0.025 * 100) / 100;
            const sgst = Math.round(subtotal * 0.025 * 100) / 100;
            const total = subtotal + cgst + sgst;
            const roundedTotal = Math.round(total);
            const rounding = Math.round((roundedTotal - total) * 100) / 100;

            const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

            // 1. Create Invoice
            const { data: invoice, error: invoiceError } = await supabase
                .from("invoices")
                .insert({
                    invoice_number: invoiceNumber,
                    order_id: activeOrder.id,
                    table_number: activeOrder.table_number,
                    order_type: "dine-in",
                    subtotal,
                    cgst,
                    sgst,
                    discount: 0,
                    service_charge: 0,
                    rounding,
                    total: roundedTotal,
                    payment_mode: paymentMode,
                    payment_status: "paid",
                    cashier_name: cashierName || "Admin",
                    customer_name: editableCustomerName.trim(),
                    customer_phone: editableCustomerPhone.trim()
                })
                .select()
                .single();

            if (invoiceError) throw invoiceError;

            // 2. Update Order
            await supabase
                .from("orders")
                .update({
                    status: "completed",
                    payment_mode: paymentMode,
                    biller_name: cashierName || "Admin",
                    customer_name: editableCustomerName.trim(),
                    customer_phone: editableCustomerPhone.trim()
                })
                .eq("id", activeOrder.id);

            // 3. Free Table
            await supabase
                .from("cafe_tables")
                .update({ status: "available", current_order_id: null })
                .eq("id", activeOrder.table_number);

            setCurrentInvoice(invoice as Invoice);
            setShowInvoice(true);
            toast.success("Invoice generated successfully!");
            fetchRecentInvoices();

        } catch (error) {
            console.error(error);
            toast.error("Failed to generate invoice");
        } finally {
            setGenerating(false);
        }
    };

    const handleUpdateInvoice = async () => {
        if (!editingInvoice) return;
        setUpdating(true);

        try {
            // Update Invoices Table
            const { error: invError } = await supabase
                .from("invoices")
                .update({
                    cashier_name: editingInvoice.cashier_name,
                    customer_name: editingInvoice.customer_name,
                    customer_phone: editingInvoice.customer_phone
                })
                .eq("id", editingInvoice.id);

            if (invError) throw invError;

            // Update Orders Table
            const { error: orderError } = await supabase
                .from("orders")
                .update({
                    customer_name: editingInvoice.customer_name,
                    customer_phone: editingInvoice.customer_phone
                })
                .eq("id", editingInvoice.order_id);

            if (orderError) throw orderError;

            toast.success("Invoice updated successfully");
            setEditingInvoice(null);
            fetchRecentInvoices();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update invoice");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-serif font-bold">Quick Billings</h1>
                <p className="text-muted-foreground">Enter table number to generate final bill</p>
            </div>

            <Card className="border-2 shadow-lg">
                <CardContent className="p-8">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <TableIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="number"
                                placeholder="Enter Table Number (e.g. 5)"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="pl-11 h-12 text-lg font-bold rounded-xl"
                                onKeyDown={(e) => e.key === 'Enter' && searchTable()}
                            />
                        </div>
                        <Button
                            onClick={searchTable}
                            disabled={loading}
                            className="h-12 px-8 rounded-xl font-bold"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Find Order"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AnimatePresence>
                {activeOrder && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Order summary */}
                            <Card className="border-2 shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-primary" />
                                        Order Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        {activeOrder.order_items.map((item) => (
                                            <div key={item.id} className="flex justify-between text-sm">
                                                <span>{item.menu_items.name} x {item.quantity}</span>
                                                <span className="font-mono">₹{(item.quantity * item.price_at_order).toFixed(0)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t pt-4 flex justify-between items-center">
                                        <span className="font-bold text-lg font-serif">Subtotal</span>
                                        <span className="text-2xl font-serif font-bold text-primary">₹{Number(activeOrder.total_price).toFixed(0)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Customer & Payment Details */}
                            <Card className="border-2 shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-primary" />
                                        Billing Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <p className="text-xs text-muted-foreground font-bold uppercase">Customer Name</p>
                                            <Input
                                                value={editableCustomerName}
                                                onChange={(e) => setEditableCustomerName(e.target.value)}
                                                placeholder="Customer Name"
                                                className="font-bold rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-xs text-muted-foreground font-bold uppercase">Phone Number</p>
                                            <Input
                                                value={editableCustomerPhone}
                                                onChange={(e) => setEditableCustomerPhone(e.target.value)}
                                                placeholder="Phone Number"
                                                className="font-mono font-bold rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs text-muted-foreground font-bold uppercase">Payment Mode</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {["cash", "upi", "card"].map((mode) => (
                                                <Button
                                                    key={mode}
                                                    variant={paymentMode === mode ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setPaymentMode(mode as any)}
                                                    className="capitalize font-bold rounded-lg"
                                                >
                                                    {mode}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground font-bold uppercase">Cashier Name</label>
                                        <Input
                                            value={cashierName}
                                            onChange={(e) => setCashierName(e.target.value)}
                                            placeholder="Cashier Name"
                                            className="font-bold rounded-xl"
                                        />
                                    </div>

                                    <Button
                                        className="w-full h-12 rounded-xl text-lg font-bold"
                                        disabled={generating}
                                        onClick={handleBillGeneration}
                                    >
                                        {generating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Printer className="h-5 w-5 mr-2" />}
                                        Generate & Print Bill
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sync with Tables page invoice design */}
            <AnimatePresence>
                {showInvoice && currentInvoice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6" ref={invoiceRef}>
                                <div className="header text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                                    <div className="logo text-2xl font-serif font-bold text-primary">CAFE REPUBLIC</div>
                                    <div className="tagline text-xs text-muted-foreground mt-1">Where Every Sip Tells a Story</div>
                                    <div className="legal text-[10px] text-muted-foreground mt-3 space-y-0.5">
                                        <p>GSTIN: 27AXXXX1234X1ZX</p>
                                        <p>FSSAI: 11523026000XXX</p>
                                        <p>Wardha Rd, below Chhatrapati Square Metro Station</p>
                                        <p>beside Santaji Mahavidyalaya, New Sneh Nagar</p>
                                        <p>Nagpur, Maharashtra 440015</p>
                                        <p>Ph: +91 98765 43210</p>
                                    </div>
                                </div>

                                <div className="meta text-xs border-b border-dashed border-gray-300 pb-3 mb-3">
                                    <div className="grid grid-cols-2 gap-1">
                                        <p><strong>Invoice:</strong> {currentInvoice.invoice_number}</p>
                                        <p><strong>Table:</strong> {currentInvoice.table_number}</p>
                                        {editableCustomerName && (
                                            <p className="col-span-2 text-primary font-bold"><strong>Customer:</strong> {editableCustomerName}</p>
                                        )}
                                        {editableCustomerPhone && (
                                            <p className="col-span-2 text-primary font-bold"><strong>Phone:</strong> {editableCustomerPhone}</p>
                                        )}
                                        <p><strong>Date:</strong> {new Date().toLocaleDateString("en-IN")}</p>
                                        <p><strong>Time:</strong> {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                                        <p><strong>Type:</strong> Dine-In</p>
                                        <p><strong>Cashier:</strong> {cashierName || 'Admin'}</p>
                                    </div>
                                </div>

                                <div className="items mb-3">
                                    <div className="flex justify-between text-xs font-bold border-b border-gray-200 pb-1 mb-2">
                                        <span className="w-1/2">Item</span>
                                        <span className="w-1/6 text-center">Qty</span>
                                        <span className="w-1/6 text-right">Rate</span>
                                        <span className="w-1/6 text-right">Amt</span>
                                    </div>
                                    {activeOrder?.order_items.map(item => (
                                        <div key={item.id} className="flex justify-between text-xs py-1">
                                            <span className="w-1/2 line-clamp-1">{item.menu_items.name}</span>
                                            <span className="w-1/6 text-center">{item.quantity}</span>
                                            <span className="w-1/6 text-right">₹{item.price_at_order}</span>
                                            <span className="w-1/6 text-right">₹{item.price_at_order * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="totals border-t border-dashed border-gray-300 pt-3">
                                    <div className="flex justify-between text-xs py-0.5">
                                        <span>Subtotal</span>
                                        <span>₹{currentInvoice.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-xs py-0.5 text-muted-foreground">
                                        <span>CGST (2.5%)</span>
                                        <span>₹{currentInvoice.cgst}</span>
                                    </div>
                                    <div className="flex justify-between text-xs py-0.5 text-muted-foreground">
                                        <span>SGST (2.5%)</span>
                                        <span>₹{currentInvoice.sgst}</span>
                                    </div>
                                    {currentInvoice.rounding !== 0 && (
                                        <div className="flex justify-between text-xs py-0.5 text-muted-foreground">
                                            <span>Rounding</span>
                                            <span>₹{currentInvoice.rounding}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold border-t-2 border-gray-900 pt-2 mt-2">
                                        <span>TOTAL</span>
                                        <span>₹{currentInvoice.total}</span>
                                    </div>
                                    <div className="flex justify-between text-xs py-1 bg-green-50 px-2 rounded mt-2">
                                        <span className="font-medium text-green-700">Payment: {currentInvoice.payment_mode?.toUpperCase()}</span>
                                        <span className="font-bold text-green-700">PAID</span>
                                    </div>
                                </div>

                                <div className="footer text-center border-t-2 border-dashed border-gray-300 pt-4 mt-4">
                                    <img src="/qr-code.png" alt="QR Code" className="mx-auto w-24 h-24 mb-3" />
                                    <p className="text-xs font-medium">Thank You for Visiting!</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">Follow us @caferepublic</p>
                                    <p className="text-[10px] text-muted-foreground">Open Daily: 10AM - 10PM</p>
                                    <p className="text-[8px] text-muted-foreground mt-2">System generated invoice</p>
                                    <p className="text-[8px] text-muted-foreground">Prices inclusive of applicable taxes</p>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-3">
                                <Button
                                    onClick={printInvoice}
                                    className="flex-1 h-12 rounded-xl"
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Invoice
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowInvoice(false);
                                        setCurrentInvoice(null);
                                        setActiveOrder(null);
                                        setTableNumber("");
                                    }}
                                    variant="outline"
                                    className="h-12 rounded-xl"
                                >
                                    Done
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Recent Invoices Section */}
            <div className="pt-8 border-t">
                <div className="flex items-center gap-2 mb-6">
                    <History className="h-6 w-6 text-primary" />
                    <h2 className="text-xl font-serif font-bold">Recently Billed</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentInvoices.map((inv) => (
                        <Card key={inv.id} className="border-2 hover:border-primary/30 transition-colors">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-mono text-sm font-bold text-primary">{inv.invoice_number}</p>
                                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase font-bold">Table {inv.table_number}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-foreground">{inv.customer_name || inv.orders?.customer_name || 'Walk-in'}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            {(inv.customer_phone || inv.orders?.customer_phone) ? `📞 ${inv.customer_phone || inv.orders?.customer_phone}` : 'No Phone'}
                                        </span>
                                        <span className="mt-1 text-xs text-muted-foreground">Cashier: <strong>{inv.cashier_name || 'Admin'}</strong></span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(inv.generated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <p className="text-lg font-serif font-bold">₹{inv.total}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-lg h-8"
                                        onClick={() => setEditingInvoice({
                                            id: inv.id,
                                            order_id: inv.order_id,
                                            cashier_name: inv.cashier_name || 'Admin',
                                            customer_name: inv.orders?.customer_name || '',
                                            customer_phone: inv.orders?.customer_phone || ''
                                        })}
                                    >
                                        <Edit3 className="h-3.5 w-3.5 mr-1" />
                                        Update
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Edit Invoice Dialog */}
            <AnimatePresence>
                {editingInvoice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-6 relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setEditingInvoice(null)}
                                className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="text-center space-y-1">
                                <h3 className="text-xl font-serif font-bold">Update Bill Info</h3>
                                <p className="text-sm text-muted-foreground">Modify details for {editingInvoice.invoice_number}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Customer Name</label>
                                    <Input
                                        value={editingInvoice.customer_name}
                                        onChange={(e) => setEditingInvoice({ ...editingInvoice, customer_name: e.target.value })}
                                        placeholder="Customer Name"
                                        className="rounded-xl font-bold"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Customer Phone</label>
                                    <Input
                                        value={editingInvoice.customer_phone}
                                        onChange={(e) => setEditingInvoice({ ...editingInvoice, customer_phone: e.target.value })}
                                        placeholder="Phone Number"
                                        className="rounded-xl font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Cashier Name</label>
                                    <Input
                                        value={editingInvoice.cashier_name}
                                        onChange={(e) => setEditingInvoice({ ...editingInvoice, cashier_name: e.target.value })}
                                        placeholder="Cashier Name"
                                        className="rounded-xl font-bold"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-xl"
                                    onClick={() => setEditingInvoice(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 rounded-xl bg-primary font-bold"
                                    onClick={handleUpdateInvoice}
                                    disabled={updating}
                                >
                                    {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Changes"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
