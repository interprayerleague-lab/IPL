-- Add payment configuration to programmes and enrollments
-- Migration: 20261110000000_add_payment_configuration.sql
-- Description: Add admin-configurable payment amounts and scholarship support

-- Add payment configuration to programmes
ALTER TABLE programmes 
ADD COLUMN IF NOT EXISTS payment_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS payment_amount_minor BIGINT DEFAULT 0 CHECK (payment_amount_minor >= 0),
ADD COLUMN IF NOT EXISTS payment_currency TEXT DEFAULT 'NGN';

COMMENT ON COLUMN programmes.payment_required IS 'Whether payment is required for this programme';
COMMENT ON COLUMN programmes.payment_amount_minor IS 'Payment amount in minor units (e.g., kobo for NGN)';
COMMENT ON COLUMN programmes.payment_currency IS 'ISO currency code (e.g., NGN, USD)';

-- Add scholarship support to enrollments
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS is_scholarship BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_exemption_reason TEXT;

COMMENT ON COLUMN enrollments.is_scholarship IS 'Student has scholarship exemption';
COMMENT ON COLUMN enrollments.payment_exemption_reason IS 'Reason for payment exemption';

-- Create index for payment queries
CREATE INDEX IF NOT EXISTS idx_programmes_payment_required ON programmes(payment_required);
CREATE INDEX IF NOT EXISTS idx_enrollments_is_scholarship ON enrollments(is_scholarship);

-- Update seed programme with default payment (50,000 kobo = ₦500)
UPDATE programmes
SET 
    payment_required = true,
    payment_amount_minor = 50000,
    payment_currency = 'NGN'
WHERE slug = 'foundations-of-discipleship';

COMMENT ON TABLE programmes IS 'Admin can configure payment requirements and amounts per programme';
COMMENT ON TABLE enrollments IS 'Support scholarship students with payment exemptions';
