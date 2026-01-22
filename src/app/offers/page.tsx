"use client";

import { motion } from "framer-motion";
import { Clock, Percent, Gift, Zap, Calendar, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const offers = [
  {
    icon: Clock,
    title: "Happy Hours",
    subtitle: "3PM - 6PM Daily",
    discount: "20% OFF",
    description: "Get 20% off on all beverages during our happy hours. Perfect for your afternoon coffee break!",
    terms: "Valid on all beverages. Cannot be combined with other offers.",
    color: "bg-orange-500",
    featured: true
  },
  {
    icon: Users,
    title: "Group Discount",
    subtitle: "4+ People",
    discount: "15% OFF",
    description: "Coming with friends or colleagues? Enjoy 15% off on your total bill when dining with 4 or more people.",
    terms: "Minimum 4 people. Valid on dine-in only.",
    color: "bg-blue-500",
    featured: false
  },
  {
    icon: Calendar,
    title: "Weekend Brunch",
    subtitle: "Sat & Sun 9AM-12PM",
    discount: "COMBO ₹399",
    description: "Start your weekend right with our special brunch combo: Any coffee + Croissant + Fresh Juice at just ₹399!",
    terms: "Available Saturday & Sunday only. While stocks last.",
    color: "bg-green-500",
    featured: true
  },
  {
    icon: Gift,
    title: "Birthday Special",
    subtitle: "On Your Birthday",
    discount: "FREE CAKE",
    description: "Celebrate your special day with us! Get a complimentary slice of cake on your birthday.",
    terms: "Valid ID required. One per person per year.",
    color: "bg-pink-500",
    featured: false
  },
  {
    icon: Zap,
    title: "First Order",
    subtitle: "New Customers",
    discount: "₹100 OFF",
    description: "New to Cafe Republic? Get ₹100 off on your first order of ₹500 or more!",
    terms: "Valid for first-time customers only. Minimum order ₹500.",
    color: "bg-purple-500",
    featured: false
  },
  {
    icon: Percent,
    title: "Student Discount",
    subtitle: "With Valid ID",
    discount: "10% OFF",
    description: "Students get 10% off on all orders. Just show your valid student ID at checkout!",
    terms: "Valid student ID required. Cannot combine with other offers.",
    color: "bg-indigo-500",
    featured: false
  },
];

export default function OffersPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=2070&auto=format&fit=crop')",
            filter: "brightness(0.4)"
          }}
        />
        <div className="relative flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-bold uppercase tracking-wider backdrop-blur-sm">
              Special Deals
            </span>
            <h1 className="mb-4 text-5xl font-serif font-bold">Offers & Promotions</h1>
            <p className="text-xl text-brand-primary/90">Exclusive deals just for you!</p>
          </motion.div>
        </div>
      </section>

      {/* Featured Offers */}
      <section className="container px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-serif font-bold">Featured Offers</h2>
          <div className="mx-auto mt-2 h-1 w-20 bg-primary" />
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {offers.filter(o => o.featured).map((offer, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#5d4a3a] p-8 text-white"
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/5" />
              
              <div className="relative">
                <div className={`mb-4 inline-flex rounded-2xl ${offer.color} p-4`}>
                  <offer.icon className="h-8 w-8 text-white" />
                </div>
                
                <div className="mb-4">
                  <span className="text-4xl font-serif font-bold">{offer.discount}</span>
                  <h3 className="text-2xl font-bold">{offer.title}</h3>
                  <p className="text-brand-primary/80">{offer.subtitle}</p>
                </div>
                
                <p className="mb-6 text-brand-primary/90">{offer.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-primary/60">*{offer.terms}</span>
                  <Button asChild variant="secondary" className="rounded-full">
                    <Link href="/menu">Order Now</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* All Offers */}
      <section className="bg-muted/50 py-16">
        <div className="container px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-serif font-bold">All Offers</h2>
            <div className="mx-auto mt-2 h-1 w-20 bg-primary" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl bg-white p-6 shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`rounded-xl ${offer.color} p-3`}>
                    <offer.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-bold">{offer.title}</h3>
                      <span className="rounded-full bg-brand-primary/20 px-3 py-1 text-xs font-bold text-primary">
                        {offer.discount}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">{offer.subtitle}</p>
                    <p className="text-sm text-muted-foreground">{offer.description}</p>
                    <p className="mt-3 text-[10px] text-muted-foreground/60">*{offer.terms}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Loyalty Program */}
      <section className="py-16">
        <div className="container px-4">
          <div className="rounded-3xl bg-gradient-to-r from-brand-primary to-[#f5e6d3] p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="mb-4 text-3xl font-serif font-bold text-primary">Join Our Loyalty Program</h2>
                <p className="mb-6 text-primary/80">
                  Earn points on every purchase and unlock exclusive rewards. Get a free coffee after every 10 purchases!
                </p>
                <ul className="mb-8 space-y-2 text-primary/70">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    1 point per ₹10 spent
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Exclusive member-only offers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Birthday bonus points
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Early access to new items
                  </li>
                </ul>
                <Button asChild className="rounded-full">
                  <Link href="/contact">Join Now - It's Free!</Link>
                </Button>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="h-48 w-80 rounded-2xl bg-gradient-to-br from-primary to-[#2d1f15] p-6 text-white shadow-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-80">Cafe Republic</span>
                      <span className="text-xs opacity-60">GOLD MEMBER</span>
                    </div>
                    <div className="mt-8">
                      <p className="text-[10px] opacity-60">MEMBER NAME</p>
                      <p className="font-bold">Your Name Here</p>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <div>
                        <p className="text-[10px] opacity-60">POINTS</p>
                        <p className="font-bold">2,450</p>
                      </div>
                      <div>
                        <p className="text-[10px] opacity-60">MEMBER SINCE</p>
                        <p className="font-bold">2024</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-white">
        <div className="container px-4 text-center">
          <h2 className="mb-4 text-3xl font-serif font-bold">Don't Miss Out!</h2>
          <p className="mx-auto mb-8 max-w-xl text-brand-primary/80">
            Visit us today and take advantage of these amazing offers.
          </p>
          <Button asChild size="lg" variant="secondary" className="h-14 rounded-full px-8">
            <Link href="/menu">Order Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

// sync: 2026-01-23 00:35:39
