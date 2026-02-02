import {
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  varchar,
} from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(), // Links to auth.users
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'income' | 'expense'
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
