-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the table if it exists
DROP TABLE IF EXISTS accounts;

-- Create the accounts table with snake_case column names
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount FLOAT8 NOT NULL,
  ifsc TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  upi_id TEXT,
  date DATE NOT NULL,
  depositor_id TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_by TEXT
);
