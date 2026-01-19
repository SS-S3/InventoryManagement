import React from 'react';
import { motion } from "framer-motion";

export function HeroSectionOne({
  title = "Inventory intelligence for modern labs",
  subtitle = "Track assets, approvals, and borrowing in one connected workspace designed for high-performing research teams.",
  onLoginClick,
  onExploreClick,
  stats = [],
  children,
}) {
  const headlineWords = title.split(" ");

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-20 pt-10 md:pb-28 md:pt-16">
      <Navbar onLoginClick={onLoginClick} />

      <div className="mt-16 grid w-full gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
          >
            Smart laboratory operations
          </motion.span>

          <h1 className="mt-6 text-balance text-3xl font-bold text-neutral-900 md:text-5xl lg:text-6xl dark:text-neutral-50">
            {headlineWords.map((word, index) => (
              <motion.span
                key={word + index}
                initial={{ opacity: 0, filter: "blur(4px)", y: 12 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04, ease: "easeInOut" }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="mt-6 max-w-xl text-lg leading-7 text-neutral-600 dark:text-neutral-300"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.55 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <button
              type="button"
              onClick={onLoginClick}
              className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-neutral-900/10 transition hover:-translate-y-0.5 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
            >
              Access dashboard
            </button>
            <button
              type="button"
              onClick={onExploreClick}
              className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-800 transition hover:-translate-y-0.5 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-neutral-500"
            >
              Explore capabilities
            </button>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.65 }}
            className="mt-12 grid grid-cols-2 gap-6 text-left sm:grid-cols-3"
          >
            {stats.map((item) => (
              <div key={item.label}>
                <dt className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  {item.label}
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
                  {item.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />
          <div className="relative px-6 py-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Live utilization snapshot
            </p>
            <ul className="mt-6 space-y-4 text-sm text-neutral-600 dark:text-neutral-300">
              <li className="flex items-center justify-between">
                <span>Borrowed instruments</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">24</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Queued maintenance</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">8</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Open competition slots</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">12</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Last sync</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">2m ago</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>

      {children && (
        <div className="mt-16 w-full">{children}</div>
      )}
    </div>
  );
}

const Navbar = ({ onLoginClick }) => {
  return (
    <nav className="flex w-full items-center justify-between rounded-full border border-neutral-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/60">
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        <div className="size-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
        <span>Inventory Lab</span>
      </div>
      <div className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex dark:text-neutral-300">
        <a href="#features" className="transition hover:text-neutral-900 dark:hover:text-white">Features</a>
        <a href="#workflows" className="transition hover:text-neutral-900 dark:hover:text-white">Workflows</a>
        <a href="#showcase" className="transition hover:text-neutral-900 dark:hover:text-white">Showcase</a>
      </div>
      <button
        type="button"
        onClick={onLoginClick}
        className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white shadow hover:-translate-y-0.5 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
      >
        Login
      </button>
    </nav>
  );
};

export default HeroSectionOne;
