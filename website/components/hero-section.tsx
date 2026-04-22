/**
 * 首页 Hero — Apple 风格极简
 */

export default function HeroSection() {
  return (
    <section className="pt-32 md:pt-40 pb-16 md:pb-20 flex items-center justify-center px-6">
      <div className="text-center animate-[fadeIn_0.8s_ease]">
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight text-[#1d1d1f] mb-6">
          曾田力
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-[#86868b] font-normal tracking-wide">
          水利工程师 · AI 工程师 · 独立开发者
        </p>
      </div>
    </section>
  )
}
