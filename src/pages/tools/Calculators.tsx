import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, DollarSign, Percent, TrendingUp, PiggyBank, Home } from 'lucide-react';

export default function Calculators() {
  // Mortgage Calculator States
  const [loanAmount, setLoanAmount] = useState('300000');
  const [interestRate, setInterestRate] = useState('6.5');
  const [loanTerm, setLoanTerm] = useState('30');
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);

  // Tip Calculator States
  const [billAmount, setBillAmount] = useState('');
  const [tipPercent, setTipPercent] = useState('15');
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [tipResult, setTipResult] = useState<{
    tipAmount: number;
    totalAmount: number;
    perPerson: number;
  } | null>(null);

  // Percentage Calculator States
  const [percentValue, setPercentValue] = useState('');
  const [percentOf, setPercentOf] = useState('');
  const [percentResult, setPercentResult] = useState<number | null>(null);

  // Investment Calculator States
  const [principal, setPrincipal] = useState('10000');
  const [annualReturn, setAnnualReturn] = useState('7');
  const [investmentYears, setInvestmentYears] = useState('10');
  const [monthlyContribution, setMonthlyContribution] = useState('100');
  const [investmentResult, setInvestmentResult] = useState<{
    futureValue: number;
    totalContributions: number;
    totalInterest: number;
  } | null>(null);

  // BMI Calculator States
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [bmiResult, setBmiResult] = useState<{
    bmi: number;
    category: string;
  } | null>(null);

  // Loan Calculator States
  const [loanPrincipal, setLoanPrincipal] = useState('');
  const [loanRate, setLoanRate] = useState('');
  const [loanDuration, setLoanDuration] = useState('');
  const [loanPayment, setLoanPayment] = useState<{
    monthly: number;
    total: number;
    totalInterest: number;
  } | null>(null);

  const calculateMortgage = () => {
    const P = parseFloat(loanAmount);
    const r = parseFloat(interestRate) / 100 / 12;
    const n = parseFloat(loanTerm) * 12;

    const M = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    setMonthlyPayment(M);
  };

  const calculateTip = () => {
    const bill = parseFloat(billAmount);
    const tip = parseFloat(tipPercent) / 100;
    const people = parseInt(numberOfPeople);

    const tipAmount = bill * tip;
    const total = bill + tipAmount;
    const perPerson = total / people;

    setTipResult({
      tipAmount,
      totalAmount: total,
      perPerson,
    });
  };

  const calculatePercentage = () => {
    const percent = parseFloat(percentValue) / 100;
    const of = parseFloat(percentOf);
    setPercentResult(percent * of);
  };

  const calculateInvestment = () => {
    const P = parseFloat(principal);
    const r = parseFloat(annualReturn) / 100 / 12;
    const n = parseFloat(investmentYears) * 12;
    const PMT = parseFloat(monthlyContribution);

    const futureValue = P * Math.pow(1 + r, n) + PMT * ((Math.pow(1 + r, n) - 1) / r);
    const totalContributions = P + (PMT * n);
    const totalInterest = futureValue - totalContributions;

    setInvestmentResult({
      futureValue,
      totalContributions,
      totalInterest,
    });
  };

  const calculateBMI = () => {
    let weightInKg = parseFloat(weight);
    let heightInM = parseFloat(height);

    if (weightUnit === 'lbs') {
      weightInKg = weightInKg * 0.453592;
    }

    if (heightUnit === 'cm') {
      heightInM = heightInM / 100;
    } else if (heightUnit === 'ft') {
      heightInM = heightInM * 0.3048;
    } else if (heightUnit === 'in') {
      heightInM = heightInM * 0.0254;
    }

    const bmi = weightInKg / (heightInM * heightInM);
    let category = '';

    if (bmi < 18.5) {
      category = 'Underweight';
    } else if (bmi < 25) {
      category = 'Normal weight';
    } else if (bmi < 30) {
      category = 'Overweight';
    } else {
      category = 'Obese';
    }

    setBmiResult({ bmi, category });
  };

  const calculateLoan = () => {
    const P = parseFloat(loanPrincipal);
    const r = parseFloat(loanRate) / 100 / 12;
    const n = parseFloat(loanDuration);

    const monthly = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = monthly * n;
    const totalInterest = total - P;

    setLoanPayment({
      monthly,
      total,
      totalInterest,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Calculator className="h-8 w-8" />
          Calculators
        </h1>
        <p className="text-muted-foreground mt-2">
          Essential calculators for everyday needs
        </p>
      </div>

      <Tabs defaultValue="mortgage" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="mortgage">
            <Home className="h-4 w-4 mr-2" />
            Mortgage
          </TabsTrigger>
          <TabsTrigger value="tip">
            <DollarSign className="h-4 w-4 mr-2" />
            Tip
          </TabsTrigger>
          <TabsTrigger value="percentage">
            <Percent className="h-4 w-4 mr-2" />
            Percentage
          </TabsTrigger>
          <TabsTrigger value="investment">
            <TrendingUp className="h-4 w-4 mr-2" />
            Investment
          </TabsTrigger>
          <TabsTrigger value="bmi">BMI</TabsTrigger>
          <TabsTrigger value="loan">
            <PiggyBank className="h-4 w-4 mr-2" />
            Loan
          </TabsTrigger>
        </TabsList>

        {/* Mortgage Calculator */}
        <TabsContent value="mortgage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mortgage Calculator</CardTitle>
              <CardDescription>
                Calculate your monthly mortgage payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loan-amount">Loan Amount ($)</Label>
                  <Input
                    id="loan-amount"
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="300000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                  <Input
                    id="interest-rate"
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="6.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loan-term">Loan Term (years)</Label>
                  <Input
                    id="loan-term"
                    type="number"
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(e.target.value)}
                    placeholder="30"
                  />
                </div>
              </div>

              <Button onClick={calculateMortgage} className="w-full">
                Calculate Payment
              </Button>

              {monthlyPayment !== null && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="text-3xl font-bold">${monthlyPayment.toFixed(2)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Payment</p>
                      <p className="font-semibold">${(monthlyPayment * parseInt(loanTerm) * 12).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Interest</p>
                      <p className="font-semibold">${((monthlyPayment * parseInt(loanTerm) * 12) - parseFloat(loanAmount)).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tip Calculator */}
        <TabsContent value="tip" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tip Calculator</CardTitle>
              <CardDescription>
                Calculate tip and split the bill
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bill-amount">Bill Amount ($)</Label>
                <Input
                  id="bill-amount"
                  type="number"
                  step="0.01"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="100.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tip-percent">Tip Percentage (%)</Label>
                <div className="flex gap-2">
                  <Input
                    id="tip-percent"
                    type="number"
                    value={tipPercent}
                    onChange={(e) => setTipPercent(e.target.value)}
                    placeholder="15"
                  />
                  <Button variant="outline" onClick={() => setTipPercent('10')}>10%</Button>
                  <Button variant="outline" onClick={() => setTipPercent('15')}>15%</Button>
                  <Button variant="outline" onClick={() => setTipPercent('20')}>20%</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="number-people">Number of People</Label>
                <Input
                  id="number-people"
                  type="number"
                  value={numberOfPeople}
                  onChange={(e) => setNumberOfPeople(e.target.value)}
                  placeholder="1"
                  min="1"
                />
              </div>

              <Button onClick={calculateTip} className="w-full" disabled={!billAmount}>
                Calculate Tip
              </Button>

              {tipResult && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Tip Amount</p>
                      <p className="text-xl font-bold">${tipResult.tipAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">${tipResult.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Per Person</p>
                      <p className="text-xl font-bold">${tipResult.perPerson.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Percentage Calculator */}
        <TabsContent value="percentage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Percentage Calculator</CardTitle>
              <CardDescription>
                Calculate percentages quickly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="percent-value">What is</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="percent-value"
                      type="number"
                      value={percentValue}
                      onChange={(e) => setPercentValue(e.target.value)}
                      placeholder="15"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="percent-of">of</Label>
                  <Input
                    id="percent-of"
                    type="number"
                    value={percentOf}
                    onChange={(e) => setPercentOf(e.target.value)}
                    placeholder="200"
                  />
                </div>
              </div>

              <Button onClick={calculatePercentage} className="w-full" disabled={!percentValue || !percentOf}>
                Calculate
              </Button>

              {percentResult !== null && (
                <div className="p-4 border rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Result</p>
                  <p className="text-3xl font-bold">{percentResult.toFixed(2)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investment Calculator */}
        <TabsContent value="investment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Calculator</CardTitle>
              <CardDescription>
                Calculate future investment value
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principal">Initial Investment ($)</Label>
                  <Input
                    id="principal"
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    placeholder="10000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annual-return">Annual Return (%)</Label>
                  <Input
                    id="annual-return"
                    type="number"
                    step="0.1"
                    value={annualReturn}
                    onChange={(e) => setAnnualReturn(e.target.value)}
                    placeholder="7"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investment-years">Investment Period (years)</Label>
                  <Input
                    id="investment-years"
                    type="number"
                    value={investmentYears}
                    onChange={(e) => setInvestmentYears(e.target.value)}
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly-contribution">Monthly Contribution ($)</Label>
                  <Input
                    id="monthly-contribution"
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    placeholder="100"
                  />
                </div>
              </div>

              <Button onClick={calculateInvestment} className="w-full">
                Calculate Future Value
              </Button>

              {investmentResult && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <div className="text-center pb-3 border-b">
                    <p className="text-sm text-muted-foreground">Future Value</p>
                    <p className="text-3xl font-bold">${investmentResult.futureValue.toFixed(2)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Contributions</p>
                      <p className="font-semibold">${investmentResult.totalContributions.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Interest</p>
                      <p className="font-semibold text-green-600">${investmentResult.totalInterest.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BMI Calculator */}
        <TabsContent value="bmi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>BMI Calculator</CardTitle>
              <CardDescription>
                Calculate your Body Mass Index
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <div className="flex gap-2">
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="70"
                    />
                    <Select value={weightUnit} onValueChange={setWeightUnit}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <div className="flex gap-2">
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="170"
                    />
                    <Select value={heightUnit} onValueChange={setHeightUnit}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="ft">ft</SelectItem>
                        <SelectItem value="in">in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={calculateBMI} className="w-full" disabled={!weight || !height}>
                Calculate BMI
              </Button>

              {bmiResult && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Your BMI</p>
                    <p className="text-3xl font-bold">{bmiResult.bmi.toFixed(1)}</p>
                    <p className="text-lg font-medium mt-2">{bmiResult.category}</p>
                  </div>
                  <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    <p>BMI Categories:</p>
                    <p>Underweight: &lt; 18.5 | Normal: 18.5-24.9 | Overweight: 25-29.9 | Obese: ≥ 30</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loan Calculator */}
        <TabsContent value="loan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Calculator</CardTitle>
              <CardDescription>
                Calculate loan payments and interest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loan-principal">Loan Amount ($)</Label>
                  <Input
                    id="loan-principal"
                    type="number"
                    value={loanPrincipal}
                    onChange={(e) => setLoanPrincipal(e.target.value)}
                    placeholder="25000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loan-rate">Interest Rate (% per year)</Label>
                  <Input
                    id="loan-rate"
                    type="number"
                    step="0.1"
                    value={loanRate}
                    onChange={(e) => setLoanRate(e.target.value)}
                    placeholder="5.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loan-duration">Loan Duration (months)</Label>
                  <Input
                    id="loan-duration"
                    type="number"
                    value={loanDuration}
                    onChange={(e) => setLoanDuration(e.target.value)}
                    placeholder="60"
                  />
                </div>
              </div>

              <Button onClick={calculateLoan} className="w-full" disabled={!loanPrincipal || !loanRate || !loanDuration}>
                Calculate Loan
              </Button>

              {loanPayment && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                  <div className="text-center pb-3 border-b">
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="text-3xl font-bold">${loanPayment.monthly.toFixed(2)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Payment</p>
                      <p className="font-semibold">${loanPayment.total.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Interest</p>
                      <p className="font-semibold">${loanPayment.totalInterest.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
