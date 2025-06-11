export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function getRateByDate(
  rateHistory: { [date: string]: number } | undefined,
  date: string,
): number | undefined {
  if (!rateHistory) {
    return undefined;
  }

  const sortedDates = Object.keys(rateHistory).sort();
  let lastRate: number | undefined = undefined;

  for (const rateDate of sortedDates) {
    if (rateDate <= date) {
      lastRate = rateHistory[rateDate];
    } else {
      break;
    }
  }

  return lastRate;
}
