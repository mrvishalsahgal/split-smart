import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb'
import Expense from '@/lib/models/Expense'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()
    const expenses = await Expense.find({
      paidBy: session.user.id,
      groupId: null
    })

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
    
    // Group by category
    const categoryMap: Record<string, number> = {}
    expenses.forEach(e => {
      const cat = e.category || 'Other'
      categoryMap[cat] = (categoryMap[cat] || 0) + e.amount
    })

    const categories = Object.entries(categoryMap).map(([name, amount]) => ({
      name,
      amount,
      percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
      color: getCategoryColor(name)
    })).sort((a, b) => b.amount - a.amount)

    return NextResponse.json({
      totalSpent,
      categories
    })
  } catch (error) {
    console.error('Fetch personal stats error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    'Food': 'bg-orange-500',
    'Transport': 'bg-blue-500',
    'Entertainment': 'bg-purple-500',
    'Bills': 'bg-red-500',
    'Shopping': 'bg-pink-500',
    'Health': 'bg-green-500',
    'Other': 'bg-gray-500'
  }
  return colors[category] || 'bg-primary'
}
