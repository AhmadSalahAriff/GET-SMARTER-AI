/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { RetroCharacter, FirewallDecryptData } from "../types";
import { sound } from "./SoundManager";
import { KeyRound, ShieldAlert, Play, CheckCircle, Lightbulb, Keyboard } from "lucide-react";

interface FirewallDecryptProps {
  character: RetroCharacter;
  gameData: FirewallDecryptData;
  xpReward: number;
  gameModifier?: string;
  onWin: (xpGained: number) => void;
  onLose: () => void;
  onClose: () => void;
}

export default function FirewallDecrypt({
  character,
  gameData,
  xpReward,
  gameModifier = "none",
  onWin,
  onLose,
  onClose,
}: FirewallDecryptProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedInput, setTypedInput] = useState("");
  const [hintUsedCount, setHintUsedCount] = useState(0);

  // Allowed faults increases with character's wisdom level
  const baseAllowedErrors = 4 + Math.floor(character.stats.wisdom / 2);
  const [errorsLeft, setErrorsLeft] = useState(baseAllowedErrors);

  const [cipherStates, setCipherStates] = useState(
    gameData.ciphers.map(() => ({ solved: false }))
  );

  const startDecrypt = () => {
    setIsPlaying(true);
    setCurrentIndex(0);
    setTypedInput("");
    setHintUsedCount(0);
    setErrorsLeft(baseAllowedErrors);
    setCipherStates(gameData.ciphers.map(() => ({ solved: false })));
    sound.playSelect();
  };

  const currentCipher = gameData.ciphers[currentIndex];

  const handleRevealLetterHint = () => {
    if (hintUsedCount >= 2) {
      sound.playError();
      return;
    }
    setHintUsedCount(hintUsedCount + 1);
    sound.playSelect();
  };

  const handleVerifySubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;

    const userGuess = typedInput.trim().toUpperCase();
    const solution = currentCipher.solutionWord.trim().toUpperCase();

    if (userGuess === solution) {
      sound.playLaser();
      const updatedStates = [...cipherStates];
      updatedStates[currentIndex].solved = true;
      setCipherStates(updatedStates);

      if (currentIndex < gameData.ciphers.length - 1) {
        // Advance to next word
        setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
          setTypedInput("");
          setHintUsedCount(0);
          sound.playSelect();
        }, 1000);
      } else {
        // All words solved! Ultimate hacker victory
        setTimeout(() => {
          sound.playWin();
          onWin(xpReward);
        }, 1200);
      }
    } else {
      // Luck can trigger dynamic protection against command error tracking
      const isLuckyAvoider = character.stats.luck >= 3 && Math.random() < 0.25;
      
      if (isLuckyAvoider) {
        sound.playLaser(); // trigger secondary shield bounce audio cue
        setTypedInput("");
        // No decrement!
      } else {
        sound.playDamage();
        const nextErrors = errorsLeft - 1;
        setErrorsLeft(nextErrors);
        setTypedInput("");
        
        if (nextErrors <= 0) {
          // Too many errors, console locked down
          setTimeout(() => {
            sound.playError();
            onLose();
          }, 1200);
        }
      }
    }
  };

  // Helper to pre-calculate hint letters based on hacking stat
  const getHelperHintString = () => {
    const solution = currentCipher.solutionWord.toUpperCase();
    
    // Check automatic letter reveals from character's Hacking skill
    const showStart = character.stats.hacking >= 3 || hintUsedCount >= 1;
    const showEnd = character.stats.hacking >= 5 || hintUsedCount >= 2;
    
    if (showStart && showEnd) {
      return `HACKING MATRIX SCAN: Starts with "${solution.charAt(0)}" ... Ends with "${solution.charAt(solution.length - 1)}" [Word Length: ${solution.length}]`;
    }
    if (showStart) {
      return `HACKING MATRIX SCAN: Starts with "${solution.charAt(0)}" [Word Length: ${solution.length}]`;
    }
    return `Decrypt diagnostic code lock. [Word Length: ${solution.length}]`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-black border-4 border-emerald-500 rounded-none shadow-[0_0_20px_rgba(16,185,129,0.35)] text-zinc-100 overflow-hidden font-mono">
      {/* Header */}
      <div className="bg-emerald-950 p-4 border-b-4 border-emerald-500 flex justify-between items-center">
        <div>
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest block">Minigame Challenge</span>
          <h2 className="text-md sm:text-lg font-bold text-white uppercase tracking-wider">
            🔐 FIREWALL CRYPTO DECODER (WORD PUZZLE)
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
        
        {/* Intro Card */}
        {!isPlaying && (
          <div className="space-y-4 bg-zinc-900 border-2 border-zinc-800 p-4 rounded-none">
            <div className="text-xs text-emerald-400 uppercase tracking-widest font-bold">
              SYSTEM SYSTEM CRYPTO WARNING:
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {gameData.description || "Prompt contents security block activated. Multiple vocabulary sub-keys have been scrambled by our data firewall. Unscramble and input each key term to bypass the decrypt block."}
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
                    {gameModifier === "time_dilation" && "Time is dilated! Extra attempt recovery circuits are active, but decryption streams require precision."}
                    {gameModifier === "mirror_dimension" && "Inverse mirror patterns! Letters are reversed or scrambled with higher entropy."}
                    {gameModifier === "quantum_static" && "Static scan is active, granting protective shield integrity buffers."}
                    {!["time_dilation", "mirror_dimension", "quantum_static"].includes(gameModifier) && "Unique logic barriers are operating on this key segment!"}
                  </p>
                </div>
                <div className="text-2xl animate-pulse">🔮</div>
              </div>
            )}

            {/* Buff info */}
            <div className="bg-zinc-950 border border-zinc-800 p-3 text-[10px] space-y-2 text-zinc-400">
              <div className="font-bold text-zinc-300 uppercase tracking-wider">Hacking Node Attributes:</div>
              <div>🧑‍💻 Character Hacking Level: <span className="text-emerald-400 font-bold">{character.stats.hacking}</span></div>
              {character.stats.hacking >= 4 ? (
                <div className="text-emerald-400 font-bold">💎 ATTRIBUTE MASTER: Auto-bypass hints unlocked!</div>
              ) : (
                <div className="text-zinc-600">Raise hacking level on future challenges to unlock richer decrypt diagnostics.</div>
              )}
            </div>

            <button
              onClick={startDecrypt}
              className="w-full py-3 bg-emerald-500 text-black hover:bg-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2 px-4 transition active:translate-y-0.5 rounded-none"
            >
              <Play className="w-4 h-4 fill-current" />
              Begin Firewall Bypass
            </button>
          </div>
        )}

        {/* Play interface */}
        {isPlaying && currentCipher && (
          <div className="space-y-6">
            
            {/* Navigation and Cipher selection bars */}
            <div className="flex border-2 border-zinc-800 bg-zinc-950 p-2.5 justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">STATUS:</span>
                <span className="bg-emerald-950 text-emerald-400 font-extrabold px-2 py-0.5 animate-pulse rounded text-[10px]">
                  SECURE CIPHER HACKING IN PROGRESS
                </span>
              </div>
              <div className="text-red-400 font-bold flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" />
                Console Lockdown after: <span className="text-white font-extrabold">{errorsLeft} faulty attempts</span>
              </div>
            </div>

            {/* Scrambled term presentation block */}
            <div className="bg-zinc-900 border-2 border-zinc-800 p-6 flex flex-col items-center justify-center text-center space-y-4 rounded-none relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:100%_8px] pointer-events-none" />
              
              <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-black">
                CORRUPTED PACKET STRING {currentIndex + 1} OF {gameData.ciphers.length}
              </span>

              {/* Scrambled Cipher letters */}
              <div className="text-3xl sm:text-4xl font-extrabold bg-zinc-950 p-4 border border-emerald-500/30 text-emerald-300 tracking-[0.25em] pl-6 select-none shadow-md animate-pulse">
                {currentCipher.scrambledWord}
              </div>

              {/* Clues provided by AI */}
              <div className="space-y-1.5 pt-2 max-w-md">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Firewall Clue:</span>
                <p className="text-xs text-zinc-300 italic leading-relaxed">
                  "{currentCipher.clue}"
                </p>
              </div>

              {/* Letter helpers based on Hint counts or high Hacking skill */}
              {(hintUsedCount > 0 || character.stats.hacking >= 3) && (
                <div className="bg-zinc-950/70 border border-emerald-500/20 px-3 py-1.5 rounded text-[10px] text-emerald-400">
                  {getHelperHintString()}
                </div>
              )}
            </div>

            {/* Input Submission Terminal Form */}
            <form onSubmit={handleVerifySubmission} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-3 text-zinc-600 font-bold select-none text-xs">
                    SYS_CMD_IN&gt;
                  </div>
                  <input
                    type="text"
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    autoFocus
                    placeholder="Enter decrypted word in upper/lowercase..."
                    className="w-full bg-zinc-950 border-2 border-zinc-800 focus:border-emerald-500 pl-28 pr-4 py-2.5 text-zinc-200 outline-none text-sm font-bold tracking-widest uppercase rounded-none placeholder-zinc-700 shadow-inner"
                  />
                </div>

                <div className="flex gap-2 shrink-0">
                  {/* Tooltip hint buttons */}
                  <button
                    type="button"
                    onClick={handleRevealLetterHint}
                    disabled={hintUsedCount >= 2 || character.stats.hacking + hintUsedCount >= 8}
                    className="px-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:opacity-20 flex items-center justify-center gap-1 rounded-none text-xs"
                    title="Unlock a character diagnostic character helper"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    Reveal Hint
                  </button>

                  <button
                    type="submit"
                    disabled={!typedInput.trim()}
                    className="px-6 py-2.5 bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-40 font-bold uppercase text-xs rounded-none active:translate-y-0.5 flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    Bypass Port
                  </button>
                </div>
              </div>

              {/* Step Indicators dots */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Hacking Nodes Completed:</span>
                <div className="flex gap-1.5 pt-0.5">
                  {cipherStates.map((state, sIdx) => {
                    let dotColor = "bg-zinc-800 border-zinc-700";
                    if (sIdx === currentIndex) {
                      dotColor = "bg-amber-600 border-amber-500 animate-pulse";
                    } else if (state.solved) {
                      dotColor = "bg-emerald-500 border-emerald-400";
                    }
                    return (
                      <span
                        key={sIdx}
                        className={`w-3.5 h-3.5 border rounded-none ${dotColor} transition-all`}
                      />
                    );
                  })}
                </div>
              </div>
            </form>

          </div>
        )}
      </div>
    </div>
  );
}
