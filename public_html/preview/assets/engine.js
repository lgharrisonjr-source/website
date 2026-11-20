// FinancialTherapy360 sample calculation engine (unchanged from the tested prototype).
const baseline = { income: 5400, expenses: 4100, balance: 8e3, limit: 12e3, apr: 24, payment: 300 };
const money = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
function payoff(balance, apr, payment) {
  if (![balance, apr, payment].every(Number.isFinite) || balance < 0 || apr < 0 || payment <= 0) return null;
  let remaining = Math.round(balance * 100), interest = 0, months = 0;
  while (remaining > 0 && months < 1200) {
    const charge = Math.round(remaining * apr / 1200);
    if (Math.round(payment * 100) <= charge) return null;
    interest += charge;
    remaining = Math.max(0, remaining + charge - Math.round(payment * 100));
    months++;
  }
  return remaining > 0 ? null : { months, interest: interest / 100 };
}
function analyze(input, extra) {
  const cash = input.income - input.expenses - input.payment;
  return {
    cash,
    afterExtra: cash - extra,
    utilization: input.limit > 0 ? input.balance / input.limit * 100 : null,
    base: payoff(input.balance, input.apr, input.payment),
    scenario: payoff(input.balance, input.apr, input.payment + extra)
  };
}
export { analyze, baseline, money, payoff };
