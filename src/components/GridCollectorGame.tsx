/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
import { RetroCharacter, GridCollectorData } from "../types";
import { sound } from "./SoundManager";
import { Play, RotateCcw, Heart, Star, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";

interface GridCollectorGameProps {
  character: RetroCharacter;
  gameData: GridCollectorData;
  xpReward: number;
  gameModifier?: string;
  onWin: (xpGained: number) => void;
  onLose: () => void;
  onClose: () => void;
}

interface GameObject {
  id: number;
  name: string;
  isGood: boolean;
  x: number;
  y: number;
  speed: number;
  size: number;
}

export default function GridCollectorGame({
  character,
  gameData,
  xpReward,
  gameModifier = "none",
  onWin,
  onLose,
  onClose,
}: GridCollectorGameProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(character.stats.wisdom * 2 + 5); // Wisdom gives health bonus
  const maxHealth = character.stats.wisdom * 2 + 5;
  const [collectedCount, setCollectedCount] = useState(0);
  const targetRequired = gameModifier === "speed_frenzy" ? 4 : 5; // Collect 4 in speed frenzy!
  const [hasShield, setHasShield] = useState(gameModifier === "quantum_static"); // Starts with quantum shield!

  // Game Loop References
  const arenaRef = useRef<HTMLDivElement>(null);
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 80 }); // Percentages for responsive fluid calculations
  const [items, setItems] = useState<GameObject[]>([]);

  // Stats impact
  const reflexesSpeed = 5 + (character.stats.reflexes * 0.8); // High reflexes -> speedier
  const luckDoubleSpawn = character.stats.luck >= 5; // Luck impact

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
        e.preventDefault();
      }
      keysPressed.current[k] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Main Loop
  useEffect(() => {
    if (!isPlaying) return;

    let animFrame: number;
    let spawnTimer = 0;
    let innerScore = score;
    let innerHealth = health;
    let innerCollected = collectedCount;
    let innerItems = [...items];
    let innerPlayerPos = { ...playerPos };

    const tick = () => {
      // 1. Move Player based on active buttons or keyboard keys
      const deltaX = reflexesSpeed * 0.15;
      const deltaY = reflexesSpeed * 0.15;

      if (keysPressed.current["arrowleft"] || keysPressed.current["a"]) {
        innerPlayerPos.x = Math.max(2, innerPlayerPos.x - deltaX);
      }
      if (keysPressed.current["arrowright"] || keysPressed.current["d"]) {
        innerPlayerPos.x = Math.min(98, innerPlayerPos.x + deltaX);
      }
      if (keysPressed.current["arrowup"] || keysPressed.current["w"]) {
        innerPlayerPos.y = Math.max(20, innerPlayerPos.y - deltaY);
      }
      if (keysPressed.current["arrowdown"] || keysPressed.current["s"]) {
        innerPlayerPos.y = Math.min(95, innerPlayerPos.y + deltaY);
      }
      setPlayerPos({ ...innerPlayerPos });

      // 2. Spawn falling symbols
      spawnTimer++;
      const spawnInterval = luckDoubleSpawn ? 40 : 55;
      if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        const isGood = Math.random() < 0.55; 
        const itemsList = isGood ? gameData.goodItems : gameData.badItems;
        if (itemsList && itemsList.length > 0) {
          const sampleItem = itemsList[Math.floor(Math.random() * itemsList.length)];
          const newItem: GameObject = {
            id: Date.now() + Math.random(),
            name: sampleItem.name,
            isGood,
            x: Math.random() * 85 + 7,
            y: 0,
            speed: Math.random() * 1.2 + (gameModifier === "speed_frenzy" ? 2.5 : 1.8),
            size: 20,
          };
          innerItems.push(newItem);
        }
      }

      // 3. Update active item coordinates
      innerItems = innerItems
        .map((it) => {
          // Magnetism: Hacking pulls positive items closer
          let calculatedX = it.x;
          if (it.isGood && character.stats.hacking >= 3 && it.y > 15) {
            const pullRate = 0.05 * (character.stats.hacking - 2);
            calculatedX += (innerPlayerPos.x - it.x) * pullRate;
          }

          // Wavy physics on gravity shift
          if (gameModifier === "gravity_shift") {
            calculatedX += Math.sin((Date.now() + it.id) / 200) * 0.9;
          }

          return {
            ...it,
            x: Math.max(3, Math.min(97, calculatedX)),
            y: it.y + it.speed,
          };
        })
        .filter((it) => {
          // Collision Check with player
          const distY = Math.abs(it.y - innerPlayerPos.y);
          const distX = Math.abs(it.x - innerPlayerPos.x);

          if (distX < 8 && distY < 8) {
            // Impact!
            if (it.isGood) {
              sound.playLaser();
              innerScore += 25;
              innerCollected += 1;
              setScore(innerScore);
              setCollectedCount(innerCollected);
            } else {
              // Quantum shield blocks negative packets!
              if (hasShield) {
                setHasShield(false);
                sound.playLaser(); // minor bounce sound
              } else if (character.stats.luck >= 3 && Math.random() < 0.25) {
                // Luck avoidance throw!
                sound.playLaser(); // trigger secondary escape sound
              } else {
                sound.playDamage();
                innerHealth -= 1;
                setHealth(innerHealth);
              }
            }
            return false; // delete item
          }

          // Filter out elements out of bounds
          return it.y < 98;
        });

      setItems(innerItems);

      // Check win/lose
      if (innerCollected >= targetRequired) {
        sound.playWin();
        setIsPlaying(false);
        onWin(xpReward);
        return;
      }

      if (innerHealth <= 0) {
        sound.playError();
        setIsPlaying(false);
        onLose();
        return;
      }

      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, hasShield]);

  const startGame = () => {
    setScore(0);
    setCollectedCount(0);
    setHealth(character.stats.wisdom * 2 + 5);
    setHasShield(gameModifier === "quantum_static");
    setPlayerPos({ x: 50, y: 80 });
    setItems([]);
    setIsPlaying(true);
    sound.playSelect();
  };

  const getAccentColorHex = () => {
    switch (character.color) {
      case "neon-green": return "#10b981";
      case "neon-purple": return "#a855f7";
      case "neon-teal": return "#06b6d4";
      case "laser-orange": return "#f97316";
      case "retro-blue": return "#3b82f6";
    }
  };

  const getCharacterEmoji = () => {
    switch (character.avatar) {
      case "robot": return "🤖";
      case "alien": return "👽";
      case "wizard": return "🧙";
      case "knight": return "🛡️";
      case "ninja": return "👤";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-black border-4 border-emerald-500 rounded-none shadow-[0_0_20px_rgba(16,185,129,0.35)] text-zinc-100 overflow-hidden font-mono">
      {/* Header */}
      <div className="bg-emerald-950 p-4 border-b-4 border-emerald-500 flex justify-between items-center">
        <div>
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest block">Minigame Challenge</span>
          <h2 className="text-md sm:text-lg font-bold text-white uppercase tracking-wider">
            ⚡ DIRECTORY INHALER (GRID COLLECT)
          </h2>
        </div>
        <button
          onClick={onClose}
          className="px-2.5 py-1 text-xs border border-zinc-700 hover:border-red-500 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 rounded-none transition"
        >
          [ESC] ABORT
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        
        {/* Intro instructions card */}
        {!isPlaying && collectedCount === 0 && (
          <div className="space-y-4 bg-zinc-900 border-2 border-zinc-800 p-4 rounded-none">
            <div className="text-xs text-emerald-400 uppercase tracking-widest font-bold">
              Mission Dossier:
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {gameData.introText || "Steer your customized avatar and absorb prompt knowledge-packets directly into base memory. Fill your system cache, but avoid corrupted bugs."}
            </p>

            {/* Dynamic Game Modifier Box */}
            {gameModifier && gameModifier !== "none" && (
              <div className="bg-purple-950/30 border border-purple-500/40 p-3 rounded-none relative overflow-hidden flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-purple-400 uppercase font-black tracking-widest block mb-0.5">🔮 QUEST LEVEL MODIFIER:</span>
                  <p className="text-white text-xs font-extrabold uppercase">
                    👾 {gameModifier.replace(/_/g, " ")}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {gameModifier === "speed_frenzy" && "Packets fall 1.4x faster, but the grid lock only requires 4 downloads to crack!"}
                    {gameModifier === "gravity_shift" && "Gravity vector unstable! Falling objects drift side-to-side in a sin wave."}
                    {gameModifier === "quantum_static" && "Armed with a blue Quantum Shield, absorbing the first bug hit for zero damage."}
                    {gameModifier === "mirror_dimension" && "Spatial dimensional drift! Be on high alert."}
                    {!["speed_frenzy", "gravity_shift", "quantum_static", "mirror_dimension"].includes(gameModifier) && "Unique server threat vectors are active!"}
                  </p>
                </div>
                <div className="text-2xl animate-pulse">🔮</div>
              </div>
            )}

            {/* Dynamic Items index provided by AI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="border border-emerald-500/20 bg-emerald-950/20 p-2.5">
                <div className="text-[10px] text-emerald-400 uppercase font-black tracking-widest flex items-center gap-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  GATHER (Target: +Score & Knowledge)
                </div>
                <div className="space-y-1">
                  {gameData.goodItems.map((item, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-[10px] text-zinc-400 block">{item.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-rose-500/20 bg-rose-950/20 p-2.5">
                <div className="text-[10px] text-rose-400 uppercase font-black tracking-widest flex items-center gap-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  AVOID (Target: -Health & Static)
                </div>
                <div className="space-y-1">
                  {gameData.badItems.map((item, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-[10px] text-zinc-400 block">{item.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hero Stats buffs description */}
            <div className="bg-zinc-950 border border-zinc-800 p-2 text-[10px] text-zinc-400 flex flex-wrap gap-x-4 gap-y-1">
              <span>🎚️ reflexes level {character.stats.reflexes} = <span className="text-emerald-400">+{((character.stats.reflexes*0.8)*18).toFixed(0)}% Speed</span></span>
              <span>🧙 wisdom level {character.stats.wisdom} = <span className="text-emerald-400">+{character.stats.wisdom*2} HP</span></span>
              {luckDoubleSpawn && <span>🎲 luck level {character.stats.luck} = <span className="text-emerald-400">Double collect chance!</span></span>}
            </div>

            <button
              onClick={startGame}
              className="w-full py-3 bg-emerald-500 text-black hover:bg-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2 px-4 transition active:translate-y-0.5 rounded-none"
            >
              <Play className="w-4 h-4 fill-current" />
              Begin Transmission Grid
            </button>
          </div>
        )}

        {/* Lose screen inside the dashboard container */}
        {!isPlaying && collectedCount < targetRequired && score === 0 && (
          <div className="hidden" /> // Spacer
        )}
        
        {/* Game play arena block */}
        {(isPlaying || (collectedCount > 0 && !isPlaying)) && (
          <div className="space-y-4">
            
            {/* Stats board bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-950 border border-zinc-800 p-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-current" />
                <div>
                  <div className="text-[8px] text-zinc-500 uppercase tracking-widest">Life core</div>
                  <div className="text-xs font-bold text-zinc-200">
                    {health} / {maxHealth}
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-400 fill-current" />
                <div>
                  <div className="text-[8px] text-zinc-500 uppercase tracking-widest">Knowledge score</div>
                  <div className="text-xs font-bold text-zinc-200">{score} PTS</div>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-2 flex items-center gap-2">
                <div className="text-xs font-bold text-emerald-400">
                  {collectedCount} / {targetRequired}
                </div>
                <div>
                  <div className="text-[8px] text-zinc-500 uppercase tracking-widest">Cache packets</div>
                  <div className="text-[9px] text-zinc-300">Target</div>
                </div>
              </div>
            </div>

            {/* Simulated Live Grid Canvas */}
            <div
              ref={arenaRef}
              className="relative w-full h-80 bg-zinc-950 border-2 border-zinc-800 rounded-none overflow-hidden select-none"
            >
              {/* Retro scanlines overlay filter */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none z-30" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

              {/* Falling words / components rendering */}
              {items.map((it) => (
                <div
                  key={it.id}
                  className={`absolute font-black tracking-wide select-none transition-transform pointer-events-none -translate-x-1/2 px-1.5 py-0.5 border text-[10px] whitespace-nowrap shadow-md ${
                    it.isGood
                      ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                      : "bg-red-950/80 border-red-500 text-red-300"
                  }`}
                  style={{
                    left: `${it.x}%`,
                    top: `${it.y}%`,
                  }}
                >
                  {it.isGood ? "📥 " : "⚠️ "} {it.name}
                </div>
              ))}

              {/* Player Avatar icon box */}
              <div
                className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center transition-all duration-75 select-none"
                style={{
                  left: `${playerPos.x}%`,
                  top: `${playerPos.y}%`,
                }}
              >
                {/* Shield glow protection bubbles */}
                {hasShield && (
                  <div className="absolute -inset-3.5 rounded-full border-2 border-cyan-400 animate-ping opacity-60 z-0" />
                )}
                {hasShield && (
                  <div className="absolute -inset-2.5 rounded-full border-2 border-cyan-400/80 animate-pulse z-0" />
                )}

                {/* Visual indicator ring under player */}
                <div
                  className="w-8 h-2 rounded-full absolute bottom-1 animate-pulse"
                  style={{ backgroundColor: `${getAccentColorHex()}25`, border: `1px solid ${getAccentColorHex()}40` }}
                />
                
                {/* Glow matrix avatar code */}
                <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] relative z-10">
                  {getCharacterEmoji()}
                </span>
                
                {/* Small indicator tag */}
                <span
                  className="text-[8px] tracking-tighter px-1 text-black font-extrabold uppercase mt-0.5 rounded pointer-events-none"
                  style={{ backgroundColor: getAccentColorHex() }}
                >
                  {character.name.substring(0, 8)}
                </span>
              </div>
            </div>

            {/* Virtual Click / Touch Keyboard controls for desktop-without-keys and mobile users */}
            <div className="flex flex-col items-center gap-1 bg-zinc-900/40 p-3 border border-zinc-800">
              <div className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">
                Directional Manual Thrusters (Keyboard WASD / Arrow Keys fully active)
              </div>
              
              <div className="flex flex-col items-center gap-1.5">
                <button
                  onMouseDown={() => { keysPressed.current["arrowup"] = true; }}
                  onMouseUp={() => { keysPressed.current["arrowup"] = false; }}
                  onTouchStart={() => { keysPressed.current["arrowup"] = true; }}
                  onTouchEnd={() => { keysPressed.current["arrowup"] = false; }}
                  className="w-10 h-10 bg-zinc-800 border-2 border-zinc-700 hover:bg-zinc-700 active:bg-zinc-600 rounded flex items-center justify-center"
                >
                  <ChevronUp className="w-5 h-5 text-emerald-400" />
                </button>
                <div className="flex gap-4">
                  <button
                    onMouseDown={() => { keysPressed.current["arrowleft"] = true; }}
                    onMouseUp={() => { keysPressed.current["arrowleft"] = false; }}
                    onTouchStart={() => { keysPressed.current["arrowleft"] = true; }}
                    onTouchEnd={() => { keysPressed.current["arrowleft"] = false; }}
                    className="w-10 h-10 bg-zinc-800 border-2 border-zinc-700 hover:bg-zinc-700 active:bg-zinc-600 rounded flex items-center justify-center"
                  >
                    <ChevronLeft className="w-5 h-5 text-emerald-400" />
                  </button>
                  <button
                    onMouseDown={() => { keysPressed.current["arrowdown"] = true; }}
                    onMouseUp={() => { keysPressed.current["arrowdown"] = false; }}
                    onTouchStart={() => { keysPressed.current["arrowdown"] = true; }}
                    onTouchEnd={() => { keysPressed.current["arrowdown"] = false; }}
                    className="w-10 h-10 bg-zinc-800 border-2 border-zinc-700 hover:bg-zinc-700 active:bg-zinc-600 rounded flex items-center justify-center"
                  >
                    <ChevronDown className="w-5 h-5 text-emerald-400" />
                  </button>
                  <button
                    onMouseDown={() => { keysPressed.current["arrowright"] = true; }}
                    onMouseUp={() => { keysPressed.current["arrowright"] = false; }}
                    onTouchStart={() => { keysPressed.current["arrowright"] = true; }}
                    onTouchEnd={() => { keysPressed.current["arrowright"] = false; }}
                    className="w-10 h-10 bg-zinc-800 border-2 border-zinc-700 hover:bg-zinc-700 active:bg-zinc-600 rounded flex items-center justify-center"
                  >
                    <ChevronRight className="w-5 h-5 text-emerald-400" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
