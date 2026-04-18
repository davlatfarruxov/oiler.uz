'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp, Settings } from 'lucide-react'

interface Employee {
  _id: string
  name: string
  commissionRate: number
}

interface EmployeeCommission {
  employee: string
  commissionRate: number
  commissionAmount: number
}

interface EmployeeCommissionControlProps {
  employees: Employee[]
  selectedEmployees: string[]
  laborCost: number
  commissions: EmployeeCommission[]
  onCommissionsChange: (commissions: EmployeeCommission[]) => void
}

export function EmployeeCommissionControl({
  employees,
  selectedEmployees,
  laborCost,
  commissions,
  onCommissionsChange
}: EmployeeCommissionControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localCommissions, setLocalCommissions] = useState<EmployeeCommission[]>([])

  const normalizeCommissions = (commissionsToNormalize: EmployeeCommission[]) => {
    if (laborCost <= 0) {
      return commissionsToNormalize.map((commission) => ({
        ...commission,
        commissionRate: 0,
        commissionAmount: 0
      }))
    }

    const total = commissionsToNormalize.reduce((sum, commission) => sum + commission.commissionAmount, 0)
    if (total <= laborCost) {
      return commissionsToNormalize
    }

    const scale = laborCost / total
    return commissionsToNormalize.map((commission) => {
      const normalizedAmount = Math.round(commission.commissionAmount * scale)
      const normalizedRate = Math.round((normalizedAmount * 10000) / laborCost) / 100
      return {
        ...commission,
        commissionRate: normalizedRate,
        commissionAmount: normalizedAmount
      }
    })
  }

  // Initialize commissions when props change
  useEffect(() => {
    if (selectedEmployees.length === 0) {
      setLocalCommissions([])
      return
    }

    const selectedEmployeesData = selectedEmployees
      .map(employeeId => employees.find(e => e._id === employeeId))
      .filter(Boolean) as Employee[]
    const totalDefaultRate = selectedEmployeesData.reduce((sum, employee) => sum + (employee.commissionRate || 0), 0)
    const sharedDefaultRate = selectedEmployees.length > 0
      ? Math.round(((totalDefaultRate / selectedEmployees.length) / selectedEmployees.length) * 100) / 100
      : 0

    const newCommissions = selectedEmployees.map(employeeId => {
      const employee = employees.find(e => e._id === employeeId)
      const existingCommission = localCommissions.find(c => c.employee === employeeId)
      
      if (existingCommission) {
        // Keep existing rate but update amount based on new labor cost
        return {
          ...existingCommission,
          commissionAmount: Math.round((laborCost * existingCommission.commissionRate) / 100)
        }
      }
      
      // Check if there's a commission from parent props
      const propsCommission = commissions.find(c => c.employee === employeeId)
      if (propsCommission) {
        return {
          ...propsCommission,
          commissionAmount: Math.round((laborCost * propsCommission.commissionRate) / 100)
        }
      }
      
      // Use a shared default rate and split equally between selected employees.
      const defaultRate = sharedDefaultRate
      const amount = Math.round((laborCost * defaultRate) / 100)
      
      return {
        employee: employeeId,
        commissionRate: defaultRate,
        commissionAmount: amount
      }
    })
    
    const normalizedCommissions = normalizeCommissions(newCommissions)

    const hasChanged =
      normalizedCommissions.length !== localCommissions.length ||
      normalizedCommissions.some((next, index) => {
        const current = localCommissions[index]
        if (!current) return true
        return (
          current.employee !== next.employee ||
          current.commissionRate !== next.commissionRate ||
          current.commissionAmount !== next.commissionAmount
        )
      })

    if (hasChanged) {
      setLocalCommissions(normalizedCommissions)
      onCommissionsChange(normalizedCommissions)
    }
  }, [selectedEmployees, employees, laborCost])

  // Update commissions when laborCost changes
  useEffect(() => {
    if (localCommissions.length > 0) {
      const updatedCommissions = localCommissions.map(commission => ({
        ...commission,
        commissionAmount: Math.round((laborCost * commission.commissionRate) / 100)
      }))
      const normalizedCommissions = normalizeCommissions(updatedCommissions)
      
      // Check if amounts actually changed
      const hasChanged = normalizedCommissions.some((updated, index) => 
        updated.commissionAmount !== localCommissions[index].commissionAmount
      )
      
      if (hasChanged) {
        setLocalCommissions(normalizedCommissions)
        onCommissionsChange(normalizedCommissions)
      }
    }
  }, [laborCost])

  // Update commission amount when rate changes
  const handleRateChange = (employeeId: string, newRate: number) => {
    const newAmount = Math.round((laborCost * newRate) / 100)
    
    const updatedCommissions = localCommissions.map(commission =>
      commission.employee === employeeId
        ? { ...commission, commissionRate: newRate, commissionAmount: newAmount }
        : commission
    )
    const normalizedCommissions = normalizeCommissions(updatedCommissions)
    
    setLocalCommissions(normalizedCommissions)
    onCommissionsChange(normalizedCommissions)
  }

  // Update commission rate when amount changes
  const handleAmountChange = (employeeId: string, newAmount: number) => {
    const newRate = laborCost > 0 ? Math.round((newAmount * 100) / laborCost) : 0
    
    const updatedCommissions = localCommissions.map(commission =>
      commission.employee === employeeId
        ? { ...commission, commissionRate: newRate, commissionAmount: newAmount }
        : commission
    )
    const normalizedCommissions = normalizeCommissions(updatedCommissions)
    
    setLocalCommissions(normalizedCommissions)
    onCommissionsChange(normalizedCommissions)
  }

  const totalCommission = localCommissions.reduce((sum, c) => sum + c.commissionAmount, 0)

  if (selectedEmployees.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Komissiya sozlamalari
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-4 pt-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground mb-4">
              Ish haqi (komissiya asosi): <span className="text-foreground font-bold">{laborCost.toLocaleString()} so'm</span>
            </div>
            
            <div className="space-y-4">
              {localCommissions.map(commission => {
                const employee = employees.find(e => e._id === commission.employee)
                if (!employee) return null
                
                return (
                  <div key={commission.employee} className="space-y-3 p-3 bg-background rounded border">
                    <div className="font-medium">{employee.name}</div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Foiz: {commission.commissionRate}%</Label>
                      <Slider
                        value={[commission.commissionRate]}
                        onValueChange={([value]) => handleRateChange(commission.employee, value)}
                        max={100}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Summa (so'm)</Label>
                      <Input
                        type="number"
                        value={commission.commissionAmount}
                        onChange={(e) => handleAmountChange(commission.employee, parseInt(e.target.value) || 0)}
                        min={0}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 pt-3 border-t">
              <div className="text-sm font-medium">
                Jami komissiya: <span className="text-primary font-bold">{totalCommission.toLocaleString()} so'm</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}