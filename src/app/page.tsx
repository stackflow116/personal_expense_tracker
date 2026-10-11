"use client";

import React, { useState } from "react";
import { FinanceProvider, useFinance } from "@/context/FinanceContext";
import { ToastProvider } from "@/components/ToastProvider";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { TransactionModal } from "@/components/modals/TransactionModal";

// Views
import { DashboardView } from "@/components/views/DashboardView";
import { TransactionsView } from "@/components/views/TransactionsView";
import { BudgetsView } from "@/components/views/BudgetsView";
import { AccountsView } from "@/components/views/AccountsView";
import { GoalsView } from "@/components/views/GoalsView";
import { RecurringView } from "@/components/views/RecurringView";
import { AnalyticsView } from "@/components/views/AnalyticsView";
import { DebtsView } from "@/components/views/DebtsView";
import { SettingsView } from "@/components/views/SettingsView";

function MainContent() {
  const { activeTab } = useFinance();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "transactions" && <TransactionsView />}
          {activeTab === "budgets" && <BudgetsView />}
          {activeTab === "accounts" && <AccountsView />}
          {activeTab === "goals" && <GoalsView />}
          {activeTab === "recurring" && <RecurringView />}
          {activeTab === "analytics" && <AnalyticsView />}
          {activeTab === "debts" && <DebtsView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Global Quick Transaction Modal */}
      <TransactionModal />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <FinanceProvider>
        <MainContent />
      </FinanceProvider>
    </ToastProvider>
  );
}
