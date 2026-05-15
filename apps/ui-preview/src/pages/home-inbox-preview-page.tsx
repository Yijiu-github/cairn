import {
  HomeCommandBarSection,
  HomeHandoffSection,
  HomeRuntimeSidebar,
  HomeRunsSection,
} from '../preview-sections/home-inbox-sections';

export function HomeInboxPreviewPage() {
  return (
    <div className="prototype-page">
      <HomeCommandBarSection />

      <section className="home-layout">
        <div className="home-main-column">
          <HomeHandoffSection />
          <HomeRunsSection />
        </div>

        <HomeRuntimeSidebar />
      </section>
    </div>
  );
}
