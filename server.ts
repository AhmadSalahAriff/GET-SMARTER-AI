import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// --- OFFLINE BACKUP CHALLENGE GENERATOR PROCEDURES ---
function generateOfflineFallbackChallenge(prompt: string) {
  const normalizedPrompt = prompt.toLowerCase();
  
  // Choose topic category based on keywords
  let category: 'tech' | 'culinary' | 'space' | 'general' = 'general';
  if (/\b(code|py|js|ts|cpp|java|rust|program|develop|soft|bug|hack|file|web|sql|db|html|css|server|network|git|comp)\b/.test(normalizedPrompt)) {
    category = 'tech';
  } else if (/\b(cook|bake|cake|food|bread|oven|kitchen|chocolate|fruit|cream|pizza|dough|chef|pastry|recipe|yeast|flour|sugar)\b/.test(normalizedPrompt)) {
    category = 'culinary';
  } else if (/\b(space|star|planet|physic|quantum|gravity|orbit|astro|cosm|galaxy|sun|moon|rocket|singularity|atom|force|energy)\b/.test(normalizedPrompt)) {
    category = 'space';
  }

  // Randomly select one game type so the user gets variety!
  const gameTypes: Array<'grid_collector' | 'trivia_boss_battle' | 'firewall_decrypt'> = [
    'grid_collector',
    'trivia_boss_battle',
    'firewall_decrypt'
  ];
  const challengeType = gameTypes[Math.floor(Math.random() * gameTypes.length)];

  // Default game metrics
  let challengeTitle = 'ARCADE OFFLINE CONDUIT';
  let challengeIntro = 'The cyber oracle is routing logic queries through fallback copper relays. Unblock the digital bottleneck!';
  let levelDifficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';
  let xpReward = 100;
  let gameModifier = 'quantum_static';
  let rewardItem: {
    id: string;
    name: string;
    type: 'weapon' | 'cosmetic';
    emoji: string;
    description: string;
    statBonus: 'hacking' | 'reflexes' | 'wisdom' | 'luck';
    bonusValue: number;
  } = {
    id: 'silicon_badge',
    name: 'Silicon Cache Badge',
    type: 'cosmetic',
    emoji: '💾',
    description: 'A physical memory container that preserves local metadata integrity.',
    statBonus: 'hacking',
    bonusValue: 3
  };

  let gridCollectorData = {
    introText: 'Use ASDW/Arrow Keys to sweep positive data bits and bypass hardware static!',
    goodItems: [
      { name: 'Redundant Power Cell', description: 'A reliable backup cell.' },
      { name: 'Isolated Packet Buffer', description: 'Keeps signal noise down.' }
    ],
    badItems: [
      { name: 'Copper Short Circuit', description: 'Causes high impedance.' },
      { name: 'Signal Cross-Talk', description: 'Destabilizes transmission line.' }
    ]
  };

  let triviaBossData = {
    bossName: 'LOCAL_REDUNDANCY_GUARD',
    bossDescription: 'A colossal security automaton running diagnostic defense protocols.',
    bossIntroDialog: 'BEEP! Main intelligence engine offline. Access requires secondary security clearance code!',
    questions: [
      {
        questionText: 'Which binary operation compares each bit and yields 1 only if both bits are 1?',
        options: ['OR', 'AND', 'XOR', 'NOT'],
        correctAnswerIndex: 1,
        explanation: 'The AND operation outputs 1 (true) only when both input bits are 1.'
      },
      {
        questionText: 'What is the decimal representation of the binary byte 00001010?',
        options: ['5', '8', '10', '12'],
        correctAnswerIndex: 2,
        explanation: '00001010 in binary equals 2^3 + 2^1 = 8 + 2 = 10.'
      },
      {
        questionText: 'Which unit is used to express signal frequency equal to one cycle per second?',
        options: ['Hertz', 'Watt', 'Volt', 'Ohm'],
        correctAnswerIndex: 0,
        explanation: 'One Hertz (Hz) is equal to exactly one cycle per second.'
      }
    ]
  };

  let firewallDecryptData = {
    description: 'We have encountered an electromagnetic block. Unscramble backup code phrases to bypass.',
    ciphers: [
      { scrambledWord: 'COPPERS', solutionWord: 'COPPER', clue: 'The metal used in analog backup circuits.' },
      { scrambledWord: 'YSTSEM', solutionWord: 'SYSTEM', clue: 'Orchestrated array of interconnected procedures.' },
      { scrambledWord: 'BACUKP', solutionWord: 'BACKUP', clue: 'Safe duplicate stored for contingency.' }
    ]
  };

  // Inject category-specific details!
  if (category === 'tech') {
    challengeTitle = 'CYBER PROTOCOL NULL-REF';
    challengeIntro = `A critical memory leak is threatening local memory systems! Bypass the Firewall block to secure your query.`;
    levelDifficulty = 'HARD';
    xpReward = 150;
    gameModifier = 'speed_frenzy';
    rewardItem = {
      id: 'cyber_solderer',
      name: 'Cyber Solderer',
      type: 'weapon' as const,
      emoji: '🔌',
      description: 'Used for fusing microcode lanes and fixing firmware overrides.',
      statBonus: 'hacking' as const,
      bonusValue: 4
    };
    gridCollectorData = {
      introText: 'Gather clean memory pointers and dodge corrupted system errors!',
      goodItems: [
        { name: 'Refactored Unit Tests', description: 'Ensures code blocks execute cleanly.' },
        { name: 'Secured API Keys', description: 'Safely locked behind server barriers.' },
        { name: 'Garbage Collector Signals', description: 'Sweeps away unusable dereferenced pointers.' }
      ],
      badItems: [
        { name: 'Infinite While Loop', description: 'Locks up thread processing indefinitely.' },
        { name: 'NullPointerException', description: 'Panics execution by accessing undefined registries.' },
        { name: 'Stale Dev Credential', description: 'Causes unauthorized access exceptions.' }
      ]
    };
    triviaBossData = {
      bossName: 'BUFFER_OVERFLOW_V3',
      bossDescription: 'A terrifying digital behemoth composed of disjointed stack traces.',
      bossIntroDialog: 'ACCESS EXCEPTION: Core logic corrupted. Do you understand coding structures and debug tools?!',
      questions: [
        {
          questionText: 'What is the standard time complexity of searching elements in a balanced Binary Search Tree?',
          options: ['O(1)', 'O(N)', 'O(log N)', 'O(N log N)'],
          correctAnswerIndex: 2,
          explanation: 'A balanced BST divides search divisions in half on each comparison, resulting in O(log N) operations.'
        },
        {
          questionText: 'Which core data structure operates on a Last-In, First-Out (LIFO) model?',
          options: ['FIFO Queue', 'Stack Registry', 'Linked Ring Buffer', 'Hash Map Directory'],
          correctAnswerIndex: 1,
          explanation: 'Stacks allow appending as pushing and deleting as popping, returning the most recently added component first.'
        },
        {
          questionText: 'What is the exact network protocol represented by the acronym HTTP?',
          options: ['HyperText Transfer Protocol', 'HighTech Transmission Protocol', 'Hypertext Terminal Port', 'Hosted Terminal Package'],
          correctAnswerIndex: 0,
          explanation: 'HTTP is the foundational protocol used for exchanging documents and hypertext across the World Wide Web.'
        }
      ]
    };
    firewallDecryptData = {
      description: 'The stack buffer is clogged with garbage signals. Unscramble security hexes to free resources.',
      ciphers: [
        { scrambledWord: 'KERNLE', solutionWord: 'KERNEL', clue: 'The absolute core program of any operating system.' },
        { scrambledWord: 'TXSET', solutionWord: 'TEXT', clue: 'Human-readable documentation symbols representing source-code.' },
        { scrambledWord: 'CYRPT', solutionWord: 'CRYPT', clue: 'A standard prefix relating to secure cryptography and security vaults.' }
      ]
    };
  } else if (category === 'culinary') {
    challengeTitle = 'Yeast Fermentation Overdrive';
    challengeIntro = `The bakery's convection systems have started cooking with excessive binary heat! Run cooking protocols before the baking oven combusts.`;
    levelDifficulty = 'EASY';
    xpReward = 85;
    gameModifier = 'time_dilation';
    rewardItem = {
      id: 'golden_spatula',
      name: 'Golden Spatula',
      type: 'weapon' as const,
      emoji: '🍳',
      description: 'A glowing utensil that guarantees absolute precision in dough folding.',
      statBonus: 'luck' as const,
      bonusValue: 3
    };
    gridCollectorData = {
      introText: 'Gather fresh leavened ingredients while dodging baking elements!',
      goodItems: [
        { name: 'Fresh Yeast Bulb', description: 'Activates yeast expansion at stable temperatures.' },
        { name: 'Symmetric Cake Layer', description: 'Perfectly balanced geometry.' },
        { name: 'Precision Dial Readings', description: 'Maintains ideal baking environment.' }
      ],
      badItems: [
        { name: 'Burnt Pastry Crust', description: 'Unusable carbonized food scraps.' },
        { name: 'Overfermented Mixture', description: 'Creates excessively sour taste profiles.' },
        { name: 'Corrupted Metal Pan', description: 'Distributes thermal heat unevenly.' }
      ]
    };
    triviaBossData = {
      bossName: 'CHEF_CONVECTO_BOT',
      bossDescription: 'An automated cooking robot displaying visual kitchen errors.',
      bossIntroDialog: 'MEEP MOP! You think you are worthy of knowing the secrets of French pastries and baking sciences?!',
      questions: [
        {
          questionText: 'Which ingredient acts as the primary logical leavening agent in standard bread baking?',
          options: ['Powdered Sugar', 'Active Dry Yeast', 'Table Sea Salt', 'Cornstarch Powder'],
          correctAnswerIndex: 1,
          explanation: 'Yeast digests sugars in dough, releasing carbon dioxide bubbles that cause the bread structural matrix to rise.'
        },
        {
          questionText: 'At approximately what thermal temperature does dry sugar molecules begin to caramelize?',
          options: ['100°C (212°F)', '160°C (320°F)', '250°C (482°F)', '80°C (176°F)'],
          correctAnswerIndex: 1,
          explanation: 'Caramelization occurs above 160°C (320°F) where sucrose breaks down into complex amber-flavored compounds.'
        },
        {
          questionText: 'What is the main biochemical reaction responsible for the golden browning of bread crust and roasted food?',
          options: ['Maillard Reaction', 'Photosynthetic Cycle', 'Yeast Fermentation', 'Carboxylic Oxidation'],
          correctAnswerIndex: 0,
          explanation: 'The Maillard Reaction is a chemical reaction between amino acids and reducing sugars that occurs under high-temperature cooking.'
        }
      ]
    };
    firewallDecryptData = {
      description: 'The kitchen computer has locked out the cooling system! Unscramble recipe terms.',
      ciphers: [
        { scrambledWord: 'STAEY', solutionWord: 'YEAST', clue: 'Unicellular fungi used to aerate and raise bread dough.' },
        { scrambledWord: 'LROFU', solutionWord: 'FLOUR', clue: 'Finely ground powder made of wheat grains that forms gluten networks.' },
        { scrambledWord: 'UGSRA', solutionWord: 'SUGAR', clue: 'Sweet carbohydrate ingredient that feeds growing yeast cells.' }
      ]
    };
  } else if (category === 'space') {
    challengeTitle = 'GRAVITY WELL STEERING';
    challengeIntro = `A relativistic gravity distortion is dragging our communication packets into a black hole! Align solar field arrays to navigate.`;
    levelDifficulty = 'HARD';
    xpReward = 140;
    gameModifier = 'gravity_shift';
    rewardItem = {
      id: 'starlight_wand',
      name: 'Starlight Oracle Wand',
      type: 'weapon' as const,
      emoji: '🪄',
      description: 'Forged from cosmic plasma, emitting a gentle guide beam.',
      statBonus: 'wisdom' as const,
      bonusValue: 4
    };
    gridCollectorData = {
      introText: 'Gather anti-matter charges and bypass black hole debris clouds!',
      goodItems: [
        { name: 'Anti-Matter Core Charge', description: 'Provides immense energy blocks.' },
        { name: 'Gravitational Wave Dampener', description: 'Smoothes space-time ripples.' },
        { name: 'Coherent Chronos Crystal', description: 'Locally stabilizes relativistic flow.' }
      ],
      badItems: [
        { name: 'Dark Matter Ingestion', description: 'Pulls spacecraft downwards.' },
        { name: 'High Solar Flare discharge', description: 'Overloads navigational electronic sensors.' },
        { name: 'Relativistic Drag Wave', description: 'Creates gravitational spaghettification forces.' }
      ]
    };
    triviaBossData = {
      bossName: 'SINGULARITY_EYE_GUARD',
      bossDescription: 'A pulsating security node orbiting a pocket black hole in space.',
      bossIntroDialog: 'CRITICAL WARNING: Gravitational boundary crossed. Submit physics authorization parameters immediately!',
      questions: [
        {
          questionText: 'What is the approximate speed of light travelling in a complete vacuum?',
          options: ['299,792 km/s', '150,000 km/s', '450,000 km/s', '1,000,000 km/s'],
          correctAnswerIndex: 0,
          explanation: 'Light speed in a vacuum is a universal physical constant equal to precisely 299,792 kilometers per second.'
        },
        {
          questionText: 'Who formulated the groundbreaking modern theory of General Relativity published in 1915?',
          options: ['Sir Isaac Newton', 'Albert Einstein', 'Niels Bohr Quantum Scholar', 'Nico Copernicus Astronomer'],
          correctAnswerIndex: 1,
          explanation: 'Albert Einstein developed General Relativity, showing that gravity is the geometric curvature of space-time caused by mass.'
        },
        {
          questionText: 'Which physical force keeps moons and celestial satellites orbiting around their host planets?',
          options: ['Electromagnetic Attraction', 'Gravitational Pull', 'Strong Nuclear Force Bind', 'Weak Nuclear Radiation decays'],
          correctAnswerIndex: 1,
          explanation: 'Gravitational attraction between two masses keeps orbital objects from flying off into straight paths.'
        }
      ]
    };
    firewallDecryptData = {
      description: 'Telemetric logs are twisted by gravitational time dilation. Unscramble cosmic labels.',
      ciphers: [
        { scrambledWord: 'TIORB', solutionWord: 'ORBIT', clue: 'The curved planetary trajectory around a heavy star.' },
        { scrambledWord: 'SART', solutionWord: 'STAR', clue: 'Highly luminous ball of superheated plasma undergoing nuclear fusion.' },
        { scrambledWord: 'GVAIT', solutionWord: 'GRAVITY', clue: 'Fundamental attractor force that governs structural cosmology.' }
      ]
    };
  }

  // Answer block formatted gracefully
  const prettyTopic = prompt.substring(0, 45) + (prompt.length > 45 ? '...' : '');
  const answer = `### 📡 Retrosector Backup Logs: Offline Guide

> **NOTICE: Local Relays Engaged.**
> The main neural intelligence array is experiencing high volume. Safe connection has been routed to **Silicon Backup Node V3.1**. Below is your requested study summary for **"${prettyTopic}"**:

---

#### 1. Fundamental Conceptual Model
The inquiry seeks to explore **"${prompt}"**. Mathematically and logically, successful execution in this sector requires understanding structural components, reducing complexity overloads, and preparing redundant pipelines.

#### 2. Key Strategies for Mastery
*   **Encapsulation**: Treat modular ideas as isolated components. This limits cascade errors and permits clean unit evaluations.
*   **Sanitization**: Eliminate invalid or edge inputs early in your control loops before executing high-overhead operations.
*   **Contingency**: Like safe physical systems, always preserve fallback pathways to ensure operational continuity under stress.

---

*Beat the active challenge below to secure local backup resources and level up your parameters!*`;

  const summary = `📡 Fallback activated for: ${prettyTopic.substring(0, 15)}`;

  return {
    answer,
    summary,
    challengeType,
    challengeTitle,
    challengeIntro,
    levelDifficulty,
    xpReward,
    gameModifier,
    rewardItem,
    gridCollectorData,
    triviaBossData,
    firewallDecryptData
  };
}

