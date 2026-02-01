const stats = [
  { value: "2,500+", label: "Websites Audited" },
  { value: "45%", label: "Avg. Issue Detection Rate" },
  { value: "23%", label: "Booking Increase After Fixes" },
  { value: "60s", label: "Average Audit Time" },
]

export function StatsSection() {
  return (
    <section className="border-y border-border bg-secondary/50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold tracking-tight lg:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
