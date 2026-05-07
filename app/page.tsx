"use client";

import { useEffect, useState } from "react";
import HeaderCard from "@/components/dashboard/HeaderCard";
import IncomeExpenseCards from "@/components/dashboard/IncomeExpenseCards";
import GoalCard from "@/components/dashboard/GoalCard";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import SpendingCategoryCard from "@/components/dashboard/SpendingCategoryCard";
import BottomNav from "@/components/navigation/BottomNav";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [myName, setMyName] = useState("민준");
  const [dashboard, setDashboard] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    const savedName = localStorage.getItem("alien_my_name");
    if (savedName) setMyName(savedName);

    async function loadHomeData() {
      try {
        const monthStartDay = Number(
          localStorage.getItem("alien_month_start_day") || 1
        );

        const safeMonthStartDay =
          Number.isFinite(monthStartDay) && monthStartDay >= 1 && monthStartDay <= 31
            ? monthStartDay
            : 1;

        const dashboardRes = await fetch(
          `/api/dashboard?monthStartDay=${safeMonthStartDay}`
        );
        const dashboardData = await dashboardRes.json();

        setDashboard(dashboardData);
      } catch (error) {
        console.error("dashboard load error:", error);
      }

      try {
        const goalsRes = await fetch("/api/goals");
        const goalsData = await goalsRes.json();

        setGoals(Array.isArray(goalsData) ? goalsData : []);
      } catch (error) {
        console.error("goals load error:", error);
        setGoals([]);
      }
    }

    loadHomeData();

  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FFFFFF",
        padding: "12px 10px 72px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 390,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2px",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>
              안녕하세요 {myName}님 👋
            </div>
            <div style={{ fontSize: 11, color: "#9B96AA", marginTop: 3 }}>
              함께 모으고, 함께 이루는 우리 자산
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Bell size={18} color="#7E73A8" />
            <Link
              href="/profile"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#EAF8D8",
                display: "grid",
                placeItems: "center",
                border: "1px solid #D7EFC1",
                fontSize: 16,
                textDecoration: "none",
              }}
            >
              👽
            </Link>
          </div>
        </header>

        <HeaderCard data={dashboard} />
        <IncomeExpenseCards data={dashboard} />
        <GoalCard goals={goals} />
        <RecentTransactions items={dashboard?.recentTransactions || []} />
        <SpendingCategoryCard items={dashboard?.spendingCategories || []} />
        <BottomNav />
      </div>
    </main>
  );
}