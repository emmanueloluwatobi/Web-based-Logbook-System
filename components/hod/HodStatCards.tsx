"use client";

import React from "react";
import {
  Users,
  Building2,
  UserX,
  UserCheck,
  BarChart3,
} from "lucide-react";

interface HodStatCardsProps {
  stats: {
    totalStudents: number;
    onPlacement: number;
    withoutPlacement: number;
    totalSupervisors: number;
    studentsPerSupervisor: number;
  };
}

export function HodStatCards({ stats }: HodStatCardsProps) {
  const cards = [
    {
      label: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      accent: "bg-primary",
      accentText: "text-primary",
      subtitle: "In department",
    },
    {
      label: "On Placement",
      value: stats.onPlacement,
      icon: Building2,
      accent: "bg-success",
      accentText: "text-success",
      subtitle: stats.totalStudents > 0
        ? `${Math.round((stats.onPlacement / stats.totalStudents) * 100)}% placed`
        : "0% placed",
    },
    {
      label: "Without Placement",
      value: stats.withoutPlacement,
      icon: UserX,
      accent: "bg-warning",
      accentText: "text-warning",
      subtitle: stats.totalStudents > 0
        ? `${Math.round((stats.withoutPlacement / stats.totalStudents) * 100)}% unplaced`
        : "0% unplaced",
    },
    {
      label: "Supervisors",
      value: stats.totalSupervisors,
      icon: UserCheck,
      accent: "bg-secondary",
      accentText: "text-secondary",
      subtitle: "Active staff",
    },
    {
      label: "Students / Supervisor",
      value: stats.studentsPerSupervisor,
      icon: BarChart3,
      accent: "bg-tertiary",
      accentText: "text-tertiary",
      subtitle: "Avg. load",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-xs hover:border-primary/40 transition-colors flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl ${card.accent}/12 flex items-center justify-center`}>
                <Icon className={`size-4.5 ${card.accentText}`} />
              </div>
            </div>
            <div>
              <p className="font-heading text-2xl font-bold text-on-surface tracking-tight">
                {card.value}
              </p>
              <p className="text-xs font-medium text-on-surface-variant mt-0.5 font-heading uppercase tracking-wider">
                {card.label}
              </p>
            </div>
            <div className="mt-auto">
              <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className={`h-full rounded-full ${card.accent} transition-all`}
                  style={{
                    width: `${Math.min(100, card.label === "Students / Supervisor"
                      ? Math.min(card.value * 10, 100)
                      : stats.totalStudents > 0
                        ? (card.value / stats.totalStudents) * 100
                        : 0
                    )}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
