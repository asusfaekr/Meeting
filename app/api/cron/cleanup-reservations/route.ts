import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// This function will be called by a cron job to delete old reservations
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Calculate date one month ago
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    // Delete reservations older than one month
    const { error, count } = await supabase
      .from("reservations")
      .delete({ count: "exact" })
      .lt("end_time", oneMonthAgo.toISOString())

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${count} old reservations`,
      deletedBefore: oneMonthAgo.toISOString(),
    })
  } catch (error) {
    console.error("Error cleaning up old reservations:", error)
    return NextResponse.json({ success: false, error: "Failed to clean up old reservations" }, { status: 500 })
  }
}
