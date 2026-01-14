import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, ShieldCheck, Zap, Globe, TrendingUp, Home as HomeIcon, Building2, Car, Briefcase, GraduationCap, HeartPulse, Building, Bus } from "lucide-react";
import heroImage from "@assets/generated_images/modern_family_home_with_happy_couple_keys.png";

const stats = [
  { label: "Assets Managed", value: "₹500Cr+" },
  { label: "Client Retention", value: "98%" },
  { label: "Loan Disbursed", value: "10K+" },
  { label: "Expert Advisors", value: "50+" },
];

const featuredServices = [
  { icon: HomeIcon, title: "Home Loans", desc: "Premium mortgages with elite interest rates." },
  { icon: Building, title: "Mortgage Loans", desc: "Capitalize on your property's inherent value." },
  { icon: Briefcase, title: "SME Loans", desc: "Strategic funding for enterprise expansion." },
  { icon: Building2, title: "Business Loans", desc: "Unsecured credit lines for corporate growth." },
];

export default function Home() {
  return (
    <Layout>
      {/* Cinematic Hero */}
      <section className="relative h-[95vh] flex items-center overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={heroImage} 
            alt="Financial Success" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
        </motion.div>
        
        <div className="container mx-auto px-6 relative z-10 text-white">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-block px-4 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-[0.3em] mb-6">
                Established 2005
              </span>
              <h1 className="text-6xl md:text-8xl font-black font-serif leading-[1.1] mb-8 tracking-tighter">
                Financial <br/>
                <span className="text-gradient">Precision.</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 mb-12 font-light leading-relaxed max-w-2xl">
                Bespoke financial architecture for those who demand excellence. Since 2005, we've redefined the standards of wealth advisory.
              </p>
              <div className="flex flex-wrap gap-6">
                <Link href="/contact">
                  <Button size="lg" className="h-16 px-10 rounded-2xl bg-secondary text-white hover:bg-secondary/90 text-lg font-bold shadow-2xl shadow-secondary/20 group">
                    Start Your Journey <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/services">
                  <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl text-white border-white/30 hover:bg-white/10 text-lg font-bold backdrop-blur-sm">
                    Our Expertise
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Floating Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0 glass border-t-0 border-x-0 py-10">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center md:text-left border-r border-slate-200 last:border-0 pr-4">
                  <p className="text-4xl font-serif font-black text-slate-900 mb-1">{stat.value}</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 -z-10 skew-x-12 translate-x-1/2" />
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="h-64 rounded-3xl bg-primary/10 overflow-hidden relative group">
                    <ShieldCheck className="absolute bottom-6 left-6 h-12 w-12 text-primary opacity-20" />
                  </div>
                  <div className="h-80 rounded-3xl bg-secondary overflow-hidden relative">
                    <TrendingUp className="absolute bottom-6 left-6 h-12 w-12 text-white/20" />
                  </div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="h-80 rounded-3xl bg-slate-900 overflow-hidden relative">
                    <Globe className="absolute bottom-6 left-6 h-12 w-12 text-white/10" />
                  </div>
                  <div className="h-64 rounded-3xl bg-slate-100 overflow-hidden relative">
                    <Zap className="absolute bottom-6 left-6 h-12 w-12 text-slate-300" />
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="space-y-10">
              <div className="space-y-4">
                <h2 className="text-sm uppercase tracking-[0.4em] font-black text-secondary">Our Philosophy</h2>
                <h3 className="text-5xl md:text-6xl font-serif font-black text-slate-900 leading-[1.1]">
                  Integrity is our <br/>
                  <span className="italic font-light">only currency.</span>
                </h3>
              </div>
              <p className="text-xl text-slate-600 leading-relaxed font-light">
                At Express Financial Services, we believe that wealth is more than just numbers—it's about the security and freedom to pursue what truly matters. Our advisors don't just process loans; they architect futures.
              </p>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-xl text-slate-900">Expert Advisory</h4>
                  <p className="text-slate-500 text-sm">Dedicated managers for every portfolio, ensuring bespoke attention to your unique needs.</p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-serif font-bold text-xl text-slate-900">Seamless Velocity</h4>
                  <p className="text-slate-500 text-sm">Advanced processing systems designed to deliver capital at the speed of your ambition.</p>
                </div>
              </div>
              <Link href="/about">
                <Button variant="link" className="p-0 h-auto text-primary text-lg font-bold group">
                  Discover Our Story <ArrowUpRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Elevated Services Grid */}
      <section className="py-32 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-[0.4em] font-black text-primary">Capabilities</h2>
              <h3 className="text-5xl font-serif font-black text-slate-900">Core Expertise</h3>
            </div>
            <Link href="/services">
              <Button size="lg" className="rounded-full bg-slate-900 hover:bg-primary px-10 shadow-xl shadow-slate-200">
                All Solutions
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredServices.map((service, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="group h-full"
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden bg-white">
                  <CardContent className="p-10 flex flex-col h-full">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 text-slate-900 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                      <service.icon className="w-8 h-8" />
                    </div>
                    <h4 className="text-2xl font-serif font-bold text-slate-900 mb-4">{service.title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow">{service.desc}</p>
                    <Link href="/contact">
                      <a className="text-xs uppercase font-bold tracking-widest text-primary flex items-center gap-2 group/btn">
                        Learn More <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
                      </a>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="container mx-auto px-6">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-24 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
              <div className="absolute top-0 left-0 w-96 h-96 bg-primary/40 blur-[100px] rounded-full -ml-48 -mt-48" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/40 blur-[100px] rounded-full -mr-48 -mb-48" />
            </div>
            <div className="relative z-10 space-y-8 max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-7xl font-serif font-black text-white leading-tight">Ready to elevate your <br/> <span className="text-secondary">financial horizon?</span></h2>
              <p className="text-slate-400 text-xl md:text-2xl font-light">
                Join thousands of individuals and enterprises who trust us for their most critical financial decisions.
              </p>
              <div className="pt-8">
                <Link href="/contact">
                  <Button size="lg" className="h-20 px-16 rounded-[2rem] bg-primary hover:bg-white hover:text-primary text-xl font-bold transition-all shadow-3xl shadow-primary/20">
                    Schedule a Consultation
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
