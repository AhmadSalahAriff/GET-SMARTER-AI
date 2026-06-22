/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  ChatMessage,
  RetroCharacter,
  ChallengePayload,
  AvatarType,
  AvatarColor,
  RewardItem,
} from "./types";
import { sound } from "./components/SoundManager";
import CharacterCreator from "./components/CharacterCreator";
import GridCollectorGame from "./components/GridCollectorGame";
import TriviaBossBattle from "./components/TriviaBossBattle";
import FirewallDecrypt from "./components/FirewallDecrypt";
import {
  Sparkles,
  Award,
  Send,
  User,
  Bot,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Zap,
  HelpCircle,
  HelpCircleIcon,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkle,
  Cpu,
} from "lucide-react";

export default function App() {
  // Sound controls
  const [soundOn, setSoundOn] = useState(true);

  // Character Configuration
  const [character, setCharacter] = useState<RetroCharacter | null>(null);
  const [showConfigurator, setShowConfigurator] = useState(false);

  // Chat conversation logs
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userPromptInput, setUserPromptInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Active Challenge Overlay Game State
  const [activePlayMessageId, setActivePlayMessageId] = useState<string | null>(null);
  const [activeGameType, setActiveGameType] = useState<
    "grid_collector" | "trivia_boss_battle" | "firewall_decrypt" | null
  >(null);
  const [activeGamePayload, setActiveGamePayload] = useState<ChallengePayload | null>(null);

  // Dynamic Loot & Gear Inventory states
  const [unlockedItemReward, setUnlockedItemReward] = useState<RewardItem | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<RewardItem | null>(null);

  // Return computed active attribute modifiers with equipped gear bonuses
  const getActiveStats = (char: RetroCharacter) => {
    const active = { ...char.stats };
    if (char.equippedWeapon) {
      const bonus = char.equippedWeapon.statBonus as keyof typeof active;
      if (active[bonus] !== undefined) {
        active[bonus] += char.equippedWeapon.bonusValue;
      }
    }
    if (char.equippedCosmetic) {
      const bonus = char.equippedCosmetic.statBonus as keyof typeof active;
      if (active[bonus] !== undefined) {
        active[bonus] += char.equippedCosmetic.bonusValue;
      }
    }
    return active;
  };

  const activeStats = character ? getActiveStats(character) : { hacking: 1, reflexes: 1, wisdom: 1, luck: 1 };
  const activeCharacter = character ? { ...character, stats: activeStats } : null;

  const handleEquipItem = (item: RewardItem) => {
    if (!character) return;
    sound.playLevelUp();
    const updated: RetroCharacter = {
      ...character,
      equippedWeapon: item.type === "weapon" ? item : (character.equippedWeapon || null),
      equippedCosmetic: item.type === "cosmetic" ? item : (character.equippedCosmetic || null),
    };
    saveCharacterToCache(updated);
  };

  const handleUnequipItem = (type: "weapon" | "cosmetic") => {
    if (!character) return;
    sound.playSelect();
    const updated: RetroCharacter = {
      ...character,
      equippedWeapon: type === "weapon" ? null : (character.equippedWeapon || null),
      equippedCosmetic: type === "cosmetic" ? null : (character.equippedCosmetic || null),
    };
    saveCharacterToCache(updated);
  };

  // Scroll anchor ref
  const chatBottomAnchorRef = useRef<HTMLDivElement>(null);

  // 1. Load Character statistics and chats from localStorage on initialization
  useEffect(() => {
    const cachedChar = localStorage.getItem("RETRO_CHAT_CHAR");
    if (cachedChar) {
      try {
        setCharacter(JSON.parse(cachedChar));
      } catch (e) {
        console.error("Failed loading cached hero statistics.", e);
      }
    }

    const cachedMessages = localStorage.getItem("RETRO_CHAT_MESSAGES");
    if (cachedMessages) {
      try {
        setMessages(JSON.parse(cachedMessages));
      } catch (e) {
        console.error("Failed loading cached chats logs.", e);
      }
    }
  }, []);

  // 2. Persist Character adjustments
  const saveCharacterToCache = (newChar: RetroCharacter) => {
    setCharacter(newChar);
    localStorage.setItem("RETRO_CHAT_CHAR", JSON.stringify(newChar));
  };

  // 3. Persist Messages
  const saveChatsToCache = (newMsgs: ChatMessage[]) => {
    setMessages(newMsgs);
    localStorage.setItem("RETRO_CHAT_MESSAGES", JSON.stringify(newMsgs));
  };

  // Sound configuration hook
  const handleToggleSound = () => {
    const nextSound = !soundOn;
    setSoundOn(nextSound);
    sound.toggleSound(nextSound);
    sound.playSelect();
  };

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Submission handler for prompting Gemini
  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPromptInput.trim() || isGenerating || !character) return;

    sound.playSelect();
    const promptText = userPromptInput.trim();
    setUserPromptInput("");

    // Create user bubble
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: promptText,
      isLocked: false,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMsgs = [...messages, userMessage];
    saveChatsToCache(newMsgs);
    setIsGenerating(true);

    try {
      // Direct POST API proxy requests toward our secure express server.ts
      const response = await fetch("/api/generate-challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptText,
          // Propagate last 4 chats elements representing history logs for Context
          history: messages.slice(-4).map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            content: m.originalPrompt || m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Critical link breakdown. Firewall refuses packets.");
      }

      const challengeData: ChallengePayload = await response.json();

      // Create Locked and Encrypted custom AI Bubble
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: challengeData.summary, // Sells short teaser
        originalPrompt: promptText,
        isLocked: true,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        challenge: challengeData,
      };

      saveChatsToCache([...newMsgs, aiMessage]);
    } catch (err: any) {
      console.error(err);
      sound.playError();
      const aiErrorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "⚡ SYSTEM EXCEPTION DETECTED: We failed to contact the cyber oracle. Check server log channels and retry.",
        isLocked: false,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      saveChatsToCache([...newMsgs, aiErrorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Triggering the overlay minigame panel
  const handleOpenChallengeMatrix = (msgId: string, challenge: ChallengePayload) => {
    sound.playLevelUp();
    setActivePlayMessageId(msgId);
    setActiveGameType(challenge.challengeType);
    setActiveGamePayload(challenge);
  };

  // Winning callback
  const handleGameWin = (xpReward: number) => {
    if (!character || !activePlayMessageId) return;

    // Capture dynamic item reward
    const earnedItem = activeGamePayload?.rewardItem;
    const currentInventory = character.inventory || [];
    const alreadyOwns = currentInventory.some(item => item.id === earnedItem?.id);
    const updatedInventory = earnedItem && !alreadyOwns 
      ? [...currentInventory, earnedItem] 
      : currentInventory;

    if (earnedItem) {
      setUnlockedItemReward(earnedItem);
    }

    // Award XP and evaluate Level ups
    let totalXp = character.xp + xpReward;
    let nextLvl = character.level;
    const requiredXp = nextLvl * 100;
    let leveledUp = false;

    if (totalXp >= requiredXp) {
      totalXp -= requiredXp;
      nextLvl += 1;
      leveledUp = true;
    }

    const updatedCharacter: RetroCharacter = {
      ...character,
      level: nextLvl,
      xp: totalXp,
      inventory: updatedInventory,
      // If leveled up, grant small stat upgrade points dynamically!
      stats: leveledUp
        ? {
            hacking: character.stats.hacking + 1,
            reflexes: character.stats.reflexes + 1,
            wisdom: character.stats.wisdom + 1,
            luck: character.stats.luck + 1,
          }
        : character.stats,
    };

    saveCharacterToCache(updatedCharacter);

    // Update active message - set unlocked
    const updatedMessages = messages.map((m) => {
      if (m.id === activePlayMessageId && m.challenge) {
        return {
          ...m,
          isLocked: false,
          text: m.challenge.answer, // Reveal full detailed MD answer!
          completedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
      }
      return m;
    });

    saveChatsToCache(updatedMessages);
    
    // Close Game Overlay
    setActivePlayMessageId(null);
    setActiveGameType(null);
    setActiveGamePayload(null);

    // Play victory flash sound effects
    setTimeout(() => {
      if (leveledUp) {
        sound.playLevelUp();
      } else {
        sound.playWin();
      }
    }, 100);
  };

  // Losing callback
  const handleGameLose = () => {
    // Return to main chat with failed tag
    setActivePlayMessageId(null);
    setActiveGameType(null);
    setActiveGamePayload(null);
    sound.playError();
  };

  // Clear Chats Log Database
  const handleClearChatCache = () => {
    sound.playSelect();
    if (window.confirm("Disconnect security line and wipe all system buffers?")) {
      setMessages([]);
      localStorage.removeItem("RETRO_CHAT_MESSAGES");
    }
  };

  // Aesthetic Character styling details
  const getAvatarBorderClass = (col: AvatarColor) => {
    switch (col) {
      case "neon-green": return "border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.3)]";
      case "neon-purple": return "border-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.3)]";
      case "neon-teal": return "border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]";
      case "laser-orange": return "border-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.3)]";
      case "retro-blue": return "border-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.3)]";
    }
  };

  const getAvatarTextClass = (col: AvatarColor) => {
    switch (col) {
      case "neon-green": return "text-emerald-300";
      case "neon-purple": return "text-purple-300";
      case "neon-teal": return "text-cyan-300";
      case "laser-orange": return "text-orange-300";
      case "retro-blue": return "text-indigo-300";
    }
  };

  const getCharacterEmojiStr = (av: AvatarType) => {
    switch (av) {
      case "robot": return "🤖";
      case "alien": return "👽";
      case "wizard": return "🧙";
      case "knight": return "🛡️";
      case "ninja": return "👤";
    }
  };

  return (
    <div className="min-h-screen container-fluid text-zinc-100 flex flex-col font-sans relative overflow-hidden frosted-glass-bg">
      
      {/* Delicate Modern Digital Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Primary Top Header Nav */}
      <header className="relative z-10 backdrop-blur-xl bg-white/5 border-b border-white/10 py-4 px-6 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative bg-white/10 w-9 h-9 border border-white/20 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/15 animate-pulse">
            <Cpu className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-sm sm:text-md md:text-lg font-black uppercase tracking-[0.25em] bg-gradient-to-r from-pink-400 via-indigo-200 to-cyan-300 bg-clip-text text-transparent flex items-center gap-2 font-display">
              GET SMARTER AI
            </h1>
            <p className="text-[9px] text-indigo-300/60 uppercase tracking-widest font-bold hidden sm:block">
              Frosted Custom Bypass Terminal // Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Sound toggle switches */}
          <button
            onClick={handleToggleSound}
            className="p-2 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition shadow-sm"
            title="Toggle arcade chip sounds"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-indigo-300" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          {character && (
            <button
              onClick={() => {
                sound.playSelect();
                setShowConfigurator(true);
              }}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-400 rounded-xl text-xs text-indigo-200 uppercase tracking-wider font-extrabold transition shadow-sm"
            >
              <span>⚙️ Mod Hero</span>
            </button>
          )}
        </div>
      </header>

      {/* If No Character initialized, force creator */}
      {!character ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <CharacterCreator
            onComplete={(newChar) => {
              saveCharacterToCache(newChar);
            }}
          />
        </div>
      ) : showConfigurator ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative">
            <button
              onClick={() => {
                sound.playSelect();
                setShowConfigurator(false);
              }}
              className="absolute top-4 right-4 z-40 px-3 py-1.5 bg-slate-950 border border-white/10 hover:border-rose-500 rounded-xl text-zinc-400 hover:text-rose-400 text-xs text-center font-bold transition shadow-lg"
            >
              [X] CLOSE MOD
            </button>
            <CharacterCreator
              initialCharacter={character}
              onComplete={(updatedChar) => {
                saveCharacterToCache(updatedChar);
                setShowConfigurator(false);
              }}
            />
          </div>
        </div>
      ) : (
        /* Primary Two-Column Layout Panel */
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6 relative z-10 overflow-hidden">
          
          {/* Sidebar: Hero Info & Diagnostic (4 Column Layout) */}
          <section className="lg:col-span-4 flex flex-col gap-6">
            
            {/* HUD Status box */}
            <div className="glass-panel p-6 shadow-2xl space-y-5 rounded-3xl relative">
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-indigo-500/15 px-2.5 py-1 border border-indigo-500/30 text-[9px] text-indigo-300 font-bold rounded-full tracking-wider">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
                ONLINE
              </div>

              <div className="flex items-center gap-4 pt-2">
                {/* Responsive customized avatar display */}
                <div className={`w-16 h-16 border bg-white/5 rounded-2xl flex items-center justify-center text-4xl shrink-0 ${getAvatarBorderClass(character.color)}`}>
                  {getCharacterEmojiStr(character.avatar)}
                </div>
                <div>
                  <h2 className="text-white text-lg font-bold tracking-wide font-display line-clamp-1">{character.name}</h2>
                  <div className="text-[10px] text-indigo-200/70 uppercase tracking-widest font-black flex items-center gap-1.5 mt-0.5">
                    <span>Level</span>
                    <span className={`text-sm font-black ${getAvatarTextClass(character.color)}`}>{character.level}</span>
                    <span className="text-zinc-500">({character.avatar})</span>
                  </div>
                </div>
              </div>

              {/* XP level representation indicator */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <div className="flex justify-between text-[10px] text-zinc-300">
                  <span className="uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                    System Buffer XP
                  </span>
                  <span className="font-bold text-indigo-300">{character.xp} / {character.level * 100} XP</span>
                </div>
                <div className="w-full h-2.5 bg-white/5 p-0.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${(character.xp / (character.level * 100)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stats values display */}
              <div className="pt-2">
                <h3 className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-1.5">
                  System Attributes
                </h3>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-white/5 p-3 border border-white/5 flex flex-col justify-between rounded-xl relative overflow-hidden">
                    <span className="text-zinc-350 text-[10px]">💻 Hacking:</span>
                    <div className="flex items-baseline mt-1 gap-1 col">
                      <span className="text-indigo-200 font-black text-sm">{activeStats.hacking}</span>
                      {activeStats.hacking > character.stats.hacking && (
                        <span className="text-[9px] text-green-400 font-extrabold">(+{activeStats.hacking - character.stats.hacking})</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 p-3 border border-white/5 flex flex-col justify-between rounded-xl relative overflow-hidden">
                    <span className="text-zinc-350 text-[10px]">⚡ Reflexes:</span>
                    <div className="flex items-baseline mt-1 gap-1">
                      <span className="text-indigo-200 font-black text-sm">{activeStats.reflexes}</span>
                      {activeStats.reflexes > character.stats.reflexes && (
                        <span className="text-[9px] text-green-400 font-extrabold">(+{activeStats.reflexes - character.stats.reflexes})</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 p-3 border border-white/5 flex flex-col justify-between rounded-xl relative overflow-hidden">
                    <span className="text-zinc-350 text-[10px]">🧙 Wisdom:</span>
                    <div className="flex items-baseline mt-1 gap-1">
                      <span className="text-indigo-200 font-black text-sm">{activeStats.wisdom}</span>
                      {activeStats.wisdom > character.stats.wisdom && (
                        <span className="text-[9px] text-green-400 font-extrabold">(+{activeStats.wisdom - character.stats.wisdom})</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 p-3 border border-white/5 flex flex-col justify-between rounded-xl relative overflow-hidden">
                    <span className="text-zinc-350 text-[10px]">🎲 Luck:</span>
                    <div className="flex items-baseline mt-1 gap-1">
                      <span className="text-indigo-200 font-black text-sm">{activeStats.luck}</span>
                      {activeStats.luck > character.stats.luck && (
                        <span className="text-[9px] text-green-400 font-extrabold">(+{activeStats.luck - character.stats.luck})</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Equipped gear slot values */}
              <div className="pt-2 border-t border-white/5">
                <h3 className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-1.5">
                  Equipped Gear Slots
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-zinc-950/40 border border-white/5 p-2 rounded-xl flex flex-col justify-center min-w-0">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-wider block font-bold">Weapon Slot:</span>
                    {character.equippedWeapon ? (
                      <div className="flex items-center gap-1.5 mt-1 text-white font-black truncate">
                        <span>{character.equippedWeapon.icon}</span>
                        <span className="truncate text-[10px]" title={character.equippedWeapon.name}>{character.equippedWeapon.name}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-600 mt-1 italic uppercase text-[8px]">Empty Slot</span>
                    )}
                  </div>
                  <div className="bg-zinc-950/40 border border-white/5 p-2 rounded-xl flex flex-col justify-center min-w-0">
                    <span className="text-[8px] text-zinc-500 uppercase tracking-wider block font-bold">Cosmetic:</span>
                    {character.equippedCosmetic ? (
                      <div className="flex items-center gap-1.5 mt-1 text-white font-black truncate">
                        <span>{character.equippedCosmetic.icon}</span>
                        <span className="truncate text-[10px]" title={character.equippedCosmetic.name}>{character.equippedCosmetic.name}</span>
                      </div>
                    ) : (
                      <span className="text-zinc-650 mt-1 italic uppercase text-[8px]">Empty Slot</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modify loadout action */}
              <button
                onClick={() => {
                  sound.playSelect();
                  setShowConfigurator(true);
                }}
                className="w-full md:hidden py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-[10px] uppercase font-bold text-zinc-200"
              >
                Change Frame Customizations
              </button>
            </div>

            {/* Retro Instruction Card box */}
            <div className="glass-panel p-6 shadow-2xl text-xs space-y-4 rounded-3xl hidden lg:block">
              <h3 className="font-bold uppercase tracking-wider text-indigo-300 border-b border-white/10 pb-2 font-display">
                How-To Play
              </h3>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                Type any prompt (e.g., Code help, history trivia, brewing recipes).
              </p>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                Upon submittal, the AI secures the decrypted output behind a prompt-specific arcade minigame block.
              </p>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                Crack the game by solving the challenges to completely unpack and display the answer block.
              </p>
            </div>

            {/* Interactive Armory & Inventory list */}
            <div className="glass-panel p-5 shadow-2xl space-y-4 rounded-3xl flex flex-col">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h3 className="font-bold uppercase tracking-wider text-indigo-300 font-display text-[11px] flex items-center gap-1.5">
                  🎒 Hero Storage Inventory ({(character.inventory || []).length})
                </h3>
              </div>

              {(character.inventory || []).length === 0 ? (
                <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl text-[10px] text-zinc-500 space-y-1">
                  <p className="uppercase font-bold">No loot collected yet</p>
                  <p className="text-[9px]">Beat prompt challenges to acquire gear & weaponry!</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {(character.inventory || []).map((item) => {
                    const isEquipped = character.equippedWeapon?.id === item.id || character.equippedCosmetic?.id === item.id;
                    const isSelected = selectedInventoryItem?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          sound.playSelect();
                          setSelectedInventoryItem(item);
                        }}
                        className={`aspect-square rounded-xl bg-white/5 border text-lg flex items-center justify-center relative hover:bg-white/10 hover:border-indigo-400 transition ${isEquipped ? "border-green-400 ring-2 ring-green-400/20" : isSelected ? "border-indigo-400" : "border-white/10"}`}
                        title={item.name}
                      >
                        <span>{item.icon}</span>
                        {isEquipped && (
                          <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-green-400 border border-black rounded-full flex items-center justify-center animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected Item detailed control panel */}
              {selectedInventoryItem && (
                <div className="bg-zinc-950/75 border border-white/10 p-3 rounded-2xl space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => setSelectedInventoryItem(null)}
                    className="absolute top-2 right-2 text-zinc-500 hover:text-white font-bold text-[9px]"
                  >
                    [CLOSE]
                  </button>
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl bg-white/5 border border-white/10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                      {selectedInventoryItem.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase text-white truncate">{selectedInventoryItem.name}</div>
                      <div className="text-[8px] text-zinc-400 uppercase font-bold mt-0.5 tracking-wider">
                        Type: {selectedInventoryItem.type} • Bonus: +{selectedInventoryItem.bonusValue} {selectedInventoryItem.statBonus}
                      </div>
                    </div>
                  </div>
                  <p className="text-[9.5px] text-zinc-300 italic leading-snug">
                    "{selectedInventoryItem.description}"
                  </p>

                  <div className="flex gap-2">
                    {character.equippedWeapon?.id === selectedInventoryItem.id || character.equippedCosmetic?.id === selectedInventoryItem.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleUnequipItem(selectedInventoryItem.type);
                          setSelectedInventoryItem(null);
                        }}
                        className="flex-1 py-1.5 bg-rose-950/40 border border-rose-500/30 hover:border-rose-400 text-rose-350 text-[9px] uppercase font-bold rounded-lg transition"
                      >
                        Unequip Item
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          handleEquipItem(selectedInventoryItem);
                          setSelectedInventoryItem(null);
                        }}
                        className="flex-1 py-1.5 bg-indigo-500/20 border border-indigo-400/40 hover:border-indigo-450 text-indigo-200 text-[9px] uppercase font-bold rounded-lg transition animate-pulse"
                      >
                        Equip Gear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </section>

          {/* Main Workspace Frame: Chat and Challenge Board (8 Columns) */}
          <main className="lg:col-span-8 flex flex-col glass-panel-deep shadow-2xl rounded-[32px] overflow-hidden relative">
            
            {/* Soft scanline styling */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.06)_50%)] bg-[size:100%_4px] pointer-events-none z-10 opacity-30" />

            {/* Work terminal header */}
            <div className="bg-white/5 border-b border-white/10 py-3 px-6 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-pulse" />
                <span className="text-zinc-300 uppercase font-black tracking-widest text-[9.5px]">
                  Secure Decryption Buffer Terminal
                </span>
              </div>
              
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChatCache}
                  className="text-[9.5px] uppercase font-bold text-zinc-400 hover:text-rose-400 transition"
                >
                  [WIPE TERMINAL CACHE]
                </button>
              )}
            </div>

            {/* Messages Stream Container */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 max-h-[50vh] lg:max-h-[62vh] relative select-text flex flex-col">
              {messages.length === 0 ? (
                <div className="h-full flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 select-none my-auto">
                  <div className="text-6xl animate-pulse filter drop-shadow-[0_0_15px_rgba(129,140,248,0.4)]">🛰️</div>
                  <h3 className="text-md font-bold uppercase text-indigo-200 tracking-wider font-display">
                    Console data logs empty
                  </h3>
                  <p className="text-[11px] text-zinc-400 max-w-sm leading-relaxed uppercase tracking-wider">
                    Initialize connection by typing your first prompt in the input tray below.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.sender === "user";
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"} items-start max-w-[90%] ${isUser ? "self-end" : "self-start"}`}
                    >
                      {/* Avatar Bubble */}
                      <div className={`w-10 h-10 rounded-full shrink-0 border border-white/20 flex items-center justify-center text-lg ${
                        isUser 
                          ? "bg-gradient-to-tr from-pink-500 to-indigo-500 shadow-lg shadow-indigo-500/20" 
                          : "bg-indigo-600/30 text-indigo-200 shadow-md"
                      }`}>
                        {isUser ? getCharacterEmojiStr(character.avatar) : "🤖"}
                      </div>

                      <div className="flex flex-col space-y-1">
                        {/* Name / Timestamp header */}
                        <span className={`text-[9px] text-zinc-450 font-bold uppercase tracking-wider ${isUser ? "text-right" : "text-left"}`}>
                          {isUser ? character.name : "Core Network AI"} • {m.timestamp}
                        </span>

                        {/* Main bubble */}
                        <div
                          className={`p-4 rounded-2xl ${
                            isUser 
                              ? "bg-white/10 border border-white/15 text-white rounded-tr-none" 
                              : m.isLocked 
                              ? "bg-slate-900/60 border-2 border-indigo-500/40 rounded-tl-none text-zinc-200" 
                              : "bg-indigo-950/20 border border-indigo-500/30 rounded-tl-none text-zinc-100"
                          } text-xs sm:text-sm leading-relaxed shadow-xl`}
                        >
                          {/* Markdown answer render or locked indicator */}
                          {isUser ? (
                            <p className="whitespace-pre-wrap select-text">{m.text}</p>
                          ) : m.isLocked && m.challenge ? (
                            /* Locked Challenge Block UI layout (Designed exactly like the gorgeous quest card in Mockup) */
                            <div className="space-y-4 py-1">
                              <div className="flex items-center gap-2 border-b border-indigo-500/20 pb-2 text-indigo-400">
                                <Zap className="w-4 h-4 text-pink-400 animate-pulse fill-current" />
                                <span className="font-extrabold uppercase tracking-widest text-[10px] bg-gradient-to-r from-pink-400 to-indigo-300 bg-clip-text text-transparent">
                                  QUEST CHALLENGE ACTIVATED
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                <span className="text-[9.5px] uppercase tracking-wider text-indigo-300/80 block font-bold leading-none">
                                  Difficulty: {m.challenge.levelDifficulty} // Reward: +{m.challenge.xpReward} XP
                                </span>
                                <h4 className="text-md font-black text-white uppercase tracking-wider font-display bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                                  {m.challenge.challengeTitle}
                                </h4>
                                <p className="text-xs text-zinc-300 leading-relaxed italic border-l-2 border-indigo-400/50 pl-2.5 py-0.5">
                                  "{m.challenge.challengeIntro}"
                                </p>
                              </div>

                              {/* Game instructions tease depending on task type selectors */}
                              <div className="bg-black/50 border border-white/10 rounded-2xl p-4 text-[10px] text-zinc-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-left">
                                  <span className="font-bold text-white text-xs block mb-0.5">
                                    {m.challenge.challengeType === "grid_collector"
                                      ? "🕹️ Grid Collector Game Mode"
                                      : m.challenge.challengeType === "trivia_boss_battle"
                                      ? "⚔️ Turn-Based Boss Battle"
                                      : "🔐 Cryptographic Code Decoder"}
                                  </span>
                                  <span className="text-[10px] block text-zinc-400 leading-normal mt-0.5">
                                    Beat this challenge to completely unpack and reveal your prompt answer!
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenChallengeMatrix(m.id, m.challenge!)}
                                  className="w-full sm:w-auto px-5 py-2.5 glass-btn-indigo text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl transition"
                                >
                                  [ENTER CHALLENGE MATRIX]
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Unlocked Prompt Output display (complete Markdown answers) */
                            <div className="space-y-3 py-1 select-text">
                              {!isUser && m.challenge && (
                                <div className="flex items-center gap-1.5 bg-indigo-500/15 px-2.5 py-1 border border-indigo-500/30 text-[9px] text-indigo-350 font-bold max-w-fit mb-2 rounded-lg">
                                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                                  DECRYPTED PROMPT SECURE (SUCCESS AT {m.completedAt})
                                </div>
                              )}
                              <div className="whitespace-pre-line text-zinc-200 select-text leading-relaxed">
                                {m.text}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Streaming AI diagnostics loader */}
              {isGenerating && (
                <div className="flex gap-4 items-start max-w-2xl self-start">
                  <div className="w-10 h-10 rounded-full shrink-0 border border-white/20 bg-indigo-600/30 flex items-center justify-center text-sm animate-pulse text-indigo-200 shadow-md">
                    ⏳
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-[9px] text-zinc-450 font-bold uppercase tracking-wider">
                      Core Network AI • PROCESSING...
                    </span>
                    <div className="p-4 glass-panel border-indigo-500/30 rounded-2xl rounded-tl-none text-xs text-indigo-100 space-y-2 animate-pulse">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                        <span className="font-bold tracking-wide uppercase text-pink-350">DIALING CENTRAL SECURE HOSTS...</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono leading-relaxed uppercase">
                        [SYS_LOAD]: RETRIEVING RESPONSE PAC-MATRIX // PACKING CHALLENGE CYPHERS & BUFFERS. standy...
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatBottomAnchorRef} />
            </div>

            {/* Keyboard Entry tray (Designed exactly like the gorgeous mockup tray) */}
            <form
              onSubmit={handlePromptSubmit}
              className="border-t border-white/10 p-4 bg-white/5 backdrop-blur-2xl relative z-20 flex gap-3"
            >
              <input
                type="text"
                value={userPromptInput}
                onChange={(e) => setUserPromptInput(e.target.value)}
                disabled={isGenerating}
                placeholder="Type your prompt to generate a new quest..."
                className="flex-1 glass-input text-white p-3.5 px-5 text-xs sm:text-sm outline-none font-medium rounded-2xl placeholder-white/30 shadow-inner"
              />
              <button
                type="submit"
                disabled={isGenerating || !userPromptInput.trim()}
                className="px-6 glass-btn-indigo text-white hover:bg-indigo-400 disabled:opacity-30 transition font-bold uppercase text-xs rounded-2xl flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Transmit</span>
              </button>
            </form>

          </main>
        </div>
      )}

      {/* Dynamic Game Overlay Panels modal */}
      {activeGameType && activeGamePayload && activeCharacter && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-250">
            {activeGameType === "grid_collector" && (
              <GridCollectorGame
                character={activeCharacter}
                gameData={activeGamePayload.gridCollectorData}
                xpReward={activeGamePayload.xpReward}
                gameModifier={activeGamePayload.gameModifier}
                onWin={handleGameWin}
                onLose={handleGameLose}
                onClose={() => {
                  sound.playSelect();
                  setActivePlayMessageId(null);
                  setActiveGameType(null);
                  setActiveGamePayload(null);
                }}
              />
            )}

            {activeGameType === "trivia_boss_battle" && (
              <TriviaBossBattle
                character={activeCharacter}
                gameData={activeGamePayload.triviaBossData}
                xpReward={activeGamePayload.xpReward}
                gameModifier={activeGamePayload.gameModifier}
                onWin={handleGameWin}
                onLose={handleGameLose}
                onClose={() => {
                  sound.playSelect();
                  setActivePlayMessageId(null);
                  setActiveGameType(null);
                  setActiveGamePayload(null);
                }}
              />
            )}

            {activeGameType === "firewall_decrypt" && (
              <FirewallDecrypt
                character={activeCharacter}
                gameData={activeGamePayload.firewallDecryptData}
                xpReward={activeGamePayload.xpReward}
                gameModifier={activeGamePayload.gameModifier}
                onWin={handleGameWin}
                onLose={handleGameLose}
                onClose={() => {
                  sound.playSelect();
                  setActivePlayMessageId(null);
                  setActiveGameType(null);
                  setActiveGamePayload(null);
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Dynamic Item Loot Reward Unlocked Popup */}
      {unlockedItemReward && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm glass-panel border-indigo-400 p-6 rounded-[32px] text-center space-y-5 relative shadow-[0_0_50px_rgba(129,140,248,0.35)]">
            <div className="absolute inset-x-0 -top-12 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-indigo-500/10 border-2 border-indigo-400 flex items-center justify-center text-4xl shadow-xl shadow-indigo-500/20 animate-bounce">
                {unlockedItemReward.icon}
              </div>
            </div>

            <div className="pt-8 space-y-1">
              <span className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-[0.2em] block">
                LOOT DROPPED BY GATEKEEPER!
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-wider font-display">
                {unlockedItemReward.name}
              </h3>
              <div className="text-[10.5px] text-green-400 font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 mt-1">
                <span>⚔️ {unlockedItemReward.type}</span>
                <span>•</span>
                <span>+{unlockedItemReward.bonusValue} {unlockedItemReward.statBonus} Bonus</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed italic px-2">
              "{unlockedItemReward.description}"
            </p>

            <div className="bg-white/5 border border-white/5 p-3 rounded-2xl text-[9px] text-zinc-400 text-left space-y-1">
              <span className="font-extrabold text-zinc-300 uppercase block mb-1">Item Description:</span>
              <div>• Power level scales with player levels and unlocks dynamic buffs in future hacking sessions.</div>
              <div>• Manage & equip this item directly inside your retro Storage Inventory sidebar!</div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  handleEquipItem(unlockedItemReward);
                  setUnlockedItemReward(null);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-pink-500 hover:opacity-90 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl transition shadow-lg"
              >
                Equip Now
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playSelect();
                  setUnlockedItemReward(null);
                }}
                className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 font-bold uppercase text-[10px] tracking-wider rounded-xl transition"
              >
                Store in Bag
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

