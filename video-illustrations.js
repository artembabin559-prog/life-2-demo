(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const videos = document.querySelectorAll('video[data-loop-src]');
  const visible = new Set();

  function update(video) {
    if (reducedMotion.matches) {
      if (video.hasAttribute('src')) {
        video.removeAttribute('src');
        video.load(); // Restore the still poster when the motion preference changes.
      }
      return;
    }
    if (document.hidden || !visible.has(video)) {
      video.pause();
      return;
    }
    if (!video.hasAttribute('src')) video.src = video.dataset.loopSrc;
    video.play().catch(() => {}); // Some mobile power modes allow only the poster.
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
      update(entry.target);
    }
  });
  videos.forEach(video => observer.observe(video));
  reducedMotion.addEventListener('change', () => videos.forEach(update));
  document.addEventListener('visibilitychange', () => videos.forEach(update));
})();
