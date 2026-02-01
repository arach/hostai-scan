import Link from "next/link"
import { Activity } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">EliteGen</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link href="https://elitegen.com" target="_blank" className="hover:text-foreground">
              About EliteGen
            </Link>
            <Link href="https://elitegen.com/privacy" target="_blank" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="https://elitegen.com/terms" target="_blank" className="hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
        
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>
            Built by{" "}
            <Link href="https://elitegen.com" target="_blank" className="font-medium text-foreground hover:underline">
              EliteGen
            </Link>
            {" "}&mdash; The complete platform for short-term rental success.
          </p>
        </div>
      </div>
    </footer>
  )
}
