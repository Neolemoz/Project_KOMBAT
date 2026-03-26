/**
 * Shared Tailwind class groups for consistent spacing and surfaces across all pages.
 * Import these instead of duplicating one-off class strings.
 */
export const pageUi = {
  /** Space below PageTopBar / game header row */
  afterHeader: "mb-10",

  /** Primary page heading block (use with PageTitle) */
  titleBlock: "mb-10",

  /** Muted helper line under title */
  metaText: "text-center text-sm text-white/80",

  /** Footer / action strip with top rule (Continue, End turn, etc.) */
  sectionFooter:
    "mt-10 rounded-2xl border border-white/10 bg-black/50 pt-8 backdrop-blur-md",

  /** Grid for main two-column flows */
  mainGap: "gap-6",

  /** Selectable tile (mode cards, minion cards, roman type buttons base) */
  card:
    "rounded-xl border border-white/10 bg-black/40 text-center text-white transition hover:bg-black/60",

  cardSelected: "border-amber-400/60 bg-black/60",
}
