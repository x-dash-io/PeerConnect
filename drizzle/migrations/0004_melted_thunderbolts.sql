DROP INDEX "mr_message_user";--> statement-breakpoint
CREATE UNIQUE INDEX "mr_message_user_emoji" ON "message_reactions" USING btree ("message_id","user_id","emoji");