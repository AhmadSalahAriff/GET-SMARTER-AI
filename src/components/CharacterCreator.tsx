/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { RetroCharacter, AvatarType, AvatarColor, AvatarWeapon, AvatarHeadpiece } from "../types";
import { sound } from "./SoundManager";
import { Sparkles, Play, ShieldAlert, Cpu, Award } from "lucide-react";

interface CharacterCreatorProps {
  onComplete: (char: RetroCharacter) => void;
  initialCharacter?: RetroCharacter;
}

const AVATAR_TYPES: { id: AvatarType; label: string; desc: string }[] = [
  { id: "robot", label: "Robo-Frame v2", desc: "A sleek cybernetic AI construct with glowing visors." },
  { id: "alien", label: "Nebula Xenomorph", desc: "A curious organic voyager with telepathic antennae." },
  { id: "wizard", label: "Quantum Chronomancer", desc: "A cosmic elemental controller bending space and data." },
  { id: "knight", label: "Iron Cryptoguard", desc: "A legendary mainframe defender clad in digital carbon." },
  { id: "ninja", label: "Shadow Byte-Infiltrator", desc: "A master stealth operative who can walk through firewalls." },
];

const COLORS: { id: AvatarColor; label: string; hex: string; bg: string; text: string }[] = [
  { id: "neon-green", label: "Volt Viridian", hex: "#10b981", bg: "bg-emerald-500", text: "text-emerald-400" },
  { id: "neon-purple", label: "Synth Ultraviolet", hex: "#a855f7", bg: "bg-purple-500", text: "text-purple-400" },
  { id: "neon-teal", label: "Laser Cyan", hex: "#06b6d4", bg: "bg-cyan-500", text: "text-cyan-400" },
  { id: "laser-orange", label: "Lava Amber", hex: "#f97316", bg: "bg-orange-500", text: "text-orange-400" },
  { id: "retro-blue", label: "Pixel Indigo", hex: "#3b82f6", bg: "bg-blue-500", text: "text-blue-400" },
];

const WEAPONS: { id: AvatarWeapon; label: string; desc: string; icon: string }[] = [
  { id: "mega-blaster", label: "Phase Blaster", desc: "Fires high-octane packet beams.", icon: "🔫" },
  { id: "pixel-sword", label: "Chronos Blade", desc: "Slashes through data blocks cleanly.", icon: "⚔️" },
  { id: "cyber-staff", label: "Macro Staff", desc: "Channels compiler magical waves.", icon: "🔮" },
  { id: "floppy-shield", label: "Floppy Buffer Shield", desc: "Repels logic bugs and memory overflows.", icon: "💾" },
  { id: "pizza-slice", label: "Omega Pizza Slice", desc: "Fuel source for intense compile marathons.", icon: "🍕" },
];

const HEADPIECES: { id: AvatarHeadpiece; label: string; desc: string; icon: string }[] = [
  { id: "visor", label: "Hacker Visor", desc: "Scans code patterns in real-time.", icon: "🕶️" },
  { id: "wizard-hat", label: "Sorcerer Hood", desc: "Increases cosmic knowledge limits.", icon: "🧙" },
  { id: "space-helmet", label: "Zero-G Dome", desc: "Protects against vacuum leaks & memory dumps.", icon: "👨‍🚀" },
  { id: "ninja-band", label: "Focus Headband", desc: "Elevates response processing reflexes.", icon: "🎗️" },
  { id: "gold-crown", label: "Monarch Kernel Crown", desc: "Grants admin execution authorization.", icon: "👑" },
];

