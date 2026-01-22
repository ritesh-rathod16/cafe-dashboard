"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

type GalleryCategory = {
  id: string;
  name: string;
};

type GalleryImage = {
  id: string;
  image_url: string;
  alt_text: string;
  category_id: string;
  category?: GalleryCategory;
};

const defaultImages = [
  { src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop", alt: "Coffee Pour", category: "Coffee" },
  { src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop", alt: "Latte Art", category: "Coffee" },
  { src: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=1200&auto=format&fit=crop", alt: "Cafe Interior", category: "Ambiance" },
  { src: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop", alt: "Pastry Display", category: "Food" },
  { src: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=1200&auto=format&fit=crop", alt: "Coffee Beans", category: "Coffee" },
  { src: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?q=80&w=1200&auto=format&fit=crop", alt: "Cappuccino", category: "Coffee" },
  { src: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=1200&auto=format&fit=crop", alt: "Croissants", category: "Food" },
  { src: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=1200&auto=format&fit=crop", alt: "Pizza", category: "Food" },
  { src: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=1200&auto=format&fit=crop", alt: "Cozy Corner", category: "Ambiance" },
  { src: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1200&auto=format&fit=crop", alt: "Coffee Counter", category: "Ambiance" },
  { src: "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1200&auto=format&fit=crop", alt: "Pasta", category: "Food" },
  { src: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=1200&auto=format&fit=crop", alt: "Cold Brew", category: "Coffee" },
];

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    const { data: catData } = await supabase
      .from("gallery_categories")
      .select("*")
      .order("name");
    
    const { data: imgData } = await supabase
      .from("gallery_images")
      .select(`*, category:gallery_categories(*)`)
      .order("created_at", { ascending: false });

    if (catData) setCategories(catData);
    if (imgData && imgData.length > 0) {
      setImages(imgData);
    }
    setLoading(false);
  };

  const displayImages = images.length > 0 
    ? images.map(img => ({
        src: img.image_url,
        alt: img.alt_text,
        category: img.category?.name || "Uncategorized"
      }))
    : defaultImages;

  const displayCategories = categories.length > 0 
    ? ["All", ...categories.map(c => c.name)]
    : ["All", "Coffee", "Food", "Ambiance"];

  const filteredImages = selectedCategory === "All" 
    ? displayImages 
    : displayImages.filter(img => img.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=2070&auto=format&fit=crop')",
            filter: "brightness(0.5)"
          }}
        />
        <div className="relative flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-4 text-5xl font-serif font-bold">Our Gallery</h1>
            <p className="text-xl text-brand-primary/90">A Visual Journey Through Cafe Republic</p>
          </motion.div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="sticky top-16 z-30 border-b bg-white/95 backdrop-blur-md">
        <div className="container flex justify-center gap-2 px-4 py-4">
          {displayCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat 
                  ? "bg-primary text-white" 
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="container px-4 py-12">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filteredImages.map((image, i) => (
              <motion.div
                key={image.src}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: i * 0.05 }}
                className="group cursor-pointer overflow-hidden rounded-2xl"
                onClick={() => setSelectedImage(image.src)}
              >
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              onClick={() => setSelectedImage(null)}
            >
              <button 
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-6 w-6" />
              </button>
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                src={selectedImage}
                alt="Gallery Image"
                className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

// sync: 2026-01-23 00:35:39
