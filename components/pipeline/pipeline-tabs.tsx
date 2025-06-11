"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function PipelineTabs() {
  const [activeTab, setActiveTab] = useState("main")

  return (
    <div className="mb-6">
      <Tabs defaultValue="main" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="main">Main Pipeline</TabsTrigger>
          <TabsTrigger value="realtor">Realtor Referrals</TabsTrigger>
          <TabsTrigger value="investment">Investment Properties</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
