"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  X,
  Search,
  ShoppingCart,
  Coffee,
  Check,
  Loader2,
  FileText,
  Edit3,
  Printer,
  Eye,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  Trash2,
  Settings,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Table = {
  biller_name?: string;
  is_paid?: boolean;
  id: number;
  status: string;
  current_order_id: string | null;
};

type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string;
};

type CartItem = MenuItem & { quantity: number };

type OrderItem = {
  id: string;
  menu_item_id: string;
  quantity: number;
  price_at_order: number;
  menu_items: { name: string; image_url: string };
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
  order_id: string;
  table_number: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  discount: number;
  service_charge: number;
  rounding: number;
  total: number;
  payment_mode: string;
  cashier_name?: string;
  payment_status: string;
  generated_at: string;
};

const categories = [
  "Water & Soft Drinks", "Appetizers", "Pasta", "Grilled Sandwich", "Open Sandwich", "Pizza",
  "Hot Coffee", "Cold Coffee", "Cold Brew", "Mocktails", "On The Rocks",
  "Shakes", "Hot Beverages", "Desserts"
];

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Water & Soft Drinks");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"new" | "view" | "edit">("new");
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [showQuickPay, setShowQuickPay] = useState(false);
  const [showTableSettings, setShowTableSettings] = useState(false);
  const [tableCount, setTableCount] = useState(50);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [billerName, setBillerName] = useState("");
  const [showCustomerDetailsModal, setShowCustomerDetailsModal] = useState(false);
  const [pendingPaymentMode, setPendingPaymentMode] = useState("");
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTables();
    fetchMenuItems();

    // Get logged-in user name
    const getUserName = async () => {
      const employeeSession = localStorage.getItem('employee_session');
      if (employeeSession) {
        const session = JSON.parse(employeeSession);
        setBillerName(session.name || 'Staff');
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setBillerName(user.user_metadata?.name || user.email?.split('@')[0] || 'Admin');
        }
      }
    };
    getUserName();

    const tablesChannel = supabase
      .channel("tables-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "cafe_tables" }, fetchTables)
      .subscribe();

    return () => {
      supabase.removeChannel(tablesChannel);
    };
  }, []);

  const fetchTables = async () => {
    const { data } = await supabase
      .from("cafe_tables")
      .select("*")
      .order("id");
    if (data) {
      setTables(data);
      setTableCount(data.length);
    }
    setLoading(false);
  };

  const fetchMenuItems = async () => {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_available", true)
      .order("name");
    if (data) setMenuItems(data);
  };

  const addTables = async (count: number) => {
    const currentMax = tables.length > 0 ? Math.max(...tables.map(t => t.id)) : 0;
    const newTables = [];
    for (let i = 1; i <= count; i++) {
      newTables.push({ id: currentMax + i, status: "available", current_order_id: null });
    }

    const { error } = await supabase.from("cafe_tables").insert(newTables);
    if (error) {
      toast.error("Failed to add tables");
    } else {
      toast.success(`Added ${count} tables`);
      fetchTables();
    }
  };

  const removeTables = async (count: number) => {
    const availableTables = tables.filter(t => t.status === "available").sort((a, b) => b.id - a.id);
    if (availableTables.length < count) {
      toast.error(`Can only remove ${availableTables.length} available tables`);
      return;
    }

    const tablesToRemove = availableTables.slice(0, count).map(t => t.id);
    const { error } = await supabase.from("cafe_tables").delete().in("id", tablesToRemove);

    if (error) {
      toast.error("Failed to remove tables");
    } else {
      toast.success(`Removed ${count} tables`);
      fetchTables();
    }
  };





  const fetchOrderForTable = async (table: Table) => {
    if (!table.current_order_id) return null;

    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          menu_item_id,
          quantity,
          price_at_order,
          menu_items (name, image_url)
        )
      `)
      .eq("id", table.current_order_id)
      .single();

    return data as Order | null;
  };

  const openNewOrder = (table: Table) => {
    setSelectedTable(table);
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setModalMode("new");
    setCurrentOrder(null);
    setShowModal(true);
  };

  const openViewOrder = async (table: Table) => {
    setSelectedTable(table);
    const order = await fetchOrderForTable(table);
    if (order) {
      setCurrentOrder(order);
      const cartFromOrder: CartItem[] = order.order_items.map(item => ({
        id: item.menu_item_id,
        name: item.menu_items.name,
        price: item.price_at_order,
        quantity: item.quantity,
        category: "",
        image_url: item.menu_items.image_url
      }));
      setCart(cartFromOrder);
      setModalMode("view");
      setShowModal(true);
    }
  };

  const openEditOrder = async (table: Table) => {
    setSelectedTable(table);
    const order = await fetchOrderForTable(table);
    if (order) {
      setCurrentOrder(order);
      const cartFromOrder: CartItem[] = order.order_items.map(item => ({
        id: item.menu_item_id,
        name: item.menu_items.name,
        price: item.price_at_order,
        quantity: item.quantity,
        category: "",
        image_url: item.menu_items.image_url
      }));
      setCart(cartFromOrder);
      setModalMode("edit");
      setShowModal(true);
    }
  };

  const addToCart = (item: MenuItem) => {
    if (modalMode === "view") return;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    if (modalMode === "view") return;
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, quantity: newQty } : i);
    });
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const submitOrder = async () => {
    if (!selectedTable || cart.length === 0) return;

    setSubmitting(true);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        table_number: selectedTable.id,
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        biller_name: billerName || null,
        status: "new",
        total_price: totalPrice,
        payment_mode: "pending"
      })
      .select()
      .single();

    if (orderError || !order) {
      setSubmitting(false);
      return;
    }

    const orderItems = cart.map(item => ({
      order_id: order.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      price_at_order: item.price
    }));

    await supabase.from("order_items").insert(orderItems);

    await supabase
      .from("cafe_tables")
      .update({ status: "occupied", current_order_id: order.id })
      .eq("id", selectedTable.id);

    setSubmitting(false);
    setShowModal(false);
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setSelectedTable(null);
    fetchTables();
  };

  const updateOrder = async () => {
    if (!selectedTable || !currentOrder || cart.length === 0) return;
    setSubmitting(true);

    await supabase.from("order_items").delete().eq("order_id", currentOrder.id);

    const orderItems = cart.map(item => ({
      order_id: currentOrder.id,
      menu_item_id: item.id,
      quantity: item.quantity,
      price_at_order: item.price
    }));

    await supabase.from("order_items").insert(orderItems);

    await supabase
      .from("orders")
      .update({ total_price: totalPrice })
      .eq("id", currentOrder.id);

    setSubmitting(false);
    setShowModal(false);
    setCart([]);
    setSelectedTable(null);
    setCurrentOrder(null);
    fetchTables();
  };

  const generateInvoice = async (mode: string = paymentMode) => {
    if (!selectedTable || !currentOrder) return;
    setGeneratingInvoice(true);

    const subtotal = totalPrice;
    const cgst = Math.round(subtotal * 0.025 * 100) / 100;
    const sgst = Math.round(subtotal * 0.025 * 100) / 100;
    const total = subtotal + cgst + sgst;
    const roundedTotal = Math.round(total);
    const rounding = Math.round((roundedTotal - total) * 100) / 100;

    const invoiceNumber = `CR-${Date.now().toString(36).toUpperCase()}`;

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        order_id: currentOrder.id,
        table_number: selectedTable.id,
        order_type: "dine-in",
        subtotal,
        cgst,
        sgst,
        discount: 0,
        service_charge: 0,
        rounding,
        total: roundedTotal,
        payment_mode: mode,
        payment_status: "paid",
        cashier_name: billerName || "Admin",
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim()
      })
      .select()
      .single();

    if (error || !invoice) {
      setGeneratingInvoice(false);
      return;
    }

    await supabase.from("payments").insert({
      invoice_id: invoice.id,
      payment_mode: mode,
      paid_amount: roundedTotal
    });

    await supabase
      .from("orders")
      .update({ status: "completed", payment_mode: mode })
      .eq("id", currentOrder.id);

    await supabase
      .from("cafe_tables")
      .update({ status: "available", current_order_id: null })
      .eq("id", selectedTable.id);

    setCurrentInvoice(invoice as Invoice);
    setGeneratingInvoice(false);
    setShowModal(false);
    setShowQuickPay(false);
    setShowInvoice(true);
    fetchTables();
  };

  const handleQuickPay = async (mode: string) => {
    setPendingPaymentMode(mode);
    setShowCustomerDetailsModal(true);
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
          .qr { margin: 10px auto; width: 80px; height: 80px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 8px; }
          @media print { body { padding: 0; } }
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

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold">Table Management</h1>
          <p className="text-muted-foreground">Manage {tables.length} tables - Click to view/add orders</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTableSettings(true)}
            className="rounded-full"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Tables
          </Button>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>Available ({tables.filter(t => t.status === "available").length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <span>Occupied ({tables.filter(t => t.status === "occupied").length})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 sm:grid-cols-8 lg:grid-cols-10">
        {tables.map(table => (
          <motion.div
            key={table.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative cursor-pointer rounded-2xl p-3 text-center transition-all border-2",
              table.status === "available"
                ? "bg-green-50 border-green-200 hover:border-green-400"
                : "bg-orange-50 border-orange-200 hover:border-orange-400"
            )}
            onClick={() => {
              table.status === "available" ? openNewOrder(table) : openViewOrder(table);
            }}
          >
            <div className={cn(
              "text-2xl font-serif font-bold",
              table.status === "available" ? "text-green-700" : "text-orange-700"
            )}>
              {table.id}
            </div>
            <div className={cn(
              "text-[10px] font-medium mt-1",
              table.status === "available" ? "text-green-600" : "text-orange-600"
            )}>
              {table.status === "available" ? "Free" : "Occupied"}
            </div>
            {table.status === "occupied" && (
              <div className="absolute -right-1 -top-1 flex gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); openEditOrder(table); }}
                  className="rounded-full bg-blue-500 p-1 text-white hover:bg-blue-600"
                  title="Edit Order"
                >
                  <Edit3 className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTable(table);
                    fetchOrderForTable(table).then(order => {
                      if (order) {
                        setCurrentOrder(order);
                        const cartFromOrder: CartItem[] = order.order_items.map(item => ({
                          id: item.menu_item_id,
                          name: item.menu_items.name,
                          price: item.price_at_order,
                          quantity: item.quantity,
                          category: "",
                          image_url: item.menu_items.image_url
                        }));
                        setCart(cartFromOrder);
                        setShowQuickPay(true);
                      }
                    });
                  }}
                  className="rounded-full bg-green-500 p-1 text-white hover:bg-green-600"
                  title="Quick Pay & Bill"
                >
                  <Receipt className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Table Settings Modal */}
      <AnimatePresence>
        {showTableSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowTableSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowTableSettings(false)}
                className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-6">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Settings className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-serif font-bold">Manage Tables</h2>
                <p className="text-sm text-muted-foreground mt-1">Add or remove tables from your cafe</p>
              </div>

              <div className="bg-muted/50 rounded-2xl p-4 mb-6">
                <div className="text-center">
                  <p className="text-4xl font-serif font-bold text-primary">{tables.length}</p>
                  <p className="text-sm text-muted-foreground">Current Tables</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <p className="text-xl font-bold text-green-600">{tables.filter(t => t.status === "available").length}</p>
                    <p className="text-xs text-green-700">Available</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-xl">
                    <p className="text-xl font-bold text-orange-600">{tables.filter(t => t.status === "occupied").length}</p>
                    <p className="text-xs text-orange-700">Occupied</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Add Tables</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 5, 10, 20].map(num => (
                      <Button
                        key={num}
                        variant="outline"
                        size="sm"
                        onClick={() => addTables(num)}
                        className="rounded-xl"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Remove Tables (only available ones)</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 5, 10, 20].map(num => (
                      <Button
                        key={num}
                        variant="outline"
                        size="sm"
                        onClick={() => removeTables(num)}
                        className="rounded-xl text-red-600 hover:bg-red-50"
                        disabled={tables.filter(t => t.status === "available").length < num}
                      >
                        <Minus className="h-3 w-3 mr-1" />
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQuickPay && selectedTable && currentOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowQuickPay(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowQuickPay(false)}
                className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-6">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Receipt className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-serif font-bold">Quick Pay - Table {selectedTable.id}</h2>
                <p className="text-sm text-muted-foreground mt-1">{cart.length} items</p>
              </div>

              <div className="bg-muted/50 rounded-2xl p-4 mb-6">
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="line-clamp-1">{item.name} x{item.quantity}</span>
                      <span className="font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-300 mt-3 pt-3 flex justify-between">
                  <span className="font-bold">Total (incl. GST)</span>
                  <span className="text-xl font-serif font-bold text-primary">
                    ₹{Math.round(totalPrice * 1.05)}
                  </span>
                </div>
              </div>

              <p className="text-sm font-medium mb-3 text-center">Select Payment Method</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleQuickPay("cash")}
                  disabled={generatingInvoice}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-green-200 bg-green-50 p-4 transition-all hover:border-green-400 hover:bg-green-100 disabled:opacity-50"
                >
                  <Banknote className="h-8 w-8 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Cash</span>
                </button>
                <button
                  onClick={() => handleQuickPay("upi")}
                  disabled={generatingInvoice}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-purple-200 bg-purple-50 p-4 transition-all hover:border-purple-400 hover:bg-purple-100 disabled:opacity-50"
                >
                  <Smartphone className="h-8 w-8 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">UPI</span>
                </button>
                <button
                  onClick={() => handleQuickPay("card")}
                  disabled={generatingInvoice}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 p-4 transition-all hover:border-blue-400 hover:bg-blue-100 disabled:opacity-50"
                >
                  <CreditCard className="h-8 w-8 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Card</span>
                </button>
              </div>

              {generatingInvoice && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating invoice...</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && selectedTable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex h-[85vh]">
                <div className="flex-1 overflow-y-auto border-r p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-serif font-bold">
                        {modalMode === "new" ? "New Order" : modalMode === "edit" ? "Edit Order" : "View Order"} - Table {selectedTable.id}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {modalMode === "view" ? "View current order - Pay to close table" : "Select items from menu"}
                      </p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="rounded-full p-2 hover:bg-muted">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {modalMode !== "view" && (
                    <>
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search menu..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="pl-10 rounded-xl"
                        />
                      </div>

                      <div className="mb-4 flex flex-wrap gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={cn(
                              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                              selectedCategory === cat
                                ? "bg-primary text-white"
                                : "bg-muted hover:bg-muted/80"
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                        {filteredItems.map(item => (
                          <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.02 }}
                            className="cursor-pointer rounded-xl border bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                            onClick={() => addToCart(item)}
                          >
                            <div className="aspect-[4/3] overflow-hidden rounded-lg mb-2">
                              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            </div>
                            <h3 className="font-medium text-sm line-clamp-1">{item.name}</h3>
                            <p className="text-primary font-bold text-sm">₹{item.price}</p>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}

                  {modalMode === "view" && (
                    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
                      <Eye className="h-16 w-16 mb-4 text-muted-foreground/30" />
                      <h3 className="text-lg font-bold">Order Summary</h3>
                      <p className="text-muted-foreground">View items on the right panel</p>
                      <p className="text-sm mt-2 text-orange-600 font-medium">Order cannot be deleted until paid</p>
                    </div>
                  )}
                </div>

                <div className="w-80 flex flex-col bg-muted/30">
                  <div className="border-b p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-3">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold">Table {selectedTable.id}</h3>
                        <p className="text-xs text-muted-foreground">{cart.length} items • {modalMode}</p>
                      </div>
                    </div>

                    {modalMode !== "view" && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Customer Name (Optional)
                          </label>
                          <Input
                            placeholder="Enter customer name..."
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                            Customer Phone (Optional)
                          </label>
                          <Input
                            placeholder="Enter phone number..."
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            type="tel"
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    {cart.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                        <Coffee className="h-12 w-12 mb-3 opacity-30" />
                        <p className="text-sm">No items added yet</p>
                        <p className="text-xs">Click on items to add them</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cart.map(item => (
                          <div key={item.id} className="rounded-xl bg-white p-3 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                                <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                              </div>
                              {modalMode !== "view" ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="rounded-full bg-muted p-1 hover:bg-muted/80"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="rounded-full bg-muted p-1 hover:bg-muted/80"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="font-bold text-sm">x{item.quantity}</span>
                              )}
                            </div>
                            <div className="mt-2 flex justify-between text-sm">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span className="font-bold">₹{item.price * item.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t bg-white p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-serif font-bold text-primary">₹{totalPrice}</span>
                    </div>

                    {modalMode === "view" && (
                      <div className="mb-4">
                        <label className="text-sm font-medium mb-2 block">Payment Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { mode: "cash", icon: Banknote, color: "green" },
                            { mode: "upi", icon: Smartphone, color: "purple" },
                            { mode: "card", icon: CreditCard, color: "blue" }
                          ].map(({ mode, icon: Icon, color }) => (
                            <button
                              key={mode}
                              onClick={() => setPaymentMode(mode)}
                              className={cn(
                                "rounded-lg py-2 px-1 text-xs font-medium transition-colors capitalize flex flex-col items-center gap-1",
                                paymentMode === mode
                                  ? `bg-${color}-100 text-${color}-700 border-2 border-${color}-400`
                                  : "bg-muted hover:bg-muted/80"
                              )}
                              style={{
                                backgroundColor: paymentMode === mode ? `var(--${color}-100, #dcfce7)` : undefined,
                                borderColor: paymentMode === mode ? `var(--${color}-400, #4ade80)` : undefined
                              }}
                            >
                              <Icon className="h-4 w-4" />
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {modalMode === "new" && (
                      <Button
                        onClick={submitOrder}
                        disabled={cart.length === 0 || submitting}
                        className="w-full h-12 rounded-xl"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Placing Order...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Place Order
                          </>
                        )}
                      </Button>
                    )}

                    {modalMode === "edit" && (
                      <Button
                        onClick={updateOrder}
                        disabled={cart.length === 0 || submitting}
                        className="w-full h-12 rounded-xl"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Update Order
                          </>
                        )}
                      </Button>
                    )}

                    {modalMode === "view" && (
                      <div className="space-y-2">
                        <Button
                          onClick={() => { setModalMode("edit"); }}
                          variant="outline"
                          className="w-full h-10 rounded-xl"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Order
                        </Button>
                        <Button
                          onClick={() => {
                            setPendingPaymentMode(paymentMode);
                            setShowCustomerDetailsModal(true);
                          }}
                          disabled={cart.length === 0 || generatingInvoice}
                          className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700"
                        >
                          {generatingInvoice ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              Pay & Generate Bill
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showInvoice && currentInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowInvoice(false)}
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
                    {customerName && (
                      <p className="col-span-2 text-primary font-bold"><strong>Customer:</strong> {customerName}</p>
                    )}
                    {customerPhone && (
                      <p className="col-span-2 text-primary font-bold"><strong>Phone:</strong> {customerPhone}</p>
                    )}
                    <p><strong>Date:</strong> {new Date(currentInvoice.generated_at).toLocaleDateString("en-IN")}</p>
                    <p><strong>Time:</strong> {new Date(currentInvoice.generated_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                    <p><strong>Type:</strong> Dine-In</p>
                    <p><strong>Cashier:</strong> {currentInvoice.cashier_name || billerName || 'Admin'}</p>
                  </div>
                </div>

                <div className="items mb-3">
                  <div className="flex justify-between text-xs font-bold border-b border-gray-200 pb-1 mb-2">
                    <span className="w-1/2">Item</span>
                    <span className="w-1/6 text-center">Qty</span>
                    <span className="w-1/6 text-right">Rate</span>
                    <span className="w-1/6 text-right">Amt</span>
                  </div>
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-xs py-1">
                      <span className="w-1/2 line-clamp-1">{item.name}</span>
                      <span className="w-1/6 text-center">{item.quantity}</span>
                      <span className="w-1/6 text-right">₹{item.price}</span>
                      <span className="w-1/6 text-right">₹{item.price * item.quantity}</span>
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
                    <span className="font-medium text-green-700">Payment: {currentInvoice.payment_mode.toUpperCase()}</span>
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
                  onClick={() => { setShowInvoice(false); setCurrentInvoice(null); setCart([]); }}
                  variant="outline"
                  className="h-12 rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Details Modal - Before Payment */}
      <AnimatePresence>
        {showCustomerDetailsModal && (
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
              className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowCustomerDetailsModal(false)}
                className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center mb-6">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-serif font-bold">Customer Details</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Please enter customer information before payment
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter customer name..."
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="rounded-xl"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Customer Phone <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter phone number..."
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    type="tel"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Cashier/Biller Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Enter cashier name..."
                    value={billerName}
                    onChange={e => setBillerName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomerDetailsModal(false)}
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!customerName.trim()) {
                        toast.error("Please enter customer name");
                        return;
                      }
                      if (!customerPhone.trim()) {
                        toast.error("Please enter customer phone");
                        return;
                      }
                      if (!billerName.trim()) {
                        toast.error("Please enter cashier/biller name");
                        return;
                      }

                      // Update order with customer details
                      if (currentOrder) {
                        await supabase
                          .from("orders")
                          .update({
                            customer_name: customerName.trim(),
                            customer_phone: customerPhone.trim(),
                            biller_name: billerName.trim()
                          })
                          .eq("id", currentOrder.id);
                      }

                      setShowCustomerDetailsModal(false);
                      setPaymentMode(pendingPaymentMode);
                      await generateInvoice(pendingPaymentMode);
                    }}
                    className="flex-1 rounded-xl bg-primary"
                    disabled={generatingInvoice}
                  >
                    {generatingInvoice ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      "Proceed to Payment"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
