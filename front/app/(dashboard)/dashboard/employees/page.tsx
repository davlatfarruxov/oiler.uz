'use client'

import React from "react"

import { useState, useEffect } from 'react'
import api from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { AlertCircle, Plus, TrendingUp, Loader2, DollarSign } from 'lucide-react'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'employee',
    commissionRate: 0,
  })

  useEffect(() => {
    fetchEmployees()
    fetchStats()
  }, [])

  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/employees')
      setEmployees(response.data.data)
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/employees/stats')
      setStats(response.data.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmployee.name || !newEmployee.email) return

    try {
      setIsSaving(true)

      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee._id}`, newEmployee)
        alert('Employee updated successfully!')
      } else {
        await api.post('/employees', newEmployee)
        alert('Employee added successfully!')
      }

      setNewEmployee({ name: '', email: '', phone: '', role: 'employee' })
      setEditingEmployee(null)
      setOpenDialog(false)
      fetchEmployees()
      fetchStats()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save employee')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return

    try {
      await api.delete(`/employees/${id}`)
      alert('Employee deleted successfully!')
      fetchEmployees()
      fetchStats()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete employee')
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      await api.patch(`/employees/${id}/toggle-status`)
      fetchEmployees()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to toggle status')
    }
  }

  const activeEmployees = employees.filter((e) => e.active)
  const totalRevenue = employees.reduce((sum, e) => sum + (e.totalRevenue || 0), 0)
  const totalServices = employees.reduce((sum, e) => sum + (e.servicesThisMonth || 0), 0)

  const topPerformer = employees.length > 0 
    ? employees.reduce((prev, current) =>
        (prev.servicesThisMonth || 0) > (current.servicesThisMonth || 0) ? prev : current
      )
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage team members and track performance</p>
        </div>
        <Button
          onClick={() => {
            setEditingEmployee(null)
            setNewEmployee({ name: '', email: '', phone: '', role: 'employee', commissionRate: 0 })
            setOpenDialog(true)
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground mt-2">{employees.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activeEmployees.length} active</p>
                  </>
                )}
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Services</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground mt-2">{totalServices}</p>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </>
                )}
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-2" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground mt-2">${totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </>
                )}
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Performance</CardTitle>
          <CardDescription>Track services and revenue by employee</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Commission</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Services</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Revenue</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Started</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{employee.name}</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">{employee.email}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={employee.active ? 'default' : 'outline'}
                          className={
                            employee.active
                              ? 'bg-green-100 text-green-900 border-green-200 cursor-pointer'
                              : 'bg-gray-100 text-gray-900 border-gray-200 cursor-pointer'
                          }
                          onClick={() => handleToggleStatus(employee._id)}
                        >
                          {employee.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{employee.commissionRate || 0}%</span>
                        </div>
                        {employee.totalCommission > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ${employee.totalCommission.toFixed(2)} earned
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">{employee.servicesThisMonth || 0}</td>
                      <td className="py-3 px-4 text-foreground font-semibold">${(employee.totalRevenue || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(employee.startDate || employee.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingEmployee(employee)
                            setNewEmployee({
                              name: employee.name,
                              email: employee.email,
                              phone: employee.phone,
                              role: employee.role,
                              commissionRate: employee.commissionRate || 0,
                            })
                            setOpenDialog(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee._id)}
                          className="text-destructive"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performer */}
      {topPerformer && topPerformer.servicesThisMonth > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-lg font-bold text-foreground">{topPerformer.name}</p>
              <p className="text-sm text-muted-foreground">{topPerformer.servicesThisMonth} services completed</p>
              <p className="text-sm text-foreground font-semibold">${topPerformer.totalRevenue} revenue this month</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Employee Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            <DialogDescription>Enter the employee details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@oilserve.com"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                placeholder="555-1234"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="commissionRate">
                Commission Rate: {newEmployee.commissionRate}%
              </Label>
              <div className="pt-2">
                <Slider
                  id="commissionRate"
                  min={0}
                  max={100}
                  step={1}
                  value={[newEmployee.commissionRate]}
                  onValueChange={(value) => setNewEmployee({ ...newEmployee, commissionRate: value[0] })}
                  className="w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Employee will receive {newEmployee.commissionRate}% of labor cost from each service
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingEmployee ? 'Update' : 'Add'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
