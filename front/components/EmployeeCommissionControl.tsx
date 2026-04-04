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
  totalServicePrice: number
  laborCost: number
  commissions: EmployeeCommission[]
  onCommissionsChange: (commissions: EmployeeCommission[]) => void
}

export function EmployeeCommissionControl({
  employees,
  selectedEmployees,
  totalServicePrice,
  laborCost,
  commissions,
  onCommissionsChange
}: EmployeeCommissionControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localCommissions, setLocalCommissions] = useState<EmployeeCommission[]>([])

  // Initialize commissions when props change
  useEffect(() => {
    console.log('EmployeeCommissionControl useEffect triggered:', {
      selectedEmployees,
      totalServicePrice,
      laborCost,
      commissions,
      localCommissions
    })
    
    if (selectedEmployees.length === 0) {
      setLocalCommissions([])
      return
    }

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
      
      // Create new commission with employee's default rate
      const rate = employee?.commissionRate || 15
      const amount = Math.round((laborCost * rate) / 100)
      
      return {
        employee: employeeId,
        commissionRate: rate,
        commissionAmount: amount
      }
    })
    
    console.log('Setting new commissions:', newCommissions)
    setLocalCommissions(newCommissions)
    onCommissionsChange(newCommissions)
  }, [selectedEmployees, employees, laborCost])

  // Update commissions when laborCost changes
  useEffect(() => {
    if (localCommissions.length > 0) {
      const updatedCommissions = localCommissions.map(commission => ({
        ...commission,
        commissionAmount: Math.round((laborCost * commission.commissionRate) / 100)
      }))
      
      // Check if amounts actually changed
      const hasChanged = updatedCommissions.some((updated, index) => 
        updated.commissionAmount !== localCommissions[index].commissionAmount
      )
      
      if (hasChanged) {
        setLocalCommissions(updatedCommissions)
        onCommissionsChange(updatedCommissions)
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
    
    console.log('Rate changed, updating commissions:', updatedCommissions)
    setLocalCommissions(updatedCommissions)
    onCommissionsChange(updatedCommissions)
  }

  // Update commission rate when amount changes
  const handleAmountChange = (employeeId: string, newAmount: number) => {
    const newRate = laborCost > 0 ? Math.round((newAmount * 100) / laborCost) : 0
    
    const updatedCommissions = localCommissions.map(commission =>
      commission.employee === employeeId
        ? { ...commission, commissionRate: newRate, commissionAmount: newAmount }
        : commission
    )
    
    console.log('Amount changed, updating commissions:', updatedCommissions)
    setLocalCommissions(updatedCommissions)
    onCommissionsChange(updatedCommissions)
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
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Jami xizmat narxi: <span className="text-foreground font-bold">{totalServicePrice.toLocaleString()} so'm</span>
            </div>
            <div className="text-sm font-medium text-muted-foreground mb-2">
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