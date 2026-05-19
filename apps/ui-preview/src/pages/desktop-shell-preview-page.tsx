import {
  DesktopShellHeroSection,
  DesktopShellInboxSection,
  DesktopShellNavigationSection,
  DesktopShellRunsSection,
  DesktopShellSidebarSection,
} from '../preview-sections/desktop-shell-sections';

export function DesktopShellPreviewPage() {
  return (
    <section className="desktop-shell-page" aria-label="Desktop Shell 原型">
      <DesktopShellHeroSection />

      <section className="desktop-shell-grid">
        <DesktopShellNavigationSection />

        <main className="desktop-shell-main" aria-label="主工作区">
          <DesktopShellInboxSection />
          <DesktopShellRunsSection />
        </main>

        <DesktopShellSidebarSection />
      </section>
    </section>
  );
}
