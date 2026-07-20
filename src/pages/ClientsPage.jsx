import ModulePlaceholder from '../components/ModulePlaceholder'

export default function ClientsPage() {
  return (
    <ModulePlaceholder
      title="Clientes (CRM)"
      description="Registro y seguimiento de clientes"
      features={[
        'CRUD de clientes con documento, teléfono y correo',
        'Historial de tallas y preferencias (JSONB)',
      ]}
    />
  )
}
