"use client";

import { useEffect, useState } from "react";

/**
 * Detects on-screen keyboard height via visualViewport API.
 * Returns keyboardHeight (px) — 0 when keyboard is closed.
 */
export function useKeyboardOffset() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // keyboard height = window height - visual viewport height (- any top offset)
      const kh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardHeight(kh);
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return keyboardHeight;
}

/**
 * Scrolls the focused input into view smoothly.
 * Call this in onFocus of any input that might be covered by keyboard.
 */
export function scrollInputIntoView(el: HTMLElement | null) {
  if (!el) return;
  setTimeout(() => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 300); // wait for keyboard animation
}
