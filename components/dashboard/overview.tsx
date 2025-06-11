"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  {
    name: "Jan",
    leads: 12,
    deals: 5,
  },
  {
    name: "Feb",
    leads: 18,
    deals: 7,
  },
  {
    name: "Mar",
    leads: 25,
    deals: 9,
  },
  {
    name: "Apr",
    leads: 20,
    deals: 8,
  },
  {
    name: "May",
    leads: 32,
    deals: 12,
  },
  {
    name: "Jun",
    leads: 28,
    deals: 10,
  },
  {
    name: "Jul",
    leads: 35,
    deals: 15,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Bar dataKey="leads" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        <Bar dataKey="deals" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
