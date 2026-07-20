import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import AppLayout from './layouts/AppLayout'
import RequireAuth from './components/RequireAuth'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import OrderNewPage from './pages/OrderNewPage'
import InventoryPage from './pages/InventoryPage'
import ClientsPage from './pages/ClientsPage'
import UsersPage from './pages/UsersPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="ordenes" element={<OrdersPage />} />
          <Route path="ordenes/nueva" element={<OrderNewPage />} />
          <Route path="inventario" element={<InventoryPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="usuarios" element={<UsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
