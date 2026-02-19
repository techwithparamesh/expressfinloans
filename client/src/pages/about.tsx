import Layout from "@/components/layout";
import { motion } from "framer-motion";
import { ShieldCheck, Clock, Award, Target } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: ShieldCheck,
    title: "Integrity & Transparency",
    desc: "We maintain the highest standards of financial ethics, ensuring every transaction is transparent, secure, and compliant with regulatory requirements."
  },
  {
    icon: Clock,
    title: "Efficiency & Speed",
    desc: "Our streamlined processes and digital infrastructure enable rapid loan processing and disbursement, minimizing wait times for our clients."
  },
  {
    icon: Award,
    title: "Expert Advisory",
    desc: "Our experienced team of financial advisors provides personalized guidance, helping clients make informed decisions tailored to their unique needs."
  },
  {
    icon: Target,
    title: "Client-Centric Approach",
    desc: "We prioritize our clients' success, offering customized solutions and dedicated support throughout their financial journey."
  }
];

const milestones = [
  { year: "2005", title: "Company Founded", desc: "Express Financial Services was established with a vision to provide accessible and reliable financial solutions to individuals and businesses across India." },
  { year: "2010", title: "Expansion Phase", desc: "Expanded operations to serve clients across multiple states, establishing partnerships with leading banks and financial institutions." },
  { year: "2015", title: "Digital Transformation", desc: "Launched digital platforms and automated processes to enhance customer experience and streamline loan processing." },
  { year: "2020", title: "Market Leadership", desc: "Achieved significant milestones in loan disbursements and client satisfaction, becoming a trusted name in the financial services sector." },
  { year: "2025", title: "Continued Growth", desc: "Surpassed ₹500Cr in managed assets with a 98% client retention rate, demonstrating our commitment to excellence and client success." }
];

export default function About() {
  return (
    <Layout>
      {/* Professional Hero Section */}
      <section className="bg-white pt-24 sm:pt-32 pb-16 sm:pb-24 border-b border-slate-200">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-black text-slate-900 leading-tight tracking-tight">
                About Express Financial Services
              </h1>
              <div className="w-24 h-1 bg-primary mx-auto" />
              <p className="text-lg sm:text-xl text-slate-600 font-light leading-relaxed max-w-3xl mx-auto">
                Established in 2005, Express Financial Services has been a trusted partner in financial solutions,
                helping thousands of individuals and businesses achieve their goals through comprehensive loan products
                and expert advisory services.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Company Overview Section */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">
                Our Mission
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                To provide accessible, transparent, and efficient financial solutions that empower our clients
                to achieve their personal and business objectives. We strive to simplify the loan application
                process while maintaining the highest standards of service and integrity.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6 pt-8 border-t border-slate-200"
            >
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">
                Our Vision
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                To become India's most trusted financial services partner, recognized for our commitment to
                client success, innovative solutions, and ethical business practices. We aim to bridge the
                gap between financial aspirations and reality for individuals and enterprises across the nation.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16 space-y-4"
            >
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">
                Our Core Values
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                The principles that guide our operations and define our commitment to excellence
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {values.map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
                      <value.icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-serif font-bold text-slate-900">
                        {value.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {value.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Company History Timeline */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16 space-y-4"
            >
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">
                Our Journey
              </h2>
              <p className="text-lg text-slate-600">
                Two decades of growth, innovation, and client success
              </p>
            </motion.div>

            <div className="space-y-8">
              {milestones.map((milestone, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-serif font-bold text-lg">
                      {milestone.year.slice(2)}
                    </div>
                    {i < milestones.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-300 my-2" />
                    )}
                  </div>
                  <div className="pb-8 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-serif font-bold text-slate-900">
                        {milestone.title}
                      </h3>
                      <span className="text-sm font-semibold text-primary">
                        {milestone.year}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {milestone.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Statistics */}
      <section className="py-16 sm:py-24 bg-slate-950 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16 space-y-4"
            >
              <h2 className="text-3xl sm:text-4xl font-serif font-black">
                Our Track Record
              </h2>
              <p className="text-lg text-slate-300">
                Numbers that reflect our commitment to excellence
              </p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { value: "₹500Cr+", label: "Assets Managed" },
                { value: "98%", label: "Client Retention" },
                { value: "20+", label: "Years Experience" },
                { value: "10K+", label: "Loans Disbursed" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center space-y-2"
                >
                  <p className="text-4xl sm:text-5xl font-serif font-black text-secondary">
                    {stat.value}
                  </p>
                  <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section - Professional */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 space-y-4"
            >
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">
                Leadership
              </h2>
              <p className="text-lg text-slate-600">
                Guided by experienced professionals committed to your success
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-slate-50 p-8 sm:p-12 rounded-2xl border border-slate-200 space-y-6"
            >
              <div className="space-y-4">
                <h3 className="text-2xl font-serif font-bold text-slate-900">
                  Mosali Harinadha Reddy
                </h3>
                <p className="text-primary font-semibold uppercase tracking-wide text-sm">
                  Managing Director
                </p>
                <div className="w-16 h-0.5 bg-primary" />
              </div>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  With over 20 years of experience in the financial services industry, Mr. Mosali Harinadha Reddy
                  has been instrumental in shaping Express Financial Services into a trusted name in the sector.
                  Under his leadership, the company has consistently delivered exceptional results and maintained
                  the highest standards of service excellence.
                </p>
                <p>
                  His vision and commitment to client success have driven the company's growth from a boutique
                  advisory firm to a comprehensive financial services provider managing assets worth over ₹500Cr.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Contact us today to discuss your financial needs and discover how we can help you achieve your goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-primary text-white font-bold">
                    Contact Us
                  </Button>
                </Link>
                <Link href="/services">
                  <Button variant="outline" className="h-12 px-8 rounded-xl border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white font-bold">
                    View Services
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
