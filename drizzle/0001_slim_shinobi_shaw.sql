CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`icon` varchar(100),
	`description` text,
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categoryFields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`label` varchar(300) NOT NULL,
	`fieldType` enum('text','number','select','multiselect','image','file') NOT NULL,
	`options` json,
	`isRequired` boolean DEFAULT false,
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categoryFields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`productId` int NOT NULL,
	`amount` decimal NOT NULL,
	`status` enum('pending','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`businessNumber` varchar(20),
	`representativeName` varchar(100),
	`phone` varchar(20),
	`email` varchar(320),
	`logoUrl` text,
	`shortIntro` varchar(500),
	`description` text,
	`regions` json,
	`specialties` json,
	`status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
	`avgRating` decimal(3,2) DEFAULT '0',
	`reviewCount` int DEFAULT 0,
	`grade` enum('bronze','silver','gold','platinum') DEFAULT 'bronze',
	`responseRate` int DEFAULT 0,
	`viewCredits` int DEFAULT 0,
	`subscriptionType` enum('none','monthly_view','monthly_design') DEFAULT 'none',
	`subscriptionExpiry` timestamp,
	`designCredits` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`images` json,
	`categoryId` int,
	`region` varchar(200),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`type` enum('view_credit','subscription','design_support') NOT NULL,
	`price` decimal NOT NULL,
	`creditAmount` int,
	`durationDays` int,
	`description` text,
	`isActive` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectManagement` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partnerId` int NOT NULL,
	`quoteId` int NOT NULL,
	`submissionId` int,
	`location` text,
	`scheduledDate` timestamp,
	`scheduledTime` varchar(50),
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`memo` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectManagement_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quoteSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`partnerId` int NOT NULL,
	`amount` decimal(12,0),
	`description` text,
	`estimatedDays` int,
	`attachments` json,
	`status` enum('submitted','selected','rejected') NOT NULL DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quoteSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quoteViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`partnerId` int NOT NULL,
	`creditUsed` int DEFAULT 1,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quoteViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`categoryId` int,
	`type` enum('public','designated') NOT NULL DEFAULT 'public',
	`designatedPartnerId` int,
	`title` varchar(500) NOT NULL,
	`description` text,
	`region` varchar(200),
	`address` text,
	`formData` json,
	`attachments` json,
	`status` enum('registered','pending','viewed','quoted','reviewing','matched','in_progress','completed','cancelled') NOT NULL DEFAULT 'registered',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`customerId` int NOT NULL,
	`partnerId` int NOT NULL,
	`rating` int NOT NULL,
	`content` text,
	`isVisible` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(100) NOT NULL,
	`settingValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteSettings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','partner') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `profileImage` text;