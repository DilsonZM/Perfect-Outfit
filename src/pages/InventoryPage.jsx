import ModulePlaceholder from '../components/ModulePlaceholder'

export default function InventoryPage() {
  return (
    <ModulePlaceholder
      title="Inventario y lavandería"
      description="Catálogo de prendas e ítems de alquiler"
      features={[
        'CRUD completo de prendas (código, categoría, talla, color, marca, precios)',
        'Cambio rápido de estado: Disponible / Lavandería / Mantenimiento / Alquilado',
      ]}
    />
  )
}
