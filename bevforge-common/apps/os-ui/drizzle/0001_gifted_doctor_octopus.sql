CREATE TABLE `alarm_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL,
	`tile_id` int,
	`endpoint_id` int,
	`alarm_type` varchar(50) NOT NULL,
	`severity` varchar(50) NOT NULL,
	`message` text NOT NULL,
	`value` varchar(255),
	`threshold` varchar(255),
	`status` varchar(50) NOT NULL DEFAULT 'active',
	`acknowledged_by` varchar(100),
	`acknowledged_at` timestamp,
	`cleared_at` timestamp,
	`batch_id` int,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alarm_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `command_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`command_id` varchar(100) NOT NULL,
	`correlation_id` varchar(100) NOT NULL,
	`requested_at` timestamp NOT NULL,
	`sent_at` timestamp,
	`acked_at` timestamp,
	`completed_at` timestamp,
	`command_type` varchar(50) NOT NULL,
	`action` varchar(100) NOT NULL,
	`target_tile_id` int,
	`target_endpoint_id` int,
	`requested_value` varchar(255),
	`applied_value` varchar(255),
	`previous_value` varchar(255),
	`command_data` json,
	`status` varchar(50) NOT NULL DEFAULT 'queued',
	`failure_reason` text,
	`requested_by_user_id` varchar(100),
	`requested_by_service` varchar(100),
	`interlock_check_passed` boolean NOT NULL DEFAULT true,
	`blocked_by_interlock_id` int,
	`interlock_details` text,
	`node_response` json,
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `command_log_id` PRIMARY KEY(`id`),
	CONSTRAINT `command_log_command_id_unique` UNIQUE(`command_id`)
);
--> statement-breakpoint
CREATE TABLE `controller_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`node_id` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`node_type` varchar(50) NOT NULL,
	`ip_address` varchar(45),
	`mac_address` varchar(17),
	`firmware_version` varchar(50),
	`status` varchar(50) NOT NULL DEFAULT 'offline',
	`last_seen` timestamp,
	`last_heartbeat` timestamp,
	`capabilities` json,
	`config` json,
	`notes` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `controller_nodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `controller_nodes_node_id_unique` UNIQUE(`node_id`)
);
--> statement-breakpoint
CREATE TABLE `device_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`group_type` varchar(50) NOT NULL,
	`rules` json,
	`notes` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `device_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `device_state_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL,
	`tile_id` int NOT NULL,
	`previous_state` varchar(255) NOT NULL,
	`new_state` varchar(255) NOT NULL,
	`change_reason` varchar(50) NOT NULL,
	`command_log_id` int,
	`duration_seconds` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `device_state_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `device_tiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tile_id` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`tile_type` varchar(50) NOT NULL,
	`position_x` decimal(10,2),
	`position_y` decimal(10,2),
	`width` decimal(10,2),
	`height` decimal(10,2),
	`icon_name` varchar(100),
	`color_theme` varchar(50),
	`config` json,
	`status` varchar(50) NOT NULL DEFAULT 'operational',
	`group_id` int,
	`parent_tile_id` int,
	`notes` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `device_tiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `device_tiles_tile_id_unique` UNIQUE(`tile_id`)
);
--> statement-breakpoint
CREATE TABLE `endpoint_current` (
	`endpoint_id` int NOT NULL,
	`timestamp` timestamp NOT NULL,
	`value_bool` boolean,
	`value_int` int,
	`value_float` decimal(15,6),
	`value_string` varchar(255),
	`value_json` json,
	`quality` varchar(20) NOT NULL DEFAULT 'good',
	`quality_reason` varchar(255),
	`source` varchar(20) NOT NULL DEFAULT 'hardware',
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `endpoint_current_endpoint_id` PRIMARY KEY(`endpoint_id`)
);
--> statement-breakpoint
CREATE TABLE `hardware_endpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`controller_id` int NOT NULL,
	`channel_id` varchar(100) NOT NULL,
	`endpoint_kind` varchar(20) NOT NULL,
	`value_type` varchar(20) NOT NULL,
	`direction` varchar(20) NOT NULL,
	`unit` varchar(50),
	`range_min` decimal(15,4),
	`range_max` decimal(15,4),
	`scale` decimal(15,6),
	`offset` decimal(15,4),
	`invert` boolean NOT NULL DEFAULT false,
	`sample_period_ms` int,
	`write_mode` varchar(20),
	`pulse_duration_ms` int,
	`failsafe_value` varchar(255),
	`config` json,
	`status` varchar(50) NOT NULL DEFAULT 'ok',
	`last_read` timestamp,
	`last_write` timestamp,
	`notes` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hardware_endpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interlock_evaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interlock_id` int NOT NULL,
	`evaluated_at` timestamp NOT NULL,
	`result` varchar(20) NOT NULL,
	`details` json,
	`action_taken` varchar(255),
	`command_log_id` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `interlock_evaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safety_interlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`interlock_type` varchar(50) NOT NULL,
	`mode` varchar(50) NOT NULL,
	`priority` int NOT NULL DEFAULT 0,
	`condition` json,
	`affected_tiles` json,
	`block_actions` json,
	`on_violation_action` varchar(50) NOT NULL,
	`force_value` varchar(255),
	`alarm_message` text,
	`latched` boolean NOT NULL DEFAULT false,
	`ack_required` boolean NOT NULL DEFAULT false,
	`severity` varchar(50) NOT NULL DEFAULT 'warning',
	`is_active` boolean NOT NULL DEFAULT true,
	`last_triggered` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `safety_interlocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_safety_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`site_id` varchar(100) NOT NULL,
	`previous_state` varchar(100) NOT NULL,
	`new_state` varchar(100) NOT NULL,
	`triggered_by` varchar(255) NOT NULL,
	`reason` text NOT NULL,
	`actions_taken` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `system_safety_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_safety_state` (
	`id` int AUTO_INCREMENT NOT NULL,
	`site_id` varchar(100) NOT NULL,
	`estop_active` boolean NOT NULL DEFAULT false,
	`estop_source` varchar(255),
	`estop_activated_at` timestamp,
	`estop_latched` boolean NOT NULL DEFAULT false,
	`safety_mode` varchar(50) NOT NULL DEFAULT 'normal',
	`ack_required` boolean NOT NULL DEFAULT false,
	`acked_by` varchar(100),
	`acked_at` timestamp,
	`notes` text,
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_safety_state_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_safety_state_site_id_unique` UNIQUE(`site_id`)
);
--> statement-breakpoint
CREATE TABLE `telemetry_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timestamp` timestamp NOT NULL,
	`endpoint_id` int NOT NULL,
	`tile_id` int,
	`value_bool` boolean,
	`value_num` decimal(15,6),
	`value_string` varchar(255),
	`value_json` json,
	`unit` varchar(50),
	`quality` varchar(20) NOT NULL DEFAULT 'good',
	`quality_reason` varchar(255),
	`source` varchar(20) NOT NULL DEFAULT 'hardware',
	`batch_id` int,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `telemetry_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tile_endpoint_bindings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tile_id` int NOT NULL,
	`endpoint_id` int NOT NULL,
	`binding_role` varchar(50) NOT NULL,
	`direction` varchar(20) NOT NULL,
	`role` varchar(100),
	`transform` json,
	`priority` int NOT NULL DEFAULT 0,
	`order` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tile_endpoint_bindings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `alarm_events` (`timestamp`);--> statement-breakpoint
