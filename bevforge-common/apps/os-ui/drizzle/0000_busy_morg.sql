CREATE TABLE `batch_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batch_id` int NOT NULL,
	`item_id` int NOT NULL,
	`lot_id` int,
	`planned_quantity` decimal(15,4) NOT NULL,
	`planned_uom` varchar(20) NOT NULL,
	`actual_quantity` decimal(15,4),
	`actual_uom` varchar(20),
	`unit_cost` decimal(15,4),
	`total_cost` decimal(15,4),
	`added_at` timestamp,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batch_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batch_outputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batch_id` int NOT NULL,
	`item_id` int NOT NULL,
	`lot_id` int,
	`location_id` int NOT NULL,
	`quantity` decimal(15,4) NOT NULL,
	`uom` varchar(20) NOT NULL,
	`output_date` timestamp NOT NULL,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `batch_outputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batch_transfers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batch_id` int NOT NULL,
	`from_location_id` int NOT NULL,
	`to_location_id` int NOT NULL,
	`transfer_type` varchar(50) NOT NULL,
	`quantity` decimal(15,4) NOT NULL,
	`uom` varchar(20) NOT NULL,
	`gravity` decimal(6,4),
	`temperature` decimal(5,2),
	`temperature_unit` varchar(1) DEFAULT 'F',
	`transfer_date` timestamp NOT NULL,
	`notes` text,
	`created_by` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `batch_transfers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batch_number` varchar(100) NOT NULL,
	`batch_name` varchar(255) NOT NULL,
	`recipe_id` int,
	`product_item_id` int,
	`status` varchar(50) NOT NULL DEFAULT 'planned',
	`planned_volume` decimal(15,4),
	`actual_volume` decimal(15,4),
	`volume_uom` varchar(20),
	`original_gravity` decimal(6,4),
	`final_gravity` decimal(6,4),
	`start_date` timestamp,
	`brew_date` timestamp,
	`fermentation_start_date` timestamp,
	`fermentation_end_date` timestamp,
	`packaging_date` timestamp,
	`completed_date` timestamp,
	`current_location_id` int,
	`total_cost` decimal(15,4),
	`cost_per_unit` decimal(15,4),
	`notes` text,
	`created_by` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `batches_batch_number_unique` UNIQUE(`batch_number`)
);
--> statement-breakpoint
CREATE TABLE `fermentation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batch_id` int NOT NULL,
	`log_date` timestamp NOT NULL,
	`gravity` decimal(6,4),
	`temperature` decimal(5,2),
	`temperature_unit` varchar(1) DEFAULT 'F',
	`ph` decimal(4,2),
	`pressure` decimal(6,2),
	`pressure_unit` varchar(10) DEFAULT 'PSI',
	`notes` text,
	`created_by` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `fermentation_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_balances` (
	`item_id` int NOT NULL,
	`lot_id` int NOT NULL,
	`location_id` int NOT NULL,
	`quantity` decimal(15,4) NOT NULL DEFAULT '0',
	`uom` varchar(20) NOT NULL,
	`last_movement` timestamp,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_balances_item_id_location_id_lot_id_pk` PRIMARY KEY(`item_id`,`location_id`,`lot_id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transaction_date` timestamp NOT NULL DEFAULT (now()),
	`transaction_type` varchar(50) NOT NULL,
	`item_id` int NOT NULL,
	`lot_id` int,
	`location_id` int NOT NULL,
	`quantity` decimal(15,4) NOT NULL,
	`uom` varchar(20) NOT NULL,
	`batch_id` int,
	`transfer_id` int,
	`reference_doc` varchar(100),
	`unit_cost` decimal(15,4),
	`total_cost` decimal(15,4),
	`notes` text,
	`created_by` varchar(100),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `inventory_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`item_code` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(50) NOT NULL,
	`subcategory` varchar(100),
	`track_lots` boolean NOT NULL DEFAULT true,
	`default_uom` varchar(20) NOT NULL,
	`alternate_uom` varchar(20),
	`conversion_factor` decimal(20,10),
	`last_cost` decimal(15,4),
	`cost_uom` varchar(20),
	`reorder_point` decimal(15,4),
	`reorder_qty` decimal(15,4),
	`yeast_data` json,
	`malt_data` json,
	`hops_data` json,
	`fruit_data` json,
	`additive_data` json,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `items_id` PRIMARY KEY(`id`),
	CONSTRAINT `items_item_code_unique` UNIQUE(`item_code`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`parent_id` int,
	`location_type` varchar(50) NOT NULL,
	`level` int NOT NULL DEFAULT 0,
	`capacity` decimal(15,4),
	`capacity_uom` varchar(20),
	`is_active` boolean NOT NULL DEFAULT true,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `locations_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `lots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`item_id` int NOT NULL,
	`lot_number` varchar(100) NOT NULL,
	`supplier_lot_ref` varchar(100),
	`received_date` timestamp,
	`expiration_date` timestamp,
	`best_before_date` timestamp,
	`manufacturing_date` timestamp,
	`notes` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `units_of_measure` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`category` varchar(50) NOT NULL,
	`base_unit` varchar(20),
	`conversion_factor` decimal(20,10),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `units_of_measure_id` PRIMARY KEY(`id`),
	CONSTRAINT `units_of_measure_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE INDEX `batch_idx` ON `batch_materials` (`batch_id`);--> statement-breakpoint
CREATE INDEX `item_idx` ON `batch_materials` (`item_id`);--> statement-breakpoint
CREATE INDEX `batch_idx` ON `batch_outputs` (`batch_id`);--> statement-breakpoint
CREATE INDEX `item_idx` ON `batch_outputs` (`item_id`);--> statement-breakpoint
CREATE INDEX `location_idx` ON `batch_outputs` (`location_id`);--> statement-breakpoint
CREATE INDEX `batch_idx` ON `batch_transfers` (`batch_id`);--> statement-breakpoint
CREATE INDEX `from_idx` ON `batch_transfers` (`from_location_id`);--> statement-breakpoint
CREATE INDEX `to_idx` ON `batch_transfers` (`to_location_id`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `batch_transfers` (`transfer_date`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `batches` (`status`);--> statement-breakpoint
CREATE INDEX `product_idx` ON `batches` (`product_item_id`);--> statement-breakpoint
CREATE INDEX `location_idx` ON `batches` (`current_location_id`);--> statement-breakpoint
CREATE INDEX `batch_idx` ON `fermentation_logs` (`batch_id`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `fermentation_logs` (`log_date`);--> statement-breakpoint
CREATE INDEX `item_idx` ON `inventory_balances` (`item_id`);--> statement-breakpoint
CREATE INDEX `location_idx` ON `inventory_balances` (`location_id`);--> statement-breakpoint
CREATE INDEX `item_idx` ON `inventory_ledger` (`item_id`);--> statement-breakpoint
CREATE INDEX `location_idx` ON `inventory_ledger` (`location_id`);--> statement-breakpoint
CREATE INDEX `batch_idx` ON `inventory_ledger` (`batch_id`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `inventory_ledger` (`transaction_date`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `inventory_ledger` (`transaction_type`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `items` (`category`);--> statement-breakpoint
CREATE INDEX `code_idx` ON `items` (`item_code`);--> statement-breakpoint
CREATE INDEX `parent_idx` ON `locations` (`parent_id`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `locations` (`location_type`);--> statement-breakpoint
CREATE INDEX `item_idx` ON `lots` (`item_id`);--> statement-breakpoint
CREATE INDEX `lot_idx` ON `lots` (`lot_number`);