import { cn } from "../../utils/cn"
import { ASSETS } from "../../constants/assets"

/**
 * One fullscreen background image + centered content column.
 * No overlays, gradients, or fixed layers — predictable layout.
 */
export function PageShell({
  bg,
  children,
  className,
  innerClassName,
  maxWidthClass = "max-w-[1400px]",
}) {
  return (
    <div
      className={cn(
        "flex h-screen w-screen flex-col overflow-hidden bg-cover bg-center bg-no-repeat text-white ",
        className
      )}
      style={bg ? { backgroundImage: `url(${bg})` } : undefined}
    >
      <div
        className={cn(
          "mx-auto flex h-full w-full flex-1 flex-col overflow-x-hidden px-6 py-6 sm:px-8 sm:py-8",
          maxWidthClass,
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** Text page title + optional subtitle (no images). */
export function PageTitle({ title, subtitle, className }) {
  return (
    <div className={cn("text-center", className)}>
      <h1 className="text-2xl font-bold text-white drop-shadow-lg md:text-5xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 text-sm text-white/80 md:text-base">{subtitle}</p>
      ) : null}
    </div>
  )
}

/** Top row: back control + optional right slot. */
export function PageTopBar({ back, right }) {
  return (
    <div className="mb-10 flex items-start justify-between gap-4">
      {back}
      {right ?? <span />}
    </div>
  )
}

/**
 * Top row for battle screen: back | centered HUD | balanced spacer (same height as PageTopBar).
 */
export function PageGameHeader({ back, center, right }) {
  return (
    <div className="mb-4 flex items-center gap-3 sm:gap-4">
      <div className="shrink-0">{back}</div>
      <div className="min-w-0 flex-1">{center}</div>
      <div className="flex w-10 shrink-0 justify-end sm:w-14">
        {right ?? <span aria-hidden className="inline-block w-full" />}
      </div>
    </div>
  )
}

/** Standard bottom section with top border (matches flow pages). */
export function PageSection({ children, className }) {
  return (
    <div
      className={cn(
        "mt-10 rounded-2xl ",
        className
      )}
    >
      {children}
    </div>
  )
}

export function BackButton({ onClick, label = "Back" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-black/50 px-2 py-2 text-white backdrop-blur-md transition hover:bg-black/60"
    >
      <img src={ASSETS.back} alt={label} className="h-8 w-auto md:h-9" draggable={false} />
    </button>
  )
}
