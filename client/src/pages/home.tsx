import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Home as HomeIcon, Building2, Car, Briefcase, GraduationCap, HeartPulse, Building, Bus, Landmark } from "lucide-react";
import heroImage from "@assets/generated_images/modern_family_home_with_happy_couple_keys.png";

const services = [
  { icon: HomeIcon, title: "Home Loans", desc: "Get the lowest interest rates for your dream home." },
  { icon: Building, title: "Mortgage Loans", desc: "Unlock the value of your property with easy processing." },
  { icon: Briefcase, title: "SME Loans", desc: "Capital to grow your small or medium enterprise." },
  { icon: Car, title: "Car Loans", desc: "Drive your dream car with up to 100% funding." },
  { icon: Building2, title: "Business Loans", desc: "Collateral-free loans to expand your business." },
  { icon: Bus, title: "Commercial Vehicle", desc: "Funding for trucks, buses, and commercial fleets." },
  { icon: HeartPulse, title: "Life Insurance", desc: "Secure your family's future with our plans." },
  { icon: GraduationCap, title: "Education Loans", desc: "Invest in your future with flexible repayment options." },
];

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Happy couple with new home" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-white pt-20">
          <div className="max-w-2xl animate-in slide-in-from-left duration-700">
            <h1 className="text-5xl md:text-7xl font-bold font-serif mb-6 leading-tight">
              Dream Home <br/>
              <span className="text-secondary">Made Possible</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-200 mb-8 font-light">
              Trusted financial solutions since 2005. We help you build your future with fast, transparent, and secure funding.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-secondary text-primary hover:bg-secondary/90 font-bold text-lg px-8 h-14">
                  Apply Now
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20 font-semibold text-lg px-8 h-14">
                  View Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <span className="text-primary font-bold tracking-wider uppercase text-sm">Since 2005</span>
          <h2 className="text-4xl font-serif font-bold mt-2 mb-6 text-slate-900">Your Trusted Financial Partner</h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Express Financial Services has been a pillar of trust for over 18 years. 
            Founded by <span className="font-semibold text-primary">Mosali Harinadha Reddy</span>, 
            we specialize in making complex financial processes simple, transparent, and accessible for everyone.
          </p>
          <Link href="/about">
            <Button variant="link" className="text-primary text-lg group">
              Know More About Us <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">Our Services</h2>
            <p className="text-slate-600">Comprehensive financial solutions tailored for you</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                    <service.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-800">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm mb-4">{service.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/services">
              <Button size="lg" className="bg-primary hover:bg-primary/90">View All Services</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Partners/Banks Text Grid */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
          <h3 className="text-center text-slate-400 font-semibold uppercase tracking-widest mb-10">Our Banking Partners</h3>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 grayscale opacity-70">
            {["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra", "LIC Housing", "Bajaj Finserv", "Tata Capital"].map((bank) => (
              <span key={bank} className="text-xl md:text-2xl font-bold text-slate-300 select-none">
                {bank}
              </span>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
