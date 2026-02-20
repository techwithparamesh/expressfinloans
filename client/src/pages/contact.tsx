import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Users,
  IndianRupee,
  Calendar,
  Star,
  Home,
  Car,
  Briefcase,
  GraduationCap,
  Building2,
  Truck,
  CheckCircle2,
  Clock,
  PhoneCall,
  FileCheck,
  ChevronDown
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const contactFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Invalid email address"),
  service: z.string().min(1, "Please select a service"),
  loanAmount: z.string().optional(),
  message: z.string().optional()
});

const serviceCards = [
  { id: "home-loans", label: "Home Loan", icon: Home, color: "bg-blue-500" },
  { id: "car-loans", label: "Car Loan", icon: Car, color: "bg-orange-500" },
  { id: "business-loans", label: "Business", icon: Briefcase, color: "bg-emerald-500" },
  { id: "education-loans", label: "Education", icon: GraduationCap, color: "bg-purple-500" },
  { id: "mortgage-loans", label: "Mortgage", icon: Building2, color: "bg-rose-500" },
  { id: "commercial-vehicle", label: "Commercial", icon: Truck, color: "bg-amber-500" },
];

const stats = [
  { icon: Users, value: "5,000+", label: "Happy Clients" },
  { icon: IndianRupee, value: "₹500Cr+", label: "Loans Disbursed" },
  { icon: Calendar, value: "18+", label: "Years Experience" },
  { icon: Star, value: "4.8★", label: "Client Rating" },
];

const processSteps = [
  { step: 1, icon: MessageSquare, title: "Submit Form", desc: "Fill the consultation form" },
  { step: 2, icon: PhoneCall, title: "Get a Call", desc: "Within 2 hours" },
  { step: 3, icon: FileCheck, title: "Compare Rates", desc: "Best offers from 20+ banks" },
  { step: 4, icon: CheckCircle2, title: "Loan Approved", desc: "Quick disbursement" },
];

const faqs = [
  {
    q: "What documents do I need for a loan?",
    a: "Basic documents include ID proof (Aadhaar/PAN), address proof, income proof (salary slips/ITR), and bank statements. Additional documents may vary by loan type."
  },
  {
    q: "How long does loan approval take?",
    a: "Pre-approval can happen within 24-48 hours. Full disbursement typically takes 3-7 working days depending on the loan type and documentation."
  },
  {
    q: "Do you charge for consultation?",
    a: "No, our initial consultation is completely free. We only earn when your loan is successfully disbursed through our partner banks."
  },
  {
    q: "What interest rates can I expect?",
    a: "Rates vary by loan type and your profile. We help you get the best rates starting from 8.5% for home loans and 10.5% for personal loans."
  },
];

