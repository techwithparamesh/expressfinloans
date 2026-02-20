import { useState } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  ArrowUpRight, 
  Home as HomeIcon, 
  Car, 
  Briefcase, 
  GraduationCap, 
  Building2, 
  Truck,
  Shield,
  Clock,
  Users,
  CheckCircle2,
  Star,
  Phone,
  MessageCircle,
  ChevronRight,
  Zap,
  Award,
  TrendingUp,
  HeartHandshake,
  Calculator
} from "lucide-react";
import LoanCalculator from "@/components/loan-calculator";

const stats = [
  { label: "Assets Managed", value: "₹500Cr+" },
  { label: "Client Retention", value: "98%" },
  { label: "Loans Disbursed", value: "10K+" },
  { label: "Expert Advisors", value: "50+" },
];

const services = [
  { 
    id: "home-loans", 
    icon: HomeIcon, 
    title: "Home Loans", 
    desc: "Competitive rates for your dream home",
    color: "bg-blue-500",
    rate: "8.5%",
    rateLabel: "Starting Rate"
  },
  { 
    id: "car-loans", 
    icon: Car, 
    title: "Car Loans", 
    desc: "Quick approval for new & used vehicles",
    color: "bg-emerald-500",
    rate: "9.0%",
    rateLabel: "Starting Rate"
  },
  { 
    id: "business-loans", 
    icon: Briefcase, 
    title: "Business Loans", 
    desc: "Fuel your business growth",
    color: "bg-purple-500",
    rate: "₹50L",
    rateLabel: "Up to"
  },
  { 
    id: "education-loans", 
    icon: GraduationCap, 
    title: "Education Loans", 
    desc: "Invest in your future",
    color: "bg-amber-500",
    rate: "7.5%",
    rateLabel: "Starting Rate"
  },
  { 
    id: "mortgage-loans", 
    icon: Building2, 
    title: "Mortgage Loans", 
    desc: "Unlock property value",
    color: "bg-rose-500",
    rate: "9.5%",
    rateLabel: "Starting Rate"
  },
  { 
    id: "commercial-vehicle-loans", 
    icon: Truck, 
    title: "Commercial Vehicle", 
    desc: "Finance your fleet",
    color: "bg-cyan-500",
    rate: "10.5%",
    rateLabel: "Starting Rate"
  },
];

const benefits = [
  { 
    icon: Zap, 
    title: "Quick Approval", 
    desc: "Get loan approval within 24-48 hours with minimal documentation" 
  },
  { 
    icon: TrendingUp, 
    title: "Best Rates", 
    desc: "Access competitive rates from 15+ partner banks & NBFCs" 
  },
  { 
    icon: HeartHandshake, 
    title: "Personal Advisor", 
    desc: "Dedicated relationship manager for end-to-end support" 
  },
  { 
    icon: Shield, 
    title: "100% Transparent", 
    desc: "No hidden charges. Clear terms. Complete fee disclosure" 
  },
];

const processSteps = [
  { 
    step: "01", 
    title: "Share Requirements", 
    desc: "Tell us about your loan needs via call, WhatsApp, or our form" 
  },
  { 
    step: "02", 
    title: "Get Best Offers", 
    desc: "We compare rates from 15+ banks and present the best options" 
  },
  { 
    step: "03", 
    title: "Quick Disbursement", 
    desc: "Complete documentation and receive funds in your account" 
  },
];

const testimonials = [
  { 
    name: "Rajesh Kumar", 
    role: "Home Loan Customer",
    quote: "Express Financial helped me get the best home loan rate. Their team guided me through every step. Highly recommended!",
    rating: 5,
    loanType: "Home Loan - ₹45 Lakhs"
  },
  { 
    name: "Priya Sharma", 
    role: "Business Owner",
    quote: "Got my business loan approved in just 3 days! The process was smooth and transparent. Great service!",
    rating: 5,
    loanType: "Business Loan - ₹25 Lakhs"
  },
  { 
    name: "Amit Patel", 
    role: "Car Loan Customer",
    quote: "Lowest interest rate for my car loan. The team negotiated the best deal for me. Thank you Express Financial!",
    rating: 5,
    loanType: "Car Loan - ₹12 Lakhs"
  },
];

