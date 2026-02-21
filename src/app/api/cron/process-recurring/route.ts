import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recurringTransactions, transactions } from "@/lib/db/schema";
import { lte, eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  // 1. Secure the route against unauthorized triggers
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Current date in YYYY-MM-DD format (local to server boundary)
    const today = new Date().toISOString().split("T")[0];

    // 2. Find all active recurring transactions that are due
    const dueRecurring = await db.query.recurringTransactions.findMany({
      where: and(
        eq(recurringTransactions.isActive, true),
        lte(recurringTransactions.nextProcessDate, today),
      ),
    });

    if (dueRecurring.length === 0) {
      return NextResponse.json({
        message: "No recurring transactions to process",
      });
    }

    // 3. Process each one in a database transaction
    await db.transaction(async (tx) => {
      for (const rt of dueRecurring) {
        // Insert the actual transaction
        await tx.insert(transactions).values({
          sheetId: rt.sheetId,
          categoryId: rt.categoryId,
          paymentType: rt.paymentType,
          amount: rt.amount,
          type: rt.type,
          description: rt.description ?? "Automated recurring transaction",
          date: today,
          createdBy: rt.createdBy,
        });

        // Calculate the next due date based on the frequency enum
        // (daily, weekly, monthly, yearly)
        const nextDate = new Date(today);

        // This calculates the next exact date.
        // It's a simple approach: if you run the cron every day, it bumps to the next valid date.
        switch (rt.frequency) {
          case "daily":
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case "weekly":
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case "monthly":
            // Attempt to keep the same day of the month
            nextDate.setMonth(nextDate.getMonth() + 1);
            if (rt.dayOfMonth) {
              // Edge casing where next month doesn't have enough days (e.g. Feb 31st)
              // This basic Implementation sets it to the closest valid day
              const targetDay = parseInt(rt.dayOfMonth.toString());
              nextDate.setDate(
                Math.min(
                  targetDay,
                  new Date(
                    nextDate.getFullYear(),
                    nextDate.getMonth() + 1,
                    0,
                  ).getDate(),
                ),
              );
            }
            break;
          case "yearly":
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        // Update the recurring template
        await tx
          .update(recurringTransactions)
          .set({
            lastProcessedAt: new Date(),
            nextProcessDate: nextDate.toISOString().split("T")[0],
          })
          .where(eq(recurringTransactions.id, rt.id));
      }
    });

    return NextResponse.json({
      success: true,
      processed: dueRecurring.length,
    });
  } catch (error) {
    console.error("Error processing recurring transactions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
