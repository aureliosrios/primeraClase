import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Clock, TrendingUp, DollarSign, Target, Calendar } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Dashboard() {
  const [lookahead, setLookahead] = useState([])
  const [sCurve, setSCurve] = useState([])
  const [ppcData, setPpcData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAllData() {
      const { data: la } = await supabase.from('v_semaforo_operativo').select('*')
      const { data: sc } = await supabase.from('v_s_curve').select('*').order('snapshot_date', { ascending: true })
      const { data: ppc } = await supabase.from('v_kpi_ppc_semanal').select('*').order('week_start', { ascending: true })
      
      setLookahead(la || [])
      setSCurve(sc || [])
      setPpcData(ppc || [])
      setLoading(false)
    }
    fetchAllData()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* BARRA SUPERIOR */}
      <nav className="bg-white border-b p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><TrendingUp size={20}/></div>
            <span className="font-black text-xl tracking-tight">PROJECT CONTROL AI</span>
          </div>
          <div className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            DATA DATE: 15 MAR 2026
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* RESUMEN EJECUTIVO (CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card icon={<Target className="text-blue-600"/>} title="PPC Semanal" value="85.4%" sub="Cumplimiento de plan" />
          <Card icon={<TrendingUp className="text-emerald-600"/>} title="SPI (Plazo)" value="0.89" sub="Atraso del 11%" color="text-amber-600"/>
          <Card icon={<DollarSign className="text-purple-600"/>} title="CPI (Costo)" value="0.85" sub="Sobre costo detectado" color="text-red-600"/>
          <Card icon={<Calendar className="text-orange-600"/>} title="Fin Estimado" value="27 NOV 26" sub="Según proyección actual" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GRÁFICO 1: CURVA S */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500"/> Curva S: Avance del Proyecto</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sCurve}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week_number" />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="pv" stroke="#94a3b8" fill="#f1f5f9" name="Planificado" />
                  <Area type="monotone" dataKey="ev" stroke="#2563eb" fill="#dbeafe" name="Ganado (Real)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 2: PPC HISTÓRICO */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500"/> Confiabilidad del Plan (PPC)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ppcData}>
                  <XAxis dataKey="week_start" tickFormatter={(str) => new Date(str).toLocaleDateString('es-PE', {day:'numeric', month:'short'})} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="ppc_porcentaje" name="% PPC" radius={[4, 4, 0, 0]}>
                    {ppcData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.ppc_porcentaje > 80 ? '#10b981' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TABLA DE LOOKAHEAD MEJORADA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={18} className="text-blue-500"/> Lookahead Operativo (Próximas 6 Semanas)</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lookahead.length} Actividades</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 text-[10px] uppercase font-bold border-b bg-slate-50/50">
                  <th className="p-4">Actividad</th>
                  <th className="p-4">Responsable</th>
                  <th className="p-4">Avance</th>
                  <th className="p-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lookahead.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-all group">
                    <td className="p-4">
                      <div className="font-bold text-slate-700 group-hover:text-blue-700">{item.actividad}</div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">{item.id}</div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">{item.responsible}</td>
                    <td className="p-4">
                       <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                          <div className="bg-blue-600 h-full" style={{width: `${item.real_pct}%`}}></div>
                       </div>
                       <span className="text-[10px] font-bold text-slate-400">{item.real_pct}% de {item.meta_pct}%</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-tighter ${
                        item.semaforo_estado.includes('BLOQUEADA') ? 'bg-red-50 text-red-600 border border-red-100' :
                        item.semaforo_estado.includes('CUMPLIDA') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        'bg-amber-50 text-amber-600 border border-amber-100'
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
      </main>
    </div>
  )
}

function Card({ icon, title, value, sub, color="text-slate-900" }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-start gap-4">
      <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
        <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
      </div>
    </div>
  )
}
