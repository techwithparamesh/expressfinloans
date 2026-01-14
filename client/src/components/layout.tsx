import { Link, useLocation } from "wouter";
import { Phone, Mail, Instagram, Menu, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.435 5.63 1.435h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/services", label: "Services" },
    { href: "/contact", label: "Contact Us" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Enhanced Floating Action Buttons */}
      <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-4">
        {[
          { icon: WhatsAppIcon, color: "bg-[#25D366]", href: "https://wa.me/919000001339" },
          { icon: Instagram, color: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]", href: "https://instagram.com" },
          { icon: Mail, color: "bg-primary", href: "mailto:info@expressfinancialservices.com" }
        ].map((item, i) => (
          <motion.a
            key={i}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            href={item.href}
            target="_blank"
            className={`${item.color} text-white p-3.5 rounded-2xl shadow-2xl ring-4 ring-white/20 backdrop-blur-sm`}
          >
            <item.icon className="h-6 w-6" />
          </motion.a>
        ))}
      </div>

      {/* Senior Header Design */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled 
            ? "py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm" 
            : "py-6 bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Link href="/">
            <a className="flex flex-col group">
              <span className="text-2xl font-serif font-black tracking-tighter text-slate-900 group-hover:text-primary transition-colors">
                EXPRESS<span className="text-secondary">.</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 -mt-1">
                Financial Services
              </span>
            </a>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a className={`text-sm font-bold uppercase tracking-widest transition-all relative group ${
                  location === link.href ? "text-primary" : "text-slate-600 hover:text-slate-900"
                }`}>
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary transition-all group-hover:w-full ${
                    location === link.href ? "w-full" : ""
                  }`} />
                </a>
              </Link>
            ))}
            <Link href="/contact">
              <Button className="rounded-full px-8 bg-slate-900 hover:bg-primary transition-all shadow-xl shadow-slate-200">
                Consult Now
              </Button>
            </Link>
          </nav>

          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[350px]">
              <div className="flex flex-col gap-8 mt-12">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a className="text-3xl font-serif font-bold text-slate-900 hover:text-primary transition-colors">
                      {link.label}
                    </a>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-grow">
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

      <footer className="bg-slate-950 text-white pt-24 pb-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[100px] rounded-full -mr-48 -mt-48" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 mb-20">
            <div className="lg:col-span-5">
              <Link href="/">
                <a className="flex flex-col mb-8">
                  <span className="text-3xl font-serif font-black tracking-tighter">EXPRESS<span className="text-secondary">.</span></span>
                  <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-slate-500 -mt-1">Financial Services</span>
                </a>
              </Link>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md mb-8">
                Pioneering financial excellence since 2005. We provide bespoke solutions that empower individuals and enterprises to scale new heights.
              </p>
              <div className="flex gap-4">
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <p className="text-secondary font-black text-2xl">18+</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Years of Trust</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <p className="text-primary font-black text-2xl">5K+</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Global Clients</p>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <h4 className="text-sm uppercase tracking-[0.2em] font-black text-slate-500 mb-8">Navigation</h4>
              <ul className="space-y-4">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <a className="text-slate-400 hover:text-white transition-all flex items-center gap-2 group">
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                        {link.label}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5">
              <h4 className="text-sm uppercase tracking-[0.2em] font-black text-slate-500 mb-8">Headquarters</h4>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl h-fit">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Direct Lines</p>
                    <p className="text-lg font-medium">+91 90000 01339</p>
                    <p className="text-slate-400 text-sm">9:00 AM - 6:00 PM (IST)</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-secondary/10 p-3 rounded-xl h-fit">
                    <Mail className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Official Inquiry</p>
                    <p className="text-lg font-medium">info@expressfinancialservices.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-600 text-sm">© 2026 Express Financial Services. Crafted for excellence.</p>
            <div className="flex gap-8">
              <a href="#" className="text-slate-600 hover:text-white text-xs uppercase tracking-widest font-bold">Privacy Policy</a>
              <a href="#" className="text-slate-600 hover:text-white text-xs uppercase tracking-widest font-bold">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
