import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuraAgent } from './services/autonomousAgent';

// Start the Autonomous Intelligence Module
try {
  AuraAgent.start();
} catch (e) {
  console.error("AuraAgent failed to start:", e);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);