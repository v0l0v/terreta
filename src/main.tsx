import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'
import './styles/mobile.css'
import './styles/adventure.css'

createRoot(document.getElementById("root")!).render(<App />);
