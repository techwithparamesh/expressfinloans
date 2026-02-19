import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, DollarSign, Calendar, Percent } from "lucide-react";
import { motion } from "framer-motion";

interface LoanCalculatorProps {
  defaultLoanAmount?: number;
  defaultTenure?: number;
  defaultInterestRate?: number;
  minLoanAmount?: number;
  maxLoanAmount?: number;
  minTenure?: number;
  maxTenure?: number;
  minInterestRate?: number;
  maxInterestRate?: number;
  loanType?: string;
}

export default function LoanCalculator({
  defaultLoanAmount = 500000,
  defaultTenure = 5,
  defaultInterestRate = 8.5,
  minLoanAmount = 100000,
  maxLoanAmount = 10000000,
  minTenure = 1,
  maxTenure = 30,
  minInterestRate = 6,
  maxInterestRate = 18,
  loanType = "Loan",
}: LoanCalculatorProps) {
  const [loanAmount, setLoanAmount] = useState(defaultLoanAmount);
  const [tenure, setTenure] = useState(defaultTenure);
  const [interestRate, setInterestRate] = useState(defaultInterestRate);

  const calculations = useMemo(() => {
    const monthlyRate = interestRate / 12 / 100;
    const numPayments = tenure * 12;

    let emi = 0;
    let totalInterest = 0;
    let totalAmount = 0;

    if (monthlyRate > 0 && numPayments > 0) {
      emi =
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
      totalAmount = emi * numPayments;
      totalInterest = totalAmount - loanAmount;
    } else {
      emi = loanAmount / numPayments;
      totalAmount = loanAmount;
      totalInterest = 0;
    }

    return {
      emi: Math.round(emi),
      totalAmount: Math.round(totalAmount),
      totalInterest: Math.round(totalInterest),
    };
  }, [loanAmount, tenure, interestRate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  return (
    <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-br from-white to-slate-50">
      <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-white p-8">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
            <Calculator className="h-8 w-8" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black text-white mb-1">
              {loanType} Calculator
            </CardTitle>
            <p className="text-white/80 text-sm font-medium">
              Calculate your EMI, total interest, and total amount payable
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-8">
        {/* Loan Amount Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Loan Amount
              </label>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(loanAmount)}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                ₹{formatNumber(minLoanAmount)} - ₹{formatNumber(maxLoanAmount)}
              </div>
            </div>
          </div>
          <Slider
            value={[loanAmount]}
            onValueChange={(value) => setLoanAmount(value[0])}
            min={minLoanAmount}
            max={maxLoanAmount}
            step={50000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>₹{formatNumber(minLoanAmount)}</span>
            <span>₹{formatNumber(maxLoanAmount)}</span>
          </div>
        </div>

        {/* Tenure Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Loan Tenure
              </label>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-slate-900">
                {tenure} {tenure === 1 ? "Year" : "Years"}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {minTenure} - {maxTenure} Years
              </div>
            </div>
          </div>
          <Slider
            value={[tenure]}
            onValueChange={(value) => setTenure(value[0])}
            min={minTenure}
            max={maxTenure}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>{minTenure} Year</span>
            <span>{maxTenure} Years</span>
          </div>
        </div>

        {/* Interest Rate Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Percent className="h-5 w-5 text-primary" />
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Interest Rate (p.a.)
              </label>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-slate-900">
                {interestRate.toFixed(2)}%
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {minInterestRate}% - {maxInterestRate}% p.a.
              </div>
            </div>
          </div>
          <Slider
            value={[interestRate]}
            onValueChange={(value) => setInterestRate(value[0])}
            min={minInterestRate}
            max={maxInterestRate}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>{minInterestRate}%</span>
            <span>{maxInterestRate}%</span>
          </div>
        </div>

        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 border-2 border-primary/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              Your Loan Breakdown
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 shadow-lg border border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Monthly EMI
              </div>
              <div className="text-3xl font-black text-primary">
                {formatCurrency(calculations.emi)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Per month for {tenure * 12} months
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-lg border border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Total Interest
              </div>
              <div className="text-3xl font-black text-secondary">
                {formatCurrency(calculations.totalInterest)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Over {tenure} {tenure === 1 ? "year" : "years"}
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-lg border border-slate-200">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Total Amount
              </div>
              <div className="text-3xl font-black text-slate-900">
                {formatCurrency(calculations.totalAmount)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Principal + Interest
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-primary/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">Principal Amount</span>
              <span className="font-black text-slate-900">{formatCurrency(loanAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-600 font-medium">Total Interest Payable</span>
              <span className="font-black text-secondary">{formatCurrency(calculations.totalInterest)}</span>
            </div>
            <div className="flex items-center justify-between text-base mt-3 pt-3 border-t border-slate-200">
              <span className="text-slate-900 font-bold">Total Amount Payable</span>
              <span className="font-black text-primary text-lg">{formatCurrency(calculations.totalAmount)}</span>
            </div>
          </div>
        </motion.div>

        <Button
          className="w-full h-14 bg-slate-900 hover:bg-primary text-white font-bold text-lg rounded-xl shadow-xl transition-all"
          onClick={() => {
            window.location.href = "/contact";
          }}
        >
          Apply for {loanType} Now
        </Button>
      </CardContent>
    </Card>
  );
}
