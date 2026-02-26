/**
 * Dropdown options for Loan Lead form and Insurance Lead form (staff portal).
 * Loan Type: no BT, no OD as main types. Sub Loan Type includes BT under each.
 */

export const LOAN_TYPES = [
  "Personal Loan",
  "Car Loan",
  "MSME",
  "Business Loan",
  "Project Finance",
  "LAP",
  "LRD",
  "Home Loan",
  "Land Purchase",
  "Education Loan",
  "Equipment Loan",
] as const;

/** Sub loan types for LAP, LRD, Home Loan, Land Purchase */
const SUB_LAP_LRD_HOME_LAND = [
  "New",
  "BT",
  "Topup",
  "Self Construction",
  "Land + Construction",
  "Land Loan",
  "Commercial Purchase",
] as const;

/** Sub loan types per loan type. BT available under all; OD removed. */
export const LOAN_TYPE_SUBTYPES: Record<(typeof LOAN_TYPES)[number], readonly string[]> = {
  "Personal Loan": ["New", "BT", "Topup"],
  "Car Loan": ["New", "Used", "BT", "Topup"],
  MSME: ["New", "Used", "BT", "Topup", "Term Loan"],
  "Business Loan": ["New", "BT", "Topup"],
  "Project Finance": ["Open Land", "Apartment", "Villas", "BT"],
  LAP: [...SUB_LAP_LRD_HOME_LAND],
  LRD: [...SUB_LAP_LRD_HOME_LAND],
  "Home Loan": [...SUB_LAP_LRD_HOME_LAND],
  "Land Purchase": [...SUB_LAP_LRD_HOME_LAND],
  "Education Loan": ["New", "BT", "Topup"],
  "Equipment Loan": ["New", "BT", "Topup"],
};

export const INCOME_TYPES = [
  "Salaried",
  "Self Employed Professional",
  "Self Employed Non-Professional",
  "No Income Proof",
  "Others",
] as const;

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
