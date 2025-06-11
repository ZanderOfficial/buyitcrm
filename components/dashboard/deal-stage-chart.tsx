"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  { name: "Pre-Qualified", value: 15, color: "#4f46e5" },
  { name: "Needs Followup", value: 8, color: "#8b5cf6" },
  { name: "Appointment Set", value: 12, color: "#ec4899" },
  { name: "In Negotiation", value: 7, color: "#f97316" },
  { name: "Under Contract", value: 5, color: "#22c55e" },
  { name: "Completed", value: 3, color: "#14b8a6" },
]

export function DealStageChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center">
            <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-muted-foreground">
              {item.name}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
