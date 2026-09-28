// Full-screen page background, fixed while scrolling: dawn sky in light theme, galaxy in dark.
// Theme switches through the `dark:` variant (class on <html>), so no JS is needed.
export function SkyBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20">
      <div className="sky-dawn absolute inset-0 dark:hidden" />
      <div className="sky-galaxy absolute inset-0 hidden dark:block">
        <div className="stars-far absolute inset-0" />
        <div className="stars absolute inset-0" />
      </div>
    </div>
  );
}
