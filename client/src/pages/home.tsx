import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowUpRight, ShieldCheck, Zap, Globe, TrendingUp, Home as HomeIcon, Building2, Briefcase, Building } from "lucide-react";
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
      {/* Cinematic Hero - Fixed Spacing and Overlap */}
      <section className="relative min-h-[100vh] flex flex-col justify-center overflow-hidden bg-slate-950">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={heroImage} 
            alt="Financial Success" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
        </motion.div>
        
        <div className="container mx-auto px-6 relative z-10 text-white pt-20 pb-20">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-6xl md:text-8xl font-black font-serif leading-[1] mb-8 tracking-tighter">
                Financial <br/>
                <span className="text-gradient">Precision.</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-300 mb-12 font-light leading-relaxed max-w-2xl">
                Bespoke financial architecture for those who demand excellence. Since 2005, we've redefined the standards of wealth advisory.
              </p>
              <div className="flex flex-wrap gap-6">
                <Link href="/contact">
                  <Button size="lg" className="h-16 px-10 rounded-2xl bg-secondary text-white hover:bg-secondary/90 text-lg font-bold shadow-2xl shadow-secondary/20 group border-none">
                    Enquire Now <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
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

        {/* Floating Stats Bar - Integrated into flow to avoid overlap */}
        <div className="relative z-20 border-t border-white/10 bg-white/5 backdrop-blur-2xl mt-auto">
          <div className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 items-center">
              {stats.map((stat, i) => (
                <div key={i} className="text-center lg:text-left border-slate-700 lg:border-r last:border-0 px-4 group">
                  <p className="text-4xl md:text-5xl font-serif font-black text-white mb-2 group-hover:text-secondary transition-colors">{stat.value}</p>
                  <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-40 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 -z-10 skew-x-12 translate-x-1/2" />
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="h-72 rounded-[2.5rem] bg-primary/5 overflow-hidden relative group border border-primary/10">
                    <ShieldCheck className="absolute bottom-8 left-8 h-12 w-12 text-primary opacity-20" />
                  </div>
                  <div className="h-96 rounded-[2.5rem] bg-secondary overflow-hidden relative shadow-2xl shadow-secondary/20">
                    <TrendingUp className="absolute bottom-8 left-8 h-12 w-12 text-white/20" />
                  </div>
                </div>
                <div className="space-y-6 pt-16">
                  <div className="h-96 rounded-[2.5rem] bg-slate-900 overflow-hidden relative shadow-2xl shadow-slate-900/20">
                    <Globe className="absolute bottom-8 left-8 h-12 w-12 text-white/10" />
                  </div>
                  <div className="h-72 rounded-[2.5rem] bg-slate-50 overflow-hidden relative border border-slate-200">
                    <Zap className="absolute bottom-8 left-8 h-12 w-12 text-slate-300" />
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-sm uppercase tracking-[0.5em] font-black text-secondary">Our Philosophy</h2>
                <h3 className="text-5xl md:text-7xl font-serif font-black text-slate-900 leading-[1.1] tracking-tighter">
                  Integrity is our <br/>
                  <span className="italic font-light text-primary/80">only currency.</span>
                </h3>
              </div>
              <p className="text-2xl text-slate-600 leading-relaxed font-light">
                At Express Financial Services, we believe that wealth is more than just numbers—it's about the security and freedom to pursue what truly matters. Our advisors don't just process loans; they architect futures.
              </p>
              <div className="grid sm:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="w-12 h-1 bg-primary/20" />
                  <h4 className="font-serif font-bold text-2xl text-slate-900">Expert Advisory</h4>
                  <p className="text-slate-500 leading-relaxed">Dedicated managers for every portfolio, ensuring bespoke attention to your unique needs.</p>
                </div>
                <div className="space-y-4">
                  <div className="w-12 h-1 bg-secondary/20" />
                  <h4 className="font-serif font-bold text-2xl text-slate-900">Seamless Velocity</h4>
                  <p className="text-slate-500 leading-relaxed">Advanced processing systems designed to deliver capital at the speed of your ambition.</p>
                </div>
              </div>
              <Link href="/about">
                <Button variant="link" className="p-0 h-auto text-primary text-xl font-bold group">
                  Discover Our Story <ArrowUpRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Elevated Services Grid */}
      <section className="py-40 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-24">
            <div className="space-y-4">
              <h2 className="text-sm uppercase tracking-[0.5em] font-black text-primary">Capabilities</h2>
              <h3 className="text-6xl font-serif font-black text-slate-900 tracking-tighter">Core Expertise</h3>
            </div>
            <Link href="/services">
              <Button size="lg" className="rounded-full bg-slate-900 hover:bg-primary px-12 h-16 text-lg shadow-2xl shadow-slate-200">
                All Solutions
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            {featuredServices.map((service, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -15 }}
                className="group h-full"
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[3rem] overflow-hidden bg-white">
                  <CardContent className="p-12 flex flex-col h-full">
                    <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-10 text-slate-900 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                      <service.icon className="w-10 h-10" />
                    </div>
                    <h4 className="text-3xl font-serif font-bold text-slate-900 mb-6 tracking-tight">{service.title}</h4>
                    <p className="text-slate-500 text-lg leading-relaxed mb-10 flex-grow">{service.desc}</p>
                    <Link href="/services">
                      <a className="text-sm uppercase font-black tracking-widest text-primary flex items-center gap-3 group/btn cursor-pointer">
                        Explore <ArrowUpRight className="h-5 w-5 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
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
      <section className="py-40">
        <div className="container mx-auto px-6">
          <div className="bg-slate-900 rounded-[4rem] p-16 md:p-32 relative overflow-hidden text-center shadow-3xl">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
              <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/30 blur-[120px] rounded-full -ml-64 -mt-64" />
              <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/30 blur-[120px] rounded-full -mr-64 -mb-64" />
            </div>
            <div className="relative z-10 space-y-10 max-w-5xl mx-auto">
              <h2 className="text-5xl md:text-8xl font-serif font-black text-white leading-[1.1] tracking-tighter">Ready to elevate your <br/> <span className="text-secondary">financial horizon?</span></h2>
              <p className="text-slate-400 text-2xl md:text-3xl font-light leading-relaxed">
                Join thousands of individuals and enterprises who trust us for their most critical financial decisions.
              </p>
              <div className="pt-10">
                <Link href="/contact">
                  <Button size="lg" className="h-24 px-20 rounded-[2.5rem] bg-primary hover:bg-white hover:text-primary text-2xl font-bold transition-all shadow-3xl shadow-primary/30 border-none">
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
