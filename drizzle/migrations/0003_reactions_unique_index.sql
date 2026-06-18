ALTER TABLE "message_reactions" DROP CONSTRAINT "mr_message_user_emoji";--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "mr_message_user" UNIQUE ("message_id", "user_id");--> statement-breakpoint
ALTER INDEX "mr_message_user_emoji" RENAME TO "mr_message_user";