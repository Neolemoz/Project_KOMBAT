export default function TitleBanner({ title, width = 760, className = "" }) {
  return (
    <div className={`flex justify-center ${className || ""}`}>
      <div className="relative" style={{ width, maxWidth: "92%" }}>
        <img
          src="/textbox.png"
          alt="title-banner"
          className="block h-auto w-full"
          draggable="false"
        />
        <div className="absolute inset-0 flex items-center justify-center translate-y-[1px]">
          <h1 className="text-center font-serif text-4xl uppercase tracking-[0.30em] text-white drop-shadow md:text-5xl">
            {title}
          </h1>
        </div>
      </div>
    </div>
  )
}
