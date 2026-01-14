import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  ArrowUpRight, 
  Home, 
  Building, 
  Briefcase, 
  Building2, 
  ShieldCheck, 
  Clock, 
  Zap, 
  FileText, 
  CheckCircle2
} from "lucide-react";
import { Link } from "wouter";

const services = [
  {
    id: "home-loans",
    icon: Home,
    title: "Premium Home Financing",
    subtitle: "Elite Mortgages for Bespoke Residences",
    desc: "Experience seamless property acquisition with our customized mortgage solutions. We offer competitive interest rates and high-loan-to-value ratios tailored for premium real estate.",
    features: ["Interest rates from 8.5%", "Tenure up to 30 years", "Zero processing fee for elite clients", "Bespoke repayment plans"],
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
    color: "from-blue-500/10 to-blue-600/5"
  },
  {
    id: "mortgage-loans",
    icon: Building,
    title: "Property Leveraging",
    subtitle: "Capitalize on Your Fixed Assets",
    desc: "Unlock the inherent value of your residential or commercial property. Our mortgage-backed credit lines provide the liquidity needed for major life milestones or strategic reinvestment.",
    features: ["Loan against property up to ₹50Cr", "Flexible end-use of funds", "Minimal documentation", "Instant approval window"],
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
    color: "from-red-500/10 to-red-600/5"
  },
  {
    id: "business-loans",
    icon: Building2,
    title: "Corporate Growth Capital",
    subtitle: "Unsecured Funding for Global Ambition",
    desc: "Fuel your enterprise's expansion with our rapid-access business credit. Designed for companies ready to scale, our solutions provide capital without collateral constraints.",
    features: ["Unsecured loans up to ₹1Cr", "Approval in 48 hours", "Competitive corporate rates", "Flexible drawdown options"],
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
    color: "from-slate-500/10 to-slate-600/5"
  },
  {
    id: "sme-loans",
    icon: Briefcase,
    title: "SME Strategic Funding",
    subtitle: "Empowering Local Enterprise",
    desc: "Specialized financing for Small and Medium Enterprises. We understand the unique challenges of SMEs and provide the financial backbone necessary for sustainable scaling.",
    features: ["Working capital limits", "Equipment & machinery financing", "Supply chain credit", "Dedicated relationship manager"],
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800",
    color: "from-blue-900/10 to-blue-800/5"
  }
];

const processSteps = [
  { icon: FileText, title: "Initial Consultation", desc: "Expert assessment of your financial objectives and profile." },
  { icon: Zap, title: "Rapid Analysis", desc: "Digital verification and precision risk assessment." },
  { icon: ShieldCheck, title: "Strategic Approval", desc: "Formal credit sanction with bespoke terms." },
  { icon: Clock, title: "Instant Liquidity", desc: "Seamless disbursement to your preferred accounts." }
];

export default function Services() {
  return (
    <Layout>
      {/* Editorial Services Header */}
      <section className="bg-slate-950 pt-32 pb-64 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/30 blur-[120px] rounded-full -mt-64" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/30 blur-[120px] rounded-full -mb-64" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-sm uppercase tracking-[0.6em] font-black text-secondary">Our Capabilities</h2>
              <h1 className="text-5xl md:text-8xl font-serif font-black text-white leading-tight tracking-tighter">
                Institutional Grade <br/>
                <span className="text-gradient italic font-light">Financial Solutions.</span>
              </h1>
              <p className="text-2xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
                Since 2005, we have curated a suite of premium financial products designed for precision, velocity, and sustainable growth.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Senior Service Showcase */}
      <section className="pb-40 -mt-40 relative z-20">
        <div className="container mx-auto px-6">
          <div className="space-y-32">
            {services.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className={`grid lg:grid-cols-2 gap-20 items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                <div className={`${i % 2 === 1 ? 'lg:order-2' : ''} space-y-10`}>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 text-primary">
                      <div className="bg-white p-3 rounded-2xl shadow-xl ring-1 ring-slate-100">
                        <service.icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.4em]">{service.subtitle}</span>
                    </div>
                    <h3 className="text-5xl font-serif font-black text-slate-900 tracking-tighter leading-tight">
                      {service.title}
                    </h3>
                    <p className="text-xl text-slate-600 leading-relaxed font-light">
                      {service.desc}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 group">
                        <div className="bg-secondary/10 p-1.5 rounded-full text-secondary transition-colors group-hover:bg-secondary group-hover:text-white">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 tracking-tight">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6">
                    <Link href={`/contact?service=${service.title}`}>
                      <Button size="lg" className="h-16 px-10 rounded-2xl bg-slate-900 hover:bg-primary text-lg font-bold shadow-2xl transition-all group">
                        Consult for {service.title} <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className={`${i % 2 === 1 ? 'lg:order-1' : ''} relative`}>
                  <div className={`absolute inset-0 bg-gradient-to-tr ${service.color} blur-3xl rounded-[3rem] -z-10`} />
                  <div className="relative h-[500px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-3xl border-8 border-white group">
                    <img 
                      src={service.image} 
                      alt={service.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Elite Process Timeline */}
      <section className="py-40 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white -skew-x-12 translate-x-1/4 -z-0" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-24 space-y-4">
            <h2 className="text-sm uppercase tracking-[0.5em] font-black text-secondary">The Velocity Framework</h2>
            <h3 className="text-5xl font-serif font-black text-slate-900 tracking-tighter">Bespoke Advisory Process</h3>
            <p className="text-xl text-slate-500 font-light">Four strategic stages from inquiry to capital deployment.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, i) => (
              <div key={i} className="relative group">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-12 left-[80%] w-full h-[2px] bg-slate-200 -z-10">
                    <div className="h-full bg-primary w-0 group-hover:w-full transition-all duration-700" />
                  </div>
                )}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 h-full border border-slate-100">
                  <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg group-hover:bg-primary transition-colors">
                    <step.icon className="h-8 w-8" />
                  </div>
                  <h4 className="text-2xl font-serif font-bold text-slate-900 mb-4">{step.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                  <div className="mt-8 text-xs font-black text-slate-200">0{i + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Conversion Section */}
      <section className="py-40">
        <div className="container mx-auto px-6">
          <div className="bg-primary rounded-[4rem] p-16 md:p-32 relative overflow-hidden text-center shadow-3xl text-white">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
              <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/20 blur-[120px] rounded-full -ml-64 -mt-64" />
              <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/30 blur-[120px] rounded-full -mr-64 -mb-64" />
            </div>
            <div className="relative z-10 space-y-10 max-w-5xl mx-auto">
              <h2 className="text-5xl md:text-8xl font-serif font-black leading-[1.1] tracking-tighter">Elevate your financial <br/> <span className="italic font-light">architecture today.</span></h2>
              <div className="flex flex-wrap justify-center gap-6 pt-10">
                <Link href="/contact">
                  <Button size="lg" className="h-24 px-16 rounded-[2.5rem] bg-white text-primary hover:bg-slate-900 hover:text-white text-2xl font-bold transition-all shadow-3xl border-none">
                    Open Priority Case
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="h-24 px-16 rounded-[2.5rem] border-white/30 text-white hover:bg-white/10 text-2xl font-bold backdrop-blur-sm">
                    View Case Studies
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
