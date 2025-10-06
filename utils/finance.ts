// utils/finance.ts
export type MortgageAmRow = {
  month: number;
  date?: string;

  // Payments
  paymentPI: number;      // base principal + interest payment (no extra)
  principal: number;      // principal portion of base P&I
  interest: number;       // interest portion of base P&I
  extraPrincipal: number; // extra principal payment

  // Escrow breakdown (per month)
  escrowTax: number;
  escrowInsurance: number;
  escrowHOA: number;
  escrowPMI: number;
  escrowTotal: number;

  // Totals
  totalPayment: number;   // P&I + extra + escrow
  balance: number;

  // Cumulative trackers
  cumulativeInterest: number;
  cumulativePrincipal: number; // includes extra
  cumulativeEscrow: number;
};

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function formatCurrency(n: number, locale = 'en-US', currency = 'USD') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
}

export function monthlyPayment(principal: number, annualRatePct: number, years: number) {
  const n = years * 12;
  if (n <= 0) return 0;
  const r = (annualRatePct / 100) / 12;
  if (r === 0) return principal / n;
  const pow = Math.pow(1 + r, n);
  return principal * (r * pow) / (pow - 1);
}

export function buildMortgageSchedule(opts: {
  principal: number;
  annualRatePct: number;
  years: number;
  extraPrincipal?: number;
  startDate?: Date;

  // Escrow (all dollar amounts expected as dollars per year or per month as noted)
  propertyTaxAnnual?: number;     // $
  insuranceAnnual?: number;       // $
  hoaMonthly?: number;            // $

  // PMI
  pmiEnabled?: boolean;
  pmiAnnualRatePct?: number;      // % per year, e.g. 0.5
  homePrice?: number;             // for auto-cancel at 80% LTV
  ltvCancelAt?: number;           // e.g. 0.80
  pmiBase?: 'original' | 'balance'; // common default is 'original'
}): MortgageAmRow[] {
  const {
    principal,
    annualRatePct,
    years,
    extraPrincipal = 0,
    startDate,

    propertyTaxAnnual = 0,
    insuranceAnnual = 0,
    hoaMonthly = 0,

    pmiEnabled = false,
    pmiAnnualRatePct = 0,
    homePrice = 0,
    ltvCancelAt = 0.80,
    pmiBase = 'original',
  } = opts;

  const n = Math.max(0, Math.floor(years * 12));
  const r = (annualRatePct / 100) / 12;
  const basePI = monthlyPayment(principal, annualRatePct, years);

  const taxM = propertyTaxAnnual / 12;
  const insM = insuranceAnnual / 12;

  let balance = principal;
  let cumI = 0;
  let cumP = 0;
  let cumE = 0;

  const rows: MortgageAmRow[] = [];

  for (let month = 1; month <= n && balance > 0.005; month++) {
    const interestRaw = r === 0 ? 0 : balance * r;
    let principalPaidRaw = basePI - interestRaw;
    if (principalPaidRaw < 0) principalPaidRaw = 0;

    // Clamp extra to not overpay
    let extraRaw = extraPrincipal;
    if (principalPaidRaw + extraRaw > balance) {
      extraRaw = Math.max(0, balance - principalPaidRaw);
    }

    // PMI: active until LTV <= 80% (if homePrice provided). If no homePrice, applies full term.
    let pmiMRaw = 0;
    if (pmiEnabled && pmiAnnualRatePct > 0) {
      const ltvLimit = homePrice > 0 ? homePrice * ltvCancelAt : Number.POSITIVE_INFINITY;
      const pmiActive = balance > ltvLimit;
      if (pmiActive) {
        const baseForPMI = pmiBase === 'balance' ? balance : principal; // many lenders use original principal
        pmiMRaw = (pmiAnnualRatePct / 100) / 12 * baseForPMI;
      }
    }

    // Escrow monthly (PMI varies monthly; tax/insurance/HOA are flat monthly here)
    const escrowTotalRaw = taxM + insM + hoaMonthly + pmiMRaw;

    // Update balance (use raw, then round outputs)
    const newBalanceRaw = balance - principalPaidRaw - extraRaw;

    cumI += interestRaw;
    cumP += principalPaidRaw + extraRaw;
    cumE += escrowTotalRaw;

    const interest = round2(interestRaw);
    const principalPaid = round2(principalPaidRaw);
    const extra = round2(extraRaw);
    const pmiM = round2(pmiMRaw);
    const escrowTotal = round2(escrowTotalRaw);
    const paymentPI = round2(interest + principalPaid);
    const totalPayment = round2(paymentPI + extra + escrowTotal);
    const nextBalance = round2(Math.max(0, newBalanceRaw));

    const row: MortgageAmRow = {
      month,
      paymentPI,
      principal: principalPaid,
      interest,
      extraPrincipal: extra,

      escrowTax: round2(taxM),
      escrowInsurance: round2(insM),
      escrowHOA: round2(hoaMonthly),
      escrowPMI: pmiM,
      escrowTotal,

      totalPayment,
      balance: nextBalance,
      cumulativeInterest: round2(cumI),
      cumulativePrincipal: round2(cumP),
      cumulativeEscrow: round2(cumE),
    };

    if (startDate) {
      const dt = new Date(startDate);
      dt.setMonth(dt.getMonth() + month);
      row.date = dt.toISOString().slice(0, 10);
    }

    rows.push(row);
    balance = newBalanceRaw;
  }

  return rows;
}
