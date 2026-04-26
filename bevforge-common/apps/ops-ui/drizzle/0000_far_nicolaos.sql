CREATE TABLE `alerts` (
	`id` varchar(50) NOT NULL,
	`type` enum('overdue_return','low_inventory','over_capacity','needs_maintenance','deposit_imbalance','compliance_deadline') NOT NULL,
	`severity` enum('info','warning','error','critical') DEFAULT 'warning',
	`entity_type` varchar(50),
	`entity_id` varchar(50),
	`message` text NOT NULL,
	`is_read` boolean DEFAULT false,
	`is_resolved` boolean DEFAULT false,
	`created_at` datetime NOT NULL,
	`resolved_at` datetime,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `batches` (
	`id` varchar(50) NOT NULL,
	`product_id` varchar(50) NOT NULL,
	`batch_number` varchar(100) NOT NULL,
	`volume_gallons` decimal(10,2),
	`production_date` datetime,
	`expiration_date` datetime,
	`status` enum('active','depleted','quarantine','archived') DEFAULT 'active',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `container_movements` (
	`id` varchar(50) NOT NULL,
	`container_id` varchar(50) NOT NULL,
	`from_location_id` varchar(50),
	`to_location_id` varchar(50) NOT NULL,
	`movement_type` enum('fill','load','deliver','return','clean','maintenance','transfer') NOT NULL,
	`delivery_id` varchar(50),
	`order_id` varchar(50),
	`performed_by` varchar(255),
	`notes` text,
	`timestamp` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `container_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `container_types` (
	`id` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('keg','case','bottle','can','sixpack','pallet') NOT NULL,
	`volume_gallons` decimal(10,4),
	`capacity` int,
	`deposit_amount` decimal(10,2),
	`is_returnable` boolean DEFAULT false,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `container_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `containers` (
	`id` varchar(50) NOT NULL,
	`container_type_id` varchar(50) NOT NULL,
	`product_id` varchar(50),
	`batch_id` varchar(50),
	`serial_number` varchar(100),
	`qr_code` varchar(255),
	`status` enum('empty','filled','in_transit','at_customer','returned','cleaning','maintenance','condemned') DEFAULT 'empty',
	`current_location_id` varchar(50),
	`pallet_id` varchar(50),
	`fill_date` datetime,
	`delivery_date` datetime,
	`expected_return_date` datetime,
	`actual_return_date` datetime,
	`last_cleaned_date` datetime,
	`last_inspected_date` datetime,
	`condition` enum('good','damaged','needs_maintenance') DEFAULT 'good',
	`notes` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `containers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_deposits` (
	`id` varchar(50) NOT NULL,
	`customer_id` varchar(50) NOT NULL,
	`container_type_id` varchar(50) NOT NULL,
	`quantity_out` int DEFAULT 0,
	`quantity_returned` int DEFAULT 0,
	`deposit_balance` decimal(10,2) DEFAULT '0.00',
	`last_updated` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `customer_deposits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` varchar(50) NOT NULL,
	`delivery_number` varchar(100) NOT NULL,
	`truck_id` varchar(50) NOT NULL,
	`driver_id` varchar(50),
	`status` enum('scheduled','loading','in_transit','completed','cancelled') DEFAULT 'scheduled',
	`scheduled_date` datetime NOT NULL,
	`departure_time` datetime,
	`completion_time` datetime,
	`notes` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `delivery_stops` (
	`id` varchar(50) NOT NULL,
	`delivery_id` varchar(50) NOT NULL,
	`customer_id` varchar(50) NOT NULL,
	`order_id` varchar(50),
	`stop_order` int NOT NULL,
	`status` enum('pending','in_progress','completed','skipped') DEFAULT 'pending',
	`arrival_time` datetime,
	`departure_time` datetime,
	`signature_name` varchar(255),
	`signature_data` text,
	`notes` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `delivery_stops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('warehouse','truck','customer','production','cleaning') NOT NULL,
	`capacity` int,
	`capacity_cases` int,
	`address` text,
	`contact_name` varchar(255),
	`contact_phone` varchar(50),
	`contact_email` varchar(255),
	`is_active` boolean DEFAULT true,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_line_items` (
	`id` varchar(50) NOT NULL,
	`order_id` varchar(50) NOT NULL,
	`product_id` varchar(50) NOT NULL,
	`container_type_id` varchar(50) NOT NULL,
	`quantity` int NOT NULL,
	`unit_price` decimal(10,2),
	`deposit_per_unit` decimal(10,2),
	`total_price` decimal(10,2),
	`total_deposit` decimal(10,2),
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `order_line_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(50) NOT NULL,
	`order_number` varchar(100) NOT NULL,
	`customer_id` varchar(50) NOT NULL,
	`status` enum('draft','confirmed','allocated','in_transit','delivered','cancelled') DEFAULT 'draft',
	`order_date` datetime NOT NULL,
	`delivery_date` datetime,
	`total_amount` decimal(10,2),
	`deposit_amount` decimal(10,2),
	`notes` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pallet_movements` (
	`id` varchar(50) NOT NULL,
	`pallet_id` varchar(50) NOT NULL,
	`from_location_id` varchar(50),
	`to_location_id` varchar(50) NOT NULL,
	`movement_type` enum('load','deliver','return','transfer') NOT NULL,
	`delivery_id` varchar(50),
	`performed_by` varchar(255),
	`notes` text,
	`timestamp` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `pallet_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pallets` (
	`id` varchar(50) NOT NULL,
	`pallet_number` varchar(100) NOT NULL,
	`container_type_id` varchar(50) NOT NULL,
	`current_location_id` varchar(50),
	`delivery_id` varchar(50),
	`status` enum('empty','partial','full','in_transit','at_customer') DEFAULT 'empty',
	`is_mixed` boolean DEFAULT false,
	`is_returnable` boolean DEFAULT true,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `pallets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('cider','beer','wine','spirits','other') NOT NULL,
	`description` text,
	`is_active` boolean DEFAULT true,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
