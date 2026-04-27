import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Sales from './pages/Sales';
import Checkout from './pages/Checkout';
import { CartProvider } from './context/CartContext';

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/vendas" element={<Sales />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </CartProvider>
  );
}
