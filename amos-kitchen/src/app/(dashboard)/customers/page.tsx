// app/(dashboard)/customers/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Download, Users, ShoppingCart, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CustomerList } from '@/components/customers/customer-list'
import { CustomerGrid } from '@/components/customers/customer-grid'
import { CustomerDialog } from '@/components/customers/customer-dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { fetchWithAuth, postWithAuth, putWithAuth, deleteWithAuth } from '@/lib/api/fetch-with-auth'
import type { Customer } from '@/lib/types/database'

interface CustomerWithStats extends Customer {
    orderCount: number
    totalSpent: number
    lastOrderDate?: Date
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<CustomerWithStats[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

    const debouncedSearch = useDebounce(searchQuery, 300)

    // Wrap fetchCustomers in useCallback to fix the dependency warning
    const fetchCustomers = useCallback(async () => {
        try {
            setIsLoading(true)
            const params = new URLSearchParams()
            if (debouncedSearch) params.append('search', debouncedSearch)

            const response = await fetchWithAuth(`/api/customers?${params}`)
            if (!response.ok) throw new Error('Failed to fetch customers')

            const data = await response.json()
            setCustomers(data)
        } catch (error) {
            console.error('Error fetching customers:', error)
        } finally {
            setIsLoading(false)
        }
    }, [debouncedSearch])

    // Fetch customers - now includes fetchCustomers in dependencies
    useEffect(() => {
        fetchCustomers()
    }, [fetchCustomers])

    const handleExport = async () => {
        try {
            const response = await fetchWithAuth('/api/customers/export', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/csv'
                }
            })

            if (!response.ok) throw new Error('Failed to export customers')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Error exporting customers:', error)
        }
    }

    const handleAddCustomer = () => {
        setSelectedCustomer(null)
        setIsDialogOpen(true)
    }

    const handleEditCustomer = (customer: Customer) => {
        setSelectedCustomer(customer)
        setIsDialogOpen(true)
    }

    const handleDeleteCustomer = async (customerId: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) return

        try {
            const response = await deleteWithAuth(`/api/customers/${customerId}`)

            if (!response.ok) throw new Error('Failed to delete customer')

            await fetchCustomers()
        } catch (error) {
            console.error('Error deleting customer:', error)
        }
    }

    const handleSaveCustomer = async (customerData: Partial<Customer>) => {
        try {
            console.log('Saving customer:', customerData)
            const url = selectedCustomer
                ? `/api/customers/${selectedCustomer.id}`
                : '/api/customers'

            const response = selectedCustomer
                ? await putWithAuth(url, customerData)
                : await postWithAuth(url, customerData)

            const responseData = await response.json()
            console.log('Response status:', response.status)
            console.log('Response data:', responseData)

            if (!response.ok) {
                console.error('Failed to save customer. Response:', responseData)
                throw new Error(responseData.error || 'Failed to save customer')
            }

            setIsDialogOpen(false)
            await fetchCustomers()
        } catch (error) {
            console.error('Error saving customer:', error)
            alert(`Error: ${error instanceof Error ? error.message : 'Failed to save customer'}`)
        }
    }

    // Calculate statistics
    const stats = {
        totalCustomers: customers.length,
        totalOrders: customers.reduce((sum, c) => sum + c.orderCount, 0),
        totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
        avgOrderValue: customers.length > 0
            ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.reduce((sum, c) => sum + c.orderCount, 0)
            : 0
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">לקוחות</h1>
                    <p className="text-muted-foreground">ניהול לקוחות והיסטוריית הזמנות</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleExport} variant="outline" size="sm">
                        <Download className="h-4 w-4 ml-2" />
                        ייצוא
                    </Button>
                    <Button onClick={handleAddCustomer} size="sm">
                        <Plus className="h-4 w-4 ml-2" />
                        לקוח חדש
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        {/* Fixed: Escaped the quote character */}
                        <CardTitle className="text-sm font-medium">סה&quot;כ לקוחות</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        {/* Fixed: Escaped the quote character */}
                        <CardTitle className="text-sm font-medium">סה&quot;כ הזמנות</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">סך הכנסות</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₪{stats.totalRevenue.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ממוצע הזמנה</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₪{stats.avgOrderValue.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="חפש לפי שם, טלפון או אימייל..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-8"
                    />
                </div>
            </div>

            {/* View Tabs */}
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'cards' | 'table')}>
                <TabsList>
                    <TabsTrigger value="cards">כרטיסים</TabsTrigger>
                    <TabsTrigger value="table">טבלה</TabsTrigger>
                </TabsList>

                <TabsContent value="cards" className="mt-6">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : customers.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-8">
                                <p className="text-muted-foreground">לא נמצאו לקוחות</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <CustomerGrid
                            customers={customers}
                            onEdit={handleEditCustomer}
                            onDelete={handleDeleteCustomer}
                        />
                    )}
                </TabsContent>

                <TabsContent value="table" className="mt-6">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : customers.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-8">
                                <p className="text-muted-foreground">לא נמצאו לקוחות</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <CustomerList
                            customers={customers}
                            onEdit={handleEditCustomer}
                            onDelete={handleDeleteCustomer}
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* Customer Dialog */}
            <CustomerDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                customer={selectedCustomer}
                onSave={handleSaveCustomer}
            />
        </div>
    )
}
