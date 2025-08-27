export function getContractTypeByDate(
  contractTypeHistory: { [date: string]: string } | undefined,
  date: string,
): string | undefined {
  if (!contractTypeHistory) {
    return undefined;
  }

  const sortedDates = Object.keys(contractTypeHistory).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );
  let lastContractType: string | undefined = undefined;

  for (const contractDate of sortedDates) {
    if (contractDate <= date) {
      lastContractType = contractTypeHistory[contractDate];
    } else {
      break;
    }
  }

  return lastContractType;
}
