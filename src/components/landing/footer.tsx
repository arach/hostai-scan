"use client"

import Link from "next/link"
import { HostAILogo } from "@/components/icons/hostai-logo"

interface FooterProps {
  /** Main HostAI URL */
  hostaiUrl?: string
}

export function Footer({
  hostaiUrl = "https://hostai.app"
}: FooterProps) {
  return (
    <footer
      className="py-12"
      style={{
        background: "#f9fafb",
        borderTop: "1px solid #e0e4e6",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <Link href="/" className="transition-opacity hover:opacity-80">
            <HostAILogo className="h-4 w-auto" color="#001821" />
          </Link>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href={hostaiUrl}
              target="_blank"
              className="transition-colors hover:opacity-70"
              style={{ color: "#61686b" }}
            >
              About HostAI
            </Link>
            <Link
              href={`${hostaiUrl}/privacy`}
              target="_blank"
              className="transition-colors hover:opacity-70"
              style={{ color: "#61686b" }}
            >
              Privacy Policy
            </Link>
            <Link
              href={`${hostaiUrl}/terms`}
              target="_blank"
              className="transition-colors hover:opacity-70"
              style={{ color: "#61686b" }}
            >
              Terms of Service
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div
          className="mt-8 pt-8 text-center text-sm"
          style={{
            borderTop: "1px solid #e0e4e6",
            color: "#8b9498",
          }}
        >
          <p>
            Built by{" "}
            <Link
              href={hostaiUrl}
              target="_blank"
              className="font-normal transition-colors hover:opacity-70"
              style={{ color: "#001821" }}
            >
              HostAI
            </Link>
            {" "}&mdash; The complete platform for short-term rental success.
          </p>
        </div>
      </div>
    </footer>
  )
}
