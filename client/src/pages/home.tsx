import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const stats = [
  { label: "Assets Managed", value: "₹500Cr+" },
  { label: "Client Retention", value: "98%" },
  { label: "Loans Disbursed", value: "10K+" },
  { label: "Expert Advisors", value: "50+" },
];

const partnerBanks = [
  "ICICI Bank", "HDFC Bank", "SBI", "Axis Bank", "Yes Bank", "Kotak Mahindra Bank",
  "Bank of Baroda", "Canara Bank", "Union Bank of India", "Bandhan Bank", "IDFC FIRST Bank",
  "BOI", "Aditya Birla Capital", "Bajaj Finserv", "Chola", "Mahindra Finance", "Tata Capital",
  "L&T Finance", "ICICI Lombard", "ICICI Prudential", "LIC Housing Finance",
  "Liberty General Insurance", "Reliance General Insurance", "HDFC ERGO", "SBI General",
  "IFFCO Tokio", "Digit Insurance", "Royal Sundaram", "Zurich", "Bajaj Allianz",
];

export default function Home() {
  return (
    <Layout>
      {/* Hero - gradient only, no image */}
      <section className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-slate-950 to-secondary/10" />
        <div className="container mx-auto px-6 relative z-10 text-white pt-20 pb-16">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-serif leading-[1.05] tracking-tight">
                Financial <span className="text-gradient">Precision.</span>
              </h1>
              <p className="text-base sm:text-xl text-slate-300 font-light max-w-2xl leading-relaxed">
                Bespoke financial solutions since 2005. Home loans, business credit, and expert advisory for individuals and enterprises.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/contact">
                  <Button size="lg" className="h-12 sm:h-14 px-8 rounded-xl bg-secondary text-white hover:bg-secondary/90 font-bold group">
                    Enquire Now <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Button>
                </Link>
                <Link href="/services/home-loans">
                  <Button size="lg" variant="outline" className="h-12 sm:h-14 px-8 rounded-xl text-white border-white/30 hover:bg-white/10 font-bold">
                    Loan Calculator
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center lg:text-left">
                  <p className="text-2xl sm:text-3xl font-serif font-black text-white">{stat.value}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Us - text only, professional */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">
              Why Express Financial Services
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              We combine integrity, speed, and expert advisory to deliver loans and financial solutions that match your goals. From home loans to business funding, we connect you with the right products and partner banks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/about">
                <Button variant="outline" className="rounded-xl border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold">
                  About Us
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="rounded-xl bg-slate-900 hover:bg-primary text-white font-bold">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Banks - scrolling marquee */}
      <section className="py-16 sm:py-20 bg-slate-950 text-white overflow-hidden">
        <div className="container mx-auto px-6 mb-8">
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-center">
            Our Partner Banks & Institutions
          </h2>
          <p className="text-slate-400 text-center mt-2 text-sm max-w-2xl mx-auto">
            We work with leading banks, NBFCs, and insurers to offer you the best rates and products.
          </p>
        </div>
        <div className="marquee rounded-2xl bg-white/5 border border-white/10 py-4 mx-4 sm:mx-6">
          <div className="marquee-inner gap-4 sm:gap-6">
            {[...partnerBanks, ...partnerBanks].map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="px-4 sm:px-6 py-2.5 rounded-full bg-white text-slate-900 text-xs sm:text-sm font-semibold whitespace-nowrap shadow-md"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">
              Ready to get started?
            </h2>
            <p className="text-lg text-slate-600">
              Discuss your requirement with our team. We respond within 24 hours.
            </p>
            <Link href="/contact">
              <Button size="lg" className="h-14 px-10 rounded-xl bg-slate-900 hover:bg-primary text-white font-bold text-lg">
                Schedule a Consultation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
