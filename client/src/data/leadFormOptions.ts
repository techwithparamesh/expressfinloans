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
  "Education Loan": ["New"],
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

/** Banks/NBFCs for insurance lead form */
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

/** Banks for loan form "Bank logged" dropdown. Select OTHERS to enter manually. */
export const BANKS_LOGGED = [
  "ICICI BANK",
  "HDFC BANK",
  "AXIS BANK",
  "IDBI BANK",
  "INDUSIND BANK",
  "KOTAK BANK WORKING CAPITAL",
  "DCB",
  "UTKARSH SMALL FINANCE BANK",
  "BANDHAN BANK",
  "BOB BANK",
  "KVB",
  "UNION BANK OF INDIA",
  "YES BANK",
  "IDFC FIRST BANK",
  "KOTAK MAHINDRA PRIME LTD",
  "ICICI HFC",
  "AXIS FINANCE",
  "TATA CAPITAL LTD",
  "TATA CAPITAL HOUSING FINANCE LTD",
  "ADITYA BIRLA HOUSING FINANCE LTD",
  "ADITYA BIRLA FINANCE LTD",
  "LICHFL",
  "SUNDARAM HOME FINANCE",
  "PNHFL",
  "CHOLA",
  "CANFINS",
  "VERITAS",
  "SRIRAM FINANCE",
  "IKF",
  "SMFG",
  "GODREJ CAPITAL LTD",
  "AU SMALL FINANCE",
  "BAJAJ FINANCE",
  "INDOSTAR",
  "LENDING KART",
  "MOHILAL HOUSING FINANCE",
  "BAJAJ HOUSING FINANCE LIMITED",
  "HDB FINANCIAL SERVICES",
  "SUNDARAM FINANCE",
  "TVS CREDIT SERVICE",
  "PIRAMAL FINANCE",
  "OTHERS",
] as const;

export const INSURANCE_TYPES = ["General Insurance", "Life", "Health"] as const;

export const INSURANCE_STATUSES = ["Open", "Closed", "Rejected"] as const;
