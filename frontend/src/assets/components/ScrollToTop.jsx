import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Hash targets can mount asynchronously (data-driven sections, product details).
// Retry a few times before giving up, then let the user scroll manually.
const HASH_RETRY_DELAYS = [0, 150, 400, 800, 1400];

/**
 * ScrollToTop Component
 * Ensures every route navigation resets window scroll to the top (0, 0),
 * unless the URL carries an anchor hash (e.g. #reviews, #faq). In that case
 * the matching element is scrolled into view once it exists.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      // The review flow manages its own scroll position.
      if (search.includes("writeReview=true")) return undefined;

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
      return undefined;
    }

    const targetId = decodeURIComponent(hash.slice(1));
    let cancelled = false;
    const timers = [];

    const tryScroll = (index) => {
      if (cancelled) return;

      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      const next = index + 1;
      if (next < HASH_RETRY_DELAYS.length) {
        timers.push(
          window.setTimeout(
            () => tryScroll(next),
            HASH_RETRY_DELAYS[next] - HASH_RETRY_DELAYS[index],
          ),
        );
      }
    };

    tryScroll(0);

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pathname, search, hash]);

  return null;
}

export default ScrollToTop;
