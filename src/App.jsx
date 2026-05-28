import { useState } from 'react';
import Header from './components/Header.jsx';
import StatusCard from './components/StatusCard.jsx';
import { nextStatus } from './utils/status.js';

export default function App() {
  const [status, setStatus] = useState('ok');
  return (
    <main>
      <Header />
      <StatusCard status={status} onCycle={() => setStatus(nextStatus(status))} />
    </main>
  );
}
