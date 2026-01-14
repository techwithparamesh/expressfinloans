import Layout from "@/components/layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const allServices = [
  {
    id: "home-loans",
    title: "Home Loans",
    description: "Make your dream home a reality with our hassle-free home loan solutions. We offer competitive interest rates and flexible tenures.",
    benefits: ["Lowest interest rates", "Higher eligibility", "Minimal documentation", "Doorstep service"],
    target: "Salaried & Self-employed individuals looking to buy or construct a home."
  },
  {
    id: "mortgage-loans",
    title: "Mortgage Loans",
    description: "Unlock the hidden value of your property. Get a loan against property for personal or business needs with extended repayment options.",
    benefits: ["High loan value", "Longer repayment tenure", "Lower interest than personal loans", "Quick processing"],
    target: "Property owners needing funds for expansion, medical, or marriage expenses."
  },
  {
    id: "sme-loans",
    title: "SME Loans",
    description: "Fuel your business growth with our tailored SME loan products designed for small and medium enterprises.",
    benefits: ["Customized limits", "Collateral-free options", "Competitive rates", "Quick disbursement"],
    target: "Small & Medium Business owners."
  },
  {
    id: "car-loans",
    title: "Car Loans",
    description: "Drive home your dream car today. We offer funding for new and used cars with up to 100% on-road funding for select profiles.",
    benefits: ["Up to 100% funding", "Fast approval", "Flexible EMI options", " minimal paperwork"],
    target: "Anyone looking to purchase a personal or commercial vehicle."
  },
  {
    id: "business-loans",
    title: "Business Loans",
    description: "Expand your operations, buy inventory, or manage cash flow with our unsecured business loans.",
    benefits: ["No collateral required", "Funds in 48 hours", "Flexible tenure", "Minimum documentation"],
    target: "Business owners with 3+ years of vintage."
  },
  {
    id: "commercial-vehicle",
    title: "Commercial Vehicle Loans",
    description: "Funding for trucks, buses, tippers, and light commercial vehicles to keep your logistics business moving.",
    benefits: ["Funding for new & used vehicles", "Simple documentation", "Quick turnaround", "Competitive rates"],
    target: "Transport operators and fleet owners."
  },
  {
    id: "personal-loans",
    title: "Personal Loans",
    description: "Quick funds for any personal need - be it travel, wedding, medical emergency, or home renovation.",
    benefits: ["No security needed", "Instant approval", "Funds in 24 hours", "Easy repayment"],
    target: "Salaried individuals."
  },
  {
    id: "education-loans",
    title: "Education Loans",
    description: "Invest in your future. We provide education loans for studies in India and abroad covering tuition and living expenses.",
    benefits: ["Covers 100% expenses", "Moratorium period", "Tax benefits", "Low interest rates"],
    target: "Students pursuing higher education."
  },
  {
    id: "lrd-loans",
    title: "LRD Loans (Lease Rental Discounting)",
    description: "Get a loan against your future rental income from commercial properties.",
    benefits: ["High loan amount", "Utilize future income", "Long tenure", "Attractive rates"],
    target: "Property owners with leased commercial spaces."
  },
  {
    id: "project-funding",
    title: "Project Funding",
    description: "End-to-end financial support for real estate and infrastructure developers.",
    benefits: ["Construction finance", "Flexible drawdowns", "Expert advisory", "Structured deals"],
    target: "Real estate developers and builders."
  },
  {
    id: "school-bus",
    title: "School Bus Funding",
    description: "Specialized loans for educational institutions to expand their transport fleet.",
    benefits: ["Special rates for schools", "Seasonal repayment options", "Bulk funding", "Quick process"],
    target: "Schools and Educational Trusts."
  },
  {
    id: "life-insurance",
    title: "Life Insurance",
    description: "Protect your loved ones with our comprehensive life insurance plans.",
    benefits: ["Financial security", "Tax savings", "Investment options", "Peace of mind"],
    target: "Everyone looking to secure their family's future."
  }
];

export default function Services() {
  return (
    <Layout>
      <div className="bg-slate-50 py-20 border-b">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-primary">Our Services</h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            We offer a wide range of financial products designed to meet your specific needs.
          </p>
        </div>
      </div>

      <section className="py-20 container mx-auto px-4 max-w-4xl">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {allServices.map((service) => (
            <AccordionItem key={service.id} value={service.id} className="border border-slate-200 rounded-lg bg-white overflow-hidden data-[state=open]:shadow-md transition-all">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50">
                <span className="text-xl font-bold text-slate-800 text-left">{service.title}</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-6 bg-slate-50/50">
                <div className="space-y-6">
                  <p className="text-slate-700 text-lg leading-relaxed">
                    {service.description}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Key Benefits</h4>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        {service.benefits.map((benefit, i) => (
                          <li key={i}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Who is this for?</h4>
                      <p className="text-slate-600">{service.target}</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link href={`/contact?service=${service.title}`}>
                      <Button className="bg-secondary text-primary hover:bg-secondary/90 font-bold">
                        Enquire Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </Layout>
  );
}
