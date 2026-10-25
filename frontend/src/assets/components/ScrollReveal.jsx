import { useEffect, useRef, useState } from "react";

/**
 * ScrollReveal Component
 * Uses IntersectionObserver to trigger smooth, hardware-accelerated fade-in
 * and subtle upward translation as the user scrolls through the page.
 * When `revealOnExit` is set, the element also fades back out once it leaves
 * the viewport and fades in again on re-entry.
 */
export function ScrollReveal({
  children,
  className = "",
  threshold = 0.1,
  delay = 0,
  duration = 400,
  direction = "up", // "up" | "none"
  distance = 16, // pixels to translate (16px per clean-ui motion tokens)
  revealOnExit = false, // fade back out when the element leaves the viewport
  exitDuration = 600, // slower, deeper exit so it reads below the sticky header
  exitDistance = 40,
  style = {},
}) {
  const elementRef = useRef(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [isVisible, setIsVisible] = useState(
    () => typeof window === "undefined" || !("IntersectionObserver" in window)
  );

  useEffect(() => {
    const node = elementRef.current;
    if (!node || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (revealOnExit) {
          if (entry.isIntersecting) {
            setHasEntered(true);
          }
          setIsVisible(entry.isIntersecting);
          return;
        }
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        // Reveal-on-exit keeps observing and only counts the middle band of the
        // viewport, so tall and short sections both enter and leave predictably.
        threshold: revealOnExit ? 0 : threshold,
        rootMargin: revealOnExit ? "-20% 0px -20% 0px" : "0px 0px -40px 0px",
      }
    );

    observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
      observer.disconnect();
    };
  }, [threshold, revealOnExit]);

  // Keep the shallow first entrance, then use the slower/deeper exit on the way
  // out. The transition values read from the state we are moving INTO, so the
  // hidden state carries the exit timing and the visible state the entrance.
  const isExiting = revealOnExit && !isVisible;
  const currentDistance = isExiting || hasEntered ? exitDistance : distance;
  const currentDuration = isExiting ? exitDuration : duration;
  const currentDelay = isExiting ? 0 : delay;

  const transformStyle = isVisible
    ? "none"
    : direction === "up"
    ? `translateY(${currentDistance}px)`
    : "none";

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: transformStyle,
        transition: `opacity ${currentDuration}ms cubic-bezier(0.22, 0.61, 0.36, 1) ${currentDelay}ms, transform ${currentDuration}ms cubic-bezier(0.22, 0.61, 0.36, 1) ${currentDelay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
