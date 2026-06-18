CREATE TABLE "hidden_messages" (
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"hidden_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "mr_message_user_emoji";--> statement-breakpoint
ALTER TABLE "hidden_messages" ADD CONSTRAINT "hidden_messages_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hidden_messages" ADD CONSTRAINT "hidden_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hm_message_user_pk" ON "hidden_messages" USING btree ("message_id","user_id");--> statement-breakpoint
CREATE INDEX "hm_message_idx" ON "hidden_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "hm_user_idx" ON "hidden_messages" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mr_message_user" ON "message_reactions" USING btree ("message_id","user_id");