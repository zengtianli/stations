interface PageHeaderProps {
  title: string
  description?: string
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="text-center pt-32 pb-16">
      <h1 className="text-4xl md:text-5xl font-semibold text-[#1d1d1f] tracking-tight mb-4">{title}</h1>
      {description && (
        <p className="text-base md:text-lg text-[#86868b] max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  )
}
