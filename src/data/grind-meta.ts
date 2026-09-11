export const TERRITORIES = [
  "Balenos",
  "Serendia",
  "Calpheon",
  "Mediah",
  "Valencia",
  "Kamasylvia",
  "Drieghan",
  "O'dyllita",
  "Mountain of Eternal Winter",
  "Land of the Morning Light",
  "Ulukita",
  "Edania",
  "Margoria",
  "Other",
] as const;

export const MONSTER_TYPES = [
  "Human",
  "Demihuman",
  "Animal",
  "Plant",
  "Undead",
  "Kama / Nature",
  "Dragon / Drieghan",
  "Ahib / O'dyllita",
  "Ancient / Ruins",
  "Demon / Edania",
  "Mixed",
  "Other",
] as const;

export const LIFESKILL_TYPES = [
  "Gathering",
  "Mining",
  "Logging",
  "Fluid Collecting",
  "Hoeing",
  "Fishing",
  "Hunting",
  "Processing",
  "Cooking",
  "Alchemy",
  "Training",
  "Trading",
  "Farming",
  "Sailing",
  "Barter",
] as const;

export type SpotMode = "pve" | "lifeskill";
