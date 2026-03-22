"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function VaultCore() {
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (meshRef.current) {
            meshRef.current.rotation.y = t * 0.2;
            meshRef.current.rotation.z = t * 0.1;
            meshRef.current.position.y = Math.sin(t * 0.5) * 0.2;
        }
    });

    return (
        <group ref={meshRef}>
            {/* Outer Frame */}
            <mesh>
                <boxGeometry args={[2.2, 2.2, 2.2]} />
                <meshStandardMaterial
                    color="#10b981"
                    wireframe
                    transparent
                    opacity={0.15}
                />
            </mesh>

            {/* Inner Glowing Core */}
            <mesh>
                <octahedronGeometry args={[0.8, 0]} />
                <meshStandardMaterial
                    color="#10b981"
                    emissive="#10b981"
                    emissiveIntensity={2}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Floating Orbits */}
            {[...Array(3)].map((_, i) => (
                <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
                    <torusGeometry args={[1.5 + i * 0.3, 0.02, 16, 100]} />
                    <meshStandardMaterial color="#059669" transparent opacity={0.3} />
                </mesh>
            ))}
        </group>
    );
}

export function VaultModel() {
    return (
        <div className="absolute inset-0 z-0 opacity-40">
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#10b981" />
                <VaultCore />
            </Canvas>
        </div>
    );
}