export default function Contact() {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<string>("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      service: "",
      loanAmount: "",
      message: ""
    }
  });

  function handleServiceSelect(serviceId: string) {
    setSelectedService(serviceId);
    form.setValue("service", serviceId);
  }

  function onSubmit(values: z.infer<typeof contactFormSchema>) {
    toast({
      title: "Consultation Request Received!",
      description: "Our senior advisor will call you within 2 hours.",
    });
    form.reset();
    setSelectedService("");
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-slate-950 pt-20 sm:pt-28 pb-20 sm:pb-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/30 blur-[130px] rounded-full -mt-64" />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-secondary/30 blur-[130px] rounded-full -mb-64" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <h2 className="text-sm uppercase tracking-[0.4em] font-bold text-secondary">Connect With Us</h2>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-black text-white leading-tight tracking-tight">
              Bespoke{" "}
              <span className="text-gradient italic font-light">Financial Advisory.</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-white border-b border-slate-100 py-6 sm:py-8 -mt-1 relative z-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 sm:gap-4"
              >
                <div className="bg-primary/10 p-2.5 sm:p-3 rounded-xl text-primary">
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-slate-500">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Contact Info Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-100">
                <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">Reach Out Directly</h3>
                <p className="text-slate-500 text-sm mb-6">Speak with our certified financial strategists.</p>

                <div className="space-y-5">
                  <a href="tel:+919000001339" className="flex gap-4 items-start p-4 rounded-xl bg-slate-50 hover:bg-primary/5 transition-colors group">
                    <div className="bg-primary/10 p-3 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Phone</p>
                      <p className="text-lg font-bold text-slate-900">+91 90000 01339</p>
                      <p className="text-xs text-slate-500">Mon-Sat, 9am - 6pm</p>
                    </div>
                  </a>

                  <a href="mailto:info@expressfinancialservices.com" className="flex gap-4 items-start p-4 rounded-xl bg-slate-50 hover:bg-secondary/5 transition-colors group">
                    <div className="bg-secondary/10 p-3 rounded-xl text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Email</p>
                      <p className="text-base font-bold text-slate-900 break-all">info@expressfinancialservices.com</p>
                    </div>
                  </a>

                  <div className="flex gap-4 items-start p-4 rounded-xl bg-slate-50">
                    <div className="bg-slate-200 p-3 rounded-xl text-slate-600">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">Office</p>
                      <p className="text-base font-bold text-slate-900 leading-snug">Financial District,<br/>Hyderabad, India</p>
                    </div>
                  </div>

                  <a
                    href="https://wa.me/919000001339"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.435 5.63 1.435h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Chat on WhatsApp
                  </a>
                </div>
              </div>

              <div className="bg-slate-900 p-6 sm:p-8 rounded-2xl text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10">
                  <ShieldCheck className="h-10 w-10 text-secondary mb-4" />
                  <h4 className="text-xl font-serif font-bold mb-2">100% Privacy Guaranteed</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">Your data is protected by bank-grade encryption. We never share your information.</p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-8">
              <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-lg border border-slate-100">
                <div className="mb-8">
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider mb-2">
                    <MessageSquare className="h-4 w-4" />
                    Free Consultation
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-2">Get Expert Advice</h3>
                  <p className="text-slate-500">Select your loan type and fill the form. We'll call you within 2 hours.</p>
                </div>

                {/* Service Quick Select Cards */}
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Quick Select Service</p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                    {serviceCards.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleServiceSelect(service.id)}
                        className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
                          selectedService === service.id
                            ? "border-primary bg-primary/5"
                            : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`${service.color} p-2 rounded-lg text-white`}>
                          <service.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{service.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</FormLabel>
                            <FormControl>
                              <Input className="h-12 sm:h-14 rounded-xl bg-slate-50 border-slate-200 px-4 focus:ring-2 focus:ring-primary/20 text-base" placeholder="Your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number</FormLabel>
                            <FormControl>
                              <Input className="h-12 sm:h-14 rounded-xl bg-slate-50 border-slate-200 px-4 focus:ring-2 focus:ring-primary/20 text-base" placeholder="+91 98765 43210" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</FormLabel>
                            <FormControl>
                              <Input className="h-12 sm:h-14 rounded-xl bg-slate-50 border-slate-200 px-4 focus:ring-2 focus:ring-primary/20 text-base" placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="loanAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-400">Loan Amount (Approx.)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 sm:h-14 rounded-xl bg-slate-50 border-slate-200 px-4 focus:ring-2 focus:ring-primary/20 text-base">
                                  <SelectValue placeholder="Select amount range" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="5-10L">₹5 Lakh - ₹10 Lakh</SelectItem>
                                <SelectItem value="10-25L">₹10 Lakh - ₹25 Lakh</SelectItem>
                                <SelectItem value="25-50L">₹25 Lakh - ₹50 Lakh</SelectItem>
                                <SelectItem value="50L-1Cr">₹50 Lakh - ₹1 Crore</SelectItem>
                                <SelectItem value="1Cr-5Cr">₹1 Crore - ₹5 Crore</SelectItem>
                                <SelectItem value="5Cr+">₹5 Crore+</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="service"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-400">Loan Type</FormLabel>
                          <Select onValueChange={(val) => { field.onChange(val); setSelectedService(val); }} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 sm:h-14 rounded-xl bg-slate-50 border-slate-200 px-4 focus:ring-2 focus:ring-primary/20 text-base">
                                <SelectValue placeholder="Select loan type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="home-loans">Home Loans</SelectItem>
                              <SelectItem value="mortgage-loans">Mortgage / LAP</SelectItem>
                              <SelectItem value="car-loans">Car Loans</SelectItem>
                              <SelectItem value="personal-loans">Personal Loans</SelectItem>
                              <SelectItem value="business-loans">Business Loans</SelectItem>
                              <SelectItem value="education-loans">Education Loans</SelectItem>
                              <SelectItem value="sme-loans">SME Loans</SelectItem>
                              <SelectItem value="commercial-vehicle">Commercial Vehicle</SelectItem>
                              <SelectItem value="life-insurance">Life Insurance</SelectItem>
                              <SelectItem value="project-funding">Project Funding</SelectItem>
                              <SelectItem value="lrd-loans">LRD Loans</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-400">Additional Details (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              className="min-h-[100px] rounded-xl bg-slate-50 border-slate-200 p-4 focus:ring-2 focus:ring-primary/20 text-base resize-none" 
                              placeholder="Tell us more about your requirements..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full h-14 sm:h-16 rounded-xl bg-primary hover:bg-primary/90 text-base sm:text-lg font-bold shadow-lg transition-all group">
                      Get Free Consultation <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    {/* Trust indicators */}
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        No spam calls
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        100% free consultation
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Response in 2 hours
                      </span>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Happens Next */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-2">What Happens Next?</h2>
            <p className="text-slate-500">Simple 4-step process to get your loan approved</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {processSteps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="relative inline-flex mb-4">
                  <div className="bg-primary/10 p-4 sm:p-5 rounded-2xl text-primary">
                    <step.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 mb-1">{step.title}</h4>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-2">Frequently Asked Questions</h2>
              <p className="text-slate-500">Quick answers to common queries</p>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-100">
                      <p className="pt-4">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Google Maps */}
      <section className="bg-white">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mb-2">Visit Our Office</h2>
            <p className="text-slate-500">Financial District, Hyderabad, India</p>
          </div>
        </div>
        <div className="h-[300px] sm:h-[400px] bg-slate-200">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.2936050984187!2d78.3748053!3d17.4399305!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93dc8c5d6dcb%3A0x2de12ad1c4e6d4f3!2sFinancial%20District%2C%20Hyderabad%2C%20Telangana!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Office Location"
          />
        </div>
      </section>
    </Layout>
  );
}
