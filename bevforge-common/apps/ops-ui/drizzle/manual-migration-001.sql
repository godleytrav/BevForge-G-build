-- Manual Migration: Add new inventory system columns
-- Run this to update the database schema

-- Add new columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sku VARCHAR(100) NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS product_type ENUM('beer', 'cider', 'seltzer', 'non_alcoholic', 'wine', 'spirits', 'other') NOT NULL DEFAULT 'beer',
ADD COLUMN IF NOT EXISTS srm INT,
ADD COLUMN IF NOT EXISTS tasting_notes TEXT,
ADD COLUMN IF NOT EXISTS ingredients TEXT,
ADD COLUMN IF NOT EXISTS recipe_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS status ENUM('active', 'discontinued', 'seasonal', 'draft') DEFAULT 'active',
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add unique constraint to SKU after populating
-- ALTER TABLE products ADD UNIQUE KEY unique_sku (sku);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id VARCHAR(50) PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  container_type ENUM('keg', 'bottle', 'can', 'growler', 'crowler', 'case') NOT NULL,
  size VARCHAR(50) NOT NULL,
  unit_of_measure VARCHAR(20) NOT NULL,
  pack_size VARCHAR(50),
  units_per_case INT,
  sku_variant VARCHAR(100) UNIQUE,
  barcode VARCHAR(100),
  wholesale_price DECIMAL(10, 2),
  retail_price DECIMAL(10, 2),
  production_cost DECIMAL(10, 2),
  deposit_amount DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_container_type (container_type)
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(50) PRIMARY KEY,
  variant_id VARCHAR(50) NOT NULL,
  location_id VARCHAR(50) NOT NULL,
  quantity_on_hand INT NOT NULL DEFAULT 0,
  quantity_allocated INT NOT NULL DEFAULT 0,
  quantity_available INT NOT NULL DEFAULT 0,
  min_stock_level INT DEFAULT 0,
  max_stock_level INT,
  reorder_point INT,
  last_counted_at DATETIME,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_variant_location (variant_id, location_id),
  INDEX idx_variant_id (variant_id),
  INDEX idx_location_id (location_id)
);

-- Update batches table with new columns
ALTER TABLE batches
ADD COLUMN IF NOT EXISTS brew_date DATE,
ADD COLUMN IF NOT EXISTS package_date DATE,
ADD COLUMN IF NOT EXISTS best_by_date DATE,
ADD COLUMN IF NOT EXISTS batch_size DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS yield_actual DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS yield_expected DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS brewer_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS quality_status ENUM('pending', 'passed', 'failed', 'quarantine') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS notes TEXT;
