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

// Monthly planned sum for one category.
export type CategoryPlan = {
  id: string;
  categoryId: string;
  amount: number; // planned monthly euro cents, positive
  dayOfMonth: number; // income arrival day (1..31); ignored for expense
  category: Category | null;
};
