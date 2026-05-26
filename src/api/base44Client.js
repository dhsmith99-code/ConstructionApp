import { createClient } from '@base44/sdk';

export const base44 = createClient({
  appId: '69e15ed21f38e4f0db4a345b',
  requiresAuth: false,
  serverUrl: '',
  appBaseUrl: 'https://app.base44.com',
});

function applyToken(token) {
  localStorage.setItem('base44_access_token', token);
  localStorage.setItem('token', token);
  base44.setToken(token);
}

async function initToken() {
  // 1. Token from URL ?access_token= (base44 platform passes it this way after OAuth)
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('access_token');
  if (urlToken) {
    applyToken(urlToken);
    // Share with preview browser via dev-token endpoint
    fetch('/dev-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: urlToken }),
    }).catch(() => {});
    return;
  }

  // 2. Token already in localStorage
  const saved = localStorage.getItem('base44_access_token') || localStorage.getItem('token');
  if (saved) {
    base44.setToken(saved);
    return;
  }

  // 3. Token synced from another browser instance via dev-token endpoint
  try {
    const res = await fetch('/dev-token');
    const { token } = await res.json();
    if (token) {
      applyToken(token);
    }
  } catch {}
}

initToken();

export function setBase44Token(token) {
  applyToken(token);
}
