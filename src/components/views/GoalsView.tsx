"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useFinance } from "@/context/FinanceContext";
import { DynamicIcon } from "@/components/DynamicIcon";
import { GoalModal, GoalItem } from "@/components/modals/GoalModal";
import { ContributeModal } from "@/components/modals/ContributeModal";
import {
  PiggyBank,
  Plus,
  Sparkles,
  CheckCircle2,
  Calendar,
  Target,
  Trophy,
} from "lucide-react";

interface EnrichedGoal {
  id: string;
  title: string;
  targetAmount: string;
  currentAmount: string;
  targetNum: number;
  currentNum: number;
  remainingNum: number;
  percent: number;
  targetDate?: string | null;
  category: string;
  color: string;
  icon: string;
  isCompleted: boolean;
}

export function GoalsView() {
  const { formatCurrency, formatCompact } = useFinance();

  const [goals, setGoals] = useState<EnrichedGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<GoalItem | null>(null);

  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<EnrichedGoal | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/goals");
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals || []);
      }
    } catch {
      console.error("Failed to load savings goals");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleOpenCreate = () => {
    setGoalToEdit(null);
    setIsGoalModalOpen(true);
  };

  const handleOpenEdit = (g: EnrichedGoal) => {
    setGoalToEdit(g);
    setIsGoalModalOpen(true);
  };

  const handleOpenContribute = (g: EnrichedGoal) => {
    setSelectedGoalForDeposit(g);
    setIsContributeModalOpen(true);
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.currentNum, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetNum, 0);
  const overallPercent = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Savings Goals & Piggy Banks</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Set aside funds for emergency buffer, travel, investments, and dream milestones
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Savings Goal
        </button>
      </div>

      {/* Aggregate Goal Progress Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-slate-900 border border-emerald-900/40 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
              Total Goal Portfolio
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-black text-white">{formatCurrency(totalSaved)}</h3>
              <span className="text-sm text-slate-400">/ {formatCurrency(totalTarget)} target</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Overall Completion</span>
              <span className="text-2xl font-black text-emerald-400">{overallPercent}%</span>
            </div>
          </div>
        </div>

        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, overallPercent)}%` }}
          />
        </div>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-slate-900 rounded-2xl border border-slate-800" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <PiggyBank className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">No Savings Goals Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create your first piggy bank for an emergency fund, dream vacation, or gadget.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
          >
            Create Savings Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const isFinished = g.percent >= 100 || g.isCompleted;

            return (
              <div
                key={g.id}
                className={`p-5 rounded-2xl bg-slate-900 border transition-all hover:border-slate-700 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden ${
                  isFinished ? "border-emerald-800/80 bg-emerald-950/10" : "border-slate-800"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                      style={{ backgroundColor: `${g.color}25`, color: g.color }}
                    >
                      <DynamicIcon name={g.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{g.title}</h4>
                      <span className="text-[11px] text-slate-400">{g.category}</span>
                    </div>
                  </div>

                  {isFinished ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      <Trophy className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {g.percent}%
                    </span>
                  )}
                </div>

                {/* Progress bar and details */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-white font-bold">{formatCurrency(g.currentNum)}</span>
                    <span className="text-slate-400">Target: {formatCurrency(g.targetNum)}</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, g.percent)}%`,
                        backgroundColor: g.color || "#10b981",
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
                    <span>
                      {isFinished ? "Target reached!" : `Need ${formatCurrency(g.remainingNum)} more`}
                    </span>
                    {g.targetDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {g.targetDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => handleOpenContribute(g)}
                    disabled={isFinished}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Deposit
                  </button>

                  <button
                    onClick={() => handleOpenEdit(g)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    Edit Goal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          fetchGoals();
        }}
        goalToEdit={goalToEdit}
      />

      <ContributeModal
        isOpen={isContributeModalOpen}
        onClose={() => {
          setIsContributeModalOpen(false);
          fetchGoals();
        }}
        goal={selectedGoalForDeposit}
      />
    </div>
  );
}
