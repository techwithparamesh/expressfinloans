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
  Clock,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Invalid email address"),
  service: z.string().min(1, "Please select a service"),
  message: z.string().optional()
});

export default function Contact() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      service: "",
      message: ""
    }
  });

  function onSubmit(values: z.infer<typeof contactFormSchema>) {
    toast({
      title: "Consultation Initiated",
      description: "Our senior advisor will contact you within 24 hours.",
    });
    form.reset();
  }

  return (
    <Layout>
      {/* Cinematic Header */}
      <section className="bg-slate-950 pt-32 pb-64 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/30 blur-[130px] rounded-full -mt-64" />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-secondary/30 blur-[130px] rounded-full -mb-64" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <h2 className="text-sm uppercase tracking-[0.6em] font-black text-secondary">Connect With Us</h2>
            <h1 className="text-5xl md:text-8xl font-serif font-black text-white leading-tight tracking-tighter">
              Bespoke <br/>
              <span className="text-gradient italic font-light">Financial Advisory.</span>
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="pb-40 -mt-40 relative z-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-16">
            {/* Contact Info */}
            <div className="lg:col-span-5 space-y-12">
              <div className="bg-white p-12 rounded-[3rem] shadow-3xl border border-slate-100 space-y-10">
                <div className="space-y-4">
                  <h3 className="text-3xl font-serif font-bold text-slate-900">Reach Out Directly</h3>
                  <p className="text-slate-500 font-light text-lg">Speak with our certified financial strategists.</p>
                </div>

                <div className="space-y-8">
                  <div className="flex gap-6 items-start">
                    <div className="bg-primary/10 p-4 rounded-2xl text-primary">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Direct Line</p>
                      <p className="text-xl font-bold text-slate-900">+91 90000 01339</p>
                      <p className="text-sm text-slate-500">Mon-Sat, 9am - 6pm</p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start">
                    <div className="bg-secondary/10 p-4 rounded-2xl text-secondary">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Email Address</p>
                      <p className="text-xl font-bold text-slate-900">info@expressfinancialservices.com</p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start">
                    <div className="bg-slate-100 p-4 rounded-2xl text-slate-600">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Office Location</p>
                      <p className="text-xl font-bold text-slate-900 leading-tight">Elite Financial District,<br/>Hyderabad, India</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-12 rounded-[3rem] text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/40 transition-all duration-500" />
                <div className="relative z-10 space-y-6">
                  <ShieldCheck className="h-12 w-12 text-secondary" />
                  <h4 className="text-2xl font-serif font-bold leading-tight">Privacy Guaranteed.</h4>
                  <p className="text-slate-400 font-light">Your financial data is protected by institutional-grade encryption and strict non-disclosure policies.</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-3xl border border-slate-100 relative overflow-hidden">
                <div className="space-y-10 relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-[0.2em]">
                      <MessageSquare className="h-4 w-4" />
                      Immediate Response
                    </div>
                    <h3 className="text-5xl font-serif font-black text-slate-900 tracking-tighter">Initiate Consultation</h3>
                    <p className="text-xl text-slate-500 font-light leading-relaxed">Complete this form to receive a prioritized call from our senior financial advisor.</p>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                      <div className="grid md:grid-cols-2 gap-8">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400">Full Identity</FormLabel>
                              <FormControl>
                                <Input className="h-16 rounded-2xl bg-slate-50 border-none px-6 focus:ring-2 focus:ring-primary/20 text-lg" placeholder="e.g. Alexander Pierce" {...field} />
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
                              <FormLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400">Contact Number</FormLabel>
                              <FormControl>
                                <Input className="h-16 rounded-2xl bg-slate-50 border-none px-6 focus:ring-2 focus:ring-primary/20 text-lg" placeholder="+91 00000 00000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400">Email Address</FormLabel>
                              <FormControl>
                                <Input className="h-16 rounded-2xl bg-slate-50 border-none px-6 focus:ring-2 focus:ring-primary/20 text-lg" placeholder="alexander@corporate.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="service"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400">Desired Solution</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-none px-6 focus:ring-2 focus:ring-primary/20 text-lg">
                                    <SelectValue placeholder="Select expertise" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-2xl border-none shadow-3xl p-2">
                                  <SelectItem value="home-loans" className="rounded-xl py-3 px-4 focus:bg-primary/5">Home Loans</SelectItem>
                                  <SelectItem value="mortgage-loans" className="rounded-xl py-3 px-4 focus:bg-primary/5">Mortgage Loans</SelectItem>
                                  <SelectItem value="business-loans" className="rounded-xl py-3 px-4 focus:bg-primary/5">Business Loans</SelectItem>
                                  <SelectItem value="education-loans" className="rounded-xl py-3 px-4 focus:bg-primary/5">Education Loans</SelectItem>
                                  <SelectItem value="project-funding" className="rounded-xl py-3 px-4 focus:bg-primary/5">Project Funding</SelectItem>
                                  <SelectItem value="other" className="rounded-xl py-3 px-4 focus:bg-primary/5">Other Solutions</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase font-black tracking-widest text-slate-400">Executive Summary (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                className="min-h-[180px] rounded-3xl bg-slate-50 border-none p-6 focus:ring-2 focus:ring-primary/20 text-lg resize-none" 
                                placeholder="Briefly describe your financial objectives..." 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full h-20 rounded-3xl bg-slate-900 hover:bg-primary text-xl font-bold shadow-2xl transition-all duration-300 group">
                        Confirm Request <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
