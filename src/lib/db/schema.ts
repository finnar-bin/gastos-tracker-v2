import {
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  varchar,
} from "drizzle-orm/pg-core";

export const sheets = pgTable("sheets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: uuid("created_by").notNull(), // Links to auth.users
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sheetUsers = pgTable("sheet_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  sheetId: uuid("sheet_id")
    .notNull()
    .references(() => sheets.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(), // Links to auth.users,
  role: varchar("role", { length: 20 }).notNull().default("viewer"), // 'viewer' | 'editor' | 'admin'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  sheetId: uuid("sheet_id")
    .notNull()
    .references(() => sheets.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // 'income' | 'expense'
  createdBy: uuid("created_by").notNull(), // Links to auth.users
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(), // Links to auth.users
  sheetId: uuid("sheet_id").references(() => sheets.id, {
    onDelete: "cascade",
  }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'income' | 'expense'
  description: text("description"),
  date: timestamp("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
