"use client";

import { motion } from "motion/react";
import Link from "next/link";

export function HeroSection({
    badge,
    title,
    subtitle,
    actions,
}: {
    badge?: string;
    title: string;
    subtitle: string;
    actions?: { label: string; href: string; primary?: boolean }[];
}) {
    const words = title.split(" ");

    return (
        <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center">
            {/* Decorative border lines */}
            <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-800/80">
                <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-emerald-500 to-transparent" />
            </div>
            <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-800/80">
                <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-emerald-500 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-800/80">
                <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
            </div>

            <div className="px-4 py-8 md:py-14">
                {/* Badge */}
                {badge && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="flex justify-center mb-4"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-emerald-400">
                            {badge}
                        </span>
                    </motion.div>
                )}

                {/* Animated Headline */}
                <h1 className="relative z-10 mx-auto max-w-4xl text-center text-3xl font-bold text-slate-200 md:text-5xl lg:text-7xl">
                    {words.map((word, index) => (
                        <motion.span
                            key={index}
                            initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.08,
                                ease: "easeInOut",
                            }}
                            className={`mr-2 inline-block ${["Secured.", "Erased.", "Capital.", "ITAD"].some((w) =>
                                word.includes(w)
                            )
                                ? "bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent"
                                : ""
                                }`}
                        >
                            {word}
                        </motion.span>
                    ))}
                </h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                    className="relative z-10 mx-auto max-w-xl py-4 text-center text-base font-normal text-neutral-400 md:text-lg"
                >
                    {subtitle}
                </motion.p>

                {/* Action Buttons */}
                {actions && actions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.8 }}
                        className="relative z-10 mt-4 flex flex-wrap items-center justify-center gap-3"
                    >
                        {actions.map((action) => (
                            <Link key={action.label} href={action.href}>
                                <button
                                    className={`w-48 transform rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 ${action.primary
                                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                        : "border border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800"
                                        }`}
                                >
                                    {action.label}
                                </button>
                            </Link>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
