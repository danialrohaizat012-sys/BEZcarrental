import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p,
});

export const IconSeat = (p: P) => (<svg {...base(p)}><path d="M7 4h4a2 2 0 0 1 2 2v7h4a2 2 0 0 1 2 2v3H9a2 2 0 0 1-2-2z" /><path d="M7 20h12" /></svg>);
export const IconBag = (p: P) => (<svg {...base(p)}><rect x="5" y="7" width="14" height="13" rx="2" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 11v5M15 11v5" /></svg>);
export const IconGear = (p: P) => (<svg {...base(p)}><circle cx="6" cy="6" r="2" /><circle cx="12" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="12" cy="18" r="2" /><path d="M6 8v8M12 8v8M18 8v4H6" /></svg>);
export const IconFuel = (p: P) => (<svg {...base(p)}><path d="M4 20V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14M3 20h12M14 10h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V9l-3-3" /><path d="M7 8h4" /></svg>);
export const IconCheck = (p: P) => (<svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>);
export const IconCalendar = (p: P) => (<svg {...base(p)}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>);
export const IconClock = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>);
export const IconPin = (p: P) => (<svg {...base(p)}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" /><circle cx="12" cy="10" r="2.3" /></svg>);
export const IconShield = (p: P) => (<svg {...base(p)}><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z" /><path d="m9 12 2 2 4-4" /></svg>);
export const IconTag = (p: P) => (<svg {...base(p)}><path d="M3.5 12.5V5a1.5 1.5 0 0 1 1.5-1.5h7.5L21 12l-8.5 8.5z" /><circle cx="8" cy="8" r="1.3" /></svg>);
export const IconChat = (p: P) => (<svg {...base(p)}><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" /></svg>);
export const IconArrow = (p: P) => (<svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IconChevron = (p: P) => (<svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>);
export const IconChevronLeft = (p: P) => (<svg {...base(p)}><path d="m15 6-6 6 6 6" /></svg>);
export const IconMenu = (p: P) => (<svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const IconX = (p: P) => (<svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IconSparkle = (p: P) => (<svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></svg>);
export const IconInfo = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></svg>);
export const IconAlert = (p: P) => (<svg {...base(p)}><path d="M12 4 2.5 20h19z" /><path d="M12 10v4M12 17h.01" /></svg>);
export const IconGlobe = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5z" /></svg>);

/** WhatsApp glyph (filled) */
export const IconWhatsApp = (p: P) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2 22l5.36-1.4a9.8 9.8 0 0 0 4.68 1.2h.01c5.43 0 9.85-4.42 9.85-9.86A9.8 9.8 0 0 0 12.04 2zm5.77 13.97c-.24.68-1.42 1.32-1.96 1.37-.5.05-1.13.07-1.83-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.18-4.94-4.37-.15-.2-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.26-.29.58-.36.77-.36h.55c.18 0 .42-.07.66.5.24.59.83 2.03.9 2.18.08.15.13.32.03.51-.1.2-.15.32-.3.49-.14.17-.3.38-.44.51-.15.15-.3.3-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.3 2.36 1.45.29.15.46.12.63-.07.17-.2.73-.85.92-1.14.2-.3.39-.24.66-.15.27.1 1.7.8 2 .95.29.15.48.22.56.34.07.12.07.7-.17 1.38z" />
  </svg>
);
