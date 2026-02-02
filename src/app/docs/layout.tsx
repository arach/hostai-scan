import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { docsSource } from '@/lib/docs-source';
import { HostAILogo } from '@/components/docs-logo';
import 'fumadocs-ui/style.css';
import './docs.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider theme={{ attribute: 'class', defaultTheme: 'system', enableSystem: true }}>
      <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <DocsLayout
          tree={docsSource.pageTree}
          nav={{
            title: (
              <div className="flex items-center gap-2">
                <HostAILogo className="h-5 w-auto" />
                <span className="text-sm font-medium text-fd-muted-foreground">Docs</span>
              </div>
            ),
          }}
          sidebar={{
            banner: (
              <div className="mb-4 rounded-lg bg-fd-muted p-3">
                <p className="text-xs text-fd-muted-foreground">
                  Website Audit Rules
                </p>
                <p className="text-sm font-medium">33 rules across 7 categories</p>
              </div>
            ),
          }}
        >
          {children}
        </DocsLayout>
      </div>
    </RootProvider>
  );
}
