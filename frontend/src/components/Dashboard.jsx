"use client";
import React, { useState, useEffect } from "react";
import DashboardStats from "./DashboardStats";
import { Card as HoverCard } from "./ui/card-hover-effect";

const Dashboard = ({ token }) => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUsername(payload.username || "Researcher");
    } catch (e) {
      console.error("Invalid token");
    }
  }, [token]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-100 tracking-tight">
          Welcome back, <span className="text-blue-500">{username}</span>
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl">
          Here's what's happening in the lab today. Monitor your borrowings, track project allocations, and manage inventory from your command center.
        </p>
      </header>

      <div className="w-full">
        <DashboardStats token={token} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickActionCard
          title="Manage Inventory"
          description="Track and update lab equipment"
          icon="📦"
        />
        <QuickActionCard
          title="Allocation Control"
          description="Assign resources to active projects"
          icon="⚖️"
        />
        <QuickActionCard
          title="System History"
          description="View all recent activity logs"
          icon="📜"
        />
      </div>
    </div>
  );
};

const QuickActionCard = ({ title, description, icon }) => {
  return (
    <HoverCard className="bg-white text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-transform duration-300 hover:-translate-y-1">
      <div className="flex flex-col gap-3">
        <span className="text-3xl">{icon}</span>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      </div>
    </HoverCard>
  );
};

export default Dashboard;
