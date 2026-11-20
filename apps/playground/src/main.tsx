import './styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import { readDarkProposal } from './themes';

const proposal = readDarkProposal(window.location.search);
if (proposal !== undefined) document.documentElement.dataset.darkProposal = proposal;

const root = document.getElementById('root');
if (root === null) throw new Error('#root is missing from index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
