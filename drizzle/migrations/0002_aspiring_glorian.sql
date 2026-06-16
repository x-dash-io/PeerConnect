ALTER TABLE "users" ADD COLUMN "chat_preferences" jsonb;--> statement-breakpoint
CREATE INDEX "messages_conv_created_at_idx" ON "messages" USING btree ("conversation_id","created_at");