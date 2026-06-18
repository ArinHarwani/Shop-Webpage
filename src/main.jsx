import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Initialize seed data on first load
import { initSeedDataIfEmpty } from './services/DataService';
import { seedItems, seedVariants } from './services/seedData';
initSeedDataIfEmpty(seedItems, seedVariants);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
