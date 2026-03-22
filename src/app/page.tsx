"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Shield, Recycle, Globe, Check } from "lucide-react";
import Link from "next/link";
import { GradientWave } from "@/components/ui/gradient-wave";
import { Button } from "@/components/ui/button";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { isAdmin, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.replace("/admin");
    }
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    document.documentElement.classList.add("snap-y", "snap-mandatory", "scroll-smooth");
    return () => {
      document.documentElement.classList.remove("snap-y", "snap-mandatory", "scroll-smooth");
    };
  }, []);
  return (
    <div>
      {/* ── Section 1: Hero ── */}
      <section className="h-screen w-full flex items-center justify-center relative snap-start shrink-0 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <GradientWave
            colors={["#031f19", "#064e3b", "#0d9488", "#065f46", "#052e20"]}
            shadowPower={5}
            darkenTop={true}
            noiseFrequency={[0.00012, 0.00018]}
            deform={{ incline: 0.15, noiseAmp: 80, noiseFlow: 1.5 }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-extrabold text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tighter"
          >
            Your Data Secured.
            <br />
            <span className="text-emerald-400">Your E-Waste Erased.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="mt-8 text-white/70 max-w-lg text-base md:text-lg leading-relaxed font-medium"
          >
            From NIST-compliant data destruction to global tech refurbishment
            — we turn old hardware into a force for good.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="flex items-center gap-4 mt-10 flex-wrap justify-center"
          >
            <Link href="/services">
              <Button
                variant="secondary"
                className="h-12 rounded-full cursor-pointer px-10 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20 font-bold text-sm uppercase tracking-widest transition-all hover:scale-105"
              >
                Our Services
              </Button>
            </Link>
            <Link href="/inventory">
              <Button
                variant="secondary"
                className="h-12 rounded-full cursor-pointer px-10 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20 font-bold text-sm uppercase tracking-widest transition-all hover:scale-105"
              >
                Browse Inventory
              </Button>
            </Link>
            <Link href="/sell">
              <Button
                variant="secondary"
                className="h-12 rounded-full cursor-pointer px-10 bg-emerald-500 text-black hover:bg-emerald-400 font-bold text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Get a Quote
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">Scroll to Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-t from-emerald-500/50 to-transparent" />
        </motion.div>
      </section>

      {/* ── Section 2: Three Pillars ── */}
      <section className="h-screen w-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="inline-block px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] font-black tracking-[0.4em] uppercase mb-4">
              Infrastructure Protocol
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
              Strategic Asset Lifecycle Management
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {[
              {
                icon: Shield,
                title: "Secure Data Destruction",
                description: "NIST 800-88 compliant sanitization and physical shredding with full chain-of-custody tracking.",
                iconColor: "text-blue-400",
                className: "md:col-span-2",
              },
              {
                icon: Recycle,
                title: "Circular Recycling",
                description: "Zero-landfill commitment with precious metal harvesting and EPA-compliant processing.",
                iconColor: "text-emerald-400",
                className: "md:row-span-2",
              },
              {
                icon: Globe,
                title: "Global Refurbishment",
                description: "Extending hardware lifecycles through professional grading and resale to emerging markets.",
                iconColor: "text-purple-400",
                className: "md:col-span-2",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
                className={item.className}
              >
                <CardSpotlight className="h-full rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-md p-10 flex flex-col group hover:bg-white/[0.04] transition-all duration-500">
                  <div className="relative z-20 flex flex-col h-full">
                    <div className={`p-4 rounded-2xl bg-white/5 w-fit mb-8 border border-white/10 ${item.iconColor} group-hover:scale-110 transition-transform duration-500`}>
                      <item.icon className="w-8 h-8" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-sm md:text-base text-neutral-400 mb-8 leading-relaxed max-w-md flex-1">
                      {item.description}
                    </p>
                  </div>
                </CardSpotlight>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer Snap Section ── */}
      <section className="snap-start shrink-0">
        <div className="h-0" /> {/* Transparent anchor for snap */}
      </section>
    </div>
  );
}
