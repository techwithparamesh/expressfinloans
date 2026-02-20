import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Phone, Mail, Instagram, Menu, ChevronRight, Clock, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Logo from "@/components/logo";
import LoanCalculator from "@/components/loan-calculator";

interface WhatsAppIconProps {
  className?: string;
}

const WhatsAppIcon: React.FC<WhatsAppIconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.435 5.63 1.435h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const serviceLinks = [
    { href: "/services/home-loans", label: "Home Loans" },
    { href: "/services/mortgage-loans", label: "Mortgage" },
    { href: "/services/sme-loans", label: "SME" },
    { href: "/services/car-loans", label: "Car Loans" },
    { href: "/services/business-loans", label: "Business" },
    { href: "/services/commercial-vehicle-loan", label: "Commercial Vehicle" },
    { href: "/services/personal-loan", label: "Personal" },
    { href: "/services/education-loans", label: "Education" },
    { href: "/services/lrd-loans", label: "LRD" },
    { href: "/services/school-bus-funding", label: "School Bus" },
    { href: "/services/life-insurance", label: "Life Insurance" },
    { href: "/services/project-funding", label: "Project Funding" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Enhanced Floating Action Buttons with Tooltips */}
      <TooltipProvider>
        <div className="fixed right-4 sm:right-6 bottom-24 sm:bottom-6 z-50 flex flex-col gap-3 sm:gap-4">
          {[
            { icon: WhatsAppIcon, color: "bg-[#25D366]", href: "https://wa.me/919000001339", tooltip: "WhatsApp Us" },
            { icon: Instagram, color: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]", href: "https://instagram.com", tooltip: "Follow Us" },
            { icon: Mail, color: "bg-primary", href: "mailto:info@expressfinancialservices.com", tooltip: "Email Us" }
          ].map((item, i) => (
            <Tooltip key={i} delayDuration={0}>
              <TooltipTrigger asChild>
                <motion.a
                  whileHover={{ scale: 1.1, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  href={item.href}
                  target="_blank"
                  className={`${i > 0 ? "hidden sm:inline-flex" : "inline-flex"} ${item.color} text-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-2xl ring-2 sm:ring-4 ring-white/20 backdrop-blur-sm`}
                >
                  <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </motion.a>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-slate-900 text-white border-none font-bold py-2 px-4 rounded-xl shadow-xl">
                {item.tooltip}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* HYBRID HEADER: Utility Bar + Main Nav + Services Strip */}
      <header className="fixed top-0 left-0 right-0 z-40">
        {/* Top Utility Bar - Dark, slim */}
        <div className="bg-slate-900 text-white py-2 hidden sm:block">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-6">
                <a href="tel:+919000001339" className="flex items-center gap-1.5 hover:text-secondary transition-colors">
                  <Phone className="h-3 w-3" />
                  <span>+91 90000 01339</span>
                </a>
                <a href="mailto:info@expressfinancialservices.com" className="flex items-center gap-1.5 hover:text-secondary transition-colors">
                  <Mail className="h-3 w-3" />
                  <span>info@expressfinancialservices.com</span>
                </a>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="h-3 w-3" />
                <span>Mon - Sat: 9:00 AM - 6:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation - White, clean */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <Link href="/">
                <a className="flex items-center gap-3 group">
                  <div className="flex items-center justify-center h-10 md:h-12 w-auto transition-transform group-hover:scale-105 [&_svg]:h-full [&_svg]:w-auto">
                    <Logo />
                  </div>
                </a>
              </Link>

              <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
                <Link href="/">
                  <a className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${location === "/" ? "text-primary bg-primary/10" : "text-slate-700 hover:text-primary hover:bg-slate-50"}`}>
                    Home
                  </a>
                </Link>
                <Link href="/about">
                  <a className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${location === "/about" ? "text-primary bg-primary/10" : "text-slate-700 hover:text-primary hover:bg-slate-50"}`}>
                    About Us
                  </a>
                </Link>
                <Link href="/contact">
                  <a className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${location === "/contact" ? "text-primary bg-primary/10" : "text-slate-700 hover:text-primary hover:bg-slate-50"}`}>
                    Contact Us
                  </a>
                </Link>
                <button
                  onClick={() => setIsCalculatorOpen(true)}
                  className="ml-2 flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition-all shadow-md"
                >
                  <Calculator className="h-4 w-4" />
                  EMI Calculator
                </button>
              </nav>

              <div className="lg:hidden flex items-center gap-2">
                <a href="tel:+919000001339" className="p-2 rounded-full bg-primary/10 text-primary">
                  <Phone className="h-5 w-5" />
                </a>
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full text-slate-900">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:w-[350px] overflow-y-auto">
                    <div className="flex flex-col gap-6 mt-12">
                      <Link href="/">
                        <a onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-serif font-bold text-slate-900 hover:text-primary transition-colors">Home</a>
                      </Link>
                      <Link href="/about">
                        <a onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-serif font-bold text-slate-900 hover:text-primary transition-colors">About Us</a>
                      </Link>
                      <Link href="/contact">
                        <a onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-serif font-bold text-slate-900 hover:text-primary transition-colors">Contact Us</a>
                      </Link>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          setIsCalculatorOpen(true);
                        }}
                        className="flex items-center gap-3 text-xl font-serif font-bold text-secondary hover:text-secondary/80 transition-colors text-left"
                      >
                        <Calculator className="h-5 w-5" />
                        EMI Calculator
                      </button>
                      <div className="border-t border-slate-200 pt-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Our Services</p>
                        <div className="grid grid-cols-1 gap-2">
                          {serviceLinks.map((s) => (
                            <Link key={s.href} href={s.href}>
                              <a onClick={() => setIsMobileMenuOpen(false)} className="block text-base font-semibold text-slate-700 hover:text-primary transition-colors py-1">{s.label}</a>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>

        {/* Services Strip - Light gray, all services visible */}
        <div className="bg-slate-50 border-b border-slate-200">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-1 py-2 w-max min-w-full">
                {serviceLinks.map((s) => (
                  <Link key={s.href} href={s.href}>
                    <a className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide whitespace-nowrap transition-all ${location === s.href ? "text-white bg-primary" : "text-slate-600 hover:text-primary hover:bg-white"}`}>
                      {s.label}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header (utility bar + main nav + services strip) */}
      <main className="flex-grow pt-[140px] sm:pt-[172px]">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-slate-950 text-white pt-16 sm:pt-20 pb-8 overflow-hidden relative border-t-4 border-secondary">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 blur-[80px] rounded-full -ml-32 -mb-32" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12 sm:mb-16">
            {/* Company Info */}
            <div className="sm:col-span-2 lg:col-span-4">
              <Link href="/">
                <a className="inline-block mb-6">
                  <div className="bg-white rounded-xl p-3 w-fit">
                    <Logo className="h-10 sm:h-12 w-auto" />
                  </div>
                </a>
              </Link>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6 max-w-sm">
                Your trusted financial partner since 2005. We help individuals and businesses achieve their goals with the best loan products and expert advisory.
              </p>
              <div className="flex gap-3">
                <div className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-secondary font-black text-xl">20+</p>
                  <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Years</p>
                </div>
                <div className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-primary font-black text-xl">10K+</p>
                  <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Clients</p>
                </div>
                <div className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-white font-black text-xl">₹500Cr</p>
                  <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Disbursed</p>
                </div>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="lg:col-span-2">
              <h4 className="text-sm uppercase tracking-[0.15em] font-bold text-white mb-5">Quick Links</h4>
              <ul className="space-y-3">
                <li><Link href="/"><a className="text-slate-400 hover:text-secondary transition-colors text-sm">Home</a></Link></li>
                <li><Link href="/about"><a className="text-slate-400 hover:text-secondary transition-colors text-sm">About Us</a></Link></li>
                <li><Link href="/services"><a className="text-slate-400 hover:text-secondary transition-colors text-sm">All Services</a></Link></li>
                <li><Link href="/contact"><a className="text-slate-400 hover:text-secondary transition-colors text-sm">Contact Us</a></Link></li>
              </ul>
            </div>

            {/* Our Services */}
            <div className="lg:col-span-3">
              <h4 className="text-sm uppercase tracking-[0.15em] font-bold text-white mb-5">Our Services</h4>
              <ul className="space-y-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-4">
                <li><Link href="/services/home-loans"><a className="text-slate-400 hover:text-secondary transition-colors text-sm">Home Loans</a></Link></li>
                <li><Link href="/services/car-loans"><a className="text-slate-400 hover:text-secondary transition-colors text-sm">Car Loans</a></Link></li>
                <li><Link href="/services/business-loans"><a className="text-slate-400 hover:text-secondary transition-colors text-sm">Business Loans</a></Link></li>
                <li><Link href="/services/mortgage-loans"><a className="text-slate-400 hover:text-secondary transition-colors text-sm">Mortgage Loans</a></Link></li>
                <li><Link href="/services/education-loans"><a className="text-slate-400 hover:text-secondary transition-colors text-sm">Education Loans</a></Link></li>
                <li><Link href="/services/personal-loan"><a className="text-slate-400 hover:text-secondary transition-colors text-sm">Personal Loans</a></Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="sm:col-span-2 lg:col-span-3">
              <h4 className="text-sm uppercase tracking-[0.15em] font-bold text-white mb-5">Contact Us</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/20 p-2 rounded-lg mt-0.5">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <a href="tel:+919000001339" className="text-white font-medium block hover:text-secondary transition-colors">+91 90000 01339</a>
                    <a href="tel:+919091001008" className="text-slate-400 text-sm block hover:text-secondary transition-colors">+91 90910 01008</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-secondary/20 p-2 rounded-lg mt-0.5">
                    <Mail className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <a href="mailto:info@expressfinancialservices.com" className="text-white font-medium hover:text-secondary transition-colors text-sm break-all">
                      info@expressfinancialservices.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-500/20 p-2 rounded-lg mt-0.5">
                    <WhatsAppIcon className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <a href="https://wa.me/919000001339" target="_blank" rel="noopener noreferrer" className="text-white font-medium hover:text-green-400 transition-colors text-sm">
                      WhatsApp Us
                    </a>
                    <p className="text-slate-500 text-xs mt-0.5">Quick Response</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-slate-800 p-2 rounded-lg mt-0.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm">Mon - Sat: 9:00 AM - 7:00 PM</p>
                    <p className="text-slate-500 text-xs mt-0.5">Sunday Closed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-6 sm:pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-xs sm:text-sm text-center sm:text-left">
              © 2026 Express Financial Services. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-500 hover:text-white text-xs font-medium transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-500 hover:text-white text-xs font-medium transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Loan Calculator Modal */}
      <LoanCalculator 
        isOpen={isCalculatorOpen} 
        onClose={() => setIsCalculatorOpen(false)} 
      />
    </div>
  );
}
