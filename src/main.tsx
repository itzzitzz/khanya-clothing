import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Dispatch event for pre-renderer to know when content is ready
document.dispatchEvent(new Event("render-event"));