/* Logos from attached_assets – official bank & insurer logos */
import logoHdfcBank from "@assets/HDFC_Bank_Logo.svg.png";
import logoIciciBank from "@assets/icici-bank-logo.png";
import logoSbi from "@assets/SBI-Logo.jpg";
import logoAxisBank from "@assets/axis bank logo.jpg";
import logoKotak from "@assets/kotak logo.png";
import logoIndusInd from "@assets/IndusIndBankJPEGlogo.jpg";
import logoYesBank from "@assets/YES Bank Logo.webp";
import logoIdfc from "@assets/IDFC logo.jpg";
import logoBaroda from "@assets/baroda logo.jpg";
import logoCanara from "@assets/canara-bank-logo-400x300.webp";
import logoPnb from "@assets/Punjab_National_Bank_new_logo.png";
import logoIdbi from "@assets/IDBI-Bank-logo.jpg";
import logoFederal from "@assets/federal bank logo.jpg";
import logoLic from "@assets/Lic logo.png";
import logoIciciPrudential from "@assets/ICICI Prudential.jpg";
import logoSbiLife from "@assets/Sbi LIfe logo.jpg";
import logoHdfcLife from "@assets/hdfc life logo.jpg";
import logoAxisMaxLife from "@assets/Axis Max life.png";

const partnerLogos: { name: string; logo: string }[] = [
  { name: "HDFC Bank", logo: logoHdfcBank },
  { name: "ICICI Bank", logo: logoIciciBank },
  { name: "State Bank of India", logo: logoSbi },
  { name: "Axis Bank", logo: logoAxisBank },
  { name: "Kotak Mahindra Bank", logo: logoKotak },
  { name: "IndusInd Bank", logo: logoIndusInd },
  { name: "Yes Bank", logo: logoYesBank },
  { name: "IDFC FIRST Bank", logo: logoIdfc },
  { name: "Bank of Baroda", logo: logoBaroda },
  { name: "Canara Bank", logo: logoCanara },
  { name: "Punjab National Bank", logo: logoPnb },
  { name: "IDBI Bank", logo: logoIdbi },
  { name: "Federal Bank", logo: logoFederal },
  { name: "LIC", logo: logoLic },
  { name: "ICICI Prudential", logo: logoIciciPrudential },
  { name: "SBI Life", logo: logoSbiLife },
  { name: "HDFC Life", logo: logoHdfcLife },
  { name: "Axis Max Life", logo: logoAxisMaxLife },
];

