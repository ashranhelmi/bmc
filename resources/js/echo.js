import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

// wsHost is deliberately derived from the page's own hostname at runtime, not
// baked in from a Vite build-time env var. This app is loaded by every
// participant at the host's current LAN IP (which changes between sessions —
// see ShareSessionScreen), so a hardcoded VITE_REVERB_HOST would only ever
// work on the host's own machine and silently fail to connect for everyone
// else on the network.
const isSecure = window.location.protocol === 'https:';

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: window.location.hostname,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    forceTLS: isSecure,
    enabledTransports: isSecure ? ['wss'] : ['ws'],
});
