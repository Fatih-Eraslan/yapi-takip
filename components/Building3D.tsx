"use client";

import { useRef, useEffect, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls, Text, Sky, ContactShadows, useTexture, Environment, Float,
} from "@react-three/drei";
import * as THREE from "three";
import type { Apartment, Building } from "@/lib/types";

interface Building3DProps {
  building: Pick<Building, "name" | "floorCount" | "aptPerFloor" | "apartments" | "image">;
  onApartmentClick?: (apt: Apartment) => void;
}

// ─── Oranlar ──────────────────────────────────────────────────────────────────
const APT_W = 3.0;
const APT_H = 2.9;
const BLDG_D = 9.0;  // gerçekçi bina derinliği (~9m)

// ─── Renk paleti ──────────────────────────────────────────────────────────────
const C = {
  plaster:   "#eae5db",   // ana sıva — krem
  band:      "#d0c9bc",   // kat bandı — biraz daha koyu
  pilaster:  "#e8e2d8",   // payeler — hafif açık (ışık tutar)
  concrete:  "#b8b2a6",   // beton / denizlik
  frame:     "#18202e",   // antrasit alüminyum
  glass:     "#7ab8d8",
  balcony:   "#dcd7ce",
  railing:   "#8a8a9a",
  ground:    "#4a7a3a",
  pavement:  "#b4b0aa",
  road:      "#303030",
  base:      "#c4b89e",   // zemin kat taş kaplama
  roof:      "#ada69a",
};

const STATUS: Record<string, { glass: string; overlay: string; label: string; dot: string }> = {
  AVAILABLE: { glass: "#86efac", overlay: "#22c55e", label: "Müsait",  dot: "#22c55e" },
  SOLD:      { glass: "#fca5a5", overlay: "#ef4444", label: "Satıldı", dot: "#ef4444" },
  RESERVED:  { glass: "#fde68a", overlay: "#f59e0b", label: "Rezerve", dot: "#f59e0b" },
  RENTED:    { glass: "#c4b5fd", overlay: "#8b5cf6", label: "Kiralık", dot: "#8b5cf6" },
};

// ─── Sahne sisi ───────────────────────────────────────────────────────────────
function SceneFog() {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.Fog("#3d5fa0", 50, 200);
    return () => { scene.fog = null; };
  }, [scene]);
  return null;
}

// ─── Bina ortaya çıkma animasyonu ─────────────────────────────────────────────
function BuildingReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const prog = useRef(0);
  useFrame((_, dt) => {
    if (!ref.current || prog.current >= 1) return;
    prog.current = Math.min(1, prog.current + dt * 1.4);
    const t = 1 - Math.pow(1 - prog.current, 3); // easeOutCubic
    ref.current.scale.y = Math.max(0.001, t);
  });
  return (
    <group ref={ref} scale={[1, 0.001, 1]}>
      {children}
    </group>
  );
}

// ─── Daire facade birimi ──────────────────────────────────────────────────────
const RECESS = 0.16; // pencere gömme derinliği

