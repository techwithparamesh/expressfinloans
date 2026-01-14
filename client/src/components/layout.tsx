import { Link, useLocation } from "wouter";
import { Phone, Mail, Instagram, MessageCircle, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logoImage from "@assets/image_1768392877999.png";

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

  const primaryBlue = "#003399";
  const primaryRed = "#ED1C24";

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
          className="bg-[#003399] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform hover:shadow-xl"
          aria-label="Send Email"
        >
          <Mail className="h-6 w-6" />
        </a>
      </div>

      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-md py-2" : "bg-white/80 py-4"
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/">
            <a className="flex items-center gap-3 group">
              <img src={logoImage} alt="Express Financial Services" className="h-12 md:h-16 w-auto transition-transform group-hover:scale-105" />
            </a>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className={`text-sm font-bold uppercase tracking-wide transition-colors hover:text-[#ED1C24] ${
                    location === link.href
                      ? "text-[#003399] border-b-2 border-[#ED1C24]"
                      : "text-slate-700"
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
                <Menu className="h-6 w-6 text-[#003399]" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 mt-10">
                <img src={logoImage} alt="Logo" className="h-12 w-auto self-start mb-4" />
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <a className={`text-lg font-bold ${location === link.href ? "text-[#ED1C24]" : "text-[#003399] hover:text-[#ED1C24]"}`}>
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
      <main className="flex-grow pt-24">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-white pt-16 pb-8 border-t-4 border-[#ED1C24]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <img src={logoImage} alt="Express Financial Services" className="h-16 mb-6 brightness-0 invert" />
              <p className="text-slate-400 max-w-sm mb-6">
                Your trusted partner for all financial needs since 2005. We make your dreams a reality with fast approvals and transparent processes.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4 text-[#ED1C24] uppercase tracking-wider">Quick Links</h4>
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
              <h4 className="text-lg font-bold mb-4 text-[#ED1C24] uppercase tracking-wider">Contact Us</h4>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-start gap-2">
                  <Phone className="h-5 w-5 shrink-0 text-[#ED1C24]" />
                  <div className="flex flex-col">
                    <span>+91 90000 01339</span>
                    <span>+91 97054 62000</span>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-5 w-5 shrink-0 text-[#ED1C24]" />
                  <span>info@expressfinancialservices.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <p>© {new Date().getFullYear()} Express Financial Services. All rights reserved.</p>
            <p className="font-medium">Managing Director: <span className="text-slate-300">Mosali Harinadha Reddy</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
