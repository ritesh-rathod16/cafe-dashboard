"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import {
  LayoutDashboard,
  ShoppingBag,
  Menu as MenuIcon,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Loader2,
  Grid3X3,
  Users,
  User,
  History,
  ChevronDown,
  Store,
  Image as ImageIcon,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  order_id?: string;
  is_read: boolean;
  created_at: string;
};

type UserRole = 'super_admin' | 'employee' | 'cashier';

type EmployeeSession = {
  id: string;
  employee_id: string;
  name: string;
  role: UserRole;
  logged_in_at: string;
};

const SUPER_ADMIN_EMAIL = "caferepublic@gmail.com";

const adminNavItems = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, roles: ['super_admin', 'employee', 'cashier'] },
  { label: "Tables", href: "/admin/tables", icon: Grid3X3, roles: ['super_admin', 'employee', 'cashier'] },
  { label: "Live Orders", href: "/admin/orders", icon: ShoppingBag, roles: ['super_admin', 'employee'] },
  { label: "Menu Management", href: "/admin/menu", icon: MenuIcon, roles: ['super_admin', 'employee'] },
  { label: "Gallery", href: "/admin/gallery", icon: ImageIcon, roles: ['super_admin', 'employee'] },
  { label: "Reports", href: "/admin/reports", icon: BarChart3, roles: ['super_admin', 'employee'] },
  { label: "Settings", href: "/admin/settings", icon: Settings, roles: ['super_admin'] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [employeeSession, setEmployeeSession] = useState<EmployeeSession | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('employee');
  const [userName, setUserName] = useState("Admin User");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const processedEventIds = useRef<Set<string>>(new Set());
  const lastOrderTotals = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const storedSession = localStorage.getItem('employee_session');
      if (storedSession) {
        try {
          const empSession: EmployeeSession = JSON.parse(storedSession);
          if (isMounted) {
            setEmployeeSession(empSession);
            setUserRole(empSession.role as UserRole);
            setUserName(empSession.name);
            setUser({ id: empSession.id, email: empSession.employee_id });
            setLoading(false);
          }
          return;
        } catch (e) {
          localStorage.removeItem('employee_session');
        }
      }

      const browserSupabase = createClient();
      const { data: { session } } = await browserSupabase.auth.getSession();

      if (!session && pathname !== "/admin/login") {
        router.push("/admin/login");
        return;
      }

      if (session && isMounted) {
        setUser(session.user);

        const isSuperAdmin = session.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

        if (session.user.user_metadata?.role) {
          setUserRole(session.user.user_metadata.role as UserRole);
          setUserName(session.user.user_metadata.name || "Employee");
        } else {
          try {
            const { data: adminUser, error } = await browserSupabase
              .from("admin_users")
              .select("*")
              .eq("auth_user_id", session.user.id)
              .maybeSingle();

            if (!error && adminUser) {
              setUserRole(isSuperAdmin ? 'super_admin' : (adminUser.role as UserRole || 'employee'));
              setUserName(adminUser.name || "Admin User");
            } else if (isSuperAdmin) {
              setUserRole('super_admin');
              setUserName("Super Admin");
            }
          } catch (err) {
            console.error("Error fetching admin user:", err);
            if (isSuperAdmin) {
              setUserRole('super_admin');
              setUserName("Super Admin");
            }
          }
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname]); // Only depend on pathname, not router

  useEffect(() => {
    fetchNotifications();

    processedEventIds.current.clear();
    lastOrderTotals.current.clear();

    const browserSupabase = createClient();
    const channel = browserSupabase
      .channel('admin_notifications_realtime_v2')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        const orderId = payload.new.id;
        const eventKey = `insert-${orderId}`;

        if (processedEventIds.current.has(eventKey)) {
          return;
        }
        processedEventIds.current.add(eventKey);

        const orderTotal = Number(payload.new.total_price);
        lastOrderTotals.current.set(orderId, orderTotal);

        const orderSource = payload.new.order_source;
        const isCustomerOrder = orderSource === 'customer_online';
        const timestamp = Date.now();

        const newNotification: Notification = {
          id: `new-order-${orderId}-${timestamp}`,
          title: `New Order - Table ${payload.new.table_number}`,
          message: `₹${orderTotal.toFixed(0)} order received${isCustomerOrder ? ' (Online)' : ''}`,
          type: 'new_order',
          order_id: orderId,
          is_read: false,
          created_at: new Date().toISOString()
        };

        setNotifications(prev => {
          const exists = prev.some(n => n.order_id === orderId && n.type === 'new_order');
          if (exists) return prev;
          return [newNotification, ...prev].slice(0, 20);
        });

        if (isCustomerOrder) {
          playNotificationSound();
          toast.success(`New online order from Table ${payload.new.table_number}!`, {
            duration: 5000,
          });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        const orderId = payload.new.id;
        const newTotal = Number(payload.new.total_price);
        const prevTotal = lastOrderTotals.current.get(orderId) ?? 0;

        if (newTotal <= prevTotal) {
          lastOrderTotals.current.set(orderId, Math.max(newTotal, prevTotal));
          return;
        }

        const eventKey = `update-${orderId}-${newTotal.toFixed(0)}`;
        if (processedEventIds.current.has(eventKey)) {
          return;
        }
        processedEventIds.current.add(eventKey);

        const addedAmount = newTotal - prevTotal;
        lastOrderTotals.current.set(orderId, newTotal);

        const orderSource = payload.new?.order_source;
        const isCustomerOrder = orderSource === 'customer_online';
        const timestamp = Date.now();

        setNotifications(prev => {
          const filtered = prev.filter(n => !(n.order_id === orderId && n.type === 'item_added'));

          const updateNotification: Notification = {
            id: `item-added-${orderId}-${timestamp}`,
            title: `Items Added - Table ${payload.new.table_number}`,
            message: `+₹${addedAmount.toFixed(0)} added. Total: ₹${newTotal.toFixed(0)}`,
            type: 'item_added',
            order_id: orderId,
            is_read: false,
            created_at: new Date().toISOString()
          };

          return [updateNotification, ...filtered].slice(0, 20);
        });

        if (isCustomerOrder) {
          playNotificationSound();
          toast.info(`Table ${payload.new.table_number} added items! (+₹${addedAmount.toFixed(0)})`, {
            duration: 5000,
          });
        }
      })
      .subscribe();

    return () => {
      browserSupabase.removeChannel(channel);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => { });
    } catch (e) { }
  };

  const fetchNotifications = async () => {
    const browserSupabase = createClient();
    const { data } = await browserSupabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) setNotifications(data);
  };

  const markAsRead = async (id: string) => {
    const browserSupabase = createClient();
    await browserSupabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("id", id);

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    const browserSupabase = createClient();
    await browserSupabase
      .from("admin_notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleLogout = async () => {
    if (employeeSession) {
      localStorage.removeItem('employee_session');
      router.push("/admin/login");
      return;
    }

    const browserSupabase = createClient();
    const { data: { user } } = await browserSupabase.auth.getUser();

    if (user) {
      const browserSupabase = createClient();
      const { data: adminUser } = await browserSupabase
        .from("admin_users")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (adminUser) {
        await browserSupabase
          .from("admin_sessions")
          .update({
            logout_at: new Date().toISOString(),
            status: "logged_out"
          })
          .eq("admin_user_id", adminUser.id)
          .eq("status", "active")
          .order("login_at", { ascending: false })
          .limit(1);
      }
    }

    await browserSupabase.auth.signOut();
    router.push("/admin/login");
  };

  const canAccess = (roles: string[]) => {
    return roles.includes(userRole);
  };

  const filteredNavItems = adminNavItems.filter(item => canAccess(item.roles));
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getRoleBadge = (role: UserRole) => {
    const styles: Record<UserRole, string> = {
      super_admin: "bg-purple-100 text-purple-700",
      employee: "bg-blue-100 text-blue-700",
      cashier: "bg-green-100 text-green-700"
    };
    const labels: Record<UserRole, string> = {
      super_admin: "Super Admin",
      employee: "Employee",
      cashier: "Cashier"
    };
    return (
      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold", styles[role])}>
        {labels[role]}
      </span>
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order': return '🆕';
      case 'order_update': return '🔄';
      case 'item_added': return '➕';
      default: return '📢';
    }
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !employeeSession && pathname !== "/admin/login") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r bg-white lg:block">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-secondary">
              <MenuIcon className="h-5 w-5" />
            </div>
            <span className="text-lg font-serif font-bold tracking-tight">CAFE ADMIN</span>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 px-4 backdrop-blur-md lg:px-8">
          <h2 className="text-xl font-bold capitalize">
            {adminNavItems.find(i => i.href === pathname)?.label || "Admin"}
          </h2>

          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <Store className="h-4 w-4" />
              View Store
            </a>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-full p-2 hover:bg-muted transition-colors"
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 top-12 z-50 w-96 rounded-2xl border bg-white shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between border-b p-4 bg-muted/30">
                      <h3 className="font-bold flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                      </h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-primary hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 hover:bg-muted rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <Bell className="mx-auto h-8 w-8 mb-2 opacity-30" />
                          <p className="text-sm">No notifications yet</p>
                          <p className="text-xs mt-1">New orders will appear here</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.order_id) {
                                router.push('/admin/orders');
                                setShowNotifications(false);
                              }
                            }}
                            className={cn(
                              "flex items-start gap-3 p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors",
                              !notif.is_read && "bg-blue-50/50"
                            )}
                          >
                            <div className="text-xl">
                              {getNotificationIcon(notif.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{notif.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(notif.created_at).toLocaleString()}
                              </p>
                            </div>
                            {!notif.is_read && (
                              <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-full border bg-muted/50 p-1 pr-3 hover:bg-muted transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium block">{userName}</span>
                    {getRoleBadge(userRole)}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/admin/profile" className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                {canAccess(['super_admin']) && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/employees" className="cursor-pointer">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Employees
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/admin/login-history" className="cursor-pointer">
                    <History className="h-4 w-4 mr-2" />
                    Login History
                  </Link>
                </DropdownMenuItem>
                {canAccess(['super_admin']) && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
