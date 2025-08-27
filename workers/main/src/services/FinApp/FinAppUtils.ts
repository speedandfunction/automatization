export function getContractTypeByDate(
  contractTypeHistory: { [date: string]: string } | undefined,
  date: string,
): string | undefined {
  if (!contractTypeHistory) {
    return undefined;
  }

  const targetTs = Date.parse(date);
  if (Number.isNaN(targetTs)) return undefined;
  
  const sorted = Object.keys(contractTypeHistory)
    .map((d) => ({ d, ts: Date.parse(d) }))
    .filter(({ ts }) => !Number.isNaN(ts))
    .sort((a, b) => a.ts - b.ts);
  let lastContractType: string | undefined;

  for (const { d, ts } of sorted) {
    if (ts <= targetTs) lastContractType = contractTypeHistory[d];
    else break;
  }

  return lastContractType;
}
