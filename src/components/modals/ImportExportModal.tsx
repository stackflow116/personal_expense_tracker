"use client";

import React, { useState } from "react";
import { useFinance } from "@/context/FinanceContext";
import { useToast } from "@/components/ToastProvider";
import { X, Download, Upload, FileText, CheckCircle2 } from "lucide-react";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportExportModal({ isOpen, onClose }: ImportExportModalProps) {
  const { accounts, refreshAll } = useFinance();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [csvContent, setCsvContent] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || "");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = () => {
    window.location.href = `/api/import-export?format=${exportFormat}`;
    success("Export Started", `Downloading your transactions as ${exportFormat.toUpperCase()}`);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      error("Please choose a CSV file or paste CSV content");
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch("/api/import-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvData: csvContent,
          defaultAccountId: selectedAccountId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        success("Import Successful", `Successfully imported ${data.importedCount} transactions!`);
        await refreshAll();
        onClose();
      } else {
        const d = await res.json();
        error(d.error || "Failed to import CSV");
      }
    } catch {
      error("Error processing CSV import");
    } finally {
      setIsProcessing(false);
    }
  };

  const sampleCsvExample = `Date,Type,Amount,Description,Merchant
2026-03-24,expense,45.50,Whole Foods Market,Whole Foods
2026-03-23,expense,12.00,Blue Bottle Coffee,Blue Bottle
2026-03-22,income,3200.00,Client Consulting,Acme Inc`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h3 className="text-lg font-bold text-white">Import & Export Data</h3>
            <p className="text-xs text-slate-400">Backup your data or import transaction history</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("export")}
            className={`py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === "export"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === "import"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
        </div>

        <div className="p-6 space-y-4">
          {activeTab === "export" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Choose Export Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat("csv")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      exportFormat === "csv"
                        ? "bg-blue-950/60 border-blue-500 text-white ring-1 ring-blue-500"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <FileText className="w-5 h-5 text-blue-400 mb-1.5" />
                    <h4 className="text-sm font-bold">CSV Spreadsheet</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Compatible with Excel, Google Sheets & Apple Numbers</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat("json")}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      exportFormat === "json"
                        ? "bg-blue-950/60 border-blue-500 text-white ring-1 ring-blue-500"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <FileText className="w-5 h-5 text-emerald-400 mb-1.5" />
                    <h4 className="text-sm font-bold">Raw JSON</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Developer raw data dump with all tags and fields</p>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="w-full py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Complete History ({exportFormat.toUpperCase()})
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Target Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency} {acc.balance})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Upload CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-300">Or Paste CSV Raw Content</label>
                  <button
                    type="button"
                    onClick={() => setCsvContent(sampleCsvExample)}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Insert Example
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="Date,Type,Amount,Description,Merchant..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isProcessing || !csvContent.trim()}
                  className="w-full py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isProcessing ? "Importing Transactions..." : "Start Import"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
