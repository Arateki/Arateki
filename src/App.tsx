import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Sales from './pages/Sales';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/vendas" element={<Sales />} />
    </Routes>
  );
}
