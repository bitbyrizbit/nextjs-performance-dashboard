import React from "react";

// Simulate database fetch
async function fetchTransactions() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return [
    { id: "1", title: "Grocery store", amount: 45.99, category: "food" },
    { id: "2", title: "Gas station", amount: 30.0, category: "transport" },
    { id: "3", title: "Internet bill", amount: 60.0, category: "utilities" },
  ];
}

export async function TransactionList() {
  const transactions = await fetchTransactions();

  return (
    <div className="rounded-md border bg-background">
      <div className="p-4 border-b font-medium">Recent Transactions</div>
      <div className="divide-y">
        {transactions.map((tx) => (
          <div key={tx.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{tx.title}</p>
              <p className="text-sm text-muted-foreground capitalize">{tx.category}</p>
            </div>
            <div className="font-medium">${tx.amount.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
