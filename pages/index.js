import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Clock, TrendingUp, DollarSign, Target, Calendar, BarChart2 } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, ComposedChart, Line } from 'recharts'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Dashboard() {
  const [activities, setActivities] = useState([])
  const [sCurve, setSCurve] = useState([])
  const [ppcData, setPpcData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAllData() {
      // 1. Traemos actividades con sus fechas para el Gantt
      const { data: act } = await supabase.from('activities').select('*, wbs_nodes(name)').order('target_start', { ascending: true })
      // 2. Curva S (aseguramos que traiga datos numéricos)
      const { data: sc } = await supabase.from('v_s_curve').select('*').order('snapshot_date', { ascending: true })
      // 3. PPC
      const { data: ppc } = await supabase.from('v_kpi_ppc_semanal').select('*').order('week_start', { ascending: true })
      
      setActivities(act || [])
      setSCurve(sc?.map(d => ({...d, pv: Number(d.pv), ev: Number(d.ev || 0)})) || [])
      setPpcData(ppc || [])
      setLoading(false)
    }
    fetchAllData()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      <p className="font-mono text-sm animate-pulse">Sincronizando con base de datos P6...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-20">
      {/* HEADER DINÁMICO */}
      <nav className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-200">
              <BarChart2 size={20}/>
            </div>
            <span className="font-black text-xl tracking-tight text-slate-800 uppercase">Control Operativo Poza 75K</span>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              DATA DATE: 15 MAR 2026
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* INDICADORES CLAVE (Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card icon={<Target className="text-blue-600"/>} title="PPC" value="85%" sub="Confiabilidad" />
          <Card icon={<TrendingUp className="text-emerald-600"/>} title="SPI" value="0.89" sub="Eficiencia Plazo" color="text-amber-600"/>
          <Card icon={<DollarSign className="text-purple-600"/>} title="CPI" value="0.85" sub="Eficiencia Costo" color="text-red-600"/>
          <Card icon={<Calendar className="text-orange-600"/>} title="Finish" value="May 2026" sub="Fecha Proyectada" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CURVA S MEJORADA */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500"/> Avance Programado vs. Real (Curva S)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sCurve}>
                  <defs>
                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="week_number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="pv" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorPv)" name="Planificado" />
                  <Area type="monotone" dataKey="ev" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEv)" name="Real logrado" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DIAGRAMA DE GANTT OPERATIVO (Por actividad) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
              <Clock size={18} className="text-blue-500"/> Gantt: Días Trabajados vs. Plan
            </h3>
            <div className="h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {activities.slice(0, 8).map((act, i) => (
                <div key={i} className="mb-4">
                  <div className="flex justify-between text-[10px] mb-1 font-bold text-slate-500">
                    <span>{act.code} - {act.name}</span>
                    <span>{act.pct_complete}%</span>
                  </div>
                  {/* Barra de Plan (Gris claro) */}
                  <div className="w-full bg-slate-100 h-4 rounded-full relative overflow-hidden">
                    {/* Barra de Real (Azul) */}
                    <div 
                      className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${act.pct_complete}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-center text-slate-400 mt-4 italic">Mostrando actividades principales en curso</p>
            </div>
          </div>
        </div>

        {/* TABLA DE DETALLES LOOKAHEAD */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-6 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Detalle de Cumplimiento por Responsable</h3>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-slate-400 text-[10px] uppercase font-black tracking-widest">
                    <th className="p-5">Actividad / WBS</th>
                    <th className="p-5">Responsable</th>
                    <th className="p-5">Plan Start</th>
                    <th className="p-5 text-center">Estado Crítico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activities.filter(a => a.status === 'in_progress').map((item, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-5">
                        <p className="font-bold text-slate-700">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{item.code}</p>
                      </td>
                      <td className="p-5">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">ING. RESIDENTE</span>
                      </td>
                      <td className="p-5 text-xs text-slate-500 font-mono">{item.target_start}</td>
                      <td className="p-5 text-center">
                        {item.is_critical ? 
                          <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-black">RUTA CRÍTICA</span> : 
                          <span className="text-slate-300 text-[10px]">NORMAL</span>
                        }
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
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
        <p className="text-[10px] text-slate-400 font-bold">{sub}</p>
      </div>
    </div>
  )
}
