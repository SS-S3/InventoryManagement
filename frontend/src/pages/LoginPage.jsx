"use client";
import React, { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  IconAlertTriangle,
  IconArrowsShuffle,
  IconChecklist,
  IconX,
} from "@tabler/icons-react";
import HeroSectionOne from "../components/HeroSectionOne";
import { HeroParallax } from "../components/ui/hero-parallax";
import AuthForm from "../components/AuthForm";
import { CometCard } from "../components/ui/comet-card";

const products = [
  {
    title: "Precision Microscope",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Chemical Analysis Kit",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1581093458791-9f3c3250bb8b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Biohazard Research Stn",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1532187875605-2fe35937966c?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Quantum Processor",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Automated Pipettes",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1614850523296-e84e09ad8dc7?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Embedded Systems Lab",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Robotic Assembly",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Compute Cluster",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1558494949-ef010952b793?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Optical Inspection",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1532635042-a6f6bd48427e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Synthesis Flasks",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Signal Analysis",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Clinical Diagnostics",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1579154215160-c323f491f4f4?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Genomics Suite",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Materials Science",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Electronic Components",
    link: "#",
    thumbnail:
      "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?q=80&w=1200&auto=format&fit=crop",
  },
];

const heroStats = [
  { label: "Assets tracked", value: "1.2k+" },
  { label: "Borrow cycles", value: "8.6k" },
  { label: "Teams onboarded", value: "34" },
];

const featureCards = [
  {
    title: "Approval-aware reservations",
    description:
      "Route borrowing requests to supervisors and auto-approve based on custom policies and shifts.",
    icon: IconChecklist,
  },
  {
    title: "Adaptive stock balancing",
    description:
      "Synchronise inventory across labs and allocate scarce equipment with fair-share logic.",
    icon: IconArrowsShuffle,
  },
  {
    title: "Incident ready",
    description:
      "Escalate anomalies, lock unsafe instruments, and document corrective actions instantly.",
    icon: IconAlertTriangle,
  },
];

const workflowTimeline = [
  {
    step: "01",
    title: "Plan & reserve",
    description:
      "Search availability, preview conflicts, and submit borrow requests without leaving the dashboard.",
  },
  {
    step: "02",
    title: "Approve & track",
    description:
      "Managers receive context-rich approvals and track custody changes with automated reminders.",
  },
  {
    step: "03",
    title: "Analyse & learn",
    description:
      "Export utilisation patterns, downtime analytics, and compliance-ready logs in one click.",
  },
];

const LandingPage = ({ setToken }) => {
  const [loginOpen, setLoginOpen] = useState(false);
  const featuresRef = useRef(null);

  const handleExploreClick = () => {
    if (featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const closeLogin = () => setLoginOpen(false);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-white via-neutral-100 to-neutral-200 text-neutral-900 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 dark:text-neutral-50">
      <HeroSectionOne
        stats={heroStats}
        onLoginClick={() => setLoginOpen(true)}
        onExploreClick={handleExploreClick}
      />

      <section
        id="features"
        ref={featuresRef}
        className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20"
      >
        <CometCard className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white/80 p-10 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70">
          <h2 className="text-2xl font-semibold md:text-3xl">Purpose-built for science operations</h2>
          <p className="mt-3 max-w-2xl text-sm text-neutral-600 md:text-base dark:text-neutral-300">
            Align technicians, researchers, and administrators with transparent workflows that keep equipment ready for the next breakthrough.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featureCards.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </CometCard>
      </section>

      <section id="workflows" className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20">
        <CometCard className="rounded-3xl border border-neutral-200 bg-white/90 p-10 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70">
          <h2 className="text-2xl font-semibold md:text-3xl">Borrowings that stay accountable</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {workflowTimeline.map((entry) => (
              <TimelineCard key={entry.step} {...entry} />
            ))}
          </div>
        </CometCard>
      </section>

      <section id="showcase" className="relative z-0 pb-32">
        <HeroParallax products={products} className="h-[160vh] py-32" />
      </section>

      <LoginOverlay
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onClose={closeLogin}
        setToken={setToken}
      />
    </div>
  );
};

const FeatureCard = ({ title, description, icon: Icon }) => {
  return (
    <CometCard className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
      <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
        <Icon className="size-6" stroke={1.75} />
      </div>
      <h3 className="mt-6 text-lg font-semibold">{title}</h3>
      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
    </CometCard>
  );
};

const TimelineCard = ({ step, title, description }) => {
  return (
    <CometCard className="relative h-full rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{step}</span>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{description}</p>
    </CometCard>
  );
};

const LoginOverlay = ({ open, onOpenChange, onClose, setToken }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md">
            <Dialog.Title className="sr-only">Login to dashboard</Dialog.Title>
            <Dialog.Description className="sr-only">
              Authenticate to access the inventory management dashboard.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                type="button"
                onClick={onClose}
                className="absolute -right-2 -top-2 inline-flex size-9 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg hover:bg-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
              >
                <IconX className="size-4" stroke={1.75} />
              </button>
            </Dialog.Close>
            <AuthForm setToken={setToken} onAuthSuccess={onClose} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default LandingPage;
