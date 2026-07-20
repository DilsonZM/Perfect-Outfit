import ModulePlaceholder from '../components/ModulePlaceholder'

export default function DashboardPage() {
  return (
    <ModulePlaceholder
      title="Dashboard"
      description="Vista general del negocio"
      features={[
        'Métricas de ingresos, prendas alquiladas y prendas en lavandería',
        'Tabla de alertas de devoluciones atrasadas',
      ]}
    />
  )
}
