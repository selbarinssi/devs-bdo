export type VoyageChoice = { id: string; text: string; tag?: string };

export type VoyageQuest = {
  id: string;
  text?: string;
  tag?: string;
  optional?: boolean;
  heading?: string;
  choice?: VoyageChoice[];
  label?: string;
};

export type VoyageStop = {
  id: string;
  title: string;
  loc: string;
  heading?: string;
  note?: string;
  rewards: string;
  quests: VoyageQuest[];
};

export const CAPTAIN_NOTES = [
  "Take the timed 180-minute deliveries (Croix, Rovinia, Dario) last at each stop, right before you sail — not first.",
  "Choosing Adult sea monsters (Candidum / Nineshark / Black Rust) pays Crow Coins or Black Stones; choosing 5× Young pays Carrack materials instead. You can't do both of the same type.",
  "A Sailies platoon (World Chat or the Sailing Discord) speeds up the Margoria hunting leg a lot — most platoons only do the Adult versions.",
  "Keep a stash of Coral Pieces and a Level 1 barter good in your inventory so Curio's and Baori/Maonil's quests are instant hand-ins.",
  "50 Oquilla Coins can be exchanged with Herrad Romsen on Oquilla's Eye for ship-upgrade materials.",
];

export const STOPS: VoyageStop[] = [
  {
    id: "velia-docks",
    title: "Velia Docks",
    loc: "NPCs: Croix & Rovinia",
    quests: [
      { id: "v1", text: "Wanted: Hekaru or Wanted: Ocean Stalker — defeat 1×" },
      { id: "v2", text: "Looming Threats from the Ocean — defeat 1× Goldmont Large Battleship" },
      { id: "v3", text: "Ocean Predators — defeat 3× Goldmont Small Battleships" },
      {
        id: "v4",
        text: "Supplies Delivery: Iliya Island (Croix) — timed 180 min",
        tag: "Pick up last",
      },
      {
        id: "v5",
        text: "Supplies Delivery: Tinberra Island (Rovinia) — timed 180 min",
        tag: "Pick up last",
      },
    ],
    rewards: "Sailing EXP · Crow Coins · Origin of Wind",
  },
  {
    id: "velia-inn",
    title: "Dancing Marlin Inn, Velia",
    loc: "NPCs: Miya & Proix",
    heading: "Same dock, walk into the inn — no sailing yet.",
    quests: [
      {
        id: "i1",
        text: "Delivering Goods — pick **Tinberra Island** so it lines up with this route (Baremi/Narvo also offered)",
      },
      { id: "i2", text: "Wanted: Hungry Sea Creatures — 3× Hungry Hekaru + 3× Hungry Ocean Stalker" },
      { id: "i3", text: "Wanted: Cox Scouts in Disguise — kill 20× Cox Pirates" },
      {
        id: "i4",
        text: "How to Recover Sailors — cook & hand in Chowder ×3",
        optional: true,
        tag: "Optional · needs residence + cooking",
      },
    ],
    rewards: "Sailing EXP · Crow Coins",
  },
  {
    id: "iliya-out",
    title: "Iliya Island",
    loc: "NPCs: Dario, Villager, Baori & Maonil",
    heading:
      "Sail north from Velia to Weita Island first — clear Cox Pirates there for the 20-kill quest — then continue north to Iliya.",
    quests: [
      { id: "il1", text: "Hand in Supplies Delivery: Iliya Island to Dario (if chosen at Velia)" },
      {
        id: "il2",
        text: "Supplies Delivery: Oquilla's Eye (Dario) — timed 180 min",
        tag: "Pick up last",
      },
      { id: "il3", text: "Lively Iliya Island I–III — barter 3 / 5 / 10 / 15 times total" },
      {
        id: "il4",
        text: "Barter Goods Support I & II (Baori & Maonil) — hand in 1× Level 1 barter good each",
      },
      {
        id: "il5",
        text: "Sailing to a Wider World (Dario) — 20 barters, rewards Explorer's Compass parts",
        optional: true,
        tag: "Optional",
      },
    ],
    rewards: "Crow Coins · Sailing/Barter EXP · Contribution EXP",
  },
  {
    id: "tinberra",
    title: "Tinberra Island",
    loc: "Turn-ins: Mulicia & Shanjo",
    heading:
      "Continue north from Iliya toward Tinberra — kill Hungry Ocean Stalkers ×3 on the way if you haven't already.",
    quests: [
      { id: "t1", text: "Hand in Delivering Goods to Mulicia (if Tinberra chosen at Velia)" },
      { id: "t2", text: "Hand in Supplies Delivery: Tinberra Island to Shanjo (Rovinia's quest)" },
      { id: "t3", text: "Finish Hungry Ocean Stalkers ×3 if not already done en route" },
    ],
    rewards: "Sailing EXP · Crow Coins",
  },
  {
    id: "oe-out",
    title: "Oquilla's Eye",
    loc: "NPCs: Ravikel, Soldier, Si Huram & Curio",
    heading:
      "Head north-west from Tinberra to Oquilla's Eye — clear any Small Goldmont Battleships between the islands on the way.",
    quests: [
      {
        id: "o1",
        label: "Old Moon Guild's Candidum Hunter — choose difficulty",
        choice: [
          { id: "adult", text: "1× Candidum (adult)", tag: "Crow Coins or Black Stones" },
          { id: "young", text: "5× Young Candidum", tag: "Carrack materials instead" },
        ],
      },
      {
        id: "o2",
        label: "Old Moon Guild's Nineshark Hunter — choose difficulty",
        choice: [
          { id: "adult", text: "1× Nineshark (adult)", tag: "Crow Coins or Black Stones" },
          { id: "young", text: "5× Young Nineshark", tag: "Carrack materials instead" },
        ],
      },
      {
        id: "o3",
        label: "Old Moon Guild's Black Rust Hunter — choose difficulty",
        choice: [
          { id: "adult", text: "1× Black Rust (adult)", tag: "Crow Coins or Black Stones" },
          { id: "young", text: "5× Young Black Rust", tag: "Carrack materials instead" },
        ],
      },
      {
        id: "o4",
        text: "Weekly Old Moon Hunter trio (Thursday reset) — Adult only, extra Crow Coins/Black Stones",
        optional: true,
        tag: "Weekly",
      },
      { id: "o5", text: "Do You Have What It Takes? — kill 1× Hekaru (Soldier)" },
      { id: "o6", text: "Win-win Situation — kill 1× Ocean Stalker (Soldier)" },
      { id: "o7", text: "Our Guild is not a Charity Group — kill 2× Young Sea Monsters (Soldier)" },
      {
        id: "o8",
        text: "Through the Rough Tides (Si Huram) — pick the **Velia** delivery so you turn it in on the way home",
      },
      { id: "o9", text: "Precious Coral Piece (Curio) — hand in 10× Coral Piece" },
      {
        id: "o10",
        text: "For the Young Otter Merchants (Curio) — hand in 1× Iridescent Coral Piece (gathered with a hoe)",
      },
    ],
    rewards: "Oquilla Coins · Crow Coins · Carrack materials",
  },
  {
    id: "margoria",
    title: "Margoria Hunting Grounds",
    loc: "Ross Sea sea-monster spawns",
    heading: "Leave Oquilla's Eye heading west — this leg is a loop, follow the waypoints below in order.",
    quests: [
      {
        id: "m1",
        heading: "West of Oquilla's Eye — Ocean Stalker habitat",
        text: "Kill 1× Ocean Stalker (adult) + 2× Young Ocean Stalker",
      },
      {
        id: "m2",
        heading: "Continue west — Hekaru habitat",
        text: "Kill 1× Hekaru (adult)",
      },
      {
        id: "m3",
        heading: "Continue west — Predator of Vadabin (Black Rust habitat)",
        label: "Choose difficulty",
        choice: [
          { id: "adult", text: "1× Black Rust (adult)", tag: "Crow Coins or Black Stones" },
          { id: "young", text: "5× Young Black Rust", tag: "Carrack materials instead" },
        ],
      },
      {
        id: "m4",
        heading: "Head north-east — Cholace Chico's Pirate Union (Goldmont Pirate Territory)",
        text: "Kill 1× Goldmont Large Battleship",
      },
      {
        id: "m5",
        heading: "Continue — Shipwrecked Haran's Cargo Ship",
        label: "Choose difficulty",
        choice: [
          { id: "adult", text: "1× Nineshark (adult)", tag: "Crow Coins or Black Stones" },
          { id: "young", text: "5× Young Nineshark", tag: "Carrack materials instead" },
        ],
      },
      {
        id: "m6",
        heading: "Continue same direction — Pakio's Combat Raft",
        label: "Choose difficulty",
        choice: [
          { id: "adult", text: "1× Candidum (adult)", tag: "Crow Coins or Black Stones" },
          { id: "young", text: "5× Young Candidum", tag: "Carrack materials instead" },
        ],
      },
      {
        id: "m7",
        text: "Clear any Goldmont Small Battleships you pass along the loop",
        optional: true,
        tag: "Optional",
      },
    ],
    note: "Match whatever your Old Moon Hunter choice was at Oquilla's Eye (Stop 5) for m3/m5/m6 — adult and young count toward different quests. Joining a Sailies platoon here is the biggest time-saver in the whole route.",
    rewards: "Clears Ravikel + Soldier quests",
  },
  {
    id: "oe-return",
    title: "Oquilla's Eye — return",
    loc: "Turn-ins: Ravikel, Soldier & Curio",
    heading: "From Pakio's Combat Raft, head south-east back to Oquilla's Eye.",
    quests: [
      { id: "r1", text: "Turn in all Ravikel sea-monster quests" },
      { id: "r2", text: "Turn in Soldier's 3 quests" },
      { id: "r3", text: "Hand in both Curio coral quests" },
    ],
    note: "Keep hold of the Old Moon Trade Item — it's turned in at Velia on the way home.",
    rewards: "Oquilla Coins · Crow Coins · Carrack materials",
  },
  {
    id: "iliya-return",
    title: "Iliya Island — return",
    loc: "Finish bartering & turn-ins",
    heading: "Sail south from Oquilla's Eye back down to Iliya.",
    quests: [
      { id: "ir1", text: "Finish remaining active barters (aim for 15+ total)" },
      { id: "ir2", text: "Turn in Lively Iliya Island tiers to the Villager" },
      { id: "ir3", text: "Turn in Barter Goods Support to Baori & Maonil" },
    ],
    rewards: "Sailing/Barter EXP · Contribution EXP · Crow Coins",
  },
  {
    id: "velia-final",
    title: "Velia — final turn-ins",
    loc: "Croix, Rovinia, Miya & Proix",
    heading: "Head south past Lema Island — clear Hungry Hekaru ×3 you pass — then dock at Velia.",
    quests: [
      { id: "f1", text: "Turn in Croix's & Rovinia's quests" },
      { id: "f2", text: "Turn in Miya's & Proix's quests" },
      {
        id: "f3",
        text: "Hand in the Old Moon Trade Item to Robert (Velia Guild Wharf Manager) if you picked Velia",
      },
      { id: "f4", text: "Store goods, feed sailors, dock ship" },
    ],
    rewards: "Daily Sailing EXP + Crow Coins secured",
  },
];

export const VOYAGE_STORAGE_KEY = "bdo_voyage_log_v1";
