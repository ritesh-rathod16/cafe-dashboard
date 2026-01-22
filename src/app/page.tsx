"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import HeroSlider from "@/components/HeroSlider";
import { TableBookingForm } from "@/components/TableBookingForm";
import { Button } from "@/components/ui/button";
import {
  Coffee,
  Wifi,
  Armchair,
  Leaf,
  Star,
  MapPin,
  ArrowRight,
  Quote
} from "lucide-react";
import { motion } from "framer-motion";

type MenuItem = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  is_bestseller: boolean;
};

export default function HomePage() {
  const [bestSellers, setBestSellers] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetchBestSellers();
  }, []);

  const fetchBestSellers = async () => {
    const { data } = await supabase
      .from("menu_items")
      .select("id, name, price, image_url, is_bestseller")
      .eq("is_bestseller", true)
      .eq("is_available", true)
      .limit(4);

    if (data) setBestSellers(data);
  };

  return (
    <div className="min-h-screen">
      {/* Original Hero Section */}
      <HeroSlider />

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
                Our Best Sellers
              </h2>
              <p className="text-lg text-muted-foreground">
                Customer favorites you can't miss
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {bestSellers.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  className="bg-card rounded-xl overflow-hidden shadow-md"
                >
                  <div className="relative h-40">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-semibold">
                      <Star className="h-3 w-3 inline mr-1" />
                      Bestseller
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                    <p className="text-primary font-bold">₹{item.price}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/menu">
                <Button size="lg" variant="outline" className="rounded-full">
                  View Full Menu
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Table Booking Section */}
      <section id="booking-section" className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Reserve Your Table
            </h2>
            <p className="text-lg text-muted-foreground">
              Book your perfect café moment in seconds
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Booking Form */}
            <div className="bg-card border rounded-2xl p-8 shadow-lg">
              <TableBookingForm />
            </div>

            {/* Why Book With Us */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-serif font-bold mb-6">Why Book With Us?</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Armchair className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Comfortable Seating</h4>
                      <p className="text-sm text-muted-foreground">
                        Cozy ambiance perfect for work or relaxation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Coffee className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Freshly Brewed Coffee</h4>
                      <p className="text-sm text-muted-foreground">
                        Premium beans, expertly crafted beverages
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Wifi className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Free Wi-Fi</h4>
                      <p className="text-sm text-muted-foreground">
                        High-speed internet for all guests
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Leaf className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Peaceful Ambience</h4>
                      <p className="text-sm text-muted-foreground">
                        Escape the hustle, find your calm
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// sync: 2026-01-23 00:35:39
