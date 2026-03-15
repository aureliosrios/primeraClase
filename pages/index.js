import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Clock, BarChart3 } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Dashboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data: semaforo } = await supabase.from('v_semaforo_operativo').select('*')
      setData(semaforo || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-10 text-center font-sans">Conectando con Supabase...</div>

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">LOOKAHEAD & PPC</h1>
            <p className="text-slate-500 font-medium mt-1 text-lg">Proyecto: CX25744531 - Control Operativo</p>
          </div>
          <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
            <BarChart3 size={32} />
            <div>
              <p className="text-xs uppercase font-bold opacity-80">Estado Global</p>
              <p className="text-3xl font-black">EN VIVO</p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="text-blue-500" /> Semáforo de Restricciones
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                  <th className="p-5">Actividad</th>
                  <th className="p-5">Responsable</th>
                  <th className="p-5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5">
                      <p className="font-bold text-slate-700">{item.actividad}</p>
                      <p className="text-xs text-slate-400">{item.id}</p>
                    </td>
                    <td className="p-5 text-slate-600 font-medium">{item.responsible}</td>
                    <td className="p-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black ${
                        item.semaforo_estado.includes('BLOQUEADA') ? 'bg-red-100 text-red-600' :
                        item.semaforo_estado.includes('CUMPLIDA') ? 'bg-emerald-100 text-emerald-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {item.semaforo_estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
