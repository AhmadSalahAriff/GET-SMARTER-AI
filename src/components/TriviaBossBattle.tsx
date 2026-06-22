/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { RetroCharacter, TriviaBossData } from "../types";
import { sound } from "./SoundManager";
import { Award, ShieldAlert, Heart, Play, Zap, HelpCircle } from "lucide-react";

interface TriviaBossBattleProps {
  character: RetroCharacter;
  gameData: TriviaBossData;
  xpReward: number;
  gameModifier?: string;
  onWin: (xpGained: number) => void;
  onLose: () => void;
  onClose: () => void;
}

export default function TriviaBossBattle({
  character,
  gameData,
  xpReward,
  gameModifier = "none",
  onWin,
  onLose,
  onClose,
}: TriviaBossBattleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [bossHealth, setBossHealth] = useState(100);
  const maxBossHealth = gameModifier === "boss_rage" ? 120 : 100;
  
  // Player Health scales with Wisdom stat
  const playerMaxHealth = 3 + character.stats.wisdom * 2;
  const [playerHealth, setPlayerHealth] = useState(playerMaxHealth);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([
    `🛡️ Entered battlefield: Faction gatekeeper ${gameData.bossName} detected!`
  ]);

  // Option auto-hacked and bypassed by high hacking level (array for multiples)
  const [hackedOptionIndices, setHackedOptionIndices] = useState<number[]>([]);

  // Player items (Heal once per battle / starts with 2 if Pizza slice equipped)
  const [potionCount, setPotionCount] = useState(character.weapon === "pizza-slice" ? 2 : 1);
  const [megaBlasterUsed, setMegaBlasterUsed] = useState(false);

  // Stats buffs calculation
  const luckCritMultiplier = character.stats.luck >= 5 ? 1.5 : 1; 

  // Helper to run hacking scan on current puzzle
  const triggerHackingAssist = (questionIdx: number) => {
    const isWizardHat = character.headpiece === "wizard-hat";
    if (character.stats.hacking >= 3 && gameData.questions[questionIdx]) {
      const q = gameData.questions[questionIdx];
      const wrongIndices: number[] = [];
      q.options.forEach((_, idx) => {
        if (idx !== q.correctAnswerIndex) {
          wrongIndices.push(idx);
        }
      });
      if (wrongIndices.length > 0) {
        // Wizard Hat automatically isolates 2 wrong indicators!
        if (isWizardHat && wrongIndices.length >= 2) {
          const firstWrong = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
          const remainder = wrongIndices.filter(idx => idx !== firstWrong);
          const secondWrong = remainder[Math.floor(Math.random() * remainder.length)];
          setHackedOptionIndices([firstWrong, secondWrong]);
          setBattleLog((prev) => [
            `📡 WIZARD HAT DE-BUFFER: Isolated and crossed out Option [${String.fromCharCode(64 + firstWrong + 1)}] and Option [${String.fromCharCode(64 + secondWrong + 1)}]!`,
            ...prev
          ]);
        } else {
          const randomWrong = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
          setHackedOptionIndices([randomWrong]);
          setBattleLog((prev) => [
            `📡 HACK TRACE ACTIVE: System diagnostics crossed out Option [${String.fromCharCode(64 + randomWrong + 1)}]!`,
            ...prev
          ]);
        }
      } else {
        setHackedOptionIndices([]);
      }
    } else {
      setHackedOptionIndices([]);
    }
  };

  const startBattle = () => {
    setIsPlaying(true);
    setBossHealth(maxBossHealth);
    setPlayerHealth(playerMaxHealth);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setPotionCount(character.weapon === "pizza-slice" ? 2 : 1);
    setMegaBlasterUsed(false);
    setBattleLog([
      `⚠️ ${gameData.bossName} screams: "${gameData.bossIntroDialog || "You shall not hack my binary vault!"}"`
    ]);
    triggerHackingAssist(0);
    sound.playSelect();
  };

  const handleUsePotion = () => {
    if (potionCount <= 0 || playerHealth >= playerMaxHealth) {
      sound.playError();
      return;
    }
    const healAmt = character.weapon === "cyber-staff" ? 5 : 3;
    const actualHeal = Math.min(playerMaxHealth - playerHealth, healAmt);
    setPlayerHealth(playerHealth + actualHeal);
    
    // Cyber Staff has a 50% chance of duplicating potion charge!
    const saved = character.weapon === "cyber-staff" && Math.random() < 0.5;
    if (!saved) {
      setPotionCount((prev) => prev - 1);
    }

    setBattleLog((prev) => [
      `🧪 Restored +${actualHeal} Core Integrity units!${saved ? " (🔮 Cyber Staff preserved potion!)" : ""}`,
      ...prev,
    ]);
    sound.playSelect();
  };

  const handleMegaBlasterStrike = () => {
    if (megaBlasterUsed || character.weapon !== "mega-blaster" || isAnswered) {
      sound.playError();
      return;
    }
    setMegaBlasterUsed(true);
    setIsAnswered(true);
    setSelectedOption(currentQuestion.correctAnswerIndex);
    
    // Direct 35 damage bypass code!
    const nextBossHealth = Math.max(0, bossHealth - 35);
    setBossHealth(nextBossHealth);
    setBattleLog((prev) => [
      `🔫 PHASE BLASTER DISCHARGE: Instantly deals 35 Damage and auto-validates question!`,
      ...prev,
    ]);
    sound.playLaser();
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered || hackedOptionIndices.includes(idx)) return;
    setSelectedOption(idx);
    sound.playSelect();
  };

  const currentQuestion = gameData.questions[currentQuestionIndex];

  const handleConfirmAnswer = () => {
    if (selectedOption === null || isAnswered) {
      sound.playError();
      return;
    }

    setIsAnswered(true);
    const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;

    if (isCorrect) {
      sound.playLaser();
      
      // We are matching stats impact: reflexes & item attributes
      let bonusWeaponDmg = 0;
      if (character.weapon === "pixel-sword") {
        bonusWeaponDmg += 15;
      }
      if (character.headpiece === "ninja-band") {
        bonusWeaponDmg += 10;
      }

      const baseDmg = gameModifier === "boss_rage" ? 55 : (35 + character.stats.reflexes * 3);
      const isCrit = Math.random() < (character.stats.luck * 0.1); // Luck is crit rate
      let actualDmg = isCrit ? Math.floor(baseDmg * 1.5) : baseDmg;
      actualDmg += bonusWeaponDmg;

      const nextBossHealth = Math.max(0, bossHealth - actualDmg);

      let healWisdom = Math.floor(character.stats.wisdom / 2);
      if (gameModifier === "time_dilation") healWisdom += 1;
      const actualHeal = Math.min(playerMaxHealth - playerHealth, healWisdom);
      if (actualHeal > 0) {
        setPlayerHealth((prev) => prev + actualHeal);
      }

      setBossHealth(nextBossHealth);
      setBattleLog((prev) => [
        `💥 CRITICAL HIT! Answer Correct. Dealt ${actualDmg} damage to ${gameData.bossName}!`,
        ...(actualHeal > 0 ? [`💖 Wisdom Absorption: Restored +${actualHeal} Integrity HP.`] : []),
        `📝 INFO: ${currentQuestion.explanation}`,
        ...prev,
      ]);

      if (nextBossHealth <= 0) {
        // Victory!
        setTimeout(() => {
          sound.playWin();
          onWin(xpReward);
        }, 1200);
        return;
      }
    } else {
      sound.playDamage();
      
      // Shield blocking throw: floppy-shield blocks incorrect replies with 45% rate
      const hasFloppyShield = character.weapon === "floppy-shield";
      let bossDmg = gameModifier === "boss_rage" ? 2 : 1;
      
      // Space Helmet safety filter against Boss rage modifier
      if (gameModifier === "boss_rage" && character.headpiece === "space-helmet") {
        bossDmg = 1;
      }

      const isFloppyBlocked = hasFloppyShield && Math.random() < 0.45;
      const isEvaded = !isFloppyBlocked && character.stats.luck >= 3 && Math.random() < 0.2;

      if (isFloppyBlocked) {
        setBattleLog((prev) => [
          `💾 FLOPPY BUFFER BLOCKED HIT: Absorbed ${bossDmg} Damage completely!`,
          `📝 CORRECT STUDY: Answer is "${currentQuestion.options[currentQuestion.correctAnswerIndex]}". ${currentQuestion.explanation}`,
          ...prev,
        ]);
      } else if (isEvaded) {
        setBattleLog((prev) => [
          `🛡️ LUCK BONUS FLUID: Dodged damage completely!`,
          `📝 CORRECT STUDY: Answer is "${currentQuestion.options[currentQuestion.correctAnswerIndex]}". ${currentQuestion.explanation}`,
          ...prev,
        ]);
      } else {
        const nextPlayerHealth = Math.max(0, playerHealth - bossDmg);
        setPlayerHealth(nextPlayerHealth);
        setBattleLog((prev) => [
          `❌ INCORRECT ANSWER! Lost ${bossDmg} integrity HP.`,
          `📝 CORRECT STUDY: Answer is "${currentQuestion.options[currentQuestion.correctAnswerIndex]}". ${currentQuestion.explanation}`,
          ...prev,
        ]);

        if (nextPlayerHealth <= 0) {
          // Defeat!
          setTimeout(() => {
            sound.playError();
            onLose();
          }, 1200);
          return;
        }
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < gameData.questions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswered(false);
      triggerHackingAssist(nextIdx);
      sound.playSelect();
    } else {
      // Questions ran out and boss is still alive! Player earns draw/loss depending on remaining health
      if (bossHealth <= 30) {
        // Close enough, let them win!
        sound.playWin();
        onWin(Math.floor(xpReward * 0.8));
      } else {
        // Failed
        sound.playError();
        onLose();
      }
    }
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

  return (
    <div className="w-full max-w-2xl mx-auto bg-black border-4 border-emerald-500 rounded-none shadow-[0_0_20px_rgba(16,185,129,0.35)] text-zinc-100 overflow-hidden font-mono">
      {/* Header */}
      <div className="bg-emerald-950 p-4 border-b-4 border-emerald-500 flex justify-between items-center">
        <div>
          <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest block">Minigame Challenge</span>
          <h2 className="text-md sm:text-lg font-bold text-white uppercase tracking-wider">
            ⚔️ MONSTER COMPILER (TRIVIA BATTLE)
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
        
        {/* Intro / Lobby Screen */}
        {!isPlaying && (
          <div className="space-y-4 bg-zinc-900 border-2 border-zinc-800 p-4 rounded-none">
            <div className="flex items-center gap-4 border-b border-zinc-800 pb-3">
              <div className="w-16 h-16 bg-zinc-950 border border-red-500 rounded flex items-center justify-center text-4xl animate-bounce">
                👾
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">{gameData.bossName}</h3>
                <p className="text-[10px] text-zinc-400">{gameData.bossDescription || "A chaotic logic entity blocking the AI memory cells."}</p>
              </div>
            </div>

            <div className="text-xs text-zinc-300 leading-relaxed space-y-2">
              <p>
                To crack this data gatekeeper, answer prompt-specific trivia questions correctly to deal damage.
              </p>
              <p className="italic text-zinc-500">
                Warning: Incorrect replies trigger server retaliation strikes, depleting your character's integrity cores.
              </p>
            </div>

            {/* Dynamic Game Modifier Box */}
            {gameModifier && gameModifier !== "none" && (
              <div className="bg-purple-950/30 border border-purple-500/40 p-3 rounded-none relative overflow-hidden flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-purple-400 uppercase font-black tracking-widest block mb-0.5">🔮 QUEST LEVEL MODIFIER:</span>
                  <p className="text-white text-xs font-extrabold uppercase">
                    👾 {gameModifier.replace(/_/g, " ")}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {gameModifier === "boss_rage" && "The Boss is ENRAGED! Deals double damage (2 HP), but core hit answers deal massive bonus damage (+55 HP)!"}
                    {gameModifier === "time_dilation" && "Time is dilated! Every correct trivia reply auto-reconstructs +1 Integrity HP."}
                    {gameModifier === "mirror_dimension" && "Inverse logic waves are active! Answers flucutate, proceed with caution."}
                    {!["boss_rage", "time_dilation", "mirror_dimension"].includes(gameModifier) && "Special custom logic filters are active for this gatekeeper!"}
                  </p>
                </div>
                <div className="text-2xl animate-pulse">🔮</div>
              </div>
            )}

            {/* Stat configuration display */}
            <div className="bg-zinc-950 border-2 border-zinc-800 p-2.5 text-[10px] space-y-1 text-zinc-400">
              <div className="font-bold text-zinc-300 uppercase tracking-wider pb-1">Ready Battle Loadout:</div>
              <div>🧑‍🚀 Name: <span className="text-white font-bold">{character.name}</span></div>
              <div>🧪 Wisdom Level: <span className="text-emerald-400 font-black">{character.stats.wisdom}</span> (Grants <span className="text-emerald-400">+{playerMaxHealth} Max HP</span>)</div>
              <div>🎲 Luck Level: <span className="text-emerald-400 font-black">{character.stats.luck}</span> (Grants <span className="text-emerald-400">{character.stats.luck * 10}% Critical rate</span>)</div>
            </div>

            <button
              onClick={startBattle}
              className="w-full py-3 bg-red-600 text-white hover:bg-red-500 font-bold uppercase tracking-wider flex items-center justify-center gap-2 px-4 transition active:translate-y-0.5 rounded-none"
            >
              <Play className="w-4 h-4 fill-current" />
              Engage {gameData.bossName}
            </button>
          </div>
        )}

        {/* Active Battle Screen */}
        {isPlaying && currentQuestion && (
          <div className="space-y-6">
            
            {/* Health Bars Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Player HP */}
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-none relative">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-zinc-300 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                    {character.name} (Integrity)
                  </span>
                  <span className="text-zinc-400 font-bold">{playerHealth} / {playerMaxHealth} HP</span>
                </div>
                {/* Health gauge */}
                <div className="w-full h-3.5 bg-zinc-900 border border-zinc-700 p-0.5">
                  <div
                    className="h-full bg-rose-600 transition-all duration-300"
                    style={{ width: `${(playerHealth / playerMaxHealth) * 100}%` }}
                  />
                </div>
                {/* Visual Character thumbnail */}
                <span className="absolute right-2.5 top-2.5 text-lg">
                  {character.avatar === "wizard" ? "🧙" : character.avatar === "robot" ? "🤖" : character.avatar === "alien" ? "👽" : "🛡️"}
                </span>
              </div>

              {/* Boss HP */}
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-none relative">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-red-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-red-500 fill-current animate-pulse" />
                    {gameData.bossName} (Slime Core)
                  </span>
                  <span className="text-zinc-400 font-bold">{bossHealth}%</span>
                </div>
                {/* Health gauge */}
                <div className="w-full h-3.5 bg-zinc-900 border border-zinc-700 p-0.5">
                  <div
                    className="h-full bg-red-600 transition-all duration-300"
                    style={{ width: `${bossHealth}%` }}
                  />
                </div>
                <span className="absolute right-2.5 top-2.5 text-lg animate-bounce">👾</span>
              </div>

            </div>

            {/* Battle log prompt */}
            <div className="bg-zinc-900 border-2 border-zinc-800 p-3.5 max-h-24 overflow-y-auto text-[10px] text-zinc-400 space-y-1">
              {battleLog.slice(0, 3).map((log, lIdx) => (
                <div key={lIdx} className={lIdx === 0 ? "text-white font-bold" : ""}>
                  {log}
                </div>
              ))}
            </div>

            {/* Question Card Box */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 space-y-4">
              <div className="flex items-start gap-3.5">
                <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-black block mb-0.5">
                    Query Block {currentQuestionIndex + 1} of {gameData.questions.length}
                  </span>
                  <h3 className="text-xs sm:text-sm font-semibold text-zinc-200">
                    {currentQuestion.questionText}
                  </h3>
                </div>
              </div>

              {/* Visor Recon HUD */}
              {character.headpiece === "visor" && (
                <div className="text-[9px] text-cyan-400 bg-cyan-950/30 px-3 py-1.5 border border-cyan-900/60 rounded flex items-center justify-between shadow-sm animate-pulse">
                  <span className="font-bold flex items-center gap-1">🕶️ RECON ACTIVE:</span>
                  <span>Diagnostic byte size: {currentQuestion.options[currentQuestion.correctAnswerIndex].length} symbols</span>
                </div>
              )}

              {/* Options lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {currentQuestion.options.map((opt, oIdx) => {
                  let btnStyle = "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700";
                  const isHacked = hackedOptionIndices.includes(oIdx);
                  
                  if (isHacked) {
                    btnStyle = "bg-zinc-950/20 border-zinc-900/60 text-zinc-650 line-through opacity-25 cursor-not-allowed";
                  } else if (selectedOption === oIdx && !isAnswered) {
                    btnStyle = "bg-emerald-950/40 border-emerald-500 text-emerald-400";
                  }

                  if (isAnswered) {
                    if (oIdx === currentQuestion.correctAnswerIndex) {
                      btnStyle = "bg-emerald-900/30 border-emerald-400 text-emerald-300";
                    } else if (selectedOption === oIdx) {
                      btnStyle = "bg-red-950/30 border-red-500 text-red-300";
                    } else {
                      btnStyle = "bg-zinc-950/40 border-zinc-900 text-zinc-650 cursor-not-allowed";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={isAnswered || isHacked}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`w-full text-left p-3 border-2 text-xs font-medium transition flex items-start gap-2 ${btnStyle}`}
                    >
                      <span className="font-extrabold text-zinc-500 uppercase shrink-0">
                        {isHacked ? "[🚫]" : `[${String.fromCharCode(65 + oIdx)}]`}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Confirm / Next step actions */}
              <div className="border-t border-zinc-800 pt-4 flex flex-wrap gap-3 justify-between items-center">
                <div className="flex gap-2">
                  {/* Healing Item */}
                  <button
                    type="button"
                    onClick={handleUsePotion}
                    disabled={potionCount <= 0 || playerHealth >= playerMaxHealth}
                    className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-[10px] uppercase font-bold text-emerald-400 hover:bg-zinc-800 disabled:opacity-30 rounded-none flex items-center gap-1"
                  >
                    🧪 Potion ({potionCount} Left)
                  </button>

                  {/* Mega Blaster strike trigger */}
                  {character.weapon === "mega-blaster" && (
                    <button
                      type="button"
                      onClick={handleMegaBlasterStrike}
                      disabled={megaBlasterUsed || isAnswered}
                      className="px-3 py-1.5 bg-rose-950/40 border border-rose-500 text-[10px] uppercase font-bold text-rose-300 hover:bg-rose-900/50 disabled:opacity-30 rounded-none flex items-center gap-1.5"
                    >
                      🔫 BLAST ({megaBlasterUsed ? "Used" : "Ready"})
                    </button>
                  )}
                </div>

                {/* Confirm step */}
                {!isAnswered ? (
                  <button
                    type="button"
                    onClick={handleConfirmAnswer}
                    disabled={selectedOption === null}
                    className="px-5 py-2.5 bg-emerald-500 text-black hover:bg-emerald-400 font-bold uppercase text-xs disabled:opacity-40 rounded-none active:translate-y-0.5 animate-pulse"
                  >
                    🚀 Lock Solution
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 bg-emerald-500 text-black hover:bg-emerald-400 font-bold uppercase text-xs rounded-none active:translate-y-0.5"
                  >
                    {currentQuestionIndex < gameData.questions.length - 1 ? "Next Query Block ➡️" : "Finish Combat Matrix ➡️"}
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
