/**
 * Dropdown options for Loan Lead form and Insurance Lead form (staff portal).
 */

export const LOAN_TYPES = [
  "Personal Loan",
  "Car Loan",
  "MSME",
  "Project",
  "Business",
  "OD",
  "LAP",
  "LRD",
  "Education",
  "Equipment Loan",
  "BT",
] as const;

export const INCOME_TYPES = ["Salaried", "Self Emp"] as const;

export const LOAN_STATUSES = [
  "Open",
  "Doc Collected",
  "Discrepancy",
  "Sanctioned",
  "Disbursed",
  "Rejected",
  "Not Interested",
] as const;

export const BANKS_NBFCS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Yes Bank",
  "IDFC FIRST Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Punjab National Bank",
  "IDBI Bank",
  "Federal Bank",
  "LIC",
  "ICICI Prudential",
  "SBI Life",
  "HDFC Life",
  "Axis Max Life",
  "Other",
] as const;

export const INSURANCE_TYPES = ["General Insurance", "Life", "Health"] as const;

export const INSURANCE_STATUSES = ["Open", "Closed", "Rejected"] as const;
