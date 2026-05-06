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
    .populate('paidBy', 'name avatar color email')
    .populate('splits.user', 'name avatar color email')
    .sort({ createdAt: -1 })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Fetch personal expenses error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    await connectDB()

    const personalExpense = await Expense.create({
      ...body,
      paidBy: session.user.id,
      groupId: null,
      splits: [{
        user: session.user.id,
        amountOwed: body.amount,
        hasSettled: true // Personal expense is always "settled" with yourself
      }]
    })

    return NextResponse.json(personalExpense, { status: 201 })
  } catch (error) {
    console.error('Create personal expense error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
