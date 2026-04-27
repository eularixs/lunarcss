import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { DocsBackground } from '@/components/docs-background';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <>
      <DocsBackground />
      <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
        {children}
      </DocsLayout>
    </>
  );
}
