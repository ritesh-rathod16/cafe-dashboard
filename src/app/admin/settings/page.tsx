"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Settings,
  Table as TableIcon,
  Plus,
  Minus,
  Save,
  Store,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminSettings() {
  const [totalTables, setTotalTables] = useState(50);
  const [cafeName, setCafeName] = useState("Cafe Republic");
  const [phone, setPhone] = useState("+91 87888 39229");
  const [address, setAddress] = useState("Wardha Rd, Nagpur, Maharashtra 440015");
  const [gstin, setGstin] = useState("");
  const [fssai, setFssai] = useState("");
  const [tagline, setTagline] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTableCount, setCurrentTableCount] = useState(0);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data: settings } = await supabase
      .from("cafe_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (settings) {
      setTotalTables(settings.total_tables);
      setCafeName(settings.cafe_name || "Cafe Republic");
      setPhone(settings.phone || "+91 87888 39229");
      setAddress(settings.address || "Wardha Rd, Nagpur, Maharashtra 440015");
      setGstin(settings.gstin || "");
      setFssai(settings.fssai || "");
      setTagline(settings.tagline || "");
    }

    const { count } = await supabase
      .from("cafe_tables")
      .select("*", { count: "exact", head: true });

    setCurrentTableCount(count || 0);
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await supabase
        .from("cafe_settings")
        .update({
          total_tables: totalTables,
          cafe_name: cafeName,
          phone: phone,
          address: address,
          gstin: gstin,
          fssai: fssai,
          tagline: tagline,
          updated_at: new Date().toISOString()
        })
        .eq("id", 1);

      if (totalTables > currentTableCount) {
        const newTables = [];
        for (let i = currentTableCount + 1; i <= totalTables; i++) {
          newTables.push({ id: i, table_number: i, capacity: 4, status: 'available' });
        }
        if (newTables.length > 0) {
          await supabase.from("cafe_tables").insert(newTables);
        }
      } else if (totalTables < currentTableCount) {
        const { data: occupiedTables } = await supabase
          .from("cafe_tables")
          .select("id")
          .gt("id", totalTables)
          .eq("status", "occupied");

        if (occupiedTables && occupiedTables.length > 0) {
          toast.error(`Cannot reduce tables. ${occupiedTables.length} tables above #${totalTables} are currently occupied.`);
          setSaving(false);
          return;
        }

        await supabase
          .from("cafe_tables")
          .delete()
          .gt("id", totalTables);
      }

      setCurrentTableCount(totalTables);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage cafe settings and configuration</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cafe Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Cafe Information
            </CardTitle>
            <CardDescription>Basic cafe details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cafeName">Cafe Name</Label>
                <Input
                  id="cafeName"
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  placeholder="Enter cafe name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 00000 00000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline (optional)</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Where Every Sip Tells a Story"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN (optional)</Label>
                <Input
                  id="gstin"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="27AXXXX1234X1ZX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fssai">FSSAI Number (optional)</Label>
                <Input
                  id="fssai"
                  value={fssai}
                  onChange={(e) => setFssai(e.target.value)}
                  placeholder="11523026000XXX"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5" />
              Table Management
            </CardTitle>
            <CardDescription>Add or reduce the number of tables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setTotalTables(Math.max(1, totalTables - 1))}
                disabled={totalTables <= 1}
              >
                <Minus className="h-6 w-6" />
              </Button>

              <div className="text-center">
                <div className="text-5xl font-serif font-bold text-primary">{totalTables}</div>
                <p className="text-sm text-muted-foreground mt-1">Total Tables</p>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setTotalTables(totalTables + 1)}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>

            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Current tables in database: <span className="font-bold text-foreground">{currentTableCount}</span>
              </p>
              {totalTables !== currentTableCount && (
                <p className="text-xs text-orange-600 mt-1">
                  {totalTables > currentTableCount
                    ? `${totalTables - currentTableCount} new tables will be added`
                    : `${currentTableCount - totalTables} tables will be removed`}
                </p>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[10, 20, 30, 40, 50].map((num) => (
                <Button
                  key={num}
                  variant={totalTables === num ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTotalTables(num)}
                  className="font-bold"
                >
                  {num}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="h-12 px-8 rounded-full font-bold"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
