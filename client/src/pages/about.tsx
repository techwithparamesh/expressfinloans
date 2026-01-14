import Layout from "@/components/layout";
import { CheckCircle2, User, Award, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <Layout>
      <div className="bg-primary py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">About Us</h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-lg">
            Building relationships through trust and financial expertise since 2005.
          </p>
        </div>
      </div>

      <section className="py-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-serif font-bold mb-6 text-slate-900">Our Story</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Established in 2005, Express Financial Services began with a simple mission: to bridge the gap between complex banking processes and the common man's financial needs. Over the last two decades, we have evolved into one of the most trusted financial advisory firms in the region.
            </p>
            <p className="text-slate-600 mb-6 leading-relaxed">
              We understand that every loan application represents a dream—a new home, a child's education, or a business expansion. That's why we don't just process papers; we build futures.
            </p>
            
            <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-secondary">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Managing Director
              </h3>
              <p className="font-serif text-xl text-primary font-bold mb-1">Mosali Harinadha Reddy</p>
              <p className="text-slate-500 text-sm">
                A visionary leader with deep expertise in banking and finance, dedicated to customer success and transparent financial practices.
              </p>
            </div>
          </div>
          
          <div className="grid gap-6">
            <Card className="bg-white shadow-lg border-none">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-6 text-slate-800">Why Choose Us?</h3>
                <ul className="space-y-4">
                  {[
                    { icon: Clock, text: "18+ Years of Experience" },
                    { icon: ShieldCheck, text: "Transparent & Honest Process" },
                    { icon: Award, text: "Tie-ups with Top Banks" },
                    { icon: CheckCircle2, text: "Fast Approvals & Disbursals" },
                    { icon: User, text: "Dedicated Relationship Managers" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-600">
                      <div className="bg-green-50 text-green-600 p-2 rounded-full">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">18+</div>
              <div className="text-slate-400">Years Experience</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">5000+</div>
              <div className="text-slate-400">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">25+</div>
              <div className="text-slate-400">Bank Partners</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">100Cr+</div>
              <div className="text-slate-400">Loans Disbursed</div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
