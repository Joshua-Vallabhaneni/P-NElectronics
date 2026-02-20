"use client";

import { motion } from "motion/react";
import {
    Shield,
    Recycle,
    Globe,
    CheckCircle,
    AlertTriangle,
    Database,
    Trash2,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function ServicesPage() {
    return (
        <div className="bg-slate-950 pt-14">
            {/* Hero — left-aligned, editorial */}
            <section className="mx-auto max-w-6xl px-6 pt-16 pb-14">
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="text-xs uppercase tracking-widest text-emerald-400 mb-4"
                >
                    Our Services
                </motion.p>
                <motion.h1
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight max-w-2xl"
                >
                    Professional ITAD, built on three pillars
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-4 text-base text-neutral-400 max-w-xl leading-relaxed"
                >
                    Secure tech recycling is no longer just a &quot;cleanup&quot; task — it
                    is a critical security and sustainability strategy.
                </motion.p>
            </section>

            <div className="mx-auto max-w-6xl px-6">
                <div className="h-px bg-neutral-800" />
            </div>

            {/* Why it matters */}
            <section className="mx-auto max-w-6xl px-6 py-16">
                <div className="md:flex md:gap-16">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="md:w-1/3 mb-8 md:mb-0"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                            <p className="text-xs uppercase tracking-widest text-red-400">
                                Hidden risks
                            </p>
                        </div>
                        <h2 className="text-xl font-bold text-white leading-snug">
                            Why proper ITAD matters
                        </h2>
                        <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
                            Most organizations believe &quot;wiping&quot; a drive or sending
                            it to a general recycler is sufficient. These methods often
                            leave businesses vulnerable.
                        </p>
                    </motion.div>

                    <div className="md:w-2/3 space-y-0 divide-y divide-neutral-800/60">
                        {[
                            {
                                icon: Database,
                                title: "The Data Recovery Reality",
                                text: "Standard formatting does not remove data — it merely hides it. Without NIST 800-88 compliant sanitization, sensitive information remains recoverable.",
                                color: "text-red-400",
                            },
                            {
                                icon: Trash2,
                                title: "The E-Waste Crisis",
                                text: "Electronic waste is the fastest-growing waste stream globally. Many devices contain lead, mercury, and cadmium. Improper disposal can lead to hefty EPA fines and brand damage.",
                                color: "text-orange-400",
                            },
                        ].map((risk, i) => (
                            <motion.div
                                key={risk.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className="flex gap-4 py-6 first:pt-0"
                            >
                                <risk.icon
                                    className={`h-5 w-5 ${risk.color} mt-0.5 shrink-0`}
                                />
                                <div>
                                    <h3 className="text-sm font-semibold text-white mb-1">
                                        {risk.title}
                                    </h3>
                                    <p className="text-sm text-neutral-400 leading-relaxed">
                                        {risk.text}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-6">
                <div className="h-px bg-neutral-800" />
            </div>

            {/* Three Pillars — deep dive */}
            <section className="mx-auto max-w-6xl px-6 py-16">
                <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-2xl font-bold text-white mb-12"
                >
                    Complete ITAD Services
                </motion.h2>

                <div className="space-y-16">
                    {[
                        {
                            icon: Shield,
                            num: "01",
                            title: "Secure Data Destruction",
                            color: "text-blue-400",
                            description:
                                "We don't just delete files; we eliminate them. Using NIST 800-88 standards, we provide on-site and off-site shredding and software-based wiping, backed by a formal Certificate of Destruction.",
                            features: [
                                {
                                    title: "NIST 800-88 Wiping",
                                    text: "Logical techniques used to sanitize data for devices intended for reuse.",
                                },
                                {
                                    title: "Physical Shredding",
                                    text: "On-site or off-site shredding that reduces media to unreadable fragments.",
                                },
                                {
                                    title: "Chain of Custody",
                                    text: "Every asset tracked via serial number from pickup to final destruction.",
                                },
                                {
                                    title: "Certificate of Destruction",
                                    text: "Complete documentation proving your data has been securely destroyed.",
                                },
                            ],
                            compliance: ["GDPR", "HIPAA", "FACTA"],
                        },
                        {
                            icon: Recycle,
                            num: "02",
                            title: "Circular Recycling & Scrap Recovery",
                            color: "text-emerald-400",
                            description:
                                'For equipment no longer functional, we prevent landfill contributions through a "zero-waste" policy, recovering valuable materials and reducing environmental impact.',
                            features: [
                                {
                                    title: "Material Harvesting",
                                    text: "We dismantle units to recover precious metals (gold, copper, silver) and plastics.",
                                },
                                {
                                    title: "Industrial Reuse",
                                    text: "Materials returned to the manufacturing supply chain, reducing virgin mining.",
                                },
                                {
                                    title: "Zero-Landfill Policy",
                                    text: "Every component is either reused, recycled, or responsibly processed.",
                                },
                                {
                                    title: "Lower Carbon Footprint",
                                    text: "Reduces the need for virgin mining and lowers the carbon footprint of new technology.",
                                },
                            ],
                            compliance: ["EPA", "Zero-Landfill"],
                        },
                        {
                            icon: Globe,
                            num: "03",
                            title: "Global Resale & Social Impact",
                            color: "text-purple-400",
                            description:
                                "We believe yesterday's office tech can be tomorrow's classroom tool. By refurbishing and exporting units to developing regions, we help bridge the digital divide.",
                            features: [
                                {
                                    title: "Refurbishment",
                                    text: '"Good lots" are cleaned, repaired, and updated with diagnostic checks.',
                                },
                                {
                                    title: "Bridging the Digital Divide",
                                    text: "Refurbished units sold to developing regions to support schools and communities.",
                                },
                                {
                                    title: "ESG Metrics",
                                    text: "Tangible Social Responsibility metrics for sustainability reporting.",
                                },
                                {
                                    title: "Carbon Offset Data",
                                    text: "Track the environmental impact of choosing refurbishment over new manufacturing.",
                                },
                            ],
                            compliance: ["ESG Reporting", "Social Impact"],
                        },
                    ].map((service, i) => (
                        <motion.div
                            key={service.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.4 }}
                            className="md:flex md:gap-12"
                        >
                            {/* Left — title area */}
                            <div className="md:w-1/3 mb-6 md:mb-0">
                                <span className="text-xs font-mono text-neutral-600">
                                    {service.num}
                                </span>
                                <div className="flex items-center gap-2.5 mt-2 mb-3">
                                    <service.icon className={`h-5 w-5 ${service.color}`} />
                                    <h3 className="text-lg font-semibold text-white">
                                        {service.title}
                                    </h3>
                                </div>
                                <p className="text-sm text-neutral-400 leading-relaxed">
                                    {service.description}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-4">
                                    {service.compliance.map((c) => (
                                        <span
                                            key={c}
                                            className="text-xs text-neutral-500 border border-neutral-800 rounded px-2 py-0.5"
                                        >
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Right — features list */}
                            <div className="md:w-2/3 space-y-0 divide-y divide-neutral-800/40">
                                {service.features.map((f, j) => (
                                    <div key={f.title} className="flex gap-3 py-4 first:pt-0">
                                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500/70" />
                                        <div>
                                            <span className="text-sm font-medium text-white">
                                                {f.title}
                                            </span>
                                            <p className="text-xs text-neutral-500 leading-relaxed mt-0.5">
                                                {f.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-6">
                <div className="h-px bg-neutral-800" />
            </div>

            {/* Process */}
            <section className="mx-auto max-w-6xl px-6 py-16">
                <motion.h2
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-2xl font-bold text-white mb-10"
                >
                    How it works
                </motion.h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                    {[
                        {
                            n: "01",
                            title: "Contact",
                            text: "Reach out for a free asset audit and quote.",
                        },
                        {
                            n: "02",
                            title: "Pickup",
                            text: "We collect your equipment with secure chain of custody.",
                        },
                        {
                            n: "03",
                            title: "Process",
                            text: "Data destruction, recycling, or refurbishment — your choice.",
                        },
                        {
                            n: "04",
                            title: "Report",
                            text: "Receive certificates, serial number logs, and ESG impact data.",
                        },
                    ].map((step, i) => (
                        <motion.div
                            key={step.n}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: i * 0.06 }}
                        >
                            <span className="text-2xl font-bold text-emerald-500/30">
                                {step.n}
                            </span>
                            <h3 className="mt-1 text-sm font-semibold text-white">
                                {step.title}
                            </h3>
                            <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                                {step.text}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="border-t border-neutral-800">
                <div className="mx-auto max-w-6xl px-6 py-16">
                    <div className="md:flex md:items-end md:justify-between">
                        <div className="max-w-lg mb-6 md:mb-0">
                            <h2 className="text-2xl font-bold text-white leading-snug">
                                Ready to get started?
                            </h2>
                            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
                                Get a free asset evaluation and see how much your old
                                equipment is worth.
                            </p>
                        </div>
                        <Link
                            href="/sell"
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                        >
                            Get a Free Quote
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
