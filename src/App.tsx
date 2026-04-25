import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Sales from './pages/Sales';
import { CartProvider } from './context/CartContext';

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vendas" element={<Sales />} />
      </Routes>
    </CartProvider>
  );
}
