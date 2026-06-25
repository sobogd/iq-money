// Shared client/server DTO types for the ledger.

export type Kind = "expense" | "income";

export type Category = {
  id: string;
  name: string;
  color: string;
  kind: Kind;
};

export type Transaction = {
  id: string;
  kind: Kind;
  amount: number; // euro cents, positive
  categoryId: string | null;
  note: string;
  createdBy: string;
  occurredAt: string; // ISO
  category: Category | null;
};

export type TransactionsResponse = {
  balance: number; // cents, signed (income - expense)
  transactions: Transaction[];
};

// A named recurring monthly line under a category. The category's budget is the
// sum of its planned items.
export type PlannedItem = {
  id: string;
  categoryId: string;
  name: string;
  amount: number; // planned monthly euro cents, positive
  dayOfMonth: number; // approx charge/arrival day (1..31)
  category: Category | null;
};
