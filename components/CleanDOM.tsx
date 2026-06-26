"use client";

import { useEffect } from "react";

export default function CleanDOM() {
  useEffect(() => {
    // Remove all bis_skin_checked attributes injected by extensions
    document.querySelectorAll("[bis_skin_checked]").forEach(el => {
      el.removeAttribute("bis_skin_checked");
    });

    // Optional: keep watching in case extension injects again
    const observer = new MutationObserver(() => {
      document.querySelectorAll("[bis_skin_checked]").forEach(el => {
        el.removeAttribute("bis_skin_checked");
      });
    });

    observer.observe(document.body, { attributes: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