// Endpoint to generate prompt-based challanges
app.post("/api/generate-challenge", async (req, res) => {
  const { prompt, history = [] } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  let lastError: any = null;
  const attempts = 2;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined in the environment.");
      }

      // Call Gemini 3.5 Flash to generate the game elements and the final answer
      const systemInstruction = 
        "You are a retro-arcade AI game developer. You are creating a customized, highly engaging mini-game challenge and the final helpful answer block based on the user's prompt. " +
        "Select one of the three challenge types ('grid_collector', 'trivia_boss_battle', 'firewall_decrypt') that would be most exciting and thematic for the user's prompt topic. " +
        "Provide complete detail for ALL three game data schemas (gridCollectorData, triviaBossData, firewallDecryptData) even if you only chose one type (for the non-selected ones, fill with blank values/arrays/placeholders, but fit the schema). " +
        "The answer property must contain the ACTUAL high-quality, comprehensive, and helpful response to the prompt (e.g. if they ask for a code, give beautiful code or detailed explanation). The answers must be fully complete and highly interactive or educational. " +
        "Make the game terms, boss name, collectible items, and ciphers extremely specific to the prompt. " +
        "IMPORTANT: You MUST also generate a thematic and customized loot reward ('rewardItem') that the user collects upon winning the quest. This reward can be either a weapon or a cosmetic item (represented by a single relevant emoji like 🥐, 💻, 🪄, ⚔️, etc.) that buffs one of the four attributes: 'hacking', 'reflexes', 'wisdom', or 'luck'. " +
        "You MUST also select a highly distinct 'gameModifier' that applies to this minigame instance to make it unique from ordinary levels. Select from: 'speed_frenzy', 'gravity_shift', 'boss_rage', 'time_dilation', 'mirror_dimension', 'quantum_static', or generate a brand new thematic mechanic modifier name (with an exciting, human-readable feeling).";

      const promptMessage = `Generate the challenge, answer, a custom loot reward item, and a gameplay modifier for original prompt: "${prompt}"`;

      const chatHistoryParts = history.map((h: any) => ({
        role: h.role,
        parts: [{ text: h.content || "" }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...chatHistoryParts,
          {
            role: "user",
            parts: [{ text: promptMessage }]
          }
        ],
        config: {
          systemInstruction,
          temperature: 1.0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: {
                type: Type.STRING,
                description: "The complete, rich, detailed Markdown response answering the user's prompt directly."
              },
              summary: {
                type: Type.STRING,
                description: "A short retro preview summary (max 10 words) like 'Quantum Data stream locked behind cyber firewall.'"
              },
              challengeType: {
                type: Type.STRING,
                description: "Select ONE that fits the topic best: 'grid_collector', 'trivia_boss_battle', or 'firewall_decrypt'."
              },
              challengeTitle: {
                type: Type.STRING,
                description: "A stylized arcade game title for this challenge (e.g. 'BAKESHOP HAVOC', 'QUANTUM PROTECTOR 2048')."
              },
              challengeIntro: {
                type: Type.STRING,
                description: "A funny and engaging 2-3 sentence retro story setting up why the character has to beat this guardian."
              },
              levelDifficulty: {
                type: Type.STRING,
                description: "The calculated difficulty of this challenge: 'EASY', 'MEDIUM', or 'HARD'."
              },
              xpReward: {
                type: Type.INTEGER,
                description: "An integer representing XP points to reward, from 50 to 180."
              },
              gameModifier: {
                type: Type.STRING,
                description: "A unique modifier code, e.g. 'speed_frenzy', 'gravity_shift', 'boss_rage', 'time_dilation', 'mirror_dimension', 'quantum_static'."
              },
              rewardItem: {
                type: Type.OBJECT,
                description: "The unique collectible item awarded upon successfully solving this challenge.",
                properties: {
                  id: { type: Type.STRING, description: "A unique slug, e.g. 'quantum_key', 'fermented_spatula'." },
                  name: { type: Type.STRING, description: "Capitalized user-facing item name (e.g. 'Stellar Flour Sifter')" },
                  type: { type: Type.STRING, description: "Must be exactly 'weapon' or 'cosmetic'" },
                  emoji: { type: Type.STRING, description: "A single highly relevant emoji representing it (e.g., 🥐, 🪄, 🎯, 👑)." },
                  description: { type: Type.STRING, description: "Funny and thematic descriptive lore." },
                  statBonus: { type: Type.STRING, description: "Attributes it boosts: must be exactly 'hacking', 'reflexes', 'wisdom', or 'luck'" },
                  bonusValue: { type: Type.INTEGER, description: "Numeric benefit value, from +1 to +5." }
                },
                required: ["id", "name", "type", "emoji", "description", "statBonus", "bonusValue"]
              },
              gridCollectorData: {
                type: Type.OBJECT,
                description: "Data strictly if selected 'grid_collector'. Good items to catch, bad items to avoid.",
                properties: {
                  introText: { type: Type.STRING, description: "Instructions e.g., 'Utilize WASD or Arrow Keys to collect positive quantum particles while dodging heavy noise!'" },
                  goodItems: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Name of the concept/item to gather (e.g. 'Healthy Yeast')" },
                        description: { type: Type.STRING, description: "A neat retro style tooltip/clue." }
                      },
                      required: ["name", "description"]
                    }
                  },
                  badItems: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Name of the concept/item to dodge (e.g. 'Overferment Block')" },
                        description: { type: Type.STRING, description: "A neat retro style tooltip/clue." }
                      },
                      required: ["name", "description"]
                    }
                  }
                },
                required: ["introText", "goodItems", "badItems"]
              },
              triviaBossData: {
                type: Type.OBJECT,
                description: "Data strictly if selected 'trivia_boss_battle'. Dynamic boss fight.",
                properties: {
                  bossName: { type: Type.STRING, description: "The boss name (e.g. 'SLIME CONVECTO_BOT')" },
                  bossDescription: { type: Type.STRING, description: "Brief visual description of the pixel boss." },
                  bossIntroDialog: { type: Type.STRING, description: "Funny dialogue line e.g., 'You think you are worthy of knowing the secrets of French Baguettes?'" },
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        questionText: { type: Type.STRING, description: "A high-quality trivia question concerning the prompt's topic." },
                        options: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: "4 diverse multiple choice answers."
                        },
                        correctAnswerIndex: { type: Type.INTEGER, description: "The index from 0 to 3 of the correct option." },
                        explanation: { type: Type.STRING, description: "Educational feedback explaining why it's right." }
                      },
                      required: ["questionText", "options", "correctAnswerIndex", "explanation"]
                    }
                  }
                },
                required: ["bossName", "bossDescription", "bossIntroDialog", "questions"]
              },
              firewallDecryptData: {
                type: Type.OBJECT,
                description: "Data strictly if selected 'firewall_decrypt'. Word unscrambles based on topic ciphers.",
                properties: {
                  description: { type: Type.STRING, description: "Instructions e.g., 'We have encountered visual static patterns. Unscramble the security hex-words to bypass.'" },
                  ciphers: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        scrambledWord: { type: Type.STRING, description: "Completely jumbled letters of the solution word in UPPERCASE (e.g., 'SEYAT' for 'YEAST')." },
                        solutionWord: { type: Type.STRING, description: "The clean solution word in UPPERCASE (e.g., 'YEAST')." },
                        clue: { type: Type.STRING, description: "Retro hint describing what this secret object is." }
                      },
                      required: ["scrambledWord", "solutionWord", "clue"]
                    }
                  }
                },
                required: ["description", "ciphers"]
              }
            },
            required: [
              "answer",
              "summary",
              "challengeType",
              "challengeTitle",
              "challengeIntro",
              "levelDifficulty",
              "xpReward",
              "gridCollectorData",
              "triviaBossData",
              "firewallDecryptData",
              "rewardItem",
              "gameModifier"
            ]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsedResult = JSON.parse(resultText);
      return res.json(parsedResult);
    } catch (err: any) {
      lastError = err;
      console.log(`[Service Tunnel] Relay routing active (attempt ${attempt}/${attempts}). Diagnostic code: ${err?.status || 'UNAVAILABLE'}.`);
      if (attempt < attempts) {
        // Wait 1 second before retrying
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  // Engage offline backup if all attempts fail
  console.log("[Service Tunnel] Offline copper fallback engaged. Sourcing offline backup assets...");
  try {
    const fallbackPayload = generateOfflineFallbackChallenge(prompt);
    res.json(fallbackPayload);
  } catch (fallbackError: any) {
    console.log("[Service Tunnel] Offline backup route error resolution.");
    res.status(200).json(generateOfflineFallbackChallenge(prompt || "system_diagnostic"));
  }
});

// Setup Vite Dev Server / Static Production Asset Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static assets from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on http://0.0.0.0:${PORT}`);
  });
}

startServer();
