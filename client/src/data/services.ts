import {
  Home,
  Building,
  Briefcase,
  Building2,
  Car,
  GraduationCap,
  HeartPulse,
  Bus,
  Activity,
  UserCheck,
  CreditCard,
} from "lucide-react";

export interface ServiceData {
  id: string;
  icon: typeof Home;
  title: string;
  subtitle: string;
  desc: string;
  features: string[];
  image: string;
  color: string;
  isDarkBg: boolean;
  calculatorConfig?: {
    defaultLoanAmount: number;
    defaultTenure: number;
    defaultInterestRate: number;
    minLoanAmount: number;
    maxLoanAmount: number;
    minTenure: number;
    maxTenure: number;
    minInterestRate: number;
    maxInterestRate: number;
  };
  detailedContent?: {
    overview: string;
    benefits: string[];
    eligibility: string[];
    documents: string[];
    process: string[];
  };
}

export const servicesData: ServiceData[] = [
  {
    id: "home-loans",
    icon: Home,
    title: "Home Loans",
    subtitle: "Dream Home Made Possible",
    desc: "Experience seamless property acquisition with our customized mortgage solutions. We offer competitive interest rates and high-loan-to-value ratios tailored for premium real estate.",
    features: [
      "Interest rates from 8.5%",
      "Tenure up to 30 years",
      "Zero processing fee for elite clients",
      "Bespoke repayment plans",
    ],
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
    color: "from-blue-600/30 to-blue-700/20",
    isDarkBg: false,
    calculatorConfig: {
      defaultLoanAmount: 5000000,
      defaultTenure: 20,
      defaultInterestRate: 8.5,
      minLoanAmount: 500000,
      maxLoanAmount: 10000000,
      minTenure: 5,
      maxTenure: 30,
      minInterestRate: 7.5,
      maxInterestRate: 12,
    },
    detailedContent: {
      overview:
        "Our Home Loans are designed to make your dream of owning a home a reality. With flexible repayment options, competitive interest rates, and quick processing, we ensure a smooth journey from application to disbursement.",
      benefits: [
        "Competitive interest rates starting from 8.5%",
        "High loan-to-value ratio up to 90%",
        "Flexible repayment tenure up to 30 years",
        "Zero processing fees for select customers",
        "Pre-approved loan offers",
        "Balance transfer facility",
      ],
      eligibility: [
        "Age: 21-65 years",
        "Minimum income: ₹25,000 per month",
        "Stable employment or business",
        "Good credit score (750+)",
        "Property valuation required",
      ],
      documents: [
        "Identity proof (Aadhaar, PAN, Passport)",
        "Address proof",
        "Income proof (Salary slips, ITR)",
        "Property documents",
        "Bank statements (6 months)",
        "Photographs",
      ],
      process: [
        "Submit application with required documents",
        "Property valuation and verification",
        "Credit assessment and approval",
        "Legal documentation",
        "Loan disbursement",
      ],
    },
  },
  {
    id: "mortgage-loans",
    icon: Building,
    title: "Mortgage Loans",
    subtitle: "Capitalize on Fixed Assets",
    desc: "Unlock the inherent value of your residential or commercial property. Our mortgage-backed credit lines provide the liquidity needed for major life milestones or strategic reinvestment.",
    features: [
      "Loan against property up to ₹50Cr",
      "Flexible end-use of funds",
      "Minimal documentation",
      "Instant approval window",
    ],
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
    color: "from-red-500/10 to-red-600/5",
    isDarkBg: false,
    calculatorConfig: {
      defaultLoanAmount: 10000000,
      defaultTenure: 15,
      defaultInterestRate: 9.5,
      minLoanAmount: 1000000,
      maxLoanAmount: 50000000,
      minTenure: 5,
      maxTenure: 20,
      minInterestRate: 8.5,
      maxInterestRate: 14,
    },
  },
  {
    id: "sme-loans",
    icon: Briefcase,
    title: "SME Loans",
    subtitle: "Empowering Local Enterprise",
    desc: "Specialized financing for Small and Medium Enterprises. We understand the unique challenges of SMEs and provide the financial backbone necessary for sustainable scaling.",
    features: [
      "Working capital limits",
      "Equipment & machinery financing",
      "Supply chain credit",
      "Dedicated relationship manager",
    ],
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800",
    color: "from-blue-900/10 to-blue-800/5",
    isDarkBg: false,
    calculatorConfig: {
      defaultLoanAmount: 2000000,
      defaultTenure: 5,
      defaultInterestRate: 12,
      minLoanAmount: 500000,
      maxLoanAmount: 5000000,
      minTenure: 1,
      maxTenure: 10,
      minInterestRate: 10,
      maxInterestRate: 18,
    },
  },
  {
    id: "car-loans",
    icon: Car,
    title: "Car Loans",
    subtitle: "Drive Your Dreams",
    desc: "Quick and hassle-free financing for your new or pre-owned vehicle. With minimal documentation and speedy processing, we get you on the road faster.",
    features: [
      "Up to 100% on-road funding",
      "Flexible tenure options",
      "Quick digital processing",
      "Competitive interest rates",
    ],
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800",
    color: "from-amber-500/10 to-amber-600/5",
    isDarkBg: false,
    calculatorConfig: {
      defaultLoanAmount: 800000,
      defaultTenure: 5,
      defaultInterestRate: 9.5,
      minLoanAmount: 100000,
      maxLoanAmount: 5000000,
      minTenure: 1,
      maxTenure: 7,
      minInterestRate: 8,
      maxInterestRate: 15,
    },
  },
  {
    id: "business-loans",
    icon: Building2,
    title: "Business Loans",
    subtitle: "Corporate Growth Capital",
    desc: "Fuel your enterprise's expansion with our rapid-access business credit. Designed for companies ready to scale, our solutions provide capital without collateral constraints.",
    features: [
      "Unsecured loans up to ₹1Cr",
      "Approval in 48 hours",
      "Competitive corporate rates",
      "Flexible drawdown options",
    ],
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
    color: "from-slate-500/10 to-slate-600/5",
    isDarkBg: false,
    calculatorConfig: {
      defaultLoanAmount: 5000000,
      defaultTenure: 3,
      defaultInterestRate: 13,
      minLoanAmount: 1000000,
      maxLoanAmount: 10000000,
      minTenure: 1,
      maxTenure: 5,
      minInterestRate: 11,
      maxInterestRate: 18,
    },
  },
  {
    id: "commercial-vehicle-loan",
    icon: Bus,
    title: "Commercial Vehicle Loan",
    subtitle: "Fueling Transport Logistics",
    desc: "Dedicated funding for trucks, buses, and commercial fleets. We help you build and expand your transport business with tailored repayment structures.",
    features: [
      "Funding for new & old vehicles",
      "Customized EMI plans",
      "Fleet expansion support",
      "Fast-track processing",
    ],
    image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800",
    color: "from-green-500/10 to-green-600/5",
    isDarkBg: false,
    calculatorConfig: {
      defaultLoanAmount: 1500000,
      defaultTenure: 5,
      defaultInterestRate: 11,
      minLoanAmount: 500000,
      maxLoanAmount: 10000000,
      minTenure: 1,
      maxTenure: 7,
      minInterestRate: 9.5,
      maxInterestRate: 16,
    },
  },
  {
    id: "personal-loan",
    icon: UserCheck,
    title: "Personal Loan",
    subtitle: "Funds for Every Need",
    desc: "Unsecured personal credit for weddings, travel, medical emergencies, or debt consolidation. Get the financial support you need with total privacy and speed.",
    features: [
      "No collateral required",
      "Instant digital disbursement",
      "Flexible repayment terms",
      "Minimal documentation",
    ],
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=800",
    color: "from-purple-500/10 to-purple-600/5",
    isDarkBg: false,
    calculatorConfig: {
      defaultLoanAmount: 500000,
      defaultTenure: 3,
      defaultInterestRate: 12,
      minLoanAmount: 50000,
      maxLoanAmount: 2000000,
      minTenure: 1,
      maxTenure: 5,
      minInterestRate: 10,
      maxInterestRate: 18,
    },
  },
  {
    id: "education-loans",
    icon: GraduationCap,
    title: "Education Loans",
    subtitle: "Investing in Futures",
    desc: "Comprehensive funding for domestic and international studies. We cover tuition fees, living expenses, and travel, ensuring your academic journey is unhindered.",
    features: [
      "Covers 100% of expenses",
      "Moratorium period available",
      "Tax benefits under Sec 80E",
      "Preferential rates for top universities",
    ],
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800",
    color: "from-cyan-500/10 to-cyan-600/5",
    isDarkBg: false,
    calculatorConfig: {
      defaultLoanAmount: 2000000,
      defaultTenure: 10,
      defaultInterestRate: 9,
      minLoanAmount: 100000,
      maxLoanAmount: 5000000,
      minTenure: 5,
      maxTenure: 15,
      minInterestRate: 7.5,
      maxInterestRate: 13,
    },
  },
  {
    id: "lrd-loans",
    icon: CreditCard,
    title: "LRD Loans",
    subtitle: "Lease Rental Discounting",
    desc: "Leverage your future lease rentals from commercial properties to get immediate capital. Ideal for property owners with established corporate tenants.",
    features: [
      "High loan amounts",
      "Competitive ROI",
      "Longer tenure options",
      "Quick processing",
    ],
    image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800",
    color: "from-indigo-500/10 to-indigo-600/5",
    isDarkBg: false,
    calculatorConfig: {
      defaultLoanAmount: 10000000,
      defaultTenure: 10,
      defaultInterestRate: 10,
      minLoanAmount: 5000000,
      maxLoanAmount: 50000000,
      minTenure: 5,
      maxTenure: 15,
      minInterestRate: 8.5,
      maxInterestRate: 14,
    },
  },
  {
    id: "school-bus-funding",
    icon: Bus,
    title: "School Bus Funding",
    subtitle: "Safe Transit Solutions",
    desc: "Specialized financing for educational institutions to acquire safe and reliable transport for students. Supporting the infrastructure of tomorrow.",
    features: [
      "Special rates for schools",
      "Flexible repayment schedules",
      "Comprehensive insurance support",
      "Bulk fleet discounts",
    ],
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800",
    color: "from-yellow-500/10 to-yellow-600/5",
    isDarkBg: false,
    calculatorConfig: {
      defaultLoanAmount: 2000000,
      defaultTenure: 5,
      defaultInterestRate: 10.5,
      minLoanAmount: 500000,
      maxLoanAmount: 10000000,
      minTenure: 3,
      maxTenure: 7,
      minInterestRate: 9,
      maxInterestRate: 15,
    },
  },
  {
    id: "life-insurance",
    icon: HeartPulse,
    title: "Life Insurance",
    subtitle: "Protecting What Matters",
    desc: "Strategic life cover solutions to ensure your family's financial security. We partner with top-tier insurers to provide the best term and endowment plans.",
    features: [
      "Comprehensive term plans",
      "Wealth creation options",
      "Tax saving benefits",
      "Critical illness riders",
    ],
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800",
    color: "from-rose-500/10 to-rose-600/5",
    isDarkBg: false,
  },
  {
    id: "project-funding",
    icon: Activity,
    title: "Project Funding",
    subtitle: "Strategic Infrastructure Capital",
    desc: "Large-scale funding for infrastructure, real estate, and industrial projects. We provide structured finance solutions tailored to project milestones.",
    features: [
      "Structured debt solutions",
      "Syndication services",
      "Customized moratoriums",
      "Expert financial modeling",
    ],
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800",
    color: "from-orange-500/10 to-orange-600/5",
    isDarkBg: false,
    calculatorConfig: {
      defaultLoanAmount: 50000000,
      defaultTenure: 10,
      defaultInterestRate: 11,
      minLoanAmount: 10000000,
      maxLoanAmount: 500000000,
      minTenure: 5,
      maxTenure: 20,
      minInterestRate: 9,
      maxInterestRate: 15,
    },
  },
];

export function getServiceById(id: string): ServiceData | undefined {
  return servicesData.find((service) => service.id === id);
}
