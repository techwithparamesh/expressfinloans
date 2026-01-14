import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, Send, MessageSquare, Clock, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid mobile number is required"),
  email: z.string().email("Valid email is required"),
  service: z.string().min(1, "Please select a service"),
  message: z.string().optional(),
});

export default function Contact() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      service: "",
      message: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log(data);
    toast({
      title: "Priority Request Received",
      description: "Our senior advisor will contact you shortly.",
      className: "bg-slate-900 text-white border-none rounded-2xl",
    });
    form.reset();
  }

  const contactMethods = [
    {
      icon: Phone,
      title: "Direct Advisory",
      desc: "Speak with our financial experts",
      values: ["+91 90000 01339", "+91 90910 01008"],
      hrefs: ["tel:+919000001339", "tel:+919091001008"],
      color: "bg-primary/10 text-primary"
    },
    {
      icon: Mail,
      title: "Official Inquiry",
      desc: "Detailed proposals and documentation",
      values: ["info@expressfinancialservices.com"],
      hrefs: ["mailto:info@expressfinancialservices.com"],
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: Clock,
      title: "Business Hours",
      desc: "Our active operational window",
      values: ["Mon - Sat: 9:00 AM - 6:00 PM"],
      hrefs: [],
      color: "bg-slate-100 text-slate-600"
    }
  ];

  return (
    <Layout>
      {/* Editorial Header */}
      <section className="bg-slate-950 pt-32 pb-48 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/40 blur-[120px] rounded-full -mr-64 -mt-64" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center space-y-8"
          >
            <h2 className="text-sm uppercase tracking-[0.6em] font-black text-secondary">Connect With Excellence</h2>
            <h1 className="text-5xl md:text-8xl font-serif font-black text-white leading-tight tracking-tighter">
              Let's architect your <br/>
              <span className="text-gradient italic font-light">financial future.</span>
            </h1>
            <p className="text-2xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
              Experience the pinnacle of financial advisory. Reach out to our senior partners for bespoke solutions tailored to your ambition.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-32 -mt-32 relative z-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            
            {/* Senior Sidebar */}
            <div className="lg:col-span-5 space-y-8">
              <div className="grid gap-6">
                {contactMethods.map((method, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 group hover:shadow-2xl transition-all duration-500"
                  >
                    <div className="flex items-start gap-6">
                      <div className={`${method.color} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-500`}>
                        <method.icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-serif font-bold text-slate-900">{method.title}</h4>
                        <p className="text-slate-500 text-sm mb-4">{method.desc}</p>
                        {method.values.map((val, idx) => (
                          method.hrefs[idx] ? (
                            <a key={idx} href={method.hrefs[idx]} className="block text-lg font-medium text-slate-800 hover:text-primary transition-colors">
                              {val}
                            </a>
                          ) : (
                            <p key={idx} className="text-lg font-medium text-slate-800">{val}</p>
                          )
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Trust Badge */}
              <div className="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3 text-secondary">
                    <Shield className="h-6 w-6" />
                    <span className="text-xs font-black uppercase tracking-widest">Client Protection</span>
                  </div>
                  <h4 className="text-2xl font-serif font-bold">Your privacy is our priority.</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    All communications are strictly confidential and encrypted. We never share your data with third parties.
                  </p>
                </div>
              </div>
            </div>

            {/* Modern Lead Capture Form */}
            <div className="lg:col-span-7">
              <Card className="rounded-[3rem] border-0 shadow-3xl overflow-hidden bg-white">
                <CardContent className="p-12 md:p-16">
                  <div className="mb-12 space-y-4">
                    <div className="flex items-center gap-3 text-primary">
                      <MessageSquare className="h-6 w-6" />
                      <span className="text-xs font-black uppercase tracking-widest">Immediate Response</span>
                    </div>
                    <h3 className="text-4xl font-serif font-black text-slate-900 tracking-tighter">Initiate Consultation</h3>
                    <p className="text-slate-500 text-lg">Complete this form to receive a prioritized call from our senior financial advisor.</p>
                  </div>

                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Identity</label>
                        <Input 
                          placeholder="e.g. Alexander Pierce" 
                          {...form.register("name")} 
                          className="h-16 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary transition-all text-lg px-6"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Contact Number</label>
                        <Input 
                          placeholder="+91 00000 00000" 
                          {...form.register("phone")}
                          className="h-16 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary transition-all text-lg px-6"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Electronic Mail</label>
                        <Input 
                          placeholder="alexander@corporate.com" 
                          type="email"
                          {...form.register("email")}
                          className="h-16 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary transition-all text-lg px-6"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Desired Solution</label>
                        <Select onValueChange={(value) => form.setValue("service", value)}>
                          <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary transition-all text-lg px-6">
                            <SelectValue placeholder="Select expertise" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                            <SelectItem value="Home Loans">Elite Home Financing</SelectItem>
                            <SelectItem value="Business Loans">Corporate Capital</SelectItem>
                            <SelectItem value="SME Loans">SME Growth Funding</SelectItem>
                            <SelectItem value="Mortgage Loans">Property Leveraging</SelectItem>
                            <SelectItem value="Other">Custom Advisory</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Executive Summary (Optional)</label>
                      <Textarea 
                        placeholder="Briefly describe your financial objectives..." 
                        className="min-h-[150px] rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-primary transition-all text-lg p-6 resize-none"
                        {...form.register("message")}
                      />
                    </div>

                    <Button type="submit" className="w-full h-20 text-xl bg-primary hover:bg-slate-900 font-bold rounded-2xl shadow-2xl shadow-primary/20 transition-all duration-500 group">
                      Secure My Consultation <Send className="ml-3 w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-black text-slate-900 tracking-tight">Our Headquarters</h2>
              <p className="text-slate-500 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Near City Center, Main Road, Hyderabad</p>
            </div>
            <Button variant="outline" className="rounded-full px-10 h-14 border-slate-200 hover:bg-white text-lg font-bold">
              Get Directions
            </Button>
          </div>
          <div className="h-[500px] w-full bg-slate-200 rounded-[3rem] overflow-hidden relative shadow-2xl border-8 border-white">
             <iframe 
               src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d243647.3160407063!2d78.26795861198664!3d17.41229980062495!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb99daeaebd2c7%3A0xae93b78392bafbc2!2sHyderabad%2C%20Telangana!5e0!3m2!1sen!2sin!4v1709823456789!5m2!1sen!2sin" 
               width="100%" 
               height="100%" 
               style={{border:0}} 
               loading="lazy" 
               referrerPolicy="no-referrer-when-downgrade"
               title="Office Map"
             ></iframe>
          </div>
        </div>
      </section>
    </Layout>
  );
}
