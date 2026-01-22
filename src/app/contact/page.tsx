"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, Send, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: ""
  });
  const [sending, setSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_key: "3ad2ac7d-5205-4c7f-b856-de35b9a592f3",
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          from_name: "Cafe Republic Contact Form"
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessageSent(true);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          subject: "General Inquiry",
          message: ""
        });
      } else {
        throw new Error("Failed to send");
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col">
      <section className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=2070&auto=format&fit=crop')",
            filter: "brightness(0.5)"
          }}
        />
        <div className="relative flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-4 text-5xl font-serif font-bold">Contact Us</h1>
            <p className="text-xl text-brand-primary/90">We'd Love to Hear From You</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4">
          <div className="grid gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-8 text-3xl font-serif font-bold">Get In Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-brand-primary/20 p-3">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Visit Us</h3>
                    <p className="text-muted-foreground">
                      Cafe Republic<br />
                      Wardha Rd, below Chhatrapati Square Metro Station<br />
                      beside Santaji Mahavidyalaya, New Sneh Nagar<br />
                      Nagpur, Maharashtra 440015
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-brand-primary/20 p-3">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Call Us</h3>
                    <p className="text-muted-foreground">
                      <a href="tel:08788839229" className="hover:text-primary transition-colors">
                        087888 39229
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-brand-primary/20 p-3">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Email Us</h3>
                    <p className="text-muted-foreground">
                      hello@caferepublic.in
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-brand-primary/20 p-3">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Opening Hours</h3>
                    <p className="text-muted-foreground">
                      Monday - Friday: 10:00 AM - 11:00 PM<br />
                      Saturday - Sunday: 10:00 AM - 12:00 AM
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="mb-4 font-bold">Follow Us</h3>
                <div className="flex gap-4">
                  <a href="#" className="rounded-full bg-muted p-3 transition-colors hover:bg-brand-primary/20">
                    <Instagram className="h-5 w-5 text-primary" />
                  </a>
                  <a href="#" className="rounded-full bg-muted p-3 transition-colors hover:bg-brand-primary/20">
                    <Facebook className="h-5 w-5 text-primary" />
                  </a>
                  <a href="#" className="rounded-full bg-muted p-3 transition-colors hover:bg-brand-primary/20">
                    <Twitter className="h-5 w-5 text-primary" />
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl bg-white p-8 shadow-lg border"
            >
              <AnimatePresence mode="wait">
                {messageSent ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="mb-6 rounded-full bg-green-100 p-6">
                      <CheckCircle2 className="h-16 w-16 text-green-600" />
                    </div>
                    <h2 className="mb-4 text-2xl font-serif font-bold text-green-700">
                      Thank You for Contacting Us!
                    </h2>
                    <p className="mb-8 text-muted-foreground max-w-sm">
                      We've received your message and will get back to you as soon as possible. 
                      Usually within 24 hours.
                    </p>
                    <Button 
                      onClick={() => setMessageSent(false)}
                      variant="outline"
                      className="rounded-full"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="mb-6 text-2xl font-serif font-bold">Send Us a Message</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium">First Name *</label>
                          <Input 
                            placeholder="John" 
                            className="rounded-xl"
                            value={formData.firstName}
                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">Last Name</label>
                          <Input 
                            placeholder="Doe" 
                            className="rounded-xl"
                            value={formData.lastName}
                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="mb-2 block text-sm font-medium">Email *</label>
                        <Input 
                          type="email" 
                          placeholder="john@example.com" 
                          className="rounded-xl"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="mb-2 block text-sm font-medium">Phone</label>
                        <Input 
                          type="tel" 
                          placeholder="+91 98765 43210" 
                          className="rounded-xl"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <label className="mb-2 block text-sm font-medium">Subject</label>
                        <select 
                          className="w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formData.subject}
                          onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        >
                          <option>General Inquiry</option>
                          <option>Reservation</option>
                          <option>Feedback</option>
                          <option>Partnership</option>
                          <option>Careers</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="mb-2 block text-sm font-medium">Message *</label>
                        <textarea 
                          rows={4} 
                          placeholder="How can we help you?"
                          className="w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                          value={formData.message}
                          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <Button type="submit" className="w-full rounded-xl h-12" disabled={sending}>
                        {sending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="container px-4">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-serif font-bold">Find Us</h2>
            <div className="mx-auto mt-2 h-1 w-20 bg-primary" />
          </div>
          
          <div className="overflow-hidden rounded-3xl shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d29778.169142954062!2d79.0520846847656!3d21.10175361840597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd4bfb65bdf135d%3A0xbb418f447f8ae821!2sCafe%20Republic!5e0!3m2!1sen!2sin!4v1768764568815!5m2!1sen!2sin"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "View Menu", desc: "Explore our delicious offerings", href: "/menu" },
              { title: "Our Story", desc: "Learn about Cafe Republic", href: "/about" },
              { title: "Current Offers", desc: "Check out our deals", href: "/offers" },
              { title: "Photo Gallery", desc: "See our cafe in pictures", href: "/gallery" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={item.href} className="block rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <h3 className="mb-2 font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

        <section className="bg-primary py-16 text-white">
          <div className="container px-4 text-center">
            <h2 className="mb-4 text-3xl font-serif font-bold">Ready to Visit?</h2>
            <p className="mx-auto mb-8 max-w-xl text-brand-primary/80">
              We're open 7 days a week. Walk in anytime or make a reservation for a special occasion.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" variant="secondary" className="h-14 rounded-full px-8">
                <Link href="/menu">Order Now</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-brand-primary px-8 text-brand-primary hover:bg-brand-primary hover:text-primary">
                <a href="tel:08788839229">Call to Reserve</a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

// sync: 2026-01-23 00:35:39
