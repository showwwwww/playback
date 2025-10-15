import backend from '@/msg/backend';

const listeners: Map<string, Function> = new Map();

backend.addEventListener('changePlayback', ({ playbackRate }) => {
  document.querySelectorAll('video')?.forEach((video) => {
    video.playbackRate = playbackRate;
    const listener = () => {
      video.playbackRate = playbackRate;
    };
    if (listeners.has(location.href)) {
      video.removeEventListener(
        'play',
        listeners.get(location.href) as EventListener,
      );
    }
    listeners.set(location.href, listener);
    video.addEventListener('play', listener);
  });
});

backend.addEventListener('getURI', (_, __, sendResponse) => {
  sendResponse({ href: location.href, hostname: location.hostname });
});
