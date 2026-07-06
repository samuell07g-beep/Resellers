CREATE TABLE `keys_stock` (
	`id` int AUTO_INCREMENT NOT NULL,
	`variant_id` int NOT NULL,
	`key_value` varchar(512) NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`order_id` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`usedAt` timestamp,
	CONSTRAINT `keys_stock_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `local_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `local_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `local_users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `order_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`user_id` int NOT NULL,
	`key_id` int NOT NULL,
	`key_value` varchar(512) NOT NULL,
	`variant_id` int NOT NULL,
	`variant_name` varchar(64) NOT NULL,
	`days` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_keys_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`variant_id` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`total_amount` decimal(10,2) NOT NULL,
	`status` enum('pending','paid','failed','expired') NOT NULL DEFAULT 'pending',
	`pix_transaction_id` varchar(128),
	`pix_qr_code_base64` text,
	`pix_qr_code_url` varchar(512),
	`pix_copy_paste` text,
	`payer_name` varchar(128),
	`payer_document` varchar(14),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`paidAt` timestamp,
	`expiresAt` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`name` varchar(64) NOT NULL,
	`days` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
