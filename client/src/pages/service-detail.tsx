import { useRoute } from "wouter";
import Layout from "@/components/layout";
import LoanCalculator from "@/components/loan-calculator";
import { getServiceById } from "@/data/services";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Clock,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import NotFound from "./not-found";

export default function ServiceDetail() {
  const [, params] = useRoute("/services/:serviceId");
  const serviceId = params?.serviceId;

  if (!serviceId) {
    return <NotFound />;
  }

  const service = getServiceById(serviceId);

  if (!service) {
    return <NotFound />;
  }

  const ServiceIcon = service.icon;

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-slate-950 pt-24 sm:pt-32 pb-16 sm:pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className={`absolute inset-0 bg-gradient-to-tr ${service.color} blur-[120px]`} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-sm border border-white/20">
                <ServiceIcon className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-sm uppercase tracking-[0.6em] font-black text-secondary">
              {service.subtitle}
            </h2>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-black text-white leading-tight tracking-tighter">
              {service.title}
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed">
              {service.desc}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Loan Calculator - prominent, right after hero */}
      {service.calculatorConfig && (
        <section className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <LoanCalculator {...service.calculatorConfig} loanType={service.title} />
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left Column - Content */}
            <div className="space-y-12">
              {/* Overview */}
              {service.detailedContent?.overview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-4"
                >
                  <h3 className="text-3xl font-serif font-black text-slate-900">
                    Overview
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {service.detailedContent.overview}
                  </p>
                </motion.div>
              )}

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <h3 className="text-3xl font-serif font-black text-slate-900">
                  Key Features
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="bg-secondary/10 p-1.5 rounded-full text-secondary mt-0.5">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <span className="text-base font-semibold text-slate-700">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Benefits */}
              {service.detailedContent?.benefits && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <h3 className="text-3xl font-serif font-black text-slate-900">
                    Benefits
                  </h3>
                  <ul className="space-y-3">
                    {service.detailedContent.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="bg-primary/10 p-1.5 rounded-full text-primary mt-0.5">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <span className="text-base text-slate-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Eligibility */}
              {service.detailedContent?.eligibility && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <h3 className="text-3xl font-serif font-black text-slate-900">
                    Eligibility Criteria
                  </h3>
                  <ul className="space-y-3">
                    {service.detailedContent.eligibility.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="bg-primary/10 p-1.5 rounded-full text-primary mt-0.5">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <span className="text-base text-slate-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Documents */}
              {service.detailedContent?.documents && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <h3 className="text-3xl font-serif font-black text-slate-900">
                    Required Documents
                  </h3>
                  <ul className="space-y-3">
                    {service.detailedContent.documents.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="bg-secondary/10 p-1.5 rounded-full text-secondary mt-0.5">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="text-base text-slate-600">{doc}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Process */}
              {service.detailedContent?.process && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <h3 className="text-3xl font-serif font-black text-slate-900">
                    Application Process
                  </h3>
                  <div className="space-y-4">
                    {service.detailedContent.process.map((step, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-black">
                          {idx + 1}
                        </div>
                        <div className="flex-1 pt-2">
                          <p className="text-base text-slate-600">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Link href={`/contact?service=${service.title}`}>
                  <Button className="h-14 w-full sm:w-auto px-10 rounded-2xl bg-slate-900 hover:bg-primary text-white font-bold text-lg shadow-2xl transition-all group">
                    Apply for {service.title} <ArrowUpRight className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right Column - Image */}
            <div className="space-y-8">
              {/* Service Image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-tr ${service.color} blur-3xl rounded-[3rem] -z-10`} />
                <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-3xl border-4 border-white group">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
