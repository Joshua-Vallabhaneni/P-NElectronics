"use client";

import { motion } from "motion/react";
import {
    Shield,
    Recycle,
    Globe,
    Check,
    CheckCircle,
    AlertTriangle,
    Database,
    Trash2,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ServicesPage() {
    return (
        <div className="min-h-screen pt-20 pb-4 selection:bg-emerald-500/30">
            {/* ── Section 1: Hero ── */}
            <section className="mx-auto max-w-[1200px] px-6 pt-24 pb-20">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
                    className="max-w-3xl"
                >
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-500/5 border border-emerald-500/10 mb-8">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/80 font-bold">Standard Infrastructure Protocol</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
                        The Infrastructure of Trust.
                    </h1>
                    <p className="text-xl text-zinc-300 leading-relaxed font-normal max-w-lg">
                        Beyond simple recycling — we build NIST-compliant systems for data destruction and hardware lifecycle management.
                    </p>
                </motion.div>
            </section>

            {/* ── Section 2: Why ITAD (Minimalist) ── */}
            <section className="mx-auto max-w-[1200px] px-6 py-16 border-t border-white/[0.03]">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    <div className="md:col-span-4">
                        <h2 className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold mb-4">Critical Vectors</h2>
                        <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">
                            The cost of <br />non-compliance.
                        </h3>
                    </div>
                    <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/20 transition-all duration-300 group">
                            <div className="text-emerald-400 font-bold text-xs tracking-widest uppercase mb-4 opacity-50 group-hover:opacity-100 transition-opacity">NIST 800-88</div>
                            <h4 className="text-xl font-bold text-white mb-4">
                                Data Persistence Risk
                            </h4>
                            <p className="text-base text-zinc-400 leading-relaxed">
                                Standard sanitization is insufficient. Bits of sensitive information remain recoverable even after formatting. NIST 800-88 compliance is the only barrier.
                            </p>
                        </div>
                        <div className="p-8 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/20 transition-all duration-300 group">
                            <div className="text-emerald-400 font-bold text-xs tracking-widest uppercase mb-4 opacity-50 group-hover:opacity-100 transition-opacity">EPA LIABILITY</div>
                            <h4 className="text-xl font-bold text-white mb-4">
                                Environmental Liability
                            </h4>
                            <p className="text-base text-zinc-400 leading-relaxed">
                                Improper disposal isn't just a PR risk — it's a legal one. Toxic heavy metals require specialized harvesting to mitigate multi-million dollar liabilities.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 3: The Three Pillars (Main Blocks) ── */}
            <section className="mx-auto max-w-[1200px] px-6 pt-24 pb-32 space-y-32">
                {[
                    {
                        icon: Shield,
                        n: "01",
                        title: "Secure Data Destruction",
                        sub: "NIST 800-88 COMPLIANT",
                        description: "Full-spectrum data remediation from physical shredding to verified logical sanitization.",
                        tags: ["GDPR", "HIPAA", "FACTA", "NIST"],
                        features: [
                            { title: "Mobile Shredding", description: "Secure on-site physical destruction of storage media and hardware." },
                            { title: "Logical Sanitization", description: "NIST 800-88 compliant software-based data erasure protocols." },
                            { title: "Audit Trail", description: "Complete chain-of-custody documentation for every retired asset." },
                            { title: "Certifications", description: "Official certificates of destruction for your compliance records." }
                        ],
                        accent: "emerald-500"
                    },
                    {
                        icon: Recycle,
                        n: "02",
                        title: "Circular Recycling",
                        sub: "ZERO-LANDFILL PROTOCOL",
                        description: "Recovering raw materials for reuse in the industrial supply chain, mitigating environmental impact.",
                        tags: ["EPA", "R2V3", "RIOS"],
                        features: [
                            { title: "Metal Harvesting", description: "Industrial-scale recovery of gold, silver, and rare earth metals." },
                            { title: "Material Sorting", description: "Precision separation of high-grade plastics and glass components." },
                            { title: "EPA Compliance", description: "Fully verified downstream processing of hazardous materials." },
                            { title: "ESG Reporting", description: "Detailed metrics on diverted waste and carbon footprint reduction." }
                        ],
                        accent: "emerald-500"
                    },
                    {
                        icon: Globe,
                        n: "03",
                        title: "Global Resale",
                        sub: "LIFECYCLE EXTENSION",
                        description: "Extending the utility of decommissioned hardware through professional grading and secondary market resale.",
                        tags: ["ESG", "CIRCULAR", "REFURB"],
                        features: [
                            { title: "System Testing", description: "Multi-point diagnostic verification of all resale-ready hardware." },
                            { title: "Logistics Network", description: "Secure global distribution to verified secondary market buyers." },
                            { title: "Certified Refurb", description: "Professional restoration to original manufacturer specifications." },
                            { title: "Value Recovery", description: "Maximum ROI through strategic market placement of assets." }
                        ],
                        accent: "emerald-500"
                    }
                ].map((pillar, i) => (
                    <div key={pillar.title} className="relative group">
                        <div className="flex flex-col md:flex-row gap-20">
                            {/* Left side: Context */}
                            <div className="md:w-1/2">
                                <div className="sticky top-32">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="font-mono text-sm text-white/20">{pillar.n}</span>
                                        <div className="h-px w-8 bg-white/10" />
                                        <span className="font-mono text-[10px] tracking-[0.3em] text-emerald-400/70 font-bold uppercase">{pillar.sub}</span>
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-6 leading-tight">
                                        {pillar.title}
                                    </h3>
                                    <p className="text-lg text-zinc-300 leading-relaxed mb-8 max-w-md">
                                        {pillar.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {pillar.tags.map(tag => (
                                            <span key={tag} className="font-mono text-[9px] px-2.5 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-white/40 tracking-widest uppercase">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="md:w-1/2 grid grid-cols-1 gap-4">
                                {pillar.features.map((feature, j) => (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: j * 0.1 }}
                                        className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all duration-300 group/card relative overflow-hidden"
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/0 group-hover/card:bg-emerald-500/50 transition-all duration-300" />
                                        <div className="relative z-10">
                                            <h4 className="text-white font-bold mb-1 group-hover:text-emerald-400 transition-colors uppercase tracking-wider text-sm">{feature.title}</h4>
                                            <p className="text-sm text-zinc-500 leading-relaxed group-hover/card:text-zinc-400 transition-colors">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* ── Section 4: How it works (Documentation Style) ── */}
            <section className="mx-auto max-w-[1200px] px-6 pt-24 pb-8 border-t border-white/[0.03]">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <h2 className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold mb-4">Operations</h2>
                        <h3 className="text-3xl font-bold text-white tracking-tight leading-tight">
                            Protocol execution.
                        </h3>
                    </div>
                </div>

                <div className="relative mt-20">
                    {/* Connecting Line (Desktop Only) */}
                    <div className="absolute top-[18px] left-0 right-0 h-[1px] bg-emerald-500/10 hidden md:block" />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
                        {[
                            { n: "01", title: "Assessment", text: "Physical and technical audit of whole inventory sets." },
                            { n: "02", title: "Logistics", text: "Secure chain-of-custody pickup with sealed transport." },
                            { n: "03", title: "Remediation", text: "Destruction, recycling, or software-level wipes." },
                            { n: "04", title: "Certification", text: "Full ESG reporting and data destruction logs." }
                        ].map((step, i) => (
                            <div key={step.n} className="flex flex-col gap-8 group relative">
                                {/* Large Watermark Number */}
                                <div className="absolute -top-12 -left-4 text-7xl font-bold text-white/[0.03] select-none group-hover:text-white/[0.05] transition-colors pointer-events-none">
                                    {step.n}
                                </div>

                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-9 h-9 rounded-full bg-[#0e0e0e] border border-emerald-500/30 flex items-center justify-center group-hover:border-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                    <div className="md:hidden h-px flex-1 bg-emerald-500/10" />
                                </div>

                                <div className="relative z-10">
                                    <h4 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{step.title}</h4>
                                    <p className="text-base text-zinc-400 leading-relaxed font-normal">
                                        {step.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Section 5: CTA ── */}
            <section className="mx-auto max-w-[1200px] px-6 pt-8 pb-4">
                <div className="p-16 rounded-3xl bg-emerald-500/[0.02] border border-white/[0.05] relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-500">
                    {/* Dot Grid Background */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                    {/* Radial Glow */}
                    <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

                    <div className="absolute top-0 right-0 p-12 text-white/[0.03] font-bold text-9xl select-none group-hover:text-white/[0.05] transition-all duration-700 pointer-events-none">
                        ITAD
                    </div>
                    <div className="relative z-10 lg:flex items-center justify-between gap-12">
                        <div className="max-w-md">
                            <h3 className="text-4xl font-bold text-white tracking-tight mb-6">
                                Ready for deployment?
                            </h3>
                            <p className="text-lg text-zinc-300 leading-relaxed mb-10">
                                Connect with our logistics team to schedule your first inventory assessment. NIST-compliant, enterprise-ready.
                            </p>
                        </div>
                        <Link href="/sell">
                            <Button className="h-14 rounded-xl bg-white text-black hover:bg-emerald-50 px-12 text-sm font-bold uppercase tracking-widest transition-all hover:scale-[1.05] active:scale-[0.95] shadow-xl">
                                Sell To Us
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
