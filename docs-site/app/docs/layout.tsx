import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { HostAILogo } from '@/components/hostai-logo';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
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
  );
}
