"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate, clamp } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  formatter: (value: number) => string;
}

export function AnimatedNumber({ value, formatter }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const prevValue = useRef(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = getDuration(value);

    console.log(
      "Animating from",
      prevValue.current,
      "to",
      value,
      "over",
      duration,
      "seconds"
    );

    const unsubscribe = motionValue.on("change", (latest) => {
      setDisplay(latest);
    });

    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
    });

    prevValue.current = value;

    return () => {
      unsubscribe();
      controls.stop();
    };
  }, [value, motionValue]);

  return <motion.span>{formatter(display).toUpperCase()}</motion.span>;
}

function getDuration(value: number) {
  const MIN = 2.4;
  const MAX = 4.2;

  if (Math.abs(value) <= 1) {
    const scaled = value * 100; 
    const BASE = 2.0;
    return Math.min(MAX, Math.max(MIN, BASE + scaled * 0.02));
  } else {
    const scaled = Math.log10(Math.abs(value) + 1);
    const BASE = 1.8;
    return Math.min(MAX, Math.max(MIN, BASE + scaled));
  }
}
