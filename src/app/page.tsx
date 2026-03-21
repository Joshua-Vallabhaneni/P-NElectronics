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
  return (
    <div>
      {/* ── Hero — 75vh, not full-screen ── */}
      <section className="min-h-[75vh] w-full flex items-center justify-center relative pt-[clamp(6rem,10vh,8rem)] pb-[clamp(4rem,8vh,6rem)]">
        <GradientWave
          colors={["#031f19", "#064e3b", "#0d9488", "#065f46", "#052e20"]}
          shadowPower={5}
          darkenTop={true}
          noiseFrequency={[0.00012, 0.00018]}
          deform={{ incline: 0.15, noiseAmp: 80, noiseFlow: 1.5 }}
        />

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-extrabold text-4xl md:text-6xl lg:text-7xl text-white leading-[1.05] tracking-tight"
          >
            Your Data Secured.
            <br />
            Your E-Waste Erased.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.45 }}
            className="mt-5 text-white/70 max-w-md text-sm md:text-base leading-relaxed"
          >
            From NIST-compliant data destruction to global tech refurbishment
            — we turn old hardware into a force for good.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="flex items-center gap-3 mt-8 flex-wrap justify-center"
          >
            <Link href="/services">
              <Button
                variant="secondary"
                className="h-11 rounded-full cursor-pointer px-8 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 font-medium text-sm"
              >
                Our Services
              </Button>
            </Link>
            <Link href="/inventory">
              <Button
                variant="secondary"
                className="h-11 rounded-full cursor-pointer px-8 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 font-medium text-sm"
              >
                Browse Inventory
              </Button>
            </Link>
            <Link href="/sell">
              <Button
                variant="secondary"
                className="h-11 rounded-full cursor-pointer px-8 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border border-white/20 font-medium text-sm"
              >
                Get a Quote
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Trust signals — anchored to bottom of hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/10"
        >
          <div className="mx-auto max-w-5xl px-6 grid grid-cols-4 py-3">
            {[
              "NIST 800-88 Certified",
              "Zero Landfill",
              "100% Audit Trail",
              "24–48hr Quotes",
            ].map((item) => (
              <p key={item} className="text-[11px] text-white font-medium tracking-wide text-center">
                {item}
              </p>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Services — leaner cards ── */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <p className="text-emerald-400 text-xs font-medium tracking-widest uppercase mb-2">
              What We Do
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Three pillars of responsible IT disposal
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Secure Data Destruction",
                bullets: [
                  "NIST 800-88 certified wiping",
                  "Physical shredding available",
                  "Full chain-of-custody tracking",
                  "Certificates of destruction",
                ],
                iconColor: "text-blue-400",
                dotColors: [[59, 130, 246], [96, 165, 250]] as number[][],
              },
              {
                icon: Recycle,
                title: "Circular Recycling",
                bullets: [
                  "Zero-landfill commitment",
                  "Precious metals recovery",
                  "Plastics processing & reuse",
                  "EPA-compliant disposal",
                ],
                iconColor: "text-emerald-400",
                dotColors: [[16, 185, 129], [52, 211, 153]] as number[][],
              },
              {
                icon: Globe,
                title: "Global Refurbishment",
                bullets: [
                  "Equipment testing & grading",
                  "Export to developing markets",
                  "Bridging the digital divide",
                  "Extend hardware lifecycle",
                ],
                iconColor: "text-purple-400",
                dotColors: [[139, 92, 246], [167, 139, 250]] as number[][],
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <CardSpotlight className="h-full rounded-xl bg-neutral-950 border-neutral-800/60">
                  <item.icon className={`w-6 h-6 ${item.iconColor} relative z-20 mb-4`} />
                  <h3 className="text-lg font-bold text-white relative z-20 mb-4">
                    {item.title}
                  </h3>
                  <ul className="space-y-2 relative z-20">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <Check className={`w-4 h-4 ${item.iconColor} mt-0.5 shrink-0`} />
                        <span className="text-sm text-neutral-300">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </CardSpotlight>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
