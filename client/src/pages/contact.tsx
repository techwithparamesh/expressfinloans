import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid mobile number is required"),
  email: z.string().email("Valid email is required"),
  service: z.string().min(1, "Please select a service"),
  message: z.string().optional(),
});

export default function Contact() {
  const { toast } = useToast();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const preSelectedService = searchParams.get("service");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      service: preSelectedService || "",
      message: "",
    },
  });
  
  // Update form if URL param changes
  useEffect(() => {
    if (preSelectedService) {
      form.setValue("service", preSelectedService);
    }
  }, [preSelectedService, form]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log(data);
    toast({
      title: "Request Sent Successfully!",
      description: "Our team will contact you shortly.",
      className: "bg-green-600 text-white border-none",
    });
    form.reset();
  }

  return (
    <Layout>
      <div className="bg-primary py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Contact Us</h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-lg">
            Get in touch for expert financial advice and loan assistance.
          </p>
        </div>
      </div>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-slate-50 p-8 rounded-xl border border-slate-100">
                <h3 className="text-2xl font-serif font-bold text-slate-900 mb-6">Get In Touch</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Phone Numbers</p>
                      <p className="text-slate-600">90000 01339</p>
                      <p className="text-slate-600">97054 62000</p>
                      <p className="text-slate-600">99485 62000</p>
                      <p className="text-slate-600">97051 62000</p>
                      <p className="text-slate-600">96405 62000</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Email Address</p>
                      <a href="mailto:info@expressfinancialservices.com" className="text-slate-600 hover:text-primary transition-colors">
                        info@expressfinancialservices.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Office Location</p>
                      <p className="text-slate-600">
                        Near City Center, Main Road,<br />
                        Hyderabad, Telangana - 500001
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="h-[300px] w-full bg-slate-200 rounded-xl overflow-hidden relative">
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

            {/* Contact Form */}
            <Card className="shadow-xl border-t-4 border-t-secondary">
              <CardContent className="p-8">
                <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">Request a Call Back</h3>
                <p className="text-slate-500 mb-8">Fill out the form below and we will get back to you within 24 hours.</p>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Full Name</label>
                      <Input 
                        placeholder="John Doe" 
                        {...form.register("name")} 
                        className={form.formState.errors.name ? "border-red-500" : ""}
                      />
                      {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Mobile Number</label>
                      <Input 
                        placeholder="9876543210" 
                        {...form.register("phone")}
                        className={form.formState.errors.phone ? "border-red-500" : ""}
                      />
                      {form.formState.errors.phone && <p className="text-xs text-red-500">{form.formState.errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <Input 
                      placeholder="john@example.com" 
                      type="email"
                      {...form.register("email")}
                      className={form.formState.errors.email ? "border-red-500" : ""}
                    />
                    {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Service Interested In</label>
                    <Select 
                      onValueChange={(value) => form.setValue("service", value)}
                      defaultValue={form.getValues("service")}
                    >
                      <SelectTrigger className={form.formState.errors.service ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Home Loans">Home Loans</SelectItem>
                        <SelectItem value="Personal Loans">Personal Loans</SelectItem>
                        <SelectItem value="Business Loans">Business Loans</SelectItem>
                        <SelectItem value="Car Loans">Car Loans</SelectItem>
                        <SelectItem value="Mortgage Loans">Mortgage Loans</SelectItem>
                        <SelectItem value="Education Loans">Education Loans</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.service && <p className="text-xs text-red-500">{form.formState.errors.service.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Message (Optional)</label>
                    <Textarea 
                      placeholder="Tell us more about your requirement..." 
                      className="min-h-[100px]"
                      {...form.register("message")}
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 text-lg bg-primary hover:bg-primary/90 font-bold">
                    Submit Request <Send className="ml-2 w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>
    </Layout>
  );
}
