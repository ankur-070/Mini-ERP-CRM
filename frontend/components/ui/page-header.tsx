export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground text-pretty">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2.5">{action}</div> : null}
    </div>
  )
}
