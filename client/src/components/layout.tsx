import { Link, useLocation } from "wouter";
import { Phone, Mail, Instagram, MessageCircle, Menu, X, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
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
    <div className="min-h-screen flex flex-col font-sans">
      {/* Floating Action Buttons */}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-3">
        <a
          href="https://wa.me/919000001339"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#25D366] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform hover:shadow-xl"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform hover:shadow-xl"
          aria-label="Visit Instagram"
        >
          <Instagram className="h-6 w-6" />
        </a>
        <a
          href="mailto:info@expressfinancialservices.com"
          className="bg-primary text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform hover:shadow-xl"
          aria-label="Send Email"
        >
          <Mail className="h-6 w-6" />
        </a>
      </div>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-md py-2" : "bg-transparent py-4"
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/">
            <a className="flex flex-col">
              <span className={`text-2xl font-serif font-bold ${isScrolled ? "text-primary" : "text-primary shadow-sm"}`}>
                EXPRESS
              </span>
              <span className={`text-sm tracking-widest font-medium ${isScrolled ? "text-gray-600" : "text-gray-700"}`}>
                FINANCIAL SERVICES
              </span>
            </a>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={`text-sm font-medium uppercase tracking-wide transition-colors hover:text-secondary ${
                    location === link.href
                      ? "text-primary font-semibold"
                      : isScrolled ? "text-gray-700" : "text-gray-800"
                  }`}
                >
                  {link.label}
                </a>
              </Link>
            ))}
          </nav>

          {/* Mobile Nav */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 mt-10">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a className="text-lg font-medium text-gray-800 hover:text-primary">
                      {link.label}
                    </a>
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-serif font-bold mb-4">EXPRESS FINANCIAL SERVICES</h3>
              <p className="text-slate-400 max-w-sm mb-6">
                Your trusted partner for all financial needs since 2005. We make your dreams a reality with fast approvals and transparent processes.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4 text-secondary">Quick Links</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <a className="text-slate-400 hover:text-white transition-colors">
                        {link.label}
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-4 text-secondary">Contact Us</h4>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>+91 90000 01339</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>info@expressfinancialservices.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} Express Financial Services. All rights reserved.</p>
            <p>Managing Director: Mosali Harinadha Reddy</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
