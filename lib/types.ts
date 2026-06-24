// Shared client/server DTO types for the ledger.

export type Kind = "expense" | "income";

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: Kind;
};

export type Transaction = {
  id: string;
  kind: Kind;
  amount: number; // euro cents, positive
  categoryId: string | null;
  plannedItemId: string | null;
  note: string;
  createdBy: string;
  occurredAt: string; // ISO
  category: Category | null;
};

export type TransactionsResponse = {
  balance: number; // cents, signed (income - expense)
  transactions: Transaction[];
};

export type PlannedItem = {
  id: string;
  name: string;
  kind: Kind;
  amount: number; // estimated euro cents, positive
  dayOfMonth: number; // 1..31
  categoryId: string | null;
  category: Category | null;
};
