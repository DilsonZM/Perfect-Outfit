import ModulePlaceholder from '../components/ModulePlaceholder'

export default function UsersPage() {
  return (
    <ModulePlaceholder
      title="Seguridad y usuarios"
      description="Perfiles de empleados y control de acceso"
      features={[
        'Listado de usuarios del sistema',
        'Creación de perfiles de empleados (solo rol Admin)',
      ]}
    />
  )
}
