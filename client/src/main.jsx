import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Mount inside WordPress's [rank_arena] root if present, otherwise the standalone #root.
const target =
  document.getElementById('rank-arena-root') ||
  document.getElementById('root');

if (target) {
  ReactDOM.createRoot(target).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}
