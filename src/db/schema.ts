import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  /** Metas em km, em ordem. A primeira dá direito ao kit; as outras são opcionais. */
  goals: integer("goals").array().notNull().default([42, 100]),
  priceCents: integer("price_cents").notNull().default(0),
  kitDescription: text("kit_description").notNull().default("Camiseta + medalha"),
  pixKey: text("pix_key").notNull().default(""),
  pixName: text("pix_name").notNull().default(""),
  pixCity: text("pix_city").notNull().default(""),
  organizerName: text("organizer_name").notNull().default(""),
  /** Só dígitos, com DDI: 5511912345678 */
  organizerWhatsapp: text("organizer_whatsapp").notNull().default(""),
  regulationKey: text("regulation_key"),
  regulationName: text("regulation_name"),
  kitImageKey: text("kit_image_key"),
  registrationOpen: boolean("registration_open").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teams = pgTable(
  "teams",
  {
    id: serial("id").primaryKey(),
    challengeId: integer("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("teams_challenge_slug").on(t.challengeId, t.slug)],
);

export const participants = pgTable(
  "participants",
  {
    id: serial("id").primaryKey(),
    challengeId: integer("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    teamId: integer("team_id").references(() => teams.id, { onDelete: "set null" }),
    /** Segredo do link pessoal: /p/<token> */
    token: text("token").notNull().unique(),
    name: text("name").notNull(),
    /** Só dígitos, com DDI: 5511912345678 */
    whatsapp: text("whatsapp").notNull(),
    shirtSize: text("shirt_size").notNull(),
    cep: text("cep").notNull(),
    street: text("street").notNull(),
    number: text("number").notNull(),
    complement: text("complement").notNull().default(""),
    neighborhood: text("neighborhood").notNull().default(""),
    city: text("city").notNull(),
    state: text("state").notNull(),
    goalKm: integer("goal_km").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    /** Valor confirmado pelo organizador (o preço do desafio pode mudar depois). */
    paidCents: integer("paid_cents"),
    kitSentAt: timestamp("kit_sent_at", { withTimezone: true }),
    acceptedRulesAt: timestamp("accepted_rules_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("participants_challenge_whatsapp").on(t.challengeId, t.whatsapp),
    index("participants_challenge").on(t.challengeId),
  ],
);

export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    participantId: integer("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    /** Distância em metros (evita arredondamento de decimais). */
    distanceM: integer("distance_m").notNull(),
    activityDate: date("activity_date").notNull(),
    photoKey: text("photo_key").notNull(),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activities_participant").on(t.participantId)],
);

export type Challenge = typeof challenges.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Activity = typeof activities.$inferSelect;
