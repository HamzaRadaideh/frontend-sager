// components/counters/counterStyles.ts
import type { CSSProperties } from 'react';


export const counterStyles: { pill: CSSProperties; badge: CSSProperties } = {
    pill: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "#F3F4F6",
        color: "#111827",
        borderRadius: 12,
        padding: "6px 10px",
        border: "1px solid rgba(0,0,0,0.12)",
        boxShadow: "0 2px 6px rgba(0,0,0,.18)",
        userSelect: "none",
    },

    badge: {
        minWidth: 22,
        height: 22,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 12,
        background: "#111827",
        color: "#fff",
        lineHeight: "22px",
    },
};
