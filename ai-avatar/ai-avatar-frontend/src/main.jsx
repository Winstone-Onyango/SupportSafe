import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ChatProvider } from './hooks/useChat';
import './index.css';

// When SupportSafe embeds this app (ai-avatar/ai-avatar-frontend is rendered in
// an iframe on the Therapy Bot page) the host supplies the page chrome and
// background, so we drop our own gradient and blend into the card.
const params = new URLSearchParams(window.location.search);
const embedded =
  window.self !== window.top || // rendered inside an iframe
  params.has('embedded') || // explicit opt-in
  window.location.hash.includes('embedded'); // or via the hash

if (embedded) {
  document.body.classList.add('embedded');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChatProvider>
      <App />
    </ChatProvider>
  </React.StrictMode>
);