export default function Home() {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  return (
    <Layout>
      {/* Hero Section - Enhanced with visual elements */}
      <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-slate-950">
        {/* Background gradients */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-slate-950 to-secondary/10" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full -mt-32 -mr-32" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/20 blur-[150px] rounded-full -mb-32 -ml-32" />
        </div>

        {/* Floating elements for visual interest */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ y: [0, -20, 0] }} 
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] right-[15%] w-20 h-20 bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-2xl backdrop-blur-sm border border-white/10"
          />
          <motion.div 
            animate={{ y: [0, 20, 0] }} 
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[40%] right-[8%] w-16 h-16 bg-gradient-to-br from-primary/30 to-primary/10 rounded-xl backdrop-blur-sm border border-white/10"
          />
          <motion.div 
            animate={{ y: [0, -15, 0] }} 
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[30%] right-[20%] w-12 h-12 bg-gradient-to-br from-amber-500/30 to-amber-500/10 rounded-lg backdrop-blur-sm border border-white/10"
          />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-white pt-16 pb-20">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Trust badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2"
              >
                <Award className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium">20+ Years of Trusted Service</span>
              </motion.div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-serif leading-[1.05] tracking-tight">
                Your Financial Goals,{" "}
                <span className="text-gradient">Our Expertise.</span>
              </h1>
              
              <p className="text-base sm:text-xl text-slate-300 font-light max-w-2xl leading-relaxed">
                From home loans to business funding — we compare 15+ banks to get you the 
                <span className="text-white font-medium"> lowest rates</span> and 
                <span className="text-white font-medium"> fastest approvals</span>.
              </p>

              {/* Quick benefits */}
              <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary" /> Quick Approval
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary" /> Best Rates
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-secondary" /> Zero Hidden Fees
                </span>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/contact">
                  <Button size="lg" className="h-14 px-8 rounded-xl bg-secondary text-white hover:bg-secondary/90 font-bold group shadow-lg shadow-secondary/25">
                    Get Free Consultation <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-14 px-8 rounded-xl text-white border-white/30 hover:bg-white/10 font-bold"
                  onClick={() => setIsCalculatorOpen(true)}
                >
                  <Calculator className="mr-2 h-5 w-5" /> EMI Calculator
                </Button>
              </div>

              {/* Quick contact - hidden on mobile as floating buttons serve this purpose */}
              <div className="hidden md:flex flex-wrap items-center gap-6 pt-4 text-sm">
                <a href="tel:+919876543210" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <Phone className="h-4 w-4" />
                  <span>+91 98765 43210</span>
                </a>
                <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp Us</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-6 sm:py-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="text-center lg:text-left"
                >
                  <p className="text-2xl sm:text-3xl font-serif font-black text-white">{stat.value}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-sm uppercase tracking-[0.3em] font-bold text-secondary mb-4">Our Services</h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-slate-900 mb-4">
                Find the Right Loan for You
              </h3>
              <p className="text-slate-600 text-lg">
                Choose from our range of financial products tailored to your needs
              </p>
            </motion.div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/services/${service.id}`}>
                  <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-slate-200 cursor-pointer h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`${service.color} p-3 rounded-xl text-white shadow-lg`}>
                        <service.icon className="h-6 w-6" />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">{service.rate}</p>
                        <p className="text-xs text-slate-500">{service.rateLabel}</p>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </h4>
                    <p className="text-slate-600 mb-4">{service.desc}</p>
                    <div className="flex items-center text-primary font-semibold text-sm group-hover:gap-2 transition-all">
                      Learn More <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/services">
              <Button variant="outline" size="lg" className="rounded-xl border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold">
                View All Services <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-sm uppercase tracking-[0.3em] font-bold text-secondary mb-4">Simple Process</h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-slate-900 mb-4">
                Get Your Loan in 3 Easy Steps
              </h3>
              <p className="text-slate-600 text-lg">
                Our streamlined process makes getting a loan quick and hassle-free
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {processSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                {i < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-full h-[2px] bg-slate-200">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-300 rounded-full" />
                  </div>
                )}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white mb-6 shadow-xl shadow-primary/20">
                    <span className="text-3xl font-black">{step.step}</span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h4>
                  <p className="text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 sm:py-24 bg-slate-950 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-sm uppercase tracking-[0.3em] font-bold text-secondary mb-4">Why Choose Us</h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black mb-4">
                The Express Advantage
              </h3>
              <p className="text-slate-400 text-lg">
                20+ years of experience helping customers achieve their financial goals
              </p>
            </motion.div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="bg-secondary/20 w-14 h-14 rounded-xl flex items-center justify-center mb-5">
                  <benefit.icon className="h-7 w-7 text-secondary" />
                </div>
                <h4 className="text-lg font-bold mb-2">{benefit.title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-sm uppercase tracking-[0.3em] font-bold text-secondary mb-4">Testimonials</h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black text-slate-900 mb-4">
                What Our Customers Say
              </h3>
              <p className="text-slate-600 text-lg">
                Join thousands of satisfied customers who trust Express Financial
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{testimonial.name}</p>
                      <p className="text-sm text-slate-500">{testimonial.loanType}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Banks */}
      <section className="py-16 sm:py-20 bg-slate-950 text-white">
        <div className="container mx-auto px-6 mb-10">
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-center text-white">
            Our Partner Banks & Institutions
          </h2>
          <p className="text-slate-400 text-center mt-2 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            We work with leading banks, NBFCs, and insurers to offer you the best rates and products.
          </p>
        </div>
        <div className="relative">
          <div className="marquee overflow-hidden py-2">
            <div className="marquee-inner flex-nowrap gap-4 sm:gap-6">
              {[...partnerLogos, ...partnerLogos].map((partner, i) => (
                <div
                  key={`${partner.name}-${i}`}
                  className="flex items-center gap-2.5 shrink-0 h-[70px] sm:h-20 min-w-[200px] sm:min-w-[220px] bg-white rounded-[12px] px-4 sm:px-5 py-4 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border border-slate-100"
                >
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center overflow-hidden">
                    <img
                      src={partner.logo}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-slate-900 font-semibold text-sm sm:text-base truncate">
                    {partner.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-slate-950 to-transparent z-10" aria-hidden />
          <div className="pointer-events-none absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-r from-slate-950 to-transparent z-10" aria-hidden />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-br from-primary via-primary to-blue-700 rounded-3xl p-8 sm:p-12 md:p-16 lg:p-20 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 blur-[100px] rounded-full -mt-32 -mr-32" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/20 blur-[100px] rounded-full -mb-32 -ml-32" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Speak to our loan experts today. Get personalized advice and the best rates for your needs.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Link href="/contact">
                  <Button size="lg" className="h-14 px-10 rounded-xl bg-white text-primary hover:bg-slate-100 font-bold text-lg shadow-xl w-full sm:w-auto">
                    Get Free Consultation
                  </Button>
                </Link>
                <a href="tel:+919876543210">
                  <Button size="lg" variant="outline" className="h-14 px-10 rounded-xl border-white/30 text-white hover:bg-white/10 font-bold text-lg w-full sm:w-auto">
                    <Phone className="mr-2 h-5 w-5" /> Call Now
                  </Button>
                </a>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Mon-Sat: 9AM - 7PM
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> 50+ Expert Advisors
                </span>
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> 100% Secure
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Calculator Modal */}
      <LoanCalculator 
        isOpen={isCalculatorOpen} 
        onClose={() => setIsCalculatorOpen(false)} 
      />
    </Layout>
  );
}
