import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const rootElement = document.getElementById("root")!;

// Check if the app was pre-rendered (has existing content)
if (rootElement.hasChildNodes()) {
  // Hydrate pre-rendered content
  hydrateRoot(rootElement, <App />);
} else {
  // Normal client-side render
  createRoot(rootElement).render(<App />);
}
