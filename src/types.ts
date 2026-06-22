/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AvatarType = "alien" | "robot" | "knight" | "ninja" | "wizard";
export type AvatarColor = "neon-green" | "neon-purple" | "neon-teal" | "laser-orange" | "retro-blue";
export type AvatarWeapon = "pixel-sword" | "mega-blaster" | "cyber-staff" | "floppy-shield" | "pizza-slice";
export type AvatarHeadpiece = "wizard-hat" | "visor" | "space-helmet" | "ninja-band" | "gold-crown";

export interface CustomStats {
  hacking: number;
  reflexes: number;
  wisdom: number;
  luck: number;
}

export interface RetroCharacter {
  name: string;
  avatar: AvatarType;
  color: AvatarColor;
  weapon: AvatarWeapon;
  headpiece: AvatarHeadpiece;
  level: number;
  xp: number;
  stats: CustomStats;
  coins: number;
  unlockedWeapons: AvatarWeapon[];
  unlockedHeadpieces: AvatarHeadpiece[];
  inventory?: RewardItem[];
  equippedWeapon?: RewardItem | null;
  equippedCosmetic?: RewardItem | null;
}

export interface ChallengeItem {
  name: string;
  description: string;
}

export interface GridCollectorData {
  introText: string;
  goodItems: ChallengeItem[];
  badItems: ChallengeItem[];
}

export interface TriviaQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface TriviaBossData {
  bossName: string;
  bossDescription: string;
  bossIntroDialog: string;
  questions: TriviaQuestion[];
}

export interface CipherItem {
  scrambledWord: string;
  solutionWord: string;
  clue: string;
}

export interface FirewallDecryptData {
  description: string;
  ciphers: CipherItem[];
}

export interface RewardItem {
  id: string;
  name: string;
  type: "weapon" | "cosmetic";
  emoji: string;
  description: string;
  statBonus: "hacking" | "reflexes" | "wisdom" | "luck";
  bonusValue: number;
}

export interface ChallengePayload {
  answer: string;
  summary: string;
  challengeType: "grid_collector" | "trivia_boss_battle" | "firewall_decrypt";
  challengeTitle: string;
  challengeIntro: string;
  levelDifficulty: "EASY" | "MEDIUM" | "HARD";
  xpReward: number;
  gridCollectorData: GridCollectorData;
  triviaBossData: TriviaBossData;
  firewallDecryptData: FirewallDecryptData;
  rewardItem: RewardItem;
  gameModifier: string; // e.g. "gravity_shift", "speed_frenzy", "boss_rage", "time_dilation", etc.
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string; // Will show the locked description until beat, then full answer!
  originalPrompt?: string;
  isLocked: boolean;
  timestamp: string;
  challenge?: ChallengePayload;
  completedAt?: string;
}
