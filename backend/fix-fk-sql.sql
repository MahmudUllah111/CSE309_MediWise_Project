-- Fix Foreign Key Constraint for appointments table
-- The current constraint references 'patients' table, but we use 'users' table

-- Step 1: Drop the old foreign key constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;

-- Step 2: Ensure patient_id column is compatible (text or uuid)
-- If patient_id is text, convert it to uuid to match users.id type
-- ALTER TABLE appointments ALTER COLUMN patient_id TYPE uuid USING patient_id::uuid;

-- Step 3: Create new foreign key constraint referencing users table
ALTER TABLE appointments
ADD CONSTRAINT appointments_patient_id_fkey
FOREIGN KEY (patient_id)
REFERENCES users(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

-- Verify the constraint
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as referenced_table,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'appointments'::regclass 
AND contype = 'f'
AND conname LIKE '%patient%';






