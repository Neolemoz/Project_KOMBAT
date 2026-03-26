/**
 * Shared Tailwind class groups for consistent spacing and surfaces across all pages.
 * Import these instead of duplicating one-off class strings.
 */
export const pageUi = {
  /** Space below PageTopBar / game header row */
  afterHeader: "mb-10",

  /** Primary page heading block (use with PageTitle) */
  titleBlock: "mb-15 font-bold text-white " +
      "[text-shadow:_0_0_15px_#dc9e2e,_0_0_30px_#243496,_0_5px_10px_#000000]",

  /** Muted helper line under title */
  metaText: "text-center text-sm text-white " +
      "[text-shadow:_0_0_15px_#dc9e2e,_0_0_30px_#243496,_0_5px_10px_#000000]",

  /** Footer / action strip with top rule (Continue, End turn, etc.) */
  sectionFooter:
    "mt-10 rounded-2xl border border-white/10 bg-black/50 pt-8 backdrop-blur-md",

  /** Grid for main two-column flows */
  mainGap: "gap-2",

  /** Selectable tile (mode cards, minion cards, roman type buttons base) */
  card:
    "rounded-xl  text-center text-white transition hover:bg-black/30 ",

  cardSelected: "border-amber-400/60 bg-black/60",
}
