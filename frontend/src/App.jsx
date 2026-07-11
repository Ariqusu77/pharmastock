import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import PlaceOrder from './pages/PlaceOrder';
import MyOrders from './pages/MyOrders';
import PharmacyOrders from './pages/PharmacyOrders';
import Inventory from './pages/Inventory';
import StockIn from './pages/StockIn';

function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === 'pharmacy' ? '/pharmacy/orders' : '/department/order'} replace />;
  }
  return children;
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'pharmacy' ? '/pharmacy/orders' : '/department/order'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route
              element={
                <RequireAny>
                  <Layout />
                </RequireAny>
              }
            >
              <Route
                path="/department/order"
                element={
                  <RequireRole role="department">
                    <PlaceOrder />
                  </RequireRole>
                }
              />
              <Route
                path="/department/orders"
                element={
                  <RequireRole role="department">
                    <MyOrders />
                  </RequireRole>
                }
              />
              <Route
                path="/pharmacy/orders"
                element={
                  <RequireRole role="pharmacy">
                    <PharmacyOrders />
                  </RequireRole>
                }
              />
              <Route
                path="/pharmacy/inventory"
                element={
                  <RequireRole role="pharmacy">
                    <Inventory />
                  </RequireRole>
                }
              />
              <Route
                path="/pharmacy/stock-in"
                element={
                  <RequireRole role="pharmacy">
                    <StockIn />
                  </RequireRole>
                }
              />
            </Route>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

function RequireAny({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
