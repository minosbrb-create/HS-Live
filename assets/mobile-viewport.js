(() => {
  const viewport = document.querySelector('meta[name="viewport"]');
  const touchDevice = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  if (!viewport || !touchDevice || !screen.width || !screen.height) return;

  const portraitWidth = Math.min(screen.width, screen.height);
  const forcePhysicalViewport = portraitWidth <= 680 && window.innerWidth > portraitWidth * 1.4;
  if (!forcePhysicalViewport) return;

  function alignViewportToScreen() {
    const landscape = screen.orientation?.type?.startsWith('landscape')
      ?? window.matchMedia('(orientation: landscape)').matches;
    const physicalWidth = landscape
      ? Math.max(screen.width, screen.height)
      : portraitWidth;

    viewport.content = `width=${physicalWidth}, initial-scale=1, interactive-widget=resizes-content`;
  }

  alignViewportToScreen();
  screen.orientation?.addEventListener('change', alignViewportToScreen);
  window.addEventListener('orientationchange', alignViewportToScreen, { passive: true });
})();
