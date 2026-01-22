"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const reviews = [
  {
    name: "Priya Sharma",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop",
    rating: 5,
    date: "2 days ago",
    text: "Best coffee in town! The ambiance is perfect for both work and casual meetups. Their Signature Cappuccino is a must-try. The staff is incredibly friendly and remembers my order every time!",
    source: "Google"
  },
  {
    name: "Rahul Verma",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop",
    rating: 5,
    date: "1 week ago",
    text: "Their pasta is to die for. I come here every weekend with family. The Carbonara is authentic and creamy. Kids love the chocolate lava cake. Highly recommend for family outings!",
    source: "Google"
  },
  {
    name: "Anita Desai",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop",
    rating: 5,
    date: "2 weeks ago",
    text: "Love the cozy vibe and friendly staff. My go-to place for morning coffee. The croissants are freshly baked and absolutely delicious. Perfect spot to start my day!",
    source: "Zomato"
  },
  {
    name: "Vikram Patel",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop",
    rating: 5,
    date: "3 weeks ago",
    text: "As a coffee enthusiast, I can say their cold brew is exceptional. The beans are sourced well and you can taste the quality. The QR ordering system is super convenient!",
    source: "Google"
  },
  {
    name: "Sneha Reddy",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop",
    rating: 5,
    date: "1 month ago",
    text: "Had my birthday celebration here and the team went above and beyond. The decoration, the special cake, everything was perfect. Thank you Cafe Republic for the memories!",
    source: "Instagram"
  },
  {
    name: "Arjun Nair",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop",
    rating: 4,
    date: "1 month ago",
    text: "Great place for remote work. Fast WiFi, comfortable seating, and they don't rush you. The only reason for 4 stars is sometimes it gets crowded during weekends.",
    source: "Google"
  },
  {
    name: "Meera Iyer",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100&auto=format&fit=crop",
    rating: 5,
    date: "2 months ago",
    text: "The Margherita Pizza here is hands down the best in the city. Thin crust, fresh basil, and perfect cheese pull. Paired with their iced latte - heaven!",
    source: "Zomato"
  },
  {
    name: "Karthik Menon",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop",
    rating: 5,
    date: "2 months ago",
    text: "Been coming here since they opened. The consistency in quality is remarkable. Whether it's coffee or food, you know exactly what to expect - excellence!",
    source: "Google"
  },
];

export default function ReviewsPage() {
  const averageRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-primary py-16 text-white">
        <div className="container px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-4 text-5xl font-serif font-bold">Customer Reviews</h1>
            <p className="mb-8 text-xl text-brand-primary/90">What Our Customers Say About Us</p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
              <div className="flex items-center gap-2">
                <span className="text-5xl font-serif font-bold">{averageRating}</span>
                <div className="flex flex-col items-start">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-brand-primary/80">Based on {reviews.length}+ reviews</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="container px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-white p-6 shadow-sm border"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full">
                    <img src={review.avatar} alt={review.name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold">{review.name}</h3>
                    <p className="text-xs text-muted-foreground">{review.date} • {review.source}</p>
                  </div>
                </div>
                <Quote className="h-8 w-8 text-brand-primary/30" />
              </div>
              
              <div className="mb-4 flex text-yellow-500">
                {[...Array(review.rating)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-current" />
                ))}
                {[...Array(5 - review.rating)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 text-gray-200" />
                ))}
              </div>
              
              <p className="text-muted-foreground leading-relaxed">{review.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-16">
        <div className="container px-4 text-center">
          <h2 className="mb-4 text-3xl font-serif font-bold">Enjoyed Your Visit?</h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            We'd love to hear from you! Share your experience and help others discover Cafe Republic.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="h-14 rounded-full px-8">
              <Link href="/menu">Order Again</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-full px-8">
              <a href="https://g.page/review" target="_blank" rel="noopener noreferrer">
                Leave a Review
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// sync: 2026-01-23 00:35:39
