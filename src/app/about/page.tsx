"use client";

import { motion } from "framer-motion";
import { Coffee, Heart, Users, Award, Leaf, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="flex flex-col pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=2070&auto=format&fit=crop')",
            filter: "brightness(0.5)"
          }}
        />
        <div className="relative flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-4 text-5xl font-serif font-bold">Our Story</h1>
            <p className="text-xl text-brand-primary/90">Brewing Happiness Since 2019</p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-6 text-4xl font-serif font-bold">Where It All Began</h2>
              <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
                Cafe Republic was born from a simple dream – to create a space where great coffee meets warm hospitality. 
                Founded in 2019 by two coffee enthusiasts, Arjun and Meera, our cafe started as a small corner shop 
                with just 4 tables and a passion for the perfect brew.
              </p>
              <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
                Today, we've grown into a beloved community hub, but our core values remain unchanged: 
                quality ingredients, handcrafted beverages, and a welcoming atmosphere that feels like home.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Every cup we serve carries our commitment to excellence. From sourcing the finest Arabica beans 
                from Coorg to training our baristas in the art of latte art, we obsess over every detail.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="aspect-[3/4] overflow-hidden rounded-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=1200&auto=format&fit=crop" 
                  alt="Coffee Beans" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] overflow-hidden rounded-2xl mt-8">
                <img 
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop" 
                  alt="Barista at work" 
                  className="h-full w-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted/50 py-20">
        <div className="container px-4">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-serif font-bold">What We Stand For</h2>
            <div className="mx-auto mt-2 h-1 w-20 bg-primary" />
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Coffee, title: "Quality First", desc: "We source only the finest ingredients and never compromise on taste." },
              { icon: Heart, title: "Made with Love", desc: "Every dish and drink is crafted with passion and attention to detail." },
              { icon: Users, title: "Community Focus", desc: "We're more than a cafe – we're a gathering place for our neighborhood." },
              { icon: Leaf, title: "Sustainability", desc: "Eco-friendly practices from farm to cup, because we care about tomorrow." },
              { icon: Award, title: "Excellence", desc: "Award-winning recipes and trained baristas ensure the best experience." },
              { icon: Clock, title: "Consistency", desc: "Same great taste, every single time you visit us." },
            ].map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-white p-8 shadow-sm"
              >
                <div className="mb-4 inline-flex rounded-full bg-brand-primary/20 p-4">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{value.title}</h3>
                <p className="text-muted-foreground">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container px-4">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-serif font-bold">Meet Our Team</h2>
            <div className="mx-auto mt-2 h-1 w-20 bg-primary" />
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Arjun Mehta", role: "Founder & Head Barista", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop" },
              { name: "Meera Kapoor", role: "Co-Founder & Chef", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop" },
              { name: "Vikram Singh", role: "Operations Manager", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop" },
              { name: "Priya Nair", role: "Head of Experience", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop" },
            ].map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 h-40 w-40 overflow-hidden rounded-full">
                  <img src={member.img} alt={member.name} className="h-full w-full object-cover" />
                </div>
                <h3 className="text-lg font-bold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-white">
        <div className="container px-4 text-center">
          <h2 className="mb-4 text-3xl font-serif font-bold">Come Experience Cafe Republic</h2>
          <p className="mx-auto mb-8 max-w-xl text-brand-primary/80">
            We'd love to have you visit and see what makes us special.
          </p>
          <Button asChild size="lg" variant="secondary" className="h-14 rounded-full px-8">
            <Link href="/contact">Visit Us Today</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

// sync: 2026-01-23 00:35:39
