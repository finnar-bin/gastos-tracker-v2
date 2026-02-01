'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation'

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

export function HistoryFilter({ month, year }: { month: number, year: number }) {
  const router = useRouter()

  const handleMonthChange = (val: string) => {
    router.push(`/history?month=${val}&year=${year}`)
  }

  const handleYearChange = (val: string) => {
    router.push(`/history?month=${month}&year=${val}`)
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="flex gap-2 w-full">
         <div className="w-1/2">
             <Select defaultValue={month.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                    {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                    ))}
                 </SelectContent>
             </Select>
         </div>
         <div className="w-1/2">
             <Select defaultValue={year.toString()} onValueChange={handleYearChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                    {years.map((y) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                 </SelectContent>
             </Select>
         </div>
    </div>
  )
}
