import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectDB } from '@/lib/mongodb'
import Expense from '@/lib/models/Expense'
import Notification from '@/lib/models/Notification'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await connectDB()

    const expense = await Expense.findById(id)
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    // Check if user is the payer
    if (expense.paidBy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the payer can delete this expense' }, { status: 403 })
    }

    // Check 24-hour restriction
    const createdAt = new Date(expense.createdAt).getTime()
    const now = new Date().getTime()
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60)

    if (hoursSinceCreation > 24) {
      return NextResponse.json({ 
        error: 'Expenses can only be deleted within 24 hours of creation' 
      }, { status: 403 })
    }

    await Expense.findByIdAndDelete(id)
    
    // Cleanup related notifications
    await Notification.deleteMany({ relatedExpenseId: id })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    await connectDB()

    const expense = await Expense.findById(id)
    if (!expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    // Check if user is the payer
    if (expense.paidBy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the payer can edit this expense' }, { status: 403 })
    }

    // Check 24-hour restriction
    const createdAt = new Date(expense.createdAt).getTime()
    const now = new Date().getTime()
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60)

    if (hoursSinceCreation > 24) {
      return NextResponse.json({ 
        error: 'Expenses can only be edited within 24 hours of creation' 
      }, { status: 403 })
    }

    // Recalculate splits if amount is changed and no custom splits provided
    if (body.amount !== undefined && body.amount !== expense.amount && !body.splits) {
      const splitCount = expense.splits.length
      const newAmount = parseFloat(body.amount)
      const perPerson = splitCount > 0 ? newAmount / splitCount : newAmount

      body.splits = expense.splits.map((split: any) => ({
        user: split.user,
        amountOwed: perPerson,
        hasSettled: split.hasSettled // Preserve settlement status
      }))
    }

    const updatedExpense = await Expense.findByIdAndUpdate(id, { $set: body }, { new: true })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
