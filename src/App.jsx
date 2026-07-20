import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/DashboardPage'
import OrdersPage from './pages/OrdersPage'
import OrderNewPage from './pages/OrderNewPage'
import InventoryPage from './pages/InventoryPage'
import ClientsPage from './pages/ClientsPage'
import UsersPage from './pages/UsersPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="ordenes" element={<OrdersPage />} />
        <Route path="ordenes/nueva" element={<OrderNewPage />} />
        <Route path="inventario" element={<InventoryPage />} />
        <Route path="clientes" element={<ClientsPage />} />
        <Route path="usuarios" element={<UsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