function ApartmentUnit({
  apartment, col, floor, totalW, onClick,
}: {
  apartment: Apartment;
  col: number; floor: number;
  totalW: number;
  onClick: (apt: Apartment) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const overlayRef = useRef<THREE.Mesh>(null);
  const sc = STATUS[apartment.status] ?? STATUS.AVAILABLE;

  useFrame(() => {
    if (overlayRef.current) {
      const mat = overlayRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, hovered ? 0.28 : 0, 0.14);
    }
  });

  const x = -totalW / 2 + col * APT_W + APT_W / 2;
  const y = (floor - 1) * APT_H + APT_H / 2;
  const z = BLDG_D / 2;

  const bayCount = Math.max(1, Math.round(APT_W / 1.65));
  const bayW     = (APT_W * 0.68) / bayCount;
  const winH     = APT_H * 0.56;
  const winY     = APT_H * 0.06;

  const balcW  = APT_W * 0.80;
  const KNEE_H = 0.38;
  const RAIL_H = 0.58;

  return (
    <group
      position={[x, y, z]}
      onClick={(e) => { e.stopPropagation(); onClick(apartment); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      {/* Hover overlay */}
      <mesh ref={overlayRef}>
        <boxGeometry args={[APT_W - 0.06, APT_H - 0.05, 0.10]} />
        <meshStandardMaterial
          color={sc.overlay} transparent opacity={0}
          emissive={sc.overlay} emissiveIntensity={hovered ? 0.18 : 0}
          depthWrite={false}
        />
      </mesh>

      {/* Pencere bölmeleri */}
      {Array.from({ length: bayCount }, (_, b) => {
        const spacing = APT_W / (bayCount + 1);
        const bx = -APT_W / 2 + spacing * (b + 1);
        return (
          <group key={b} position={[bx, winY, 0]}>
            {/* Üst lento (gömme gölgesi) */}
            <mesh position={[0, winH / 2 + 0.05, -RECESS / 2]}>
              <boxGeometry args={[bayW + 0.26, 0.09, RECESS + 0.06]} />
              <meshStandardMaterial color="#a8a29a" roughness={0.90} />
            </mesh>
            {/* Alt denizlik (dışa çıkıntılı) */}
            <mesh position={[0, -winH / 2 - 0.07, -RECESS / 2 + 0.06]} castShadow>
              <boxGeometry args={[bayW + 0.32, 0.10, RECESS + 0.14]} />
              <meshStandardMaterial color="#ccc6bc" roughness={0.84} />
            </mesh>
            {/* Sol revan */}
            <mesh position={[-(bayW + 0.16) / 2, 0, -RECESS / 2]}>
              <boxGeometry args={[0.07, winH + 0.12, RECESS + 0.04]} />
              <meshStandardMaterial color="#bab4aa" roughness={0.88} />
            </mesh>
            {/* Sağ revan */}
            <mesh position={[(bayW + 0.16) / 2, 0, -RECESS / 2]}>
              <boxGeometry args={[0.07, winH + 0.12, RECESS + 0.04]} />
              <meshStandardMaterial color="#bab4aa" roughness={0.88} />
            </mesh>
            {/* Güneş vizörü */}
            <mesh position={[0, winH / 2 + 0.17, 0.10]} castShadow>
              <boxGeometry args={[bayW + 0.34, 0.07, 0.36]} />
              <meshStandardMaterial color={C.concrete} roughness={0.78} />
            </mesh>
            {/* Alüminyum çerçeve (gömülü) */}
            <mesh position={[0, 0, -RECESS + 0.07]} castShadow>
              <boxGeometry args={[bayW + 0.10, winH + 0.10, 0.07]} />
              <meshStandardMaterial color="#18202e" roughness={0.20} metalness={0.90} envMapIntensity={3.5} />
            </mesh>
            {/* İç ışık paneli */}
            <mesh position={[0, 0, -RECESS]}>
              <boxGeometry args={[bayW - 0.02, winH - 0.02, 0.02]} />
              <meshStandardMaterial color="#fff8e8" emissive="#ffd080" emissiveIntensity={0.90} />
            </mesh>
            {/* Cam — fiziksel yansıma + kırılma */}
            <mesh position={[0, 0, -RECESS + 0.14]}>
              <boxGeometry args={[bayW, winH, 0.05]} />
              <meshPhysicalMaterial
                color={sc.glass}
                transmission={0.80}
                ior={1.52}
                thickness={0.10}
                roughness={0.03}
                metalness={0.0}
                reflectivity={0.60}
                envMapIntensity={2.8}
                emissive={sc.glass}
                emissiveIntensity={0.05}
              />
            </mesh>
            {/* Dikey çıta */}
            <mesh position={[0, 0, -RECESS + 0.20]}>
              <boxGeometry args={[0.036, winH, 0.026]} />
              <meshStandardMaterial color="#18202e" metalness={0.88} roughness={0.20} />
            </mesh>
            {/* Yatay çıta */}
            <mesh position={[0, winH * 0.06, -RECESS + 0.20]}>
              <boxGeometry args={[bayW, 0.036, 0.026]} />
              <meshStandardMaterial color="#18202e" metalness={0.88} roughness={0.20} />
            </mesh>
          </group>
        );
      })}

      {/* Balkon */}
      <group position={[0, -APT_H * 0.385, 0.44]}>
        {/* Döşeme levhası */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[balcW, 0.14, 0.76]} />
          <meshStandardMaterial color={C.balcony} roughness={0.78} />
        </mesh>
        {/* Levha alın şeridi */}
        <mesh position={[0, -0.10, 0.39]}>
          <boxGeometry args={[balcW + 0.04, 0.04, 0.055]} />
          <meshStandardMaterial color={C.concrete} roughness={0.85} />
        </mesh>
        {/* Beton diz duvarı */}
        <mesh position={[0, 0.28, 0.40]} castShadow>
          <boxGeometry args={[balcW, KNEE_H, 0.11]} />
          <meshStandardMaterial color="#ddd8d0" roughness={0.80} />
        </mesh>
        {/* Yan beton perde duvarlar */}
        <mesh position={[-balcW / 2 - 0.05, 0.25, 0.02]} castShadow>
          <boxGeometry args={[0.10, KNEE_H + RAIL_H + 0.10, 0.80]} />
          <meshStandardMaterial color={C.band} roughness={0.82} />
        </mesh>
        <mesh position={[ balcW / 2 + 0.05, 0.25, 0.02]} castShadow>
          <boxGeometry args={[0.10, KNEE_H + RAIL_H + 0.10, 0.80]} />
          <meshStandardMaterial color={C.band} roughness={0.82} />
        </mesh>
        {/* Cam korkuluk */}
        <mesh position={[0, KNEE_H + RAIL_H / 2 - 0.09, 0.40]}>
          <boxGeometry args={[balcW - 0.04, RAIL_H, 0.012]} />
          <meshPhysicalMaterial
            color="#d4ecf8"
            transmission={0.92}
            ior={1.50}
            roughness={0.02}
            metalness={0.0}
            reflectivity={0.65}
            envMapIntensity={2.2}
          />
        </mesh>
        {/* Paslanmaz çelik üst küpeşte */}
        <mesh position={[0, KNEE_H + RAIL_H + 0.02, 0.40]}>
          <boxGeometry args={[balcW + 0.12, 0.055, 0.055]} />
          <meshStandardMaterial color="#c8ccd4" roughness={0.24} metalness={0.85} envMapIntensity={3.0} />
        </mesh>
      </group>

      {/* Hover etiketi */}
      {hovered && (
        <Text
          position={[0, APT_H * 0.71, 0.24]}
          fontSize={0.22}
          color="#ffffff"
          anchorX="center" anchorY="middle"
          outlineWidth={0.014} outlineColor="#0f172a"
          maxWidth={APT_W * 1.1}
        >
          {`Daire ${apartment.number}  ·  ${sc.label}\n${apartment.type}${apartment.size ? `  ${apartment.size}m²` : ""}${apartment.price ? `  ·  ₺${apartment.price.toLocaleString("tr-TR")}` : ""}`}
        </Text>
      )}
    </group>
  );
}

// ─── Arka cephe daire birimi (dekoratif, tıklanamaz) ────────────────────────
function BackApartmentUnit({
  apartment, col, totalW,
}: {
  apartment: Apartment;
  col: number;
  totalW: number;
}) {
  const sc = STATUS[apartment.status] ?? STATUS.AVAILABLE;
  const x = -totalW / 2 + col * APT_W + APT_W / 2;
  const y = (apartment.floor - 1) * APT_H + APT_H / 2;
  const z = -BLDG_D / 2;

  const bayCount = Math.max(1, Math.round(APT_W / 1.65));
  const bayW     = (APT_W * 0.68) / bayCount;
  const winH     = APT_H * 0.56;
  const winY     = APT_H * 0.06;
  const balcW    = APT_W * 0.80;
  const KNEE_H   = 0.38;
  const RAIL_H   = 0.58;

  return (
    <group position={[x, y, z]}>
      {Array.from({ length: bayCount }, (_, b) => {
        const spacing = APT_W / (bayCount + 1);
        const bx = -APT_W / 2 + spacing * (b + 1);
        return (
          <group key={b} position={[bx, winY, 0]}>
            {/* Güneş vizörü */}
            <mesh position={[0, winH / 2 + 0.17, -0.10]} castShadow>
              <boxGeometry args={[bayW + 0.34, 0.07, 0.36]} />
              <meshStandardMaterial color={C.concrete} roughness={0.78} />
            </mesh>
            {/* Çerçeve */}
            <mesh position={[0, 0, RECESS - 0.07]}>
              <boxGeometry args={[bayW + 0.10, winH + 0.10, 0.07]} />
              <meshStandardMaterial color="#18202e" roughness={0.20} metalness={0.90} envMapIntensity={3.5} />
            </mesh>
            {/* İç ışık */}
            <mesh position={[0, 0, RECESS]}>
              <boxGeometry args={[bayW - 0.02, winH - 0.02, 0.02]} />
              <meshStandardMaterial color="#fff8e8" emissive="#ffd080" emissiveIntensity={0.90} />
            </mesh>
            {/* Cam */}
            <mesh position={[0, 0, RECESS - 0.14]}>
              <boxGeometry args={[bayW, winH, 0.05]} />
              <meshPhysicalMaterial
                color={sc.glass} transmission={0.80} ior={1.52} thickness={0.10}
                roughness={0.03} metalness={0.0} reflectivity={0.60}
                envMapIntensity={2.8} emissive={sc.glass} emissiveIntensity={0.05}
              />
            </mesh>
          </group>
        );
      })}
      {/* Balkon (arka) */}
      <group position={[0, -APT_H * 0.385, -0.44]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[balcW, 0.14, 0.76]} />
          <meshStandardMaterial color={C.balcony} roughness={0.78} />
        </mesh>
        <mesh position={[0, 0.28, -0.40]} castShadow>
          <boxGeometry args={[balcW, KNEE_H, 0.11]} />
          <meshStandardMaterial color="#ddd8d0" roughness={0.80} />
        </mesh>
        <mesh position={[-balcW / 2 - 0.05, 0.25, -0.02]} castShadow>
          <boxGeometry args={[0.10, KNEE_H + RAIL_H + 0.10, 0.80]} />
          <meshStandardMaterial color={C.band} roughness={0.82} />
        </mesh>
        <mesh position={[ balcW / 2 + 0.05, 0.25, -0.02]} castShadow>
          <boxGeometry args={[0.10, KNEE_H + RAIL_H + 0.10, 0.80]} />
          <meshStandardMaterial color={C.band} roughness={0.82} />
        </mesh>
        <mesh position={[0, KNEE_H + RAIL_H / 2 - 0.09, -0.40]}>
          <boxGeometry args={[balcW - 0.04, RAIL_H, 0.012]} />
          <meshPhysicalMaterial
            color="#d4ecf8" transmission={0.92} ior={1.50}
            roughness={0.02} metalness={0.0} reflectivity={0.65} envMapIntensity={2.2}
          />
        </mesh>
        <mesh position={[0, KNEE_H + RAIL_H + 0.02, -0.40]}>
          <boxGeometry args={[balcW + 0.12, 0.055, 0.055]} />
          <meshStandardMaterial color="#c8ccd4" roughness={0.24} metalness={0.85} envMapIntensity={3.0} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Yan duvar penceresi (merdiven/banyo/mutfak) ──────────────────────────────
function SideWindow({ x, y, z, dir }: { x: number; y: number; z: number; dir: -1 | 1 }) {
  return (
    <group position={[x, y, z]}>
      {/* Alüminyum çerçeve */}
      <mesh position={[dir * 0.05, 0, 0]}>
        <boxGeometry args={[0.09, 1.05, 0.72]} />
        <meshStandardMaterial color={C.frame} metalness={0.75} roughness={0.30} envMapIntensity={2.0} />
      </mesh>
      {/* İç ışık */}
      <mesh position={[dir * 0.025, 0, 0]}>
        <boxGeometry args={[0.03, 0.90, 0.58]} />
        <meshStandardMaterial color="#fff8e1" emissive="#ffd740" emissiveIntensity={0.40} />
      </mesh>
      {/* Cam */}
      <mesh position={[dir * 0.09, 0, 0]}>
        <boxGeometry args={[0.07, 0.92, 0.60]} />
        <meshStandardMaterial
          color={C.glass} transparent opacity={0.62}
          roughness={0.03} metalness={0.20} envMapIntensity={4.0}
        />
      </mesh>
    </group>
  );
}

// ─── Bina kabuğu ─────────────────────────────────────────────────────────────
function BuildingShell({
  floorCount, aptPerFloor, totalW, totalH,
}: {
  floorCount: number; aptPerFloor: number; totalW: number; totalH: number;
}) {
  const cy = totalH / 2;
  const W  = totalW + 0.65;

  return (
    <group position={[0, cy, 0]}>
      {/* Ana gövde */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[W, totalH, BLDG_D]} />
        <meshStandardMaterial color={C.plaster} roughness={0.82} metalness={0.015} envMapIntensity={0.4} />
      </mesh>
      {/* Arka duvar (biraz daha koyu) */}
      <mesh position={[0, 0, -BLDG_D / 2 - 0.02]}>
        <boxGeometry args={[W + 0.05, totalH + 0.04, 0.05]} />
        <meshStandardMaterial color={C.band} roughness={0.9} />
      </mesh>

      {/* Taban renk şeridi */}
      <mesh position={[0, -totalH / 2 + APT_H / 2, BLDG_D / 2 + 0.008]}>
        <boxGeometry args={[W, APT_H + 0.05, 0.020]} />
        <meshStandardMaterial color={C.base} roughness={0.85} />
      </mesh>

      {/* Kat döşeme bandları */}
      {Array.from({ length: floorCount + 1 }, (_, i) => (
        <group key={i}>
          <mesh position={[0, -totalH / 2 + i * APT_H, BLDG_D / 2 + 0.013]}>
            <boxGeometry args={[W + 0.08, 0.20, 0.10]} />
            <meshStandardMaterial color={C.band} roughness={0.86} />
          </mesh>
          {/* Gölge çizgisi altında */}
          <mesh position={[0, -totalH / 2 + i * APT_H - 0.12, BLDG_D / 2 + 0.014]}>
            <boxGeometry args={[W + 0.08, 0.045, 0.04]} />
            <meshStandardMaterial color={C.concrete} roughness={0.90} />
          </mesh>
        </group>
      ))}

      {/* Dikey payeler */}
      {Array.from({ length: aptPerFloor + 1 }, (_, i) => {
        const px = -totalW / 2 + i * APT_W;
        return (
          <group key={i}>
            <mesh position={[px, 0, BLDG_D / 2 + 0.013]}>
              <boxGeometry args={[0.22, totalH, 0.085]} />
              <meshStandardMaterial color={C.pilaster} roughness={0.83} />
            </mesh>
            <mesh position={[px, 0, BLDG_D / 2 + 0.006]}>
              <boxGeometry args={[0.30, totalH, 0.022]} />
              <meshStandardMaterial color={C.concrete} roughness={0.90} />
            </mesh>
          </group>
        );
      })}

      {/* Yan duvarlar (görünür cephe — sıva doku, kat bantları) */}
      {([-1, 1] as const).map((side) => {
        const sx = side * (W / 2 + 0.065);
        return (
          <group key={side}>
            {/* Yan duvar yüzeyi */}
            <mesh position={[sx, 0, 0]} castShadow>
              <boxGeometry args={[0.13, totalH + 0.10, BLDG_D + 0.14]} />
              <meshStandardMaterial color={C.band} roughness={0.87} />
            </mesh>
            {/* Yan kat bandları */}
            {Array.from({ length: floorCount + 1 }, (_, i) => (
              <mesh key={i} position={[sx, -totalH / 2 + i * APT_H, 0]}>
                <boxGeometry args={[0.18, 0.20, BLDG_D + 0.14]} />
                <meshStandardMaterial color={C.concrete} roughness={0.90} />
              </mesh>
            ))}
            {/* Yan duvar pencereleri (arka 2/3'te: mutfak, banyo, merdiven) */}
            {Array.from({ length: floorCount }, (_, fi) => {
              const wy = -totalH / 2 + fi * APT_H + APT_H * 0.55;
              return (
                <group key={fi}>
                  <SideWindow x={sx} y={wy} z={-BLDG_D * 0.25} dir={side} />
                  <SideWindow x={sx} y={wy} z={BLDG_D * 0.15}  dir={side} />
                </group>
              );
            })}
          </group>
        );
      })}

      {/* Düz çatı yüzeyi (3/4 açıdan görünür) */}
      <mesh position={[0, totalH / 2 + 0.005, 0]} receiveShadow>
        <boxGeometry args={[W - 0.10, 0.04, BLDG_D - 0.10]} />
        <meshStandardMaterial color="#ada69a" roughness={0.96} />
      </mesh>
      {/* Çatı üzeri şap/mozaik */}
      <mesh position={[0, totalH / 2 + 0.025, 0]}>
        <boxGeometry args={[W - 0.30, 0.03, BLDG_D - 0.30]} />
        <meshStandardMaterial color="#b8b0a4" roughness={0.94} />
      </mesh>

      {/* Parapet */}
      <mesh position={[0, totalH / 2 + 0.36, 0]} castShadow>
        <boxGeometry args={[W + 0.14, 0.72, BLDG_D + 0.26]} />
        <meshStandardMaterial color={C.band} roughness={0.82} />
      </mesh>
      {/* Parapet üst kapak */}
      <mesh position={[0, totalH / 2 + 0.76, 0]}>
        <boxGeometry args={[W + 0.18, 0.11, BLDG_D + 0.30]} />
        <meshStandardMaterial color={C.concrete} roughness={0.80} />
      </mesh>
      {/* Parapet ön yüz şeridi */}
      <mesh position={[0, totalH / 2 + 0.36, BLDG_D / 2 + 0.14]}>
        <boxGeometry args={[W, 0.72, 0.045]} />
        <meshStandardMaterial color={C.plaster} roughness={0.88} />
      </mesh>
      {/* LED şerit — parapet üst kenar (mavi-beyaz accent) */}
      <mesh position={[0, totalH / 2 + 0.77, BLDG_D / 2 + 0.16]}>
        <boxGeometry args={[W + 0.10, 0.038, 0.018]} />
        <meshStandardMaterial color="#a8d8ff" emissive="#80c8ff" emissiveIntensity={3.2} />
      </mesh>
      {/* LED şerit — taban kenar */}
      <mesh position={[0, -totalH / 2 + 0.01, BLDG_D / 2 + 0.014]}>
        <boxGeometry args={[W, 0.028, 0.016]} />
        <meshStandardMaterial color="#c0e8ff" emissive="#90d0ff" emissiveIntensity={2.5} />
      </mesh>

      {/* Çatı üstü merdiven kulesi */}
      <mesh position={[totalW * 0.14, totalH / 2 + 1.40, 0]} castShadow>
        <boxGeometry args={[Math.min(totalW * 0.36, 3.6), 2.3, BLDG_D * 0.72]} />
        <meshStandardMaterial color={C.plaster} roughness={0.84} envMapIntensity={0.3} />
      </mesh>
      <mesh position={[totalW * 0.14, totalH / 2 + 2.58, 0]}>
        <boxGeometry args={[Math.min(totalW * 0.36, 3.6) + 0.16, 0.11, BLDG_D * 0.72 + 0.16]} />
        <meshStandardMaterial color={C.concrete} roughness={0.86} />
      </mesh>

      {/* Su deposu */}
      <mesh position={[-totalW * 0.24, totalH / 2 + 1.75, 0]} castShadow>
        <cylinderGeometry args={[0.52, 0.52, 1.55, 14]} />
        <meshStandardMaterial color="#7a8ea8" roughness={0.42} metalness={0.48} envMapIntensity={2.0} />
      </mesh>
      <mesh position={[-totalW * 0.24, totalH / 2 + 2.56, 0]}>
        <cylinderGeometry args={[0.54, 0.54, 0.11, 14]} />
        <meshStandardMaterial color="#6a7e98" roughness={0.38} metalness={0.55} envMapIntensity={1.8} />
      </mesh>

      {/* Anten */}
      <mesh position={[totalW * 0.14 + 0.65, totalH / 2 + 3.5, 0]}>
        <cylinderGeometry args={[0.019, 0.024, 2.6, 6]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.85} roughness={0.28} envMapIntensity={2.0} />
      </mesh>
    </group>
  );
}

// ─── Giriş ───────────────────────────────────────────────────────────────────
function Entrance({ totalW }: { totalW: number }) {
  const lobbyW  = Math.min(APT_W * 1.45, totalW * 0.42);
  const doorH   = APT_H * 0.84;
  const canopyH = APT_H * 0.92;
  const canopyD = 1.30;

  return (
    <group>
      {/* Kapı çerçevesi */}
      <mesh position={[0, doorH / 2, BLDG_D / 2 + 0.034]} castShadow>
        <boxGeometry args={[lobbyW, doorH, 0.09]} />
        <meshStandardMaterial color={C.frame} roughness={0.26} metalness={0.75} envMapIntensity={2.5} />
      </mesh>
      {/* İç ısık (koridor lambası simülasyonu) */}
      <mesh position={[0, doorH / 2, BLDG_D / 2 - 0.22]}>
        <boxGeometry args={[lobbyW - 0.15, doorH - 0.14, 0.04]} />
        <meshStandardMaterial color="#fff8e1" emissive="#ffd740" emissiveIntensity={0.45} />
      </mesh>
      {/* Cam */}
      <mesh position={[0, doorH / 2, BLDG_D / 2 + 0.085]}>
        <boxGeometry args={[lobbyW - 0.10, doorH - 0.09, 0.055]} />
        <meshStandardMaterial
          color="#9ecce8"
          transparent opacity={0.42}
          roughness={0.02} metalness={0.22}
          envMapIntensity={4.0}
        />
      </mesh>
      {/* Orta dikey ray */}
      <mesh position={[0, doorH / 2, BLDG_D / 2 + 0.105]}>
        <boxGeometry args={[0.05, doorH - 0.09, 0.038]} />
        <meshStandardMaterial color={C.frame} metalness={0.78} roughness={0.28} />
      </mesh>

      {/* Saçak levhası */}
      <mesh position={[0, canopyH + 0.075, BLDG_D / 2 + canopyD / 2 + 0.12]} castShadow>
        <boxGeometry args={[lobbyW + 1.15, 0.12, canopyD + 0.22]} />
        <meshStandardMaterial color={C.concrete} roughness={0.72} />
      </mesh>
      {/* Saçak alt cam */}
      <mesh position={[0, canopyH - 0.01, BLDG_D / 2 + canopyD / 2 + 0.12]}>
        <boxGeometry args={[lobbyW + 0.92, 0.04, canopyD + 0.10]} />
        <meshStandardMaterial
          color="#aad4e8"
          transparent opacity={0.32}
          roughness={0.03} metalness={0.25}
          envMapIntensity={3.0}
        />
      </mesh>
      {/* Saçak kolonlar × 2 */}
      {([-lobbyW * 0.38, lobbyW * 0.38] as number[]).map((dx, i) => (
        <mesh key={i} position={[dx, canopyH / 2, BLDG_D / 2 + canopyD + 0.12]} castShadow>
          <boxGeometry args={[0.13, canopyH, 0.13]} />
          <meshStandardMaterial color={C.pilaster} roughness={0.80} />
        </mesh>
      ))}

      {/* Basamaklar */}
      {[0, 1, 2].map((s) => (
        <mesh key={s} position={[0, s * 0.11 - 0.08, BLDG_D / 2 + 0.34 + s * 0.31]} receiveShadow>
          <boxGeometry args={[lobbyW + 0.42 + s * 0.48, 0.11, 0.33]} />
          <meshStandardMaterial color={C.pavement} roughness={0.86} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Foto doku ────────────────────────────────────────────────────────────────
function PhotoFacade({ url, totalW, totalH }: { url: string; totalW: number; totalH: number }) {
  const texture = useTexture(url);
  const ref = useRef<THREE.Mesh>(null);
  useEffect(() => { if (ref.current) ref.current.raycast = () => {}; }, []);
  return (
    <mesh ref={ref} position={[0, totalH / 2, BLDG_D / 2 + 0.025]}>
      <planeGeometry args={[totalW + 0.65, totalH]} />
      <meshStandardMaterial map={texture} roughness={0.86} />
    </mesh>
  );
}

// ─── Ağaç ────────────────────────────────────────────────────────────────────
function Tree({ p, scale = 1 }: { p: [number, number, number]; scale?: number }) {
  return (
    <group position={p} scale={scale}>
      <mesh castShadow>
        <cylinderGeometry args={[0.14, 0.22, 1.5, 7]} />
        <meshStandardMaterial color="#6d4c41" roughness={0.92} />
      </mesh>
      <mesh position={[0, 2.3, 0]} castShadow>
        <sphereGeometry args={[1.10, 9, 7]} />
        <meshStandardMaterial color="#1b5e20" roughness={0.86} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[0, 3.3, 0]} castShadow>
        <sphereGeometry args={[0.82, 9, 7]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.83} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[0.12, 4.0, -0.1]} castShadow>
        <sphereGeometry args={[0.54, 8, 6]} />
        <meshStandardMaterial color="#388e3c" roughness={0.80} />
      </mesh>
    </group>
  );
}

// ─── Araba ───────────────────────────────────────────────────────────────────
function Car({ p, color = "#c62828", ry = 0 }: { p: [number, number, number]; color?: string; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {/* Gövde */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.95, 0.68, 0.92]} />
        <meshStandardMaterial color={color} roughness={0.18} metalness={0.65} envMapIntensity={3.0} />
      </mesh>
      {/* Kabin */}
      <mesh position={[0.08, 0.95, 0]} castShadow>
        <boxGeometry args={[1.05, 0.52, 0.84]} />
        <meshStandardMaterial color={color} roughness={0.18} metalness={0.65} envMapIntensity={3.0} />
      </mesh>
      {/* Ön cam */}
      <mesh position={[0.55, 0.93, 0]}>
        <boxGeometry args={[0.09, 0.42, 0.78]} />
        <meshStandardMaterial color="#aaccdd" transparent opacity={0.56} roughness={0.02} metalness={0.2} envMapIntensity={4.0} />
      </mesh>
      {/* Arka cam */}
      <mesh position={[-0.50, 0.93, 0]}>
        <boxGeometry args={[0.09, 0.38, 0.78]} />
        <meshStandardMaterial color="#aaccdd" transparent opacity={0.50} roughness={0.02} metalness={0.2} envMapIntensity={4.0} />
      </mesh>
      {/* Tekerlekler */}
      {([[-0.70, -0.38], [0.70, -0.38], [-0.70, 0.38], [0.70, 0.38]] as [number, number][]).map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.19, wz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.16, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.90} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Sokak lambası ───────────────────────────────────────────────────────────
function StreetLamp({ p }: { p: [number, number, number] }) {
  return (
    <group position={p}>
      {/* Direk */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.080, 5.0, 6]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.55} metalness={0.62} envMapIntensity={1.5} />
      </mesh>
      {/* Kol */}
      <mesh position={[0.62, 5.1, 0]} rotation={[0, 0, -Math.PI * 0.12]} castShadow>
        <cylinderGeometry args={[0.038, 0.038, 1.25, 6]} />
        <meshStandardMaterial color="#3a3a4a" roughness={0.55} metalness={0.62} />
      </mesh>
      {/* Armatür gövde */}
      <mesh position={[1.15, 5.0, 0]}>
        <boxGeometry args={[0.42, 0.15, 0.30]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.45} metalness={0.72} />
      </mesh>
      {/* Lamba yüzeyi */}
      <mesh position={[1.15, 4.93, 0]}>
        <boxGeometry args={[0.32, 0.05, 0.22]} />
        <meshStandardMaterial color="#fffde0" emissive="#ffe066" emissiveIntensity={4.5} />
      </mesh>
      <pointLight position={[1.15, 4.75, 0]} color="#ffe8a0" intensity={5} distance={13} decay={2} />
    </group>
  );
}

// ─── Zemin ───────────────────────────────────────────────────────────────────
function Ground({ totalW }: { totalW: number }) {
  return (
    <group>
      {/* Çim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]} receiveShadow>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color={C.ground} roughness={0.96} envMapIntensity={0.2} />
      </mesh>
      {/* Kaldırım */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, BLDG_D / 2 + 5.0]} receiveShadow>
        <planeGeometry args={[totalW + 22, 10]} />
        <meshStandardMaterial color={C.pavement} roughness={0.87} envMapIntensity={0.35} />
      </mesh>
      {/* Kaldırım kenar taşı */}
      <mesh position={[0, -0.022, BLDG_D / 2 + 10.1]} receiveShadow>
        <boxGeometry args={[totalW + 22, 0.06, 0.24]} />
        <meshStandardMaterial color={C.concrete} roughness={0.84} />
      </mesh>
      {/* Yol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, BLDG_D / 2 + 13.8]} receiveShadow>
        <planeGeometry args={[totalW + 30, 7.5]} />
        <meshStandardMaterial color={C.road} roughness={0.86} metalness={0.06} envMapIntensity={0.5} />
      </mesh>
      {/* Yol şerit çizgileri */}
      {[-1.7, 0, 1.7].map((ox, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[ox, -0.018, BLDG_D / 2 + 13.8]}>
          <planeGeometry args={[0.15, 5.8]} />
          <meshStandardMaterial color="#ddd8c8" roughness={0.72} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Ana sahne ────────────────────────────────────────────────────────────────
function BuildingScene({
  building, onApartmentClick,
}: {
  building: Building3DProps["building"];
  onApartmentClick: (apt: Apartment) => void;
}) {
  const { floorCount, aptPerFloor, apartments, image } = building;
  const totalW = aptPerFloor * APT_W;
  const totalH = floorCount * APT_H;

  const floorPos = useMemo(() => {
    const counter: Record<number, number> = {};
    const result: Record<string, number> = {};
    for (const apt of apartments) {
      const c = counter[apt.floor] ?? 0;
      result[apt.id] = c;
      counter[apt.floor] = c + 1;
    }
    return result;
  }, [apartments]);

  return (
    <>
      <SceneFog />
      <BuildingReveal>
        <BuildingShell
          floorCount={floorCount} aptPerFloor={aptPerFloor}
          totalW={totalW} totalH={totalH}
        />

        {image && <PhotoFacade url={image} totalW={totalW} totalH={totalH} />}

        <Entrance totalW={totalW} />

        {apartments.map((apt) => (
          <ApartmentUnit
            key={apt.id}
            apartment={apt}
            col={floorPos[apt.id] ?? 0}
            floor={apt.floor}
            totalW={totalW}
            onClick={onApartmentClick}
          />
        ))}

        {apartments.map((apt) => (
          <BackApartmentUnit
            key={`back-${apt.id}`}
            apartment={apt}
            col={floorPos[apt.id] ?? 0}
            totalW={totalW}
          />
        ))}

        {/* Kat numaraları */}
        {Array.from({ length: floorCount }, (_, fi) => (
          <Text
            key={fi}
            position={[-totalW / 2 - 0.62, fi * APT_H + APT_H / 2, BLDG_D / 2 + 0.12]}
            fontSize={0.28}
            color="#64748b"
            anchorX="right" anchorY="middle"
          >
            {fi + 1}.Kat
          </Text>
        ))}

        {/* Bina adı (yüzen animasyonlu) */}
        <Float floatIntensity={0.28} speed={1.4} rotationIntensity={0.04}>
          <Text
            position={[0, totalH + APT_H * 0.78, 0.1]}
            fontSize={0.68}
            color="#1e3a5f"
            anchorX="center" anchorY="middle"
            outlineWidth={0.026} outlineColor="#ffffff"
          >
            {building.name}
          </Text>
        </Float>
      </BuildingReveal>

      <Ground totalW={totalW} />

      {/* Ağaçlar */}
      <Tree p={[-totalW / 2 - 2.8, -0.07, BLDG_D / 2 + 3.0]} />
      <Tree p={[ totalW / 2 + 2.8, -0.07, BLDG_D / 2 + 3.0]} />
      <Tree p={[-totalW / 2 - 2.8, -0.07, BLDG_D / 2 + 7.5]} scale={0.85} />
      <Tree p={[ totalW / 2 + 2.8, -0.07, BLDG_D / 2 + 7.5]} scale={0.85} />

      {/* Sokak lambaları */}
      <StreetLamp p={[-totalW / 2 - 5.2, -0.07, BLDG_D / 2 + 8.0]} />
      <StreetLamp p={[ totalW / 2 + 5.2, -0.07, BLDG_D / 2 + 8.0]} />

      {/* Arabalar */}
      <Car p={[-totalW * 0.28, -0.07, BLDG_D / 2 + 14.2]} color="#1565c0" ry={Math.PI * 0.02} />
      <Car p={[ totalW * 0.15, -0.07, BLDG_D / 2 + 14.6]} color="#c62828" ry={-Math.PI * 0.01} />
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function Building3D({ building, onApartmentClick }: Building3DProps) {
  const totalW  = building.aptPerFloor * APT_W;
  const totalH  = building.floorCount * APT_H;
  const camDist = Math.max(totalW, totalH, BLDG_D * 0.9) * 1.55 + 11;

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const apt of building.apartments) {
      c[apt.status] = (c[apt.status] ?? 0) + 1;
    }
    return c;
  }, [building.apartments]);

  return (
    <div className="w-full h-full relative select-none">
      {/* Durum göstergesi */}
      <div className="absolute top-3 right-3 z-10 bg-white/92 backdrop-blur-md rounded-2xl p-3.5 shadow-lg border border-white/60 min-w-[138px]">
        <p className="text-xs font-bold text-slate-400 mb-2.5 uppercase tracking-wider">Durum</p>
        {Object.entries(STATUS).map(([status, { dot, label }]) => (
          <div key={status} className="flex items-center justify-between gap-3 mb-1.5 last:mb-0">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: dot }} />
              <span className="text-xs text-slate-600">{label}</span>
            </div>
            <span className="text-xs font-bold text-slate-700">{statusCounts[status] ?? 0}</span>
          </div>
        ))}
      </div>

      {building.image && (
        <div className="absolute top-3 left-3 z-10 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
          <p className="text-xs text-white/85">📷 Fotoğraf aktif</p>
        </div>
      )}

      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-xs text-slate-500 bg-white/85 backdrop-blur-sm px-3 py-1.5 rounded-full whitespace-nowrap shadow-sm border border-white/50">
        Döndür · Yakınlaştır · Daireye tıkla
      </p>

      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [camDist * 0.80, totalH * 0.62, camDist * 0.72], fov: 42 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        style={{ background: "linear-gradient(175deg, #080f28 0%, #0f1f52 12%, #162e7a 28%, #1f4aa8 45%, #3a72c8 62%, #6aa8e0 78%, #b0d4ee 92%, #d8ecf8 100%)" }}
      >
        <Suspense fallback={null}>
          {/* Işıklar */}
          <ambientLight intensity={0.58} color="#c8dff0" />
          <directionalLight
            position={[16, 32, 22]}
            intensity={2.4}
            color="#fffbf0"
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-camera-far={220}
            shadow-camera-left={-70}
            shadow-camera-right={70}
            shadow-camera-top={70}
            shadow-camera-bottom={-6}
            shadow-bias={-0.0001}
          />
          <directionalLight position={[-12, 18, -10]} intensity={0.38} color="#d4e8ff" />
          <directionalLight position={[0, -2, 20]} intensity={0.14} color="#ffffff" />
          {/* Bina önü sıcak aydınlatma */}
          <pointLight
            position={[0, totalH * 0.45, BLDG_D + 5]}
            intensity={1.2}
            color="#fff8e8"
            distance={totalW * 3.0}
            decay={2}
          />

          {/* Mavi dolgu — arka/yan (gölge yumuşatır) */}
          <directionalLight position={[-12, 10, -22]} intensity={0.42} color="#4a90ff" />
          {/* Gün batımı yan ışık */}
          <directionalLight position={[28, 8, 5]} intensity={0.30} color="#ffb060" />
          {/* Parapet LED yansıması */}
          <pointLight position={[0, totalH + 2, BLDG_D / 2 + 1]} intensity={2.2} color="#80d0ff" distance={totalW * 2.5} decay={2} />

          {/* HDRI ortam yansıması */}
          <Environment preset="city" />

          {/* Güneş & gökyüzü */}
          <Sky
            sunPosition={[16, 32, 22]}
            turbidity={5.5}
            rayleigh={0.72}
            mieCoefficient={0.004}
            mieDirectionalG={0.92}
          />

          <BuildingScene
            building={building}
            onApartmentClick={onApartmentClick ?? (() => {})}
          />

          <ContactShadows
            position={[0, -0.06, 0]}
            opacity={0.65}
            scale={Math.max(totalW, totalH, BLDG_D) * 4.5}
            blur={4.0}
            far={8}
            color="#1a2a40"
          />

          <OrbitControls
            target={[0, totalH / 2, 0]}
            minDistance={5}
            maxDistance={camDist * 2.5}
            maxPolarAngle={Math.PI / 1.82}
            enableDamping
            dampingFactor={0.055}
            rotateSpeed={0.72}
            zoomSpeed={0.92}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