CREATE INDEX `tile_idx` ON `alarm_events` (`tile_id`);--> statement-breakpoint
CREATE INDEX `endpoint_idx` ON `alarm_events` (`endpoint_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `alarm_events` (`status`);--> statement-breakpoint
CREATE INDEX `severity_idx` ON `alarm_events` (`severity`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `alarm_events` (`alarm_type`);--> statement-breakpoint
CREATE INDEX `requested_at_idx` ON `command_log` (`requested_at`);--> statement-breakpoint
CREATE INDEX `correlation_idx` ON `command_log` (`correlation_id`);--> statement-breakpoint
CREATE INDEX `command_id_idx` ON `command_log` (`command_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `command_log` (`status`);--> statement-breakpoint
CREATE INDEX `tile_idx` ON `command_log` (`target_tile_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `command_log` (`requested_by_user_id`);--> statement-breakpoint
CREATE INDEX `node_id_idx` ON `controller_nodes` (`node_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `controller_nodes` (`status`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `controller_nodes` (`is_active`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `device_groups` (`group_type`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `device_groups` (`is_active`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `device_state_history` (`timestamp`);--> statement-breakpoint
CREATE INDEX `tile_idx` ON `device_state_history` (`tile_id`);--> statement-breakpoint
CREATE INDEX `reason_idx` ON `device_state_history` (`change_reason`);--> statement-breakpoint
CREATE INDEX `tile_id_idx` ON `device_tiles` (`tile_id`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `device_tiles` (`tile_type`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `device_tiles` (`status`);--> statement-breakpoint
CREATE INDEX `group_idx` ON `device_tiles` (`group_id`);--> statement-breakpoint
CREATE INDEX `parent_idx` ON `device_tiles` (`parent_tile_id`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `device_tiles` (`is_active`);--> statement-breakpoint
CREATE INDEX `controller_idx` ON `hardware_endpoints` (`controller_id`);--> statement-breakpoint
CREATE INDEX `kind_idx` ON `hardware_endpoints` (`endpoint_kind`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `hardware_endpoints` (`status`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `hardware_endpoints` (`is_active`);--> statement-breakpoint
CREATE INDEX `interlock_idx` ON `interlock_evaluations` (`interlock_id`);--> statement-breakpoint
CREATE INDEX `evaluated_at_idx` ON `interlock_evaluations` (`evaluated_at`);--> statement-breakpoint
CREATE INDEX `result_idx` ON `interlock_evaluations` (`result`);--> statement-breakpoint
CREATE INDEX `command_idx` ON `interlock_evaluations` (`command_log_id`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `safety_interlocks` (`interlock_type`);--> statement-breakpoint
CREATE INDEX `mode_idx` ON `safety_interlocks` (`mode`);--> statement-breakpoint
CREATE INDEX `priority_idx` ON `safety_interlocks` (`priority`);--> statement-breakpoint
CREATE INDEX `severity_idx` ON `safety_interlocks` (`severity`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `safety_interlocks` (`is_active`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `system_safety_log` (`timestamp`);--> statement-breakpoint
CREATE INDEX `site_idx` ON `system_safety_log` (`site_id`);--> statement-breakpoint
CREATE INDEX `site_idx` ON `system_safety_state` (`site_id`);--> statement-breakpoint
CREATE INDEX `endpoint_timestamp_idx` ON `telemetry_readings` (`endpoint_id`,`timestamp`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `telemetry_readings` (`timestamp`);--> statement-breakpoint
CREATE INDEX `tile_idx` ON `telemetry_readings` (`tile_id`);--> statement-breakpoint
CREATE INDEX `batch_idx` ON `telemetry_readings` (`batch_id`);--> statement-breakpoint
CREATE INDEX `quality_idx` ON `telemetry_readings` (`quality`);--> statement-breakpoint
CREATE INDEX `tile_idx` ON `tile_endpoint_bindings` (`tile_id`);--> statement-breakpoint
CREATE INDEX `endpoint_idx` ON `tile_endpoint_bindings` (`endpoint_id`);--> statement-breakpoint
CREATE INDEX `role_idx` ON `tile_endpoint_bindings` (`binding_role`);--> statement-breakpoint
CREATE INDEX `direction_idx` ON `tile_endpoint_bindings` (`direction`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `tile_endpoint_bindings` (`is_active`);