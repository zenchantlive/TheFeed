CREATE TYPE "public"."community_post_kind" AS ENUM('share', 'request', 'update', 'resource');--> statement-breakpoint
CREATE TYPE "public"."community_post_mood" AS ENUM('hungry', 'full', 'update');--> statement-breakpoint
CREATE TYPE "public"."community_post_status" AS ENUM('verified', 'community', 'needs-love');--> statement-breakpoint
CREATE TYPE "public"."reaction_type" AS ENUM('on-it', 'helpful');--> statement-breakpoint
ALTER TABLE "comment_reactions" ALTER COLUMN "type" SET DATA TYPE "public"."reaction_type" USING "type"::"public"."reaction_type";--> statement-breakpoint
ALTER TABLE "community_posts" ALTER COLUMN "mood" SET DATA TYPE "public"."community_post_mood" USING "mood"::"public"."community_post_mood";--> statement-breakpoint
ALTER TABLE "community_posts" ALTER COLUMN "kind" SET DATA TYPE "public"."community_post_kind" USING "kind"::"public"."community_post_kind";--> statement-breakpoint
ALTER TABLE "community_posts" ALTER COLUMN "status" SET DEFAULT 'community'::"public"."community_post_status";--> statement-breakpoint
ALTER TABLE "community_posts" ALTER COLUMN "status" SET DATA TYPE "public"."community_post_status" USING "status"::"public"."community_post_status";--> statement-breakpoint
ALTER TABLE "post_reactions" ALTER COLUMN "type" SET DATA TYPE "public"."reaction_type" USING "type"::"public"."reaction_type";