"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "./ui/sidebar";
import {
  IconBrandTabler,
  IconPackage,
  IconArrowsExchange,
  IconBriefcase,
  IconClipboardCheck,
  IconHandGrab,
  IconTrophy,
  IconLogout,
} from "@tabler/icons-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FollowerPointerCard } from "./ui/following-pointer";

export default function Layout({ children, token, setToken }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    localStorage.removeItem("token");
    setToken && setToken(null);
    navigate("/");
  }

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Inventory",
      href: "/inventory",
      icon: (
        <IconPackage className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Lab Layout",
      href: "/layout",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Transactions",
      href: "/transactions",
      icon: (
        <IconArrowsExchange className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Projects",
      href: "/projects",
      icon: (
        <IconBriefcase className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Allocations",
      href: "/allocations",
      icon: (
        <IconClipboardCheck className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Borrowings",
      href: "/borrowings",
      icon: (
        <IconHandGrab className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Competitions",
      href: "/competitions",
      icon: (
        <IconTrophy className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col overflow-hidden bg-background text-foreground md:flex-row",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <Logo />
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink
                  key={idx}
                  link={link}
                  className={cn(
                    location.pathname === link.href && "bg-neutral-200 dark:bg-neutral-800 rounded-md px-2"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(link.href);
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-start gap-2 group/sidebar py-2 w-full text-left"
            >
              <IconLogout className="h-5 w-5 shrink-0 text-red-500" />
              <span className={cn(
                "text-red-500 text-sm transition duration-150 whitespace-pre inline-block",
                !open && "hidden"
              )}>
                Logout
              </span>
            </button>
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex flex-1 h-full overflow-hidden">
        <FollowerPointerCard className="w-full h-full">
          <main className="h-full w-full overflow-y-auto p-4 md:p-10 bg-background text-foreground rounded-tl-2xl border-t border-l border-neutral-200 dark:border-neutral-800">
            {children}
          </main>
        </FollowerPointerCard>
      </div>
    </div>
  );
}

const Logo = () => {
  return (
    <div className="flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white">
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <span className="font-medium text-black dark:text-white whitespace-pre">
        Inventory Lab
      </span>
    </div>
  );
};
