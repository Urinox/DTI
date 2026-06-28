// components/COS-JOS/Content/PayrollContent.tsx
import ContentHeader from "@/components/ContentHeader"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import axios from "axios"

interface PayrollRecord {
    id: string
    payrollDate: string
    periodStart: string
    periodEnd: string
    dailyRate: number
    hoursPerDay: number
    daysWorked: number
    grossPay: number
    overtime: number
    deductions: number
    netSalary: number
    status: string
    employeeId: string
    employeeName: string
    designation: string
}

export default function PayrollContent() {
    const { data: session } = useSession()
    const [show, setShow] = useState(false)
    const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    useEffect(() => {
        fetchPayrollData()
    }, [session])

    async function fetchPayrollData() {
        try {
            if (!session?.user?.id) return
            
            const response = await axios.get(`/api/payroll/${session.user.id}`)
            const data = response.data.data || []
            
            const formattedRecords = data.map((record: any) => ({
                id: record.id || '',
                payrollDate: formatDate(record.payrollDate || record.createdAt),
                periodStart: record.periodStart || '',
                periodEnd: record.periodEnd || '',
                dailyRate: record.dailyRate || 101.88,
                hoursPerDay: record.hoursPerDay || 8,
                daysWorked: record.daysWorked || 0,
                grossPay: record.grossPay || 0,
                overtime: record.overtime || 0,
                deductions: record.deductions || 0,
                netSalary: record.netSalary || 0,
                status: record.status || 'Pending',
                employeeId: record.employeeId || session.user.id,
                employeeName: record.employeeName || session.user.name || 'User',
                designation: record.designation || ''
            }))
            
            setPayrollRecords(formattedRecords)
        } catch (error) {
            console.error('Error fetching payroll data:', error)
            setPayrollRecords([])
        } finally {
            setLoading(false)
        }
    }

    function formatDate(dateString: string): string {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    function calculateTotals(record: PayrollRecord) {
        const dailyRate = record.dailyRate || 101.88
        const hoursPerDay = record.hoursPerDay || 8
        const daysWorked = record.daysWorked || 0
        
        const dailyRateAmount = dailyRate * hoursPerDay
        const hourlyRate = dailyRate / 60
        const grossPay = dailyRateAmount * daysWorked
        const overtimeHours = record.overtime || 0
        const overtimePay = hourlyRate * overtimeHours * 1.5
        const netSalary = grossPay + overtimePay - (record.deductions || 0)
        
        return {
            dailyRateAmount,
            hourlyRate,
            grossPay,
            overtimePay,
            netSalary
        }
    }

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
    }

    const totalPages = Math.ceil(payrollRecords.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentRecords = payrollRecords.slice(startIndex, endIndex)

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    const ViewPayrollPopup = ({ record, onClose }: { record: PayrollRecord, onClose: () => void }) => {
        const { dailyRateAmount, hourlyRate, grossPay, overtimePay, netSalary } = calculateTotals(record)
        
        return (
            <div className='flex flex-col bg-white gap-2 rounded-lg py-5 w-[60%] max-h-[80vh] overflow-y-auto shadow-xl shadow-gray-500/30'>
                <div className='flex pl-5 items-center w-full border-b border-gray-300 pb-5'>
                    <p className='text-xl font-bold'>Payroll Details</p>
                </div>
                
                <div className='flex mx-5 gap-4 flex-col'>
                    <div className='grid grid-cols-2 gap-4'>
                        <div>
                            <p className='font-bold text-sm'>Employee</p>
                            <p className='text-gray-600'>{record.employeeName || 'N/A'}</p>
                        </div>
                        <div>
                            <p className='font-bold text-sm'>Designation</p>
                            <p className='text-gray-600'>{record.designation || 'N/A'}</p>
                        </div>
                        <div>
                            <p className='font-bold text-sm'>Payroll Date</p>
                            <p className='text-gray-600'>{record.payrollDate}</p>
                        </div>
                        <div>
                            <p className='font-bold text-sm'>Period</p>
                            <p className='text-gray-600'>{record.periodStart} to {record.periodEnd}</p>
                        </div>
                    </div>
                    
                    <div className='border-t border-gray-300 pt-4'>
                        <p className='font-bold text-lg'>Salary Computation</p>
                        
                        <div className='grid grid-cols-3 gap-4 mt-3 bg-gray-50 p-4 rounded-lg'>
                            <div>
                                <p className='text-sm text-gray-500'>Daily Rate</p>
                                <p className='font-bold'>₱{formatCurrency(record.dailyRate)}</p>
                            </div>
                            <div>
                                <p className='text-sm text-gray-500'>Hours per Day</p>
                                <p className='font-bold'>{record.hoursPerDay} hrs</p>
                            </div>
                            <div>
                                <p className='text-sm text-gray-500'>Days Worked</p>
                                <p className='font-bold'>{record.daysWorked} days</p>
                            </div>
                        </div>
                        
                        <div className='mt-4 space-y-2'>
                            <div className='flex justify-between py-1 border-b border-gray-100'>
                                <span>Daily Rate</span>
                                <span>₱{formatCurrency(record.dailyRate)} × {record.hoursPerDay} hrs = ₱{formatCurrency(dailyRateAmount)}</span>
                            </div>
                            <div className='flex justify-between py-1 border-b border-gray-100'>
                                <span>Hourly Rate</span>
                                <span>₱{formatCurrency(record.dailyRate)} / 60 mins = ₱{formatCurrency(hourlyRate)}</span>
                            </div>
                            <div className='flex justify-between py-1 border-b border-gray-100'>
                                <span>Gross Pay</span>
                                <span>₱{formatCurrency(dailyRateAmount)} × {record.daysWorked} days = ₱{formatCurrency(grossPay)}</span>
                            </div>
                            {record.overtime > 0 && (
                                <div className='flex justify-between py-1 border-b border-gray-100'>
                                    <span>Overtime</span>
                                    <span>₱{formatCurrency(hourlyRate)} × {record.overtime} hrs × 1.50 = ₱{formatCurrency(overtimePay)}</span>
                                </div>
                            )}
                            <div className='flex justify-between py-1 border-b border-gray-100'>
                                <span>Deductions</span>
                                <span>₱{formatCurrency(record.deductions || 0)}</span>
                            </div>
                            <div className='flex justify-between py-2 font-bold text-lg border-t-2 border-gray-300 mt-2 pt-2'>
                                <span>Net Salary</span>
                                <span>₱{formatCurrency(netSalary)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className='flex items-center justify-end mt-2 gap-3'>
                        <button 
                            onClick={onClose}
                            className='border border-gray-300 text-gray-700 rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-gray-100 transition-colors'
                        >
                            Close
                        </button>
                        <button className='bg-red-800 text-white rounded-lg px-5 py-2 cursor-pointer font-bold text-sm hover:bg-red-700 transition-colors'>
                            Print Payslip
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className='flex flex-col w-full'>
                <ContentHeader />
                <div className='flex flex-col bg-white py-5 my-5 mx-10 rounded-xl shadow-xl shadow-gray-500/30'>
                    <div className='flex justify-center items-center p-10'>
                        <p className='text-gray-500'>Loading...</p>
                    </div>
                </div>
            </div>
        )
    }

    return(
        <div className='flex flex-col w-full'>
            <ContentHeader />
            <div className='flex flex-col bg-white py-5 my-5 mx-10 rounded-xl shadow-xl shadow-gray-500/30'>
                <p className='font-bold text-xl ml-5'>Payslips</p>
                <div className='flex flex-col mb-3 mt-5 border-b-2 border-gray-300'>
                    <table className='table-fixed w-full text-gray-600'>
                        <thead className='bg-gray-200 border-y-2 border-gray-300'>
                            <tr>
                                <td className='pl-10 py-1 font-bold'>Payroll Date</td>
                                <td className='pl-10 font-bold'>Basic</td>
                                <td className='pl-10 font-bold'>Deductions</td>
                                <td className='pl-10 font-bold'>Salary</td>
                                <td className='pl-10 font-bold w-36'>Action</td>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className='text-center py-4 text-gray-500'>No payroll records found</td>
                                </tr>
                            ) : (
                                currentRecords.map((record) => {
                                    const { netSalary } = calculateTotals(record)
                                    return (
                                        <tr key={record.id} className='border-t-[1] border-gray-300 hover:bg-gray-50'>
                                            <td className='py-1 pl-10'>{record.payrollDate}</td>
                                            <td className='pl-10'>₱{formatCurrency(record.grossPay)}</td>
                                            <td className='pl-10'>₱{formatCurrency(record.deductions || 0)}</td>
                                            <td className='pl-10'>₱{formatCurrency(netSalary)}</td>
                                            <td className='pl-10'>
                                                <button 
                                                    onClick={() => setSelectedPayroll(record)}
                                                    className='text-sm bg-blue-200 text-blue-800 font-bold border-2 border-blue-800 rounded-lg px-2 cursor-pointer my-2'
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className='flex justify-between items-center text-sm font-bold text-gray-600 px-8'>
                        <p>Page {currentPage} of {totalPages}</p>
                        <div className='flex gap-3'>
                            <button 
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`cursor-pointer ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Image src='/arrow-left.svg' width={14} height={14} alt='arrow-left'/>
                            </button>
                            <p>{currentPage}</p>
                            <button 
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`cursor-pointer ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Image src='/arrow-right.svg' width={14} height={14} alt='arrow-right'/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className={`justify-center items-center absolute w-full right-0 top-0 h-screen bg-gray-700/20 ${selectedPayroll ? 'flex' : 'hidden'}`}>
                {selectedPayroll && (
                    <ViewPayrollPopup 
                        record={selectedPayroll} 
                        onClose={() => setSelectedPayroll(null)} 
                    />
                )}
            </div>
        </div>
    )
}