export default function CharacterCreator({ onComplete, initialCharacter }: CharacterCreatorProps) {
  const [name, setName] = useState(initialCharacter?.name || "Player1");
  const [avatar, setAvatar] = useState<AvatarType>(initialCharacter?.avatar || "robot");
  const [color, setColor] = useState<AvatarColor>(initialCharacter?.color || "neon-green");
  const [weapon, setWeapon] = useState<AvatarWeapon>(initialCharacter?.weapon || "mega-blaster");
  const [headpiece, setHeadpiece] = useState<AvatarHeadpiece>(initialCharacter?.headpiece || "visor");

  // Coins and item loadouts
  const [coins, setCoins] = useState<number>(initialCharacter?.coins ?? 100);
  const [unlockedWeapons, setUnlockedWeapons] = useState<AvatarWeapon[]>(
    initialCharacter?.unlockedWeapons || [initialCharacter?.weapon || "mega-blaster"]
  );
  const [unlockedHeadpieces, setUnlockedHeadpieces] = useState<AvatarHeadpiece[]>(
    initialCharacter?.unlockedHeadpieces || [initialCharacter?.headpiece || "visor"]
  );

  // Stat point allocation (12 points maximum to distribute)
  const [stats, setStats] = useState({
    reflexes: initialCharacter?.stats.reflexes || 3,
    wisdom: initialCharacter?.stats.wisdom || 3,
    hacking: initialCharacter?.stats.hacking || 3,
    luck: initialCharacter?.stats.luck || 3,
  });

  const maxPoints = 12;
  const currentPointsUsed = stats.reflexes + stats.wisdom + stats.hacking + stats.luck;
  const remainingPoints = maxPoints - currentPointsUsed;

  const handleStatChange = (stat: "reflexes" | "wisdom" | "hacking" | "luck", delta: number) => {
    if (initialCharacter) {
      if (delta > 0) {
        if (coins >= 150) {
          setCoins((prev) => prev - 150);
          setStats((prev) => ({
            ...prev,
            [stat]: prev[stat] + 1,
          }));
          sound.playLevelUp();
        } else {
          sound.playError();
          alert("Insufficient coins! Stat upgrades cost 150 🪙.");
        }
      }
      return;
    }

    const nextVal = stats[stat] + delta;
    if (nextVal < 1) return; // Minimum 1
    if (delta > 0 && remainingPoints <= 0) {
      sound.playError();
      return;
    }
    setStats({
      ...stats,
      [stat]: nextVal,
    });
    sound.playSelect();
  };

  const handleAvatarSelect = (type: AvatarType) => {
    setAvatar(type);
    sound.playSelect();
  };

  const handleColorSelect = (col: AvatarColor) => {
    setColor(col);
    sound.playSelect();
  };

  const handleWeaponSelect = (wep: AvatarWeapon) => {
    if (unlockedWeapons.includes(wep)) {
      setWeapon(wep);
      sound.playSelect();
    } else {
      if (coins >= 150) {
        if (window.confirm(`Unlock weapon "${WEAPONS.find((w) => w.id === wep)?.label}" for 150 🪙?`)) {
          setCoins((prev) => prev - 150);
          setUnlockedWeapons((prev) => [...prev, wep]);
          setWeapon(wep);
          sound.playLevelUp();
        }
      } else {
        sound.playError();
        alert(`This weapon is locked! Collect 150 🪙 to unlock it.`);
      }
    }
  };

  const handleHeadpieceSelect = (head: AvatarHeadpiece) => {
    if (unlockedHeadpieces.includes(head)) {
      setHeadpiece(head);
      sound.playSelect();
    } else {
      if (coins >= 150) {
        if (window.confirm(`Unlock cosmetic "${HEADPIECES.find((h) => h.id === head)?.label}" for 150 🪙?`)) {
          setCoins((prev) => prev - 150);
          setUnlockedHeadpieces((prev) => [...prev, head]);
          setHeadpiece(head);
          sound.playLevelUp();
        }
      } else {
        sound.playError();
        alert(`This cosmetic is locked! Collect 150 🪙 to unlock it.`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      sound.playError();
      return;
    }
    sound.playLevelUp();
    onComplete({
      name: name.trim(),
      avatar,
      color,
      weapon,
      headpiece,
      level: initialCharacter?.level || 1,
      xp: initialCharacter?.xp || 0,
      stats,
      coins,
      unlockedWeapons,
      unlockedHeadpieces,
    });
  };

  // SVG representation dynamically reflecting configurations
  const renderAvatarPreview = () => {
    const selectedColorHex = COLORS.find((c) => c.id === color)?.hex || "#10b981";

    const getWeaponIcon = () => WEAPONS.find((w) => w.id === weapon)?.icon || "⚔️";
    const getHeadpieceIcon = () => HEADPIECES.find((h) => h.id === headpiece)?.icon || "🕶️";

    return (
      <div className="relative w-44 h-44 bg-white/5 border border-white/15 rounded-2xl flex items-center justify-center p-3 shadow-2xl overflow-hidden">
        {/* Soft Modern Digital Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />
        
        {/* Scanning horizontal line effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/10 animate-pulse pointer-events-none" />

        <div className="relative flex flex-col items-center justify-center">
          {/* Headpiece Accessory Icon Floating Above */}
          <div className="absolute -top-12 z-20 text-3xl animate-bounce" style={{ animationDuration: "1.8s" }}>
            {getHeadpieceIcon()}
          </div>

          {/* SVG Character Silhouette Drawing */}
          <svg className="w-24 h-24 drop-shadow-[0_0_12px_rgba(129,140,248,0.4)]" viewBox="0 0 100 100">
            {/* Robot Base */}
            {avatar === "robot" && (
              <g>
                {/* Body block */}
                <rect x="25" y="45" width="50" height="40" rx="8" fill={selectedColorHex} opacity="0.9" stroke="#000" strokeWidth="2.5" />
                {/* Heart-beat glowing screen */}
                <rect x="35" y="52" width="30" height="20" rx="4" fill="#000" stroke="#fff" strokeWidth="1.5" />
                <path d="M 38 62 L 44 62 L 47 55 L 50 67 L 53 60 L 55 62 L 62 62" fill="none" stroke={selectedColorHex} strokeWidth="1.5" />
                {/* Head Block */}
                <rect x="33" y="18" width="34" height="26" rx="6" fill="#18181b" stroke={selectedColorHex} strokeWidth="2.5" />
                <circle cx="43" cy="30" r="4" fill={selectedColorHex} />
                <circle cx="57" cy="30" r="4" fill={selectedColorHex} />
                {/* Antenna */}
                <line x1="50" y1="18" x2="50" y2="8" stroke={selectedColorHex} strokeWidth="2.5" />
                <circle cx="50" cy="6" r="3.5" fill="#f43f5e" />
              </g>
            )}

            {/* Alien Base */}
            {avatar === "alien" && (
              <g>
                {/* Alien Spacesuit */}
                <rect x="28" y="48" width="44" height="36" rx="10" fill="#27272a" stroke={selectedColorHex} strokeWidth="2.5" />
                <rect x="38" y="55" width="24" height="15" rx="4" fill="#09090b" stroke={selectedColorHex} strokeWidth="1.5" />
                {/* Head Organic Oval */}
                <ellipse cx="50" cy="30" rx="22" ry="16" fill={selectedColorHex} stroke="#000" strokeWidth="2.5" />
                {/* Gigantic Glowing Eyes */}
                <ellipse cx="40" cy="28" rx="8" ry="5" fill="#000" />
                <ellipse cx="60" cy="28" rx="8" ry="5" fill="#000" />
                <circle cx="42" cy="27" r="1.5" fill="#fff" />
                <circle cx="62" cy="27" r="1.5" fill="#fff" />
                {/* Two antennae */}
                <path d="M 40 16 Q 35 6 30 10" fill="none" stroke={selectedColorHex} strokeWidth="2.5" />
                <path d="M 60 16 Q 65 6 70 10" fill="none" stroke={selectedColorHex} strokeWidth="2.5" />
                <circle cx="30" cy="11" r="3" fill={selectedColorHex} />
                <circle cx="70" cy="11" r="3" fill={selectedColorHex} />
              </g>
            )}

            {/* Wizard Base */}
            {avatar === "wizard" && (
              <g>
                {/* Magical wizard robes */}
                <path d="M 50 40 L 20 85 L 80 85 Z" fill={selectedColorHex} stroke="#000" strokeWidth="2.5" />
                <circle cx="50" cy="65" r="4" fill="#fbbf24" />
                <circle cx="50" cy="50" r="3" fill="#fff" />
                {/* Head */}
                <circle cx="50" cy="26" r="14" fill="#fed7aa" stroke="#000" strokeWidth="2.5" />
                {/* Glowing runic glasses / eyes */}
                <rect x="40" y="22" width="8" height="6" fill="#000" rx="2" />
                <rect x="52" y="22" width="8" height="6" fill="#000" rx="2" />
                <line x1="48" y1="25" x2="52" y2="25" stroke="#000" strokeWidth="2.5" />
                {/* Magical mist */}
                <ellipse cx="50" cy="88" rx="28" ry="6" fill="#a855f7" opacity="0.3" />
              </g>
            )}

            {/* Knight Base */}
            {avatar === "knight" && (
              <g>
                {/* Digital Armor Heavy Plate */}
                <rect x="25" y="44" width="50" height="42" rx="6" fill="#52525b" stroke="#000" strokeWidth="2.5" />
                <rect x="42" y="52" width="16" height="18" fill={selectedColorHex} stroke="#000" strokeWidth="1.5" />
                {/* Shield / crest */}
                <line x1="50" y1="52" x2="50" y2="70" stroke="#000" strokeWidth="1.5" />
                <line x1="42" y1="61" x2="58" y2="61" stroke="#000" strokeWidth="1.5" />
                {/* Knight Helmet */}
                <rect x="32" y="16" width="36" height="28" rx="3" fill="#27272a" stroke={selectedColorHex} strokeWidth="2.5" />
                {/* Glowing red visor slot */}
                <rect x="38" y="24" width="24" height="6" fill="#ef4444" rx="2" />
                {/* Helmet plumes */}
                <path d="M 50 16 C 50 10, 38 6, 38 6" fill="none" stroke="#ef4444" strokeWidth="3" />
              </g>
            )}

            {/* Ninja Base */}
            {avatar === "ninja" && (
              <g>
                {/* Shadow robes */}
                <rect x="26" y="46" width="48" height="40" rx="8" fill="#18181b" stroke="#000" strokeWidth="2.5" />
                <rect x="26" y="60" width="48" height="6" fill={selectedColorHex} />
                {/* Head block */}
                <rect x="34" y="17" width="32" height="29" rx="4" fill="#18181b" stroke="#000" strokeWidth="2.5" />
                {/* Mask open eye slit */}
                <rect x="38" y="22" width="24" height="8" fill="#fed7aa" rx="2" stroke="#18181b" strokeWidth="1" />
                {/* Sharp squinting eyes */}
                <circle cx="44" cy="26" r="1.5" fill="#000" />
                <circle cx="56" cy="26" r="1.5" fill="#000" />
                {/* Flowing scarf back banner */}
                <path d="M 26 48 L 10 52 L 20 60 L 26 55" fill={selectedColorHex} stroke="#000" strokeWidth="1.5" />
              </g>
            )}
          </svg>

          {/* Weapon Slot (drawn as a cute stamp to the right of the character base) */}
          <div className="absolute right-0 bottom-2 bg-zinc-900/90 border border-white/20 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg" style={{ borderColor: selectedColorHex }}>
            {getWeaponIcon()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto glass-panel-deep shadow-2xl rounded-[32px] text-zinc-100 overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="bg-white/5 border-b border-white/10 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="w-6 h-6 text-indigo-300 animate-pulse" />
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest bg-gradient-to-r from-pink-400 via-indigo-200 to-cyan-300 bg-clip-text text-transparent font-display">
            {initialCharacter ? "SYSTEM LOADER: UPGRADE HERO" : "SYSTEM LOADER: CUSTOMIZE HERO"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {initialCharacter && (
            <div className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 px-3.5 py-1.5 rounded-full font-bold flex items-center gap-2 shadow-sm animate-pulse">
              <span>🪙 {coins} Coins</span>
            </div>
          )}
          <div className="text-[10px] bg-white/10 border border-white/15 text-indigo-100 px-3 py-1.5 rounded-full uppercase tracking-widest font-black">
            CORE V2.0 ONLINE
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Live Render & Stat Points Allocations (4 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center gap-6 bg-white/5 p-6 border border-white/10 rounded-3xl shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-300 self-start border-b border-white/5 pb-2.5 w-full font-display">
              Hologram Avatar Preview
            </h2>
            
            {renderAvatarPreview()}

            {/* Character Stats allocator */}
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center bg-white/5 px-4 py-3 border border-white/10 rounded-xl">
                {initialCharacter ? (
                  <>
                    <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Stat Upgrades cost:</span>
                    <span className="text-xs font-black px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full animate-pulse flex items-center gap-1.5 shadow">
                      150 🪙 Per Point
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Available Core Points:</span>
                    <span className={`text-md font-black px-3 py-0.5 rounded-full ${remainingPoints > 0 ? "bg-pink-500/20 text-pink-300 animate-pulse" : "bg-white/5 text-zinc-400"}`}>
                      {remainingPoints}
                    </span>
                  </>
                )}
              </div>

              {/* Stats lines */}
              <div className="space-y-3">
                {[
                  { key: "hacking", label: "💻 HACKING", desc: "Clues in code ciphers" },
                  { key: "reflexes", label: "⚡ REFLEXES", desc: "Hero speed in collections" },
                  { key: "wisdom", label: "🧙 WISDOM", desc: "Combat Health bonus" },
                  { key: "luck", label: "🎲 LUCK", desc: "Double collections & loot drops" },
                ].map((st) => {
                  const statVal = stats[st.key as keyof typeof stats];
                  return (
                    <div key={st.key} className="flex justify-between items-center bg-white/5 p-3.5 border border-white/5 rounded-xl transition hover:bg-white/10">
                      <div>
                        <div className="text-xs font-bold text-zinc-150">{st.label}</div>
                        <div className="text-[10px] text-zinc-400 leading-normal mt-0.5">{st.desc}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleStatChange(st.key as any, -1)}
                          disabled={initialCharacter ? true : statVal <= 1}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center text-zinc-300 font-bold hover:bg-white/15 disabled:opacity-20 transition"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-extrabold text-indigo-300">
                          {statVal}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStatChange(st.key as any, 1)}
                          disabled={initialCharacter ? coins < 150 : remainingPoints <= 0}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center text-zinc-300 font-bold hover:bg-white/15 disabled:opacity-25 transition"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Selection Options (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Input Name field */}
            <div className="space-y-2">
              <label className="text-xs uppercase font-extrabold text-indigo-300 block tracking-widest font-display">
                Choose Hero Codename:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={16}
                required
                className="w-full glass-input text-white p-3.5 px-5 outline-none font-medium tracking-wide placeholder-white/20 rounded-2xl shadow-inner"
                placeholder="PROMPT-HACKER"
              />
            </div>

            {/* Avatar Selection Grid */}
            <div className="space-y-3">
              <label className="text-xs uppercase font-extrabold text-indigo-300 block tracking-widest font-display">
                Select Character Frame:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVATAR_TYPES.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleAvatarSelect(av.id)}
                    className={`p-4 text-left border rounded-2xl flex flex-col justify-start gap-1.5 transition-all ${
                      avatar === av.id
                        ? "bg-indigo-500/10 border-indigo-400 shadow-lg shadow-indigo-500/10"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="text-sm font-bold flex items-center gap-2 text-white">
                      <span className={`w-2 h-2 rounded-full ${avatar === av.id ? "bg-pink-400 animate-ping" : "bg-white/10"}`} />
                      {av.label}
                    </div>
                    <div className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed mt-0.5">
                      {av.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Chip Colors Grid */}
            <div className="space-y-3">
              <label className="text-xs uppercase font-extrabold text-indigo-300 block tracking-widest font-display">
                Spectrum Matrix Color:
              </label>
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handleColorSelect(col.id)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 border rounded-xl text-xs font-bold transition ${
                       color === col.id
                        ? "bg-indigo-500/15 border-indigo-400 shadow-md animate-pulse"
                        : "bg-white/5 border-white/10 hover:border-white/15"
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${col.bg} border border-black/20`} />
                    <span className={col.text}>{col.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gear Accessories selection lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Headpieces */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold text-indigo-300 block tracking-widest font-display flex justify-between items-center">
                  <span>Equip Headpiece:</span>
                  <span className="text-[10px] text-zinc-400 capitalize bg-white/5 px-2 py-0.5 rounded-full">Unlock: 150 🪙</span>
                </label>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 space-y-1.5 max-h-48 overflow-y-auto">
                  {HEADPIECES.map((hd) => {
                    const isUnlocked = unlockedHeadpieces.includes(hd.id);
                    return (
                      <button
                        key={hd.id}
                        type="button"
                        onClick={() => handleHeadpieceSelect(hd.id)}
                        className={`w-full text-left p-2 flex items-center justify-between gap-3 transition-all rounded-xl border ${
                          headpiece === hd.id
                            ? "bg-indigo-500/15 border-indigo-400/50 text-white"
                            : isUnlocked
                            ? "text-zinc-300 hover:text-white hover:bg-white/5 border-transparent"
                            : "text-zinc-500 hover:bg-zinc-950/40 border-dashed border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] shrink-0">{hd.icon}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span className="truncate">{hd.label}</span>
                              {!isUnlocked && <span className="text-[8px] bg-amber-500/10 text-amber-300 px-1 py-0.5 rounded leading-none shrink-0 border border-amber-500/20">🔒 Lock</span>}
                            </div>
                            <div className="text-[9px] text-zinc-400 truncate mt-0.5">{hd.desc}</div>
                          </div>
                        </div>
                        {!isUnlocked && (
                          <span className="text-[10px] font-black text-amber-300 shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded-md leading-none select-none">
                            150 🪙
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weapons */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold text-indigo-300 block tracking-widest font-display flex justify-between items-center">
                  <span>Equip Logic Arm:</span>
                  <span className="text-[10px] text-zinc-400 capitalize bg-white/5 px-2 py-0.5 rounded-full">Unlock: 150 🪙</span>
                </label>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 space-y-1.5 max-h-48 overflow-y-auto">
                  {WEAPONS.map((wp) => {
                    const isUnlocked = unlockedWeapons.includes(wp.id);
                    return (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => handleWeaponSelect(wp.id)}
                        className={`w-full text-left p-2 flex items-center justify-between gap-3 transition-all rounded-xl border ${
                          weapon === wp.id
                            ? "bg-indigo-500/15 border-indigo-400/50 text-white"
                            : isUnlocked
                            ? "text-zinc-300 hover:text-white hover:bg-white/5 border-transparent"
                            : "text-zinc-500 hover:bg-zinc-950/40 border-dashed border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] shrink-0">{wp.icon}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              <span className="truncate">{wp.label}</span>
                              {!isUnlocked && <span className="text-[8px] bg-amber-500/10 text-amber-300 px-1 py-0.5 rounded leading-none shrink-0 border border-amber-500/20">🔒 Lock</span>}
                            </div>
                            <div className="text-[9px] text-zinc-400 truncate mt-0.5">{wp.desc}</div>
                          </div>
                        </div>
                        {!isUnlocked && (
                          <span className="text-[10px] font-black text-amber-300 shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded-md leading-none select-none">
                            150 🪙
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Submit Loadout validation button */}
        <div className="border-t border-white/10 pt-6 flex justify-end">
          <button
            type="submit"
            className="group w-full md:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-450 text-white font-extrabold uppercase tracking-widest flex items-center justify-center gap-3.5 transition-all shadow-lg rounded-2xl"
          >
            <Play className="w-5 h-5 fill-current" />
            {initialCharacter ? "Confirm & Save Upgrade" : "Initialize Arcade Character"}
            <Sparkles className="w-5 h-5 text-indigo-150 group-hover:scale-125 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
}
