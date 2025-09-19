"use client";

import React, { useMemo, useCallback, useState, useEffect } from 'react';

interface Transaction {
  id: string;
  amount: number;
  description?: string;
  material_type?: string;
  kgs?: number;
  approved_at?: string;
  updated_at?: string;
  created_at?: string;
}

interface VirtualizedTransactionListProps {
  transactions: Transaction[];
  renderTransaction: (transaction: Transaction, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}

const VirtualizedTransactionList: React.FC<VirtualizedTransactionListProps> = ({
  transactions,
  renderTransaction,
  itemHeight = 80,
  containerHeight = 400,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = transactions.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    transactions.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleTransactions = useMemo(() => {
    return transactions.slice(startIndex, endIndex + 1);
  }, [transactions, startIndex, endIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Reset scroll when transactions change
  useEffect(() => {
    setScrollTop(0);
  }, [transactions.length]);

  return (
    <div
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: startIndex * itemHeight,
            width: '100%'
          }}
        >
          {visibleTransactions.map((transaction, index) => (
            <div
              key={transaction.id}
              style={{ height: itemHeight }}
            >
              {renderTransaction(transaction, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualizedTransactionList;
