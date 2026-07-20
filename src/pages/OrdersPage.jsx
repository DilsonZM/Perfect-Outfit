import ModulePlaceholder from '../components/ModulePlaceholder'

export default function OrdersPage() {
  return (
    <ModulePlaceholder
      title="Órdenes de servicio"
      description="Gestión de órdenes de alquiler"
      features={[
        'Listado de órdenes con estado, cliente y fechas',
        'Crear orden con múltiples ítems, descuento y total calculado',
      ]}
    />
  )
}
