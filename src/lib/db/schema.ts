import {
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  date,
  pgEnum,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    timeZone: text("time_zone"),
    pushNotificationsEnabled: boolean("push_notifications_enabled")
      .notNull()
      .default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("profiles_email_idx").on(table.email),
  }),
);

export const userRoleEnum = pgEnum("user_role", ["viewer", "editor", "admin"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
]);
export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);
export const categoryDueReminderFrequencyEnum = pgEnum(
  "category_due_reminder_frequency",
  ["specific_date", "daily", "weekly", "monthly"],
);
export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "declined",
  "revoked",
  "expired",
]);

export const sheets = pgTable("sheets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: uuid("created_by").notNull(), // Links to auth.users
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sheetSettings = pgTable("sheet_settings", {
  sheetId: uuid("sheet_id")
    .primaryKey()
    .references(() => sheets.id, { onDelete: "cascade" }),
  currency: text("currency").notNull().default("USD"),
  updatedBy: uuid("updated_by").notNull(), // Links to auth.users
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sheetUsers = pgTable(
  "sheet_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sheetId: uuid("sheet_id")
      .notNull()
      .references(() => sheets.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(), // Links to auth.users,
    role: userRoleEnum("role").notNull().default("viewer"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    sheetUserUnique: uniqueIndex("sheet_users_sheet_id_user_id_uq").on(
      table.sheetId,
      table.userId,
    ),
    userIdIdx: index("sheet_users_user_id_idx").on(table.userId),
  }),
);

export const sheetInvites = pgTable(
  "sheet_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sheetId: uuid("sheet_id")
      .notNull()
      .references(() => sheets.id, { onDelete: "cascade" }),
    invitedEmail: text("invited_email").notNull(),
    role: userRoleEnum("role").notNull().default("viewer"),
    tokenHash: text("token_hash").notNull(),
    status: inviteStatusEnum("status").notNull().default("pending"),
    invitedBy: uuid("invited_by").notNull(), // Links to auth.users
    acceptedBy: uuid("accepted_by"), // Links to auth.users
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex("sheet_invites_token_hash_uq").on(
      table.tokenHash,
    ),
    emailStatusIdx: index("sheet_invites_sheet_email_status_idx").on(
      table.sheetId,
      table.invitedEmail,
      table.status,
    ),
    inviteLookupIdx: index("sheet_invites_email_status_expires_idx").on(
      table.invitedEmail,
      table.status,
      table.expiresAt,
    ),
    sheetStatusExpiresIdx: index("sheet_invites_sheet_status_expires_idx").on(
      table.sheetId,
      table.status,
      table.expiresAt,
    ),
  }),
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    icon: text("icon").notNull(),
    sheetId: uuid("sheet_id")
      .notNull()
      .references(() => sheets.id, { onDelete: "cascade" }),
    type: transactionTypeEnum("type").notNull(),
    budget: decimal("budget", { precision: 10, scale: 2 }),
    defaultAmount: decimal("default_amount", {
      precision: 10,
      scale: 2,
    }),
    dueDate: date("due_date"),
    dueReminderFrequency: categoryDueReminderFrequencyEnum(
      "due_reminder_frequency",
    ),
    dueLastNotifiedOn: date("due_last_notified_on"),
    createdBy: uuid("created_by").notNull(), // Links to auth.users
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    sheetCreatedAtIdx: index("categories_sheet_created_at_idx").on(
      table.sheetId,
      table.createdAt,
    ),
  }),
);

export const paymentTypes = pgTable(
  "payment_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    icon: text("icon").notNull(),
    sheetId: uuid("sheet_id")
      .notNull()
      .references(() => sheets.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").notNull(), // Links to auth.users
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    sheetIdIdx: index("payment_types_sheet_id_idx").on(table.sheetId),
  }),
);

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sheetId: uuid("sheet_id").references(() => sheets.id, {
    onDelete: "cascade",
  }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  paymentType: uuid("payment_type_id").references(() => paymentTypes.id, {
    onDelete: "set null",
  }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  description: text("description"),
  date: date("date").notNull().defaultNow(),
  createdBy: uuid("created_by").notNull(), // Links to auth.users
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recurringTransactions = pgTable(
  "recurring_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sheetId: uuid("sheet_id").references(() => sheets.id, {
      onDelete: "cascade",
    }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    paymentType: uuid("payment_type_id").references(() => paymentTypes.id, {
      onDelete: "set null",
    }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    type: transactionTypeEnum("type").notNull(),
    description: text("description"),

    // Scheduling Rules
    frequency: recurringFrequencyEnum("frequency").notNull().default("monthly"),
    dayOfMonth: decimal("day_of_month"), // e.g. 5 for the 5th of every month

    // Processing Tracking
    lastProcessedAt: timestamp("last_processed_at"),
    nextProcessDate: date("next_process_date").notNull(),
    isActive: boolean("is_active").default(true).notNull(),

    createdBy: uuid("created_by").notNull(), // Links to auth.users
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    sheetCreatedAtIdx: index("recurring_transactions_sheet_created_at_idx").on(
      table.sheetId,
      table.createdAt,
    ),
    activeDueDateIdx: index("recurring_transactions_active_due_date_idx")
      .on(table.nextProcessDate)
      .where(sql`${table.isActive} = true`),
  }),
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    endpoint: text("endpoint").notNull(),
    p256dhKey: text("p256dh_key").notNull(),
    authKey: text("auth_key").notNull(),
    userAgent: text("user_agent"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("push_subscriptions_user_id_idx").on(table.userId),
    endpointUnique: uniqueIndex("push_subscriptions_endpoint_uq").on(
      table.endpoint,
    ),
    activeUserIdx: index("push_subscriptions_user_active_idx").on(
      table.userId,
      table.isActive,
    ),
  }),
);

export const categoryReminderDeliveries = pgTable(
  "category_reminder_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    localDate: date("local_date").notNull(),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserCategoryDate: uniqueIndex(
      "category_reminder_deliveries_user_category_date_uq",
    ).on(table.userId, table.categoryId, table.localDate),
    userDateIdx: index("category_reminder_deliveries_user_date_idx").on(
      table.userId,
      table.localDate,
    ),
  }),
);
