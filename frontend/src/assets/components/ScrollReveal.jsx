import { useEffect, useRef, useState } from "react";

/**
 * ScrollReveal Component
 * Uses IntersectionObserver to trigger smooth, hardware-accelerated fade-in
 * and subtle upward translation as the user scrolls through the page.
 */
export function ScrollReveal({
  children,
  className = "",
  threshold = 0.1,
  delay = 0,
  duration = 650,
  direction = "up", // "up" | "none"
  distance = 20, // pixels to translate
}) {
  const elementRef = useRef(null);
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
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px", // Trigger slightly before reaching the viewport bottom
      }
    );

    observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
      observer.disconnect();
    };
  }, [threshold]);

  const transformStyle = isVisible
    ? "none"
    : direction === "up"
    ? `translateY(${distance}px)`
    : "none";

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: transformStyle,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
