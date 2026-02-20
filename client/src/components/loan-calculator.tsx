import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Calculator, 
  Clock,
  Percent,
  IndianRupee,
  ArrowRight,
  PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  loanTypes, 
  calculateEMI, 
  calculateTotalInterest,
  formatCurrency,
  LoanTypeConfig 
} from "@/data/bankRates";
import { Link } from "wouter";

interface LoanCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedLoanType?: string;
}

export default function LoanCalculator({ isOpen, onClose, preSelectedLoanType }: LoanCalculatorProps) {
  const [selectedLoanType, setSelectedLoanType] = useState<LoanTypeConfig>(
    loanTypes.find(l => l.id === preSelectedLoanType) || loanTypes[0]
  );
  const [loanAmount, setLoanAmount] = useState(selectedLoanType.defaultAmount);
  const [tenure, setTenure] = useState(selectedLoanType.defaultTenure);
  const [interestRate, setInterestRate] = useState(selectedLoanType.banks[0]?.rate || 8.5);

  useEffect(() => {
    if (preSelectedLoanType) {
      const loanType = loanTypes.find(l => l.id === preSelectedLoanType);
      if (loanType) {
        setSelectedLoanType(loanType);
        setLoanAmount(loanType.defaultAmount);
        setTenure(loanType.defaultTenure);
        setInterestRate(loanType.banks[0]?.rate || 8.5);
      }
    }
  }, [preSelectedLoanType]);

  const handleLoanTypeChange = (loanType: LoanTypeConfig) => {
    setSelectedLoanType(loanType);
    setLoanAmount(loanType.defaultAmount);
    setTenure(Math.min(tenure, loanType.maxTenure));
    setInterestRate(loanType.banks[0]?.rate || 8.5);
  };

  const emi = calculateEMI(loanAmount, interestRate, tenure);
  const totalInterest = calculateTotalInterest(loanAmount, emi, tenure);
  const totalPayment = loanAmount + totalInterest;
  const principalPercentage = (loanAmount / totalPayment) * 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-blue-700 text-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
                  <Calculator className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">EMI Calculator</h2>
                  <p className="text-white/80 text-xs sm:text-sm">Calculate your monthly payments</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="p-4 sm:p-6 space-y-5">
              {/* Loan Type Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block">
                  Select Loan Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {loanTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleLoanTypeChange(type)}
                      className={`p-2.5 sm:p-3 rounded-xl border-2 text-left transition-all ${
                        selectedLoanType.id === type.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-semibold block truncate">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Loan Amount Slider */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Loan Amount</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">{formatCurrency(loanAmount)}</span>
                </div>
                <input
                  type="range"
                  min={selectedLoanType.minAmount}
                  max={selectedLoanType.maxAmount}
                  step={selectedLoanType.minAmount >= 1000000 ? 100000 : 10000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>{formatCurrency(selectedLoanType.minAmount)}</span>
                  <span>{formatCurrency(selectedLoanType.maxAmount)}</span>
                </div>
              </div>

              {/* Interest Rate Slider */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Interest Rate</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-primary">{interestRate}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>5%</span>
                  <span>20%</span>
                </div>
              </div>

              {/* Tenure Slider */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Loan Tenure</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">{tenure} {tenure === 1 ? 'Year' : 'Years'}</span>
                </div>
                <input
                  type="range"
                  min={selectedLoanType.minTenure}
                  max={selectedLoanType.maxTenure}
                  step={1}
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>{selectedLoanType.minTenure} Year{selectedLoanType.minTenure > 1 ? 's' : ''}</span>
                  <span>{selectedLoanType.maxTenure} Years</span>
                </div>
              </div>

              {/* Results */}
              <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-5 sm:p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="h-5 w-5" />
                  <span className="text-sm font-semibold">Your EMI Breakdown</span>
                </div>
                
                <div className="text-center mb-6">
                  <p className="text-white/70 text-sm mb-1">Monthly EMI</p>
                  <p className="text-4xl sm:text-5xl font-black">{formatCurrency(emi)}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="text-center">
                    <p className="text-white/70 text-xs mb-1">Principal</p>
                    <p className="text-lg font-bold">{formatCurrency(loanAmount)}</p>
                  </div>
                  <div className="text-center border-x border-white/20">
                    <p className="text-white/70 text-xs mb-1">Total Interest</p>
                    <p className="text-lg font-bold">{formatCurrency(totalInterest)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/70 text-xs mb-1">Total Payment</p>
                    <p className="text-lg font-bold">{formatCurrency(totalPayment)}</p>
                  </div>
                </div>

                {/* Visual breakdown bar */}
                <div className="mb-4">
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-300"
                      style={{ width: `${principalPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      Principal ({principalPercentage.toFixed(0)}%)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-white/30 rounded-full"></span>
                      Interest ({(100 - principalPercentage).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/contact?service=${selectedLoanType.name}&amount=${loanAmount}`} className="flex-1">
                  <Button 
                    className="w-full bg-secondary hover:bg-secondary/90 text-white rounded-xl h-12 font-semibold"
                    onClick={onClose}
                  >
                    Apply for {selectedLoanType.name} <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  className="rounded-xl h-12 font-semibold border-2"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
