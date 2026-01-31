import Layout from "@/components/layout";
import { motion } from "framer-motion";
import { 
  Users, 
  Target, 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Briefcase,
  History,
  Building2,
  CheckCircle2
} from "lucide-react";
import { Link } from "wouter";
import founderImage from "@assets/IMG-20260112-WA0000_1768436447893.jpg";

const values = [
  {
    icon: ShieldCheck,
    title: "Institutional Integrity",
    desc: "We maintain the highest standards of financial ethics, ensuring every transaction is transparent and secure."
  },
  {
    icon: Clock,
    title: "Operational Velocity",
    desc: "Time is capital. Our proprietary systems are engineered to deliver financial solutions at the speed of your ambition."
  },
  {
    icon: Award,
    title: "Premium Advisory",
    desc: "Our senior advisors provide bespoke financial architecture, not just generic loan processing."
  }
];

const milestones = [
  { year: "2005", title: "Founding", desc: "Express Financial Services established with a vision for premium financial advisory." },
  { year: "2012", title: "Strategic Expansion", desc: "Expanded into commercial project funding and SME corporate credit." },
  { year: "2018", title: "Digital Transformation", desc: "Launched proprietary digital credit assessment framework for faster approvals." },
  { year: "2025", title: "Institutional Milestone", desc: "Surpassed ₹500Cr in managed assets with a 98% client retention rate." }
];

export default function About() {
  return (
    <Layout>
      {/* Editorial Hero Section */}
      <section className="bg-slate-950 pt-24 sm:pt-32 pb-24 sm:pb-64 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/30 blur-[120px] rounded-full -mt-64" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/30 blur-[120px] rounded-full -mb-64" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-sm uppercase tracking-[0.6em] font-black text-secondary">Our Legacy</h2>
              <h1 className="text-4xl sm:text-5xl md:text-8xl font-serif font-black text-white leading-tight tracking-tighter">
                Architecting <br/>
                <span className="text-gradient italic font-light">Financial Futures.</span>
              </h1>
              <p className="text-base sm:text-xl md:text-2xl text-slate-400 font-light max-w-2xl leading-relaxed">
                Since 2005, Express Financial Services has been the silent engine behind thousands of successful property acquisitions and enterprise expansions.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="pb-24 sm:pb-40 -mt-16 sm:-mt-32 relative z-20">
        <div className="container mx-auto px-6">
          <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] overflow-hidden shadow-3xl border border-slate-100">
            <div className="grid lg:grid-cols-2">
              <div className="relative h-[420px] sm:h-[520px] lg:h-auto overflow-hidden">
                <img 
                  src={founderImage} 
                  alt="Mosali Harinadha Reddy - Managing Director" 
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent lg:hidden" />
                <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 text-white lg:hidden">
                  <p className="text-xl sm:text-2xl font-serif font-bold">Mosali Harinadha Reddy</p>
                  <p className="text-secondary font-bold uppercase tracking-widest text-xs sm:text-sm">Managing Director</p>
                </div>
              </div>
              <div className="p-8 sm:p-12 md:p-24 flex flex-col justify-center space-y-10">
                <div className="space-y-6">
                  <h2 className="text-sm uppercase tracking-[0.4em] font-black text-primary">Leadership</h2>
                  <h3 className="text-3xl sm:text-4xl md:text-6xl font-serif font-black text-slate-900 tracking-tighter leading-tight">
                    Visionary Guidance. <br/>
                    <span className="italic font-light">Institutional Excellence.</span>
                  </h3>
                  <div className="hidden lg:block pt-2">
                    <p className="text-2xl font-serif font-bold text-slate-900">Mosali Harinadha Reddy</p>
                    <p className="text-secondary font-bold uppercase tracking-widest text-sm">Managing Director</p>
                  </div>
                </div>
                <div className="space-y-6 text-lg sm:text-xl text-slate-600 font-light leading-relaxed">
                  <p>
                    "Our mission has always been simple: to provide the financial backbone that allows our clients' dreams to take flight. In an industry often clouded by complexity, we choose clarity."
                  </p>
                  <p>
                    Under Mr. Reddy's leadership, Express Financial Services has evolved from a boutique advisory into a multi-asset financial powerhouse, known for its rapid execution and unwavering commitment to client success.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-6">
                  <div className="space-y-2">
                    <p className="text-3xl sm:text-4xl font-serif font-black text-primary">20+</p>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Years Experience</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl sm:text-4xl font-serif font-black text-primary">10k+</p>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Portfolios Guided</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Grid */}
      <section className="py-20 sm:py-32 lg:py-40 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-24 space-y-4">
            <h2 className="text-sm uppercase tracking-[0.5em] font-black text-secondary">The Express Code</h2>
            <h3 className="text-5xl font-serif font-black text-slate-900 tracking-tighter">What Defines Us</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {values.map((value, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-slate-100 group"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 sm:mb-10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                  <value.icon className="h-10 w-10" />
                </div>
                <h4 className="text-3xl font-serif font-bold text-slate-900 mb-6">{value.title}</h4>
                <p className="text-slate-500 text-lg leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 sm:py-32 lg:py-40 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 sm:gap-24 items-start relative">
            <div className="lg:sticky lg:top-32 space-y-8 sm:space-y-10 z-10 bg-white/80 backdrop-blur-sm lg:bg-transparent py-8 lg:py-0">
              <div className="space-y-6">
                <h2 className="text-sm uppercase tracking-[0.5em] font-black text-primary">Timeline</h2>
                <h3 className="text-5xl md:text-7xl font-serif font-black text-slate-900 tracking-tighter leading-tight">
                  Two Decades of <br/>
                  <span className="italic font-light">Growth & Trust.</span>
                </h3>
              </div>
              <p className="text-lg sm:text-2xl text-slate-600 font-light leading-relaxed">
                From our first loan disbursement in 2005 to managing institutional-grade assets today, our journey is defined by the success of our clients.
              </p>
            </div>
            <div className="space-y-16 lg:pt-20 relative">
              {milestones.map((milestone, i) => (
                <div key={i} className="flex gap-6 sm:gap-10 group relative bg-white/50 backdrop-blur-sm p-6 rounded-3xl lg:bg-transparent lg:p-0">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-primary flex items-center justify-center text-primary font-serif font-bold shrink-0 group-hover:bg-primary group-hover:text-white transition-all z-10 bg-white">
                      {milestone.year.slice(2)}
                    </div>
                    {i < milestones.length - 1 && <div className="w-[2px] h-full bg-slate-100 my-4" />}
                  </div>
                  <div className="pb-8 sm:pb-12 space-y-4">
                    <h4 className="text-2xl font-serif font-bold text-slate-900">{milestone.title}</h4>
                    <p className="text-slate-500 text-lg leading-relaxed">{milestone.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="py-24 sm:py-32 lg:py-40 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary blur-[150px] rounded-full -mr-96 -mt-96" />
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-16 lg:gap-20">
            <div className="space-y-4">
              <p className="text-4xl sm:text-6xl md:text-8xl font-serif font-black text-secondary">₹500Cr</p>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Assets Managed</p>
            </div>
            <div className="space-y-4">
              <p className="text-4xl sm:text-6xl md:text-8xl font-serif font-black text-secondary">98%</p>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Client Retention</p>
            </div>
            <div className="space-y-4">
              <p className="text-4xl sm:text-6xl md:text-8xl font-serif font-black text-secondary">15+</p>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Bank Partners</p>
            </div>
            <div className="space-y-4">
              <p className="text-4xl sm:text-6xl md:text-8xl font-serif font-black text-secondary">24h</p>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Avg. Response</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
