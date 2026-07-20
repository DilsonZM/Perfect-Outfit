import ModulePlaceholder from '../components/ModulePlaceholder'

export default function OrderNewPage() {
  return (
    <ModulePlaceholder
      title="Nueva orden"
      description="Formulario dinámico de creación de orden"
      features={[
        'Selección de cliente',
        'Agregar múltiples ítems (prenda principal, zapato, accesorio)',
        'Descuento en % o valor fijo, cálculo de total y generación de la orden',
      ]}
    />
  )
}
