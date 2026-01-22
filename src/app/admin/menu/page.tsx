"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Leaf, 
  Flame, 
  Star,
  Loader2,
  Image as ImageIcon,
  FolderPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_vegetarian: boolean;
  is_spicy: boolean;
  is_bestseller: boolean;
  is_available: boolean;
};

const defaultCategories = [
  "Appetizers",
  "Pasta", 
  "Grilled Sandwich",
  "Open Sandwich",
  "Pizza",
  "Hot Coffee",
  "Cold Coffee",
  "Cold Brew",
  "Mocktails",
  "On The Rocks",
  "Shakes",
  "Hot Beverages",
  "Desserts",
  "Water & Soft Drinks"
];

export default function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Hot Coffee",
    image_url: "",
    is_vegetarian: false,
    is_spicy: false,
    is_bestseller: false,
    is_available: true
  });

  useEffect(() => {
    fetchItems();
    loadCategories();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load menu items");
    else setItems(data || []);
    setLoading(false);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from("menu_items")
      .select("category");
    
    if (data) {
      const uniqueCategories = [...new Set(data.map(d => d.category).filter(Boolean))];
      const allCategories = [...new Set([...defaultCategories, ...uniqueCategories])];
      setCategories(allCategories);
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter category name");
      return;
    }

    if (categories.includes(newCategoryName.trim())) {
      toast.error("Category already exists");
      return;
    }

    setCategories(prev => [...prev, newCategoryName.trim()]);
    setFormData(prev => ({ ...prev, category: newCategoryName.trim() }));
    setNewCategoryName("");
    setShowAddCategoryDialog(false);
    toast.success("Category added successfully!");
  };

  const handleOpenDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price.toString(),
        category: item.category,
        image_url: item.image_url || "",
        is_vegetarian: item.is_vegetarian,
        is_spicy: item.is_spicy,
        is_bestseller: item.is_bestseller,
        is_available: item.is_available
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "Hot Coffee",
        image_url: "",
        is_vegetarian: false,
        is_spicy: false,
        is_bestseller: false,
        is_available: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error("Name and price are required");
      return;
    }

    const itemData = {
      ...formData,
      price: parseFloat(formData.price)
    };

    if (editingItem) {
      const { error } = await supabase
        .from("menu_items")
        .update(itemData)
        .eq("id", editingItem.id);

      if (error) toast.error("Failed to update item");
      else {
        toast.success("Item updated successfully");
        setIsDialogOpen(false);
        fetchItems();
        loadCategories();
      }
    } else {
      const { error } = await supabase
        .from("menu_items")
        .insert([itemData]);

      if (error) toast.error("Failed to add item");
      else {
        toast.success("Item added successfully");
        setIsDialogOpen(false);
        fetchItems();
        loadCategories();
      }
    }
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ is_available: !current })
      .eq("id", id);

    if (error) toast.error("Failed to update availability");
    else fetchItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id);

    if (error) toast.error("Failed to delete item");
    else {
      toast.success("Item deleted");
      fetchItems();
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddCategoryDialog(true)} className="rounded-xl">
            <FolderPlus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="rounded-xl font-bold">
                <Plus className="mr-2 h-4 w-4" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Item Name</label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Mocha Latte" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Price (₹)</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="150" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Category</label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => setFormData({...formData, category: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Description</label>
                  <textarea 
                    className="w-full rounded-md border p-2 text-sm focus:ring-1 focus:ring-primary"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Tell us about this item..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Image URL</label>
                  <Input 
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    placeholder="https://..." 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="veg" 
                      checked={formData.is_vegetarian}
                      onCheckedChange={(v) => setFormData({...formData, is_vegetarian: !!v})}
                    />
                    <label htmlFor="veg" className="text-sm font-medium">Vegetarian</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="spicy" 
                      checked={formData.is_spicy}
                      onCheckedChange={(v) => setFormData({...formData, is_spicy: !!v})}
                    />
                    <label htmlFor="spicy" className="text-sm font-medium">Spicy</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="bestseller" 
                      checked={formData.is_bestseller}
                      onCheckedChange={(v) => setFormData({...formData, is_bestseller: !!v})}
                    />
                    <label htmlFor="bestseller" className="text-sm font-medium">Bestseller</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="available" 
                      checked={formData.is_available}
                      onCheckedChange={(v) => setFormData({...formData, is_available: !!v})}
                    />
                    <label htmlFor="available" className="text-sm font-medium">Available</label>
                  </div>
                </div>
                <DialogFooter className="pt-6">
                  <Button type="submit" className="w-full rounded-xl">
                    {editingItem ? "Save Changes" : "Create Item"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Add New Category
            </DialogTitle>
            <DialogDescription>
              Create a new menu category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input 
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Smoothies, Burgers"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Existing Categories:</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <span key={cat} className="text-xs bg-muted px-2 py-1 rounded-full">{cat}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>
              Add Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="col-span-full flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/20">
              <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="font-medium text-muted-foreground">No menu items found</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className={cn(
                  "overflow-hidden border-none shadow-sm transition-opacity",
                  !item.is_available && "opacity-60"
                )}>
                  <CardContent className="flex gap-4 p-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <img 
                        src={item.image_url || `https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=200&auto=format&fit=crop`} 
                        alt={item.name} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                    
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold">{item.name}</h3>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.category}</span>
                          </div>
                          <span className="text-lg font-serif font-bold text-primary">₹{Number(item.price).toFixed(0)}</span>
                        </div>
                        <div className="mt-2 flex gap-3">
                          {item.is_vegetarian && <Leaf className="h-3 w-3 text-green-500" />}
                          {item.is_spicy && <Flame className="h-3 w-3 text-red-500" />}
                          {item.is_bestseller && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-full text-blue-600 hover:bg-blue-50"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-full text-red-600 hover:bg-red-50"
                            onClick={() => deleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={cn(
                            "h-9 rounded-xl border-2 px-4 text-xs font-bold uppercase tracking-widest",
                            item.is_available ? "border-green-100 text-green-600 hover:bg-green-50" : "border-red-100 text-red-600 hover:bg-red-50"
                          )}
                          onClick={() => toggleAvailability(item.id, item.is_available)}
                        >
                          {item.is_available ? <><Eye className="mr-2 h-4 w-4" /> Active</> : <><EyeOff className="mr-2 h-4 w-4" /> Hidden</>}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// sync: 2026-01-23 00:35:39
