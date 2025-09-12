CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text,
	`role` text,
	`content` text,
	`metadata` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`updated_at` integer DEFAULT CURRENT_TIMESTAMP,
	`user_preferences` text
);
--> statement-breakpoint
CREATE TABLE `compatibility` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`model_number` text,
	`is_compatible` integer,
	`confidence` real,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `installation_guides` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`steps` text,
	`tools_required` text,
	`difficulty` text,
	`estimated_time` integer,
	`safety_warnings` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`part_number` text,
	`name` text,
	`description` text,
	`category` text,
	`brand` text,
	`price` real,
	`image_url` text,
	`availability` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_part_number_unique` ON `products` (`part_number`);