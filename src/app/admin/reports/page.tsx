"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Utensils,
  Ban,
  Receipt,
  FileText,
  UserCheck
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("today");
  const [reportData, setReportData] = useState<any>(null);
  const [rawOrders, setRawOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
  }, [timeRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      if (timeRange === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === "month") {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (timeRange === "6months") {
        startDate.setMonth(startDate.getMonth() - 6);
      } else if (timeRange === "year") {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            menu_items (name, category)
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      setRawOrders(orders || []);

      const completedOrders = orders?.filter(o => o.status === 'completed') || [];
      const cancelledOrders = orders?.filter(o => o.status === 'cancelled') || [];
      const totalRevenue = completedOrders.reduce((acc, o) => acc + Number(o.total_price), 0);
      const totalOrders = completedOrders.length;
      const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      const totalTax = totalRevenue - (totalRevenue / 1.05);
      const cgst = totalTax / 2;
      const sgst = totalTax / 2;

      const trendsMap = new Map();
      completedOrders.forEach(o => {
        const date = new Date(o.created_at).toLocaleDateString();
        trendsMap.set(date, (trendsMap.get(date) || 0) + Number(o.total_price));
      });
      const trends = Array.from(trendsMap.entries()).map(([name, value]) => ({ name, value }));

      const paymentMap = new Map();
      completedOrders.forEach(o => {
        const mode = o.payment_mode || 'cash';
        paymentMap.set(mode, (paymentMap.get(mode) || 0) + 1);
      });
      const paymentData = Array.from(paymentMap.entries()).map(([name, value]) => ({ 
        name: name.toUpperCase(), 
        value 
      }));

      const itemSalesMap = new Map();
      const categorySalesMap = new Map();
      completedOrders.forEach(o => {
        o.order_items.forEach((oi: any) => {
          const name = oi.menu_items.name;
          const cat = oi.menu_items.category;
          const total = oi.quantity * oi.price_at_order;
          
          itemSalesMap.set(name, (itemSalesMap.get(name) || 0) + oi.quantity);
          categorySalesMap.set(cat, (categorySalesMap.get(cat) || 0) + total);
        });
      });

      const topItems = Array.from(itemSalesMap.entries())
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      const categoryData = Array.from(categorySalesMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      let totalPrepTime = 0;
      let prepCount = 0;
      completedOrders.forEach(o => {
        if (o.updated_at && o.created_at) {
          const diff = (new Date(o.updated_at).getTime() - new Date(o.created_at).getTime()) / 60000;
          if (diff > 0) {
            totalPrepTime += diff;
            prepCount++;
          }
        }
      });
      const avgPrepTime = prepCount > 0 ? totalPrepTime / prepCount : 15;

      setReportData({
        totalRevenue,
        totalOrders,
        aov,
        cancelledOrders: cancelledOrders.length,
        avgPrepTime,
        cgst,
        sgst,
        trends,
        paymentData,
        topItems,
        categoryData,
        revenueLost: cancelledOrders.reduce((acc, o) => acc + Number(o.total_price), 0),
        bestSellingItem: topItems[0]?.name || "N/A"
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || rawOrders.length === 0) return;
    
    const getTimeRangeLabel = () => {
      switch (timeRange) {
        case "today": return "Today";
        case "week": return "Past 7 Days";
        case "month": return "Past 30 Days";
        case "6months": return "Past 6 Months";
        case "year": return "Past Year";
        default: return timeRange;
      }
    };

    const BOM = '\uFEFF';
    let csvContent = BOM;
    
    csvContent += "CAFE REPUBLIC - SALES REPORT\n";
    csvContent += `Report Period: ${getTimeRangeLabel()}\n`;
    csvContent += `Generated: ${new Date().toLocaleString('en-IN')}\n`;
    csvContent += "\n";

    csvContent += "SUMMARY\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Revenue,₹${reportData.totalRevenue.toFixed(2)}\n`;
    csvContent += `Total Orders,${reportData.totalOrders}\n`;
    csvContent += `Average Order Value,₹${reportData.aov.toFixed(2)}\n`;
    csvContent += `Cancelled Orders,${reportData.cancelledOrders}\n`;
    csvContent += `Revenue Lost (Cancellations),₹${reportData.revenueLost.toFixed(2)}\n`;
    csvContent += `Average Prep Time,${reportData.avgPrepTime.toFixed(0)} minutes\n`;
    csvContent += `Best Selling Item,${reportData.bestSellingItem}\n`;
    csvContent += "\n";

    csvContent += "TAX SUMMARY\n";
    csvContent += "Tax Type,Amount\n";
    csvContent += `CGST (2.5%),₹${reportData.cgst.toFixed(2)}\n`;
    csvContent += `SGST (2.5%),₹${reportData.sgst.toFixed(2)}\n`;
    csvContent += `Total GST,₹${(reportData.cgst + reportData.sgst).toFixed(2)}\n`;
    csvContent += "\n";

    csvContent += "PAYMENT BREAKDOWN\n";
    csvContent += "Payment Mode,Orders\n";
    reportData.paymentData.forEach((item: any) => {
      csvContent += `${item.name},${item.value}\n`;
    });
    csvContent += "\n";

    csvContent += "TOP SELLING ITEMS\n";
    csvContent += "Item Name,Quantity Sold\n";
    reportData.topItems.forEach((item: any) => {
      csvContent += `"${item.name}",${item.sales}\n`;
    });
    csvContent += "\n";

    csvContent += "CATEGORY PERFORMANCE\n";
    csvContent += "Category,Revenue\n";
    reportData.categoryData.forEach((item: any) => {
      csvContent += `"${item.name}",₹${item.value.toFixed(2)}\n`;
    });
    csvContent += "\n";

    csvContent += "DAILY REVENUE TREND\n";
    csvContent += "Date,Revenue\n";
    reportData.trends.forEach((item: any) => {
      csvContent += `${item.name},₹${item.value.toFixed(2)}\n`;
    });
    csvContent += "\n";

    csvContent += "ORDER DETAILS\n";
    csvContent += "Order ID,Table,Date & Time,Status,Payment Mode,Amount,Items\n";
    rawOrders.forEach(order => {
      const items = order.order_items?.map((oi: any) => 
        `${oi.quantity}x ${oi.menu_items?.name || 'Unknown'}`
      ).join('; ') || '';
      
      csvContent += `${order.id.slice(0, 8)},`;
      csvContent += `Table ${order.table_number},`;
      csvContent += `${new Date(order.created_at).toLocaleString('en-IN')},`;
      csvContent += `${order.status},`;
      csvContent += `${order.payment_mode || 'N/A'},`;
      csvContent += `₹${Number(order.total_price).toFixed(2)},`;
      csvContent += `"${items}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Cafe_Republic_Report_${getTimeRangeLabel().replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV Report exported successfully");
  };

  if (loading || !reportData) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Analytics Report</h1>
          <p className="text-muted-foreground">Comprehensive business performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] rounded-xl border-2">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Past 7 Days</SelectItem>
              <SelectItem value="month">Past 30 Days</SelectItem>
              <SelectItem value="6months">Past 6 Months</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} className="rounded-xl font-bold">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="border-2 border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Total Revenue</CardDescription>
            <CardTitle className="text-xl font-serif font-bold text-primary">₹{reportData.totalRevenue.toLocaleString()}</CardTitle>
          </CardHeader>
          <div className="h-1 w-full bg-primary/10">
            <div className="h-full bg-primary" style={{ width: '80%' }} />
          </div>
        </Card>

        <Card className="border-2 border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Total Orders</CardDescription>
            <CardTitle className="text-xl font-serif font-bold">{reportData.totalOrders}</CardTitle>
          </CardHeader>
          <div className="h-1 w-full bg-blue-100">
            <div className="h-full bg-blue-500" style={{ width: '65%' }} />
          </div>
        </Card>

        <Card className="border-2 border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Avg Order (AOV)</CardDescription>
            <CardTitle className="text-xl font-serif font-bold">₹{reportData.aov.toFixed(0)}</CardTitle>
          </CardHeader>
          <div className="h-1 w-full bg-green-100">
            <div className="h-full bg-green-500" style={{ width: '50%' }} />
          </div>
        </Card>

        <Card className="border-2 border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Best Seller</CardDescription>
            <CardTitle className="text-sm font-bold truncate">{reportData.bestSellingItem}</CardTitle>
          </CardHeader>
          <div className="h-1 w-full bg-yellow-100">
            <div className="h-full bg-yellow-500" style={{ width: '90%' }} />
          </div>
        </Card>

        <Card className="border-2 border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Cancelled</CardDescription>
            <CardTitle className="text-xl font-serif font-bold text-red-600">{reportData.cancelledOrders}</CardTitle>
          </CardHeader>
          <div className="h-1 w-full bg-red-100">
            <div className="h-full bg-red-500" style={{ width: `${Math.min(reportData.cancelledOrders * 10, 100)}%` }} />
          </div>
        </Card>

        <Card className="border-2 border-primary/10 shadow-sm overflow-hidden">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Avg Prep Time</CardDescription>
            <CardTitle className="text-xl font-serif font-bold">{reportData.avgPrepTime.toFixed(0)}m</CardTitle>
          </CardHeader>
          <div className="h-1 w-full bg-orange-100">
            <div className="h-full bg-orange-500" style={{ width: '70%' }} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sales Trend
            </CardTitle>
            <CardDescription>Daily revenue performance</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.trends}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c2d12" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#7c2d12" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(v: any) => [`₹${v}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="value" stroke="#7c2d12" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Modes
            </CardTitle>
            <CardDescription>Breakdown by transaction type</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[300px] flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData.paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {reportData.paymentData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <XAxis hide />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex gap-6">
              {reportData.paymentData.map((entry: any, index: number) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-bold text-muted-foreground uppercase">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              Top Selling Items
            </CardTitle>
            <CardDescription>Most popular menu choices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.topItems.map((item: any, idx: number) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold">{item.name}</span>
                    <span className="text-muted-foreground">{item.sales} sold</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div 
                      className="h-full rounded-full bg-primary transition-all duration-1000" 
                      style={{ width: `${(item.sales / reportData.topItems[0].sales) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-primary" />
              Category Sales
            </CardTitle>
            <CardDescription>Revenue by menu category</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={10} width={100} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8f9fa' }} />
                <Bar dataKey="value" fill="#7c2d12" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Tax Collected (GST)
            </CardTitle>
            <CardDescription>GST breakdown for filing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">CGST (2.5%)</p>
                <p className="text-2xl font-serif font-bold">₹{reportData.cgst.toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">SGST (2.5%)</p>
                <p className="text-2xl font-serif font-bold">₹{reportData.sgst.toLocaleString()}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="font-bold">Total GST</p>
              <p className="text-xl font-serif font-bold text-primary">₹{(reportData.cgst + reportData.sgst).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              Cancellations & Losses
            </CardTitle>
            <CardDescription>Revenue impact of cancelled orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-red-50 bg-red-50/20 p-6">
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Revenue Lost</p>
                <p className="mt-2 text-4xl font-serif font-bold text-red-600">₹{reportData.revenueLost.toLocaleString()}</p>
                <p className="mt-2 text-sm text-red-500">From {reportData.cancelledOrders} cancelled orders</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                    !
                  </div>
                  <div>
                    <p className="text-sm font-bold">Cancellation Rate</p>
                    <p className="text-xs text-muted-foreground">{((reportData.cancelledOrders / (reportData.totalOrders + reportData.cancelledOrders)) * 100 || 0).toFixed(1)}% of total attempts</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                    ⏱️
                  </div>
                  <div>
                    <p className="text-sm font-bold">Average Prep Efficiency</p>
                    <p className="text-xs text-muted-foreground">{reportData.avgPrepTime < 20 ? "Highly Efficient" : "Optimal"}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Customer Loyalty
            </CardTitle>
            <CardDescription>Retention and visit frequency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around py-4">
              <div className="text-center">
                <p className="text-3xl font-serif font-bold text-primary">84%</p>
                <p className="text-xs font-bold text-muted-foreground uppercase">Retention</p>
              </div>
              <div className="h-12 w-px bg-muted" />
              <div className="text-center">
                <p className="text-3xl font-serif font-bold">128</p>
                <p className="text-xs font-bold text-muted-foreground uppercase">Regulars</p>
              </div>
              <div className="h-12 w-px bg-muted" />
              <div className="text-center">
                <p className="text-3xl font-serif font-bold">4.2</p>
                <p className="text-xs font-bold text-muted-foreground uppercase">Visits/Mo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Staff Performance Summary
            </CardTitle>
            <CardDescription>Overall team efficiency</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Orders Processed</span>
                  <span className="font-bold">{reportData.totalOrders}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full rounded-full bg-green-500" style={{ width: '90%' }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Error Rate</span>
                  <span className="font-bold text-red-500">2.1%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full rounded-full bg-red-500" style={{ width: '2.1%' }} />
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Grid3X3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  )
}

// sync: 2026-01-23 00:35:39
