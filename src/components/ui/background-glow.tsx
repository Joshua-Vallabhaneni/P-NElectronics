"use client";

import { cn } from "@/lib/utils";

export function BackgroundGlow() {
    return (
        <div className="fixed inset-0 z-[-1] bg-[#0e0e0e] overflow-hidden pointer-events-none">
            {/* Primary Emerald Glow (Top Left) - Increased opacity and size */}
            <div
                className="absolute -top-[20%] -left-[10%] w-[100%] h-[100%] rounded-full blur-[140px] opacity-[0.14]"
                style={{
                    background: "radial-gradient(circle at center, #10b981 0%, transparent 70%)",
                }}
            />

            {/* Cyan/Teal Accent (Bottom Right) - More vibrant */}
            <div
                className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] rounded-full blur-[120px] opacity-[0.12]"
                style={{
                    background: "radial-gradient(circle at center, #06b6d4 0%, transparent 70%)",
                }}
            />

            {/* Deep Emerald Accent (Middle Left) - Subtle but adds depth */}
            <div
                className="absolute top-[40%] -left-[20%] w-[60%] h-[60%] rounded-full blur-[130px] opacity-[0.08]"
                style={{
                    background: "radial-gradient(circle at center, #059669 0%, transparent 70%)",
                }}
            />

            {/* Center Soft Glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[150px] opacity-[0.05]"
                style={{
                    background: "radial-gradient(circle at center, #10b981 0%, transparent 80%)",
                }}
            />
        </div>
    );
}
