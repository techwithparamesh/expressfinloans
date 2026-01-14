import { Link, useLocation } from "wouter";
import { Phone, Mail, Instagram, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logoImage from "@assets/image_1768392877999.png";

// Custom WhatsApp SVG for a better look
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.435 5.63 1.435h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

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
          className="bg-[#25D366] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform hover:shadow-xl ring-4 ring-white/10"
          aria-label="Chat on WhatsApp"
        >
          <WhatsAppIcon className="h-6 w-6" />
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform hover:shadow-xl ring-4 ring-white/10"
          aria-label="Visit Instagram"
        >
          <Instagram className="h-6 w-6" />
        </a>
        <a
          href="mailto:info@expressfinancialservices.com"
          className="bg-[#003399] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform hover:shadow-xl ring-4 ring-white/10"
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
              <div className="relative h-12 md:h-16 overflow-hidden">
                <img 
                  src={logoImage} 
                  alt="Express Financial Services" 
                  className="h-full w-auto transition-transform group-hover:scale-105 mix-blend-multiply" 
                />
              </div>
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
                <img src={logoImage} alt="Logo" className="h-12 w-auto self-start mb-4 mix-blend-multiply" />
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
              <div className="mb-6 flex items-center overflow-hidden">
                <img 
                  src={logoImage} 
                  alt="Express Financial Services" 
                  className="h-12 md:h-16 w-auto" 
                  style={{ 
                    filter: 'brightness(0) invert(1)',
                    mixBlendMode: 'screen'
                  }}
                />
              </div>
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
