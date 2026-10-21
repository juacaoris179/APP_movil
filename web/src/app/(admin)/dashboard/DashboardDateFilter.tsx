'use client'

import { useRouter } from 'next/navigation'
import { Calendar } from 'lucide-react'

interface DashboardDateFilterProps {
  currentDate: string
}

export default function DashboardDateFilter({ currentDate }: DashboardDateFilterProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 shadow-sm">
      <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
      <label htmlFor="dashboard-date" className="text-xs text-slate-400 whitespace-nowrap">
        Fecha:
      </label>
      <input
        id="dashboard-date"
        type="date"
        value={currentDate}
        onChange={(e) => {
          if (e.target.value) {
            router.push(`/dashboard?fecha=${e.target.value}`)
          }
        }}
        className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
      />
    </div>
  )
}
