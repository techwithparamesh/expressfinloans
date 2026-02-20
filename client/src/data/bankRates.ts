/**
 * Centralized bank interest rates for all loan types.
 * This is the single source of truth for loan calculations across the app.
 */

export interface BankRate {
  bank: string;
  logo?: string;
  rate: number;
  processingFee: string;
  maxTenure: number;
}

export interface LoanTypeConfig {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  minTenure: number;
  maxTenure: number;
  defaultAmount: number;
  defaultTenure: number;
  banks: BankRate[];
}

export const loanTypes: LoanTypeConfig[] = [
  {
    id: "home-loans",
    name: "Home Loan",
    minAmount: 500000,
    maxAmount: 100000000,
    minTenure: 5,
    maxTenure: 30,
    defaultAmount: 5000000,
    defaultTenure: 20,
    banks: [
      { bank: "SBI", rate: 8.50, processingFee: "0.35%", maxTenure: 30 },
      { bank: "HDFC", rate: 8.70, processingFee: "0.50%", maxTenure: 30 },
      { bank: "ICICI", rate: 8.75, processingFee: "0.50%", maxTenure: 30 },
      { bank: "Axis Bank", rate: 8.90, processingFee: "1.00%", maxTenure: 30 },
      { bank: "Kotak", rate: 8.85, processingFee: "0.50%", maxTenure: 20 },
      { bank: "Bank of Baroda", rate: 8.40, processingFee: "0.25%", maxTenure: 30 },
      { bank: "PNB", rate: 8.45, processingFee: "0.35%", maxTenure: 30 },
      { bank: "LIC Housing", rate: 8.60, processingFee: "0.50%", maxTenure: 30 },
    ],
  },
  {
    id: "car-loans",
    name: "Car Loan",
    minAmount: 100000,
    maxAmount: 10000000,
    minTenure: 1,
    maxTenure: 7,
    defaultAmount: 800000,
    defaultTenure: 5,
    banks: [
      { bank: "HDFC", rate: 8.75, processingFee: "0.50%", maxTenure: 7 },
      { bank: "ICICI", rate: 8.90, processingFee: "0.50%", maxTenure: 7 },
      { bank: "SBI", rate: 8.65, processingFee: "Nil", maxTenure: 7 },
      { bank: "Axis Bank", rate: 9.00, processingFee: "0.50%", maxTenure: 7 },
      { bank: "Kotak", rate: 8.99, processingFee: "0.50%", maxTenure: 7 },
      { bank: "Bank of Baroda", rate: 8.70, processingFee: "0.50%", maxTenure: 7 },
      { bank: "IndusInd", rate: 9.25, processingFee: "0.75%", maxTenure: 7 },
    ],
  },
  {
    id: "business-loans",
    name: "Business Loan",
    minAmount: 500000,
    maxAmount: 50000000,
    minTenure: 1,
    maxTenure: 7,
    defaultAmount: 2500000,
    defaultTenure: 3,
    banks: [
      { bank: "HDFC", rate: 11.50, processingFee: "2.00%", maxTenure: 5 },
      { bank: "ICICI", rate: 11.75, processingFee: "2.00%", maxTenure: 5 },
      { bank: "Axis Bank", rate: 12.00, processingFee: "2.00%", maxTenure: 5 },
      { bank: "Kotak", rate: 12.25, processingFee: "2.50%", maxTenure: 5 },
      { bank: "IndusInd", rate: 12.50, processingFee: "2.00%", maxTenure: 5 },
      { bank: "Yes Bank", rate: 13.00, processingFee: "2.00%", maxTenure: 5 },
      { bank: "Bajaj Finserv", rate: 14.00, processingFee: "3.00%", maxTenure: 7 },
    ],
  },
  {
    id: "personal-loan",
    name: "Personal Loan",
    minAmount: 50000,
    maxAmount: 5000000,
    minTenure: 1,
    maxTenure: 5,
    defaultAmount: 500000,
    defaultTenure: 3,
    banks: [
      { bank: "HDFC", rate: 10.50, processingFee: "2.50%", maxTenure: 5 },
      { bank: "ICICI", rate: 10.75, processingFee: "2.50%", maxTenure: 5 },
      { bank: "SBI", rate: 11.00, processingFee: "1.50%", maxTenure: 5 },
      { bank: "Axis Bank", rate: 10.99, processingFee: "2.00%", maxTenure: 5 },
      { bank: "Kotak", rate: 11.25, processingFee: "2.50%", maxTenure: 5 },
      { bank: "Bajaj Finserv", rate: 13.00, processingFee: "3.00%", maxTenure: 5 },
      { bank: "Tata Capital", rate: 12.50, processingFee: "2.50%", maxTenure: 5 },
    ],
  },
  {
    id: "education-loans",
    name: "Education Loan",
    minAmount: 100000,
    maxAmount: 20000000,
    minTenure: 5,
    maxTenure: 15,
    defaultAmount: 2000000,
    defaultTenure: 10,
    banks: [
      { bank: "SBI", rate: 8.50, processingFee: "Nil", maxTenure: 15 },
      { bank: "Bank of Baroda", rate: 8.60, processingFee: "Nil", maxTenure: 15 },
      { bank: "PNB", rate: 8.55, processingFee: "Nil", maxTenure: 15 },
      { bank: "Canara Bank", rate: 8.65, processingFee: "Nil", maxTenure: 15 },
      { bank: "HDFC Credila", rate: 9.50, processingFee: "1.00%", maxTenure: 15 },
      { bank: "Axis Bank", rate: 9.75, processingFee: "1.00%", maxTenure: 15 },
      { bank: "ICICI", rate: 10.00, processingFee: "1.00%", maxTenure: 12 },
    ],
  },
  {
    id: "mortgage-loans",
    name: "Loan Against Property",
    minAmount: 500000,
    maxAmount: 100000000,
    minTenure: 5,
    maxTenure: 20,
    defaultAmount: 5000000,
    defaultTenure: 15,
    banks: [
      { bank: "SBI", rate: 9.00, processingFee: "0.50%", maxTenure: 20 },
      { bank: "HDFC", rate: 9.25, processingFee: "0.50%", maxTenure: 18 },
      { bank: "ICICI", rate: 9.30, processingFee: "0.50%", maxTenure: 18 },
      { bank: "Axis Bank", rate: 9.50, processingFee: "1.00%", maxTenure: 18 },
      { bank: "Bank of Baroda", rate: 8.90, processingFee: "0.50%", maxTenure: 20 },
      { bank: "Kotak", rate: 9.50, processingFee: "0.50%", maxTenure: 15 },
      { bank: "Bajaj Finserv", rate: 10.00, processingFee: "1.50%", maxTenure: 18 },
    ],
  },
  {
    id: "commercial-vehicle-loan",
    name: "Commercial Vehicle Loan",
    minAmount: 500000,
    maxAmount: 50000000,
    minTenure: 1,
    maxTenure: 7,
    defaultAmount: 2000000,
    defaultTenure: 5,
    banks: [
      { bank: "HDFC", rate: 10.50, processingFee: "1.50%", maxTenure: 7 },
      { bank: "ICICI", rate: 10.75, processingFee: "1.50%", maxTenure: 7 },
      { bank: "Mahindra Finance", rate: 11.50, processingFee: "2.00%", maxTenure: 7 },
      { bank: "Tata Capital", rate: 11.25, processingFee: "1.75%", maxTenure: 7 },
      { bank: "Cholamandalam", rate: 12.00, processingFee: "2.00%", maxTenure: 7 },
      { bank: "SBI", rate: 10.25, processingFee: "1.00%", maxTenure: 7 },
      { bank: "Axis Bank", rate: 11.00, processingFee: "1.50%", maxTenure: 7 },
    ],
  },
  {
    id: "sme-loans",
    name: "SME Loan",
    minAmount: 500000,
    maxAmount: 50000000,
    minTenure: 1,
    maxTenure: 10,
    defaultAmount: 3000000,
    defaultTenure: 5,
    banks: [
      { bank: "SBI", rate: 10.50, processingFee: "1.00%", maxTenure: 10 },
      { bank: "HDFC", rate: 11.00, processingFee: "1.50%", maxTenure: 7 },
      { bank: "ICICI", rate: 11.25, processingFee: "1.50%", maxTenure: 7 },
      { bank: "Axis Bank", rate: 11.50, processingFee: "2.00%", maxTenure: 7 },
      { bank: "Bank of Baroda", rate: 10.75, processingFee: "1.00%", maxTenure: 10 },
      { bank: "Yes Bank", rate: 12.00, processingFee: "2.00%", maxTenure: 7 },
    ],
  },
];

/**
 * Calculate EMI using standard formula
 * EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculateEMI(principal: number, annualRate: number, tenureYears: number): number {
  const monthlyRate = annualRate / 12 / 100;
  const tenureMonths = tenureYears * 12;
  
  if (monthlyRate === 0) return principal / tenureMonths;
  
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

/**
 * Calculate total interest payable
 */
export function calculateTotalInterest(principal: number, emi: number, tenureYears: number): number {
  const totalPayment = emi * tenureYears * 12;
  return totalPayment - principal;
}

/**
 * Format currency in Indian format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format currency without symbol
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get loan type by ID
 */
export function getLoanTypeById(id: string): LoanTypeConfig | undefined {
  return loanTypes.find(loan => loan.id === id);
}
