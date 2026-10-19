import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 * Ensures every route navigation resets window scroll to the top (0, 0),
 * matching standard multi-page browser behavior, unless an explicit
 * anchor hash (e.g. #reviews) is present in the URL.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If navigating to a specific hash (e.g. #reviews), let the target element handle it
    if (hash || search.includes("writeReview=true")) {
      return;
    }

    // Scroll to the top of the page immediately upon route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname, search, hash]);

  return null;
}

export default ScrollToTop;
