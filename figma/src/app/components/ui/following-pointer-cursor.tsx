import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

export function FollowingPointerCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsMoving(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsMoving(false);
      }, 100);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const cursorMarkup = (
    <>
      {/* Hide default cursor */}
      <style>{`
        body {
          cursor: none !important;
        }
        a, button, input, select, textarea, [role="button"] {
          cursor: none !important;
        }
      `}</style>

      {/* Main cursor dot */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[10000] h-4 w-4 translate-x-[-50%] translate-y-[-50%] rounded-full bg-violet-500 mix-blend-difference shadow-lg shadow-violet-500/50"
        animate={{ x: mousePosition.x, y: mousePosition.y }}
        transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.5 }}
      />

      {/* Outer ring */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[10000] h-8 w-8 translate-x-[-50%] translate-y-[-50%] rounded-full border-2 border-violet-400 mix-blend-difference"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
          scale: isMoving ? 1.2 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.7 }}
      />

      {/* Glow effect */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[10000] h-12 w-12 translate-x-[-50%] translate-y-[-50%] rounded-full border border-violet-300/50"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
          opacity: isMoving ? 0.8 : 0.25,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      />
    </>
  );

  if (!isMounted) {
    return null;
  }

  return createPortal(cursorMarkup, document.body);
}
