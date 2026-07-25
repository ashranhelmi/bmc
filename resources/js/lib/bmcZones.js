// Single source of truth for the Supply/Value/Demand/Financial zone colors
// and the KP/KA/KR/... short-form legend — shared between BoardCanvas (the
// live canvas) and BmcGuideDialog (the teaching diagram), so the two stay
// visually consistent rather than each picking their own colors/labels.

export const ZONE_OF = {
  key_partners: "supply",
  key_activities: "supply",
  key_resources: "supply",
  value_propositions: "value",
  customer_relationships: "demand",
  channels: "demand",
  customer_segments: "demand",
  cost_structure: "financial",
  revenue_streams: "financial",
}

export const ZONE_TINT = {
  supply: "bg-blue-50 dark:bg-blue-950/30",
  value: "bg-orange-50 dark:bg-orange-950/30",
  demand: "bg-rose-50 dark:bg-rose-950/30",
  financial: "bg-slate-100 dark:bg-slate-800/40",
}

export const ZONE_LABEL_TINT = {
  supply: "text-blue-700 dark:text-blue-300",
  value: "text-orange-700 dark:text-orange-300",
  demand: "text-rose-700 dark:text-rose-300",
  financial: "text-slate-600 dark:text-slate-300",
}

// Short-form so the "supply -> value -> demand" flow diagram fits in one
// line without wrapping — full section names made every box too wide.
export const ABBR = {
  key_partners: "KP",
  key_activities: "KA",
  key_resources: "KR",
  value_propositions: "VP",
  customer_relationships: "CR",
  channels: "CH",
  customer_segments: "CS",
  cost_structure: "C$",
  revenue_streams: "R$",
}
