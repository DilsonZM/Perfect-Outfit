import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PageTransition from '../components/PageTransition'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl p-6 md:p-8 lg:p-10">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  )
}
