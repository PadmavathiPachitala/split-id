export interface MemberBalance {
  id: string
  name: string
  split_id: string
  balance: number // Positive means they are owed (creditor), negative means they owe (debtor)
}

export interface SuggestedTransaction {
  fromId: string
  fromName: string
  fromSplitId: string
  toId: string
  toName: string
  toSplitId: string
  amount: number
}

/**
 * Greedy algorithm to minimize the number of transactions required to settle all debts.
 * It takes the list of member balances and pairs the largest debtors with the largest creditors.
 */
export function simplifyDebts(members: MemberBalance[]): SuggestedTransaction[] {
  // Split into debtors (negative balance) and creditors (positive balance)
  // We use 0.005 to guard against tiny floating point precision issues.
  const debtors = members
    .filter((m) => m.balance < -0.005)
    .map((m) => ({ ...m, balance: Math.abs(m.balance) }))
    .sort((a, b) => b.balance - a.balance)

  const creditors = members
    .filter((m) => m.balance > 0.005)
    .map((m) => ({ ...m }))
    .sort((a, b) => b.balance - a.balance)

  const transactions: SuggestedTransaction[] = []

  let dIdx = 0
  let cIdx = 0

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx]
    const creditor = creditors[cIdx]

    // The settlement amount is the minimum of what debtor owes and what creditor is owed
    const settleAmount = Math.min(debtor.balance, creditor.balance)

    if (settleAmount > 0.005) {
      transactions.push({
        fromId: debtor.id,
        fromName: debtor.name,
        fromSplitId: debtor.split_id,
        toId: creditor.id,
        toName: creditor.name,
        toSplitId: creditor.split_id,
        amount: Number(settleAmount.toFixed(2)),
      })
    }

    debtor.balance -= settleAmount
    creditor.balance -= settleAmount

    if (debtor.balance < 0.005) {
      dIdx++
    }
    if (creditor.balance < 0.005) {
      cIdx++
    }
  }

  return transactions
}
