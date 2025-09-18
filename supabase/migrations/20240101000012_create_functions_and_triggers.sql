-- Functions and Triggers for Summa Qualitas Construction Management System
-- This script creates business logic functions and automated triggers

-- Function to calculate project summary statistics
CREATE OR REPLACE FUNCTION calculate_project_summary(project_uuid UUID)
RETURNS VOID AS $$
DECLARE
    total_exp DECIMAL(15,2) := 0;
    total_inc DECIMAL(15,2) := 0;
    profit_loss_calc DECIMAL(15,2) := 0;
    expense_perc DECIMAL(5,2) := 0;
    project_budget DECIMAL(15,2) := 0;
BEGIN
    -- Get project budget
    SELECT budget INTO project_budget FROM projects WHERE id = project_uuid;
    
    -- Calculate total expenses
    SELECT COALESCE(SUM(amount), 0) INTO total_exp
    FROM expenses 
    WHERE project_id = project_uuid AND payment_status != 'cancelado';
    
    -- Calculate total income (client payments)
    SELECT COALESCE(SUM(amount), 0) INTO total_inc
    FROM client_payments 
    WHERE project_id = project_uuid AND status != 'cancelado';
    
    -- Calculate profit/loss
    profit_loss_calc := total_inc - total_exp;
    
    -- Calculate expense percentage relative to budget
    IF project_budget > 0 THEN
        expense_perc := (total_exp / project_budget) * 100;
    END IF;
    
    -- Insert or update project summary
    INSERT INTO project_summaries (
        project_id, 
        total_expenses, 
        total_income, 
        profit_loss, 
        expense_percentage,
        last_calculated
    ) VALUES (
        project_uuid, 
        total_exp, 
        total_inc, 
        profit_loss_calc, 
        expense_perc,
        NOW()
    )
    ON CONFLICT (project_id) 
    DO UPDATE SET
        total_expenses = EXCLUDED.total_expenses,
        total_income = EXCLUDED.total_income,
        profit_loss = EXCLUDED.profit_loss,
        expense_percentage = EXCLUDED.expense_percentage,
        last_calculated = EXCLUDED.last_calculated,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update equipment status based on rentals
CREATE OR REPLACE FUNCTION update_equipment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If a new rental is created or updated to active
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'activo' THEN
        UPDATE equipment 
        SET status = 'en_uso' 
        WHERE id = NEW.equipment_id;
    END IF;
    
    -- If a rental is completed or cancelled, check if equipment should be available
    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
        -- Check if there are any other active rentals for this equipment
        IF NOT EXISTS (
            SELECT 1 FROM equipment_rentals 
            WHERE equipment_id = COALESCE(NEW.equipment_id, OLD.equipment_id) 
            AND status = 'activo' 
            AND id != COALESCE(NEW.id, OLD.id)
        ) THEN
            UPDATE equipment 
            SET status = 'disponible' 
            WHERE id = COALESCE(NEW.equipment_id, OLD.equipment_id);
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to validate project dates
CREATE OR REPLACE FUNCTION validate_project_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure end_date is after start_date
    IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
        IF NEW.end_date < NEW.start_date THEN
            RAISE EXCEPTION 'End date cannot be before start date';
        END IF;
    END IF;
    
    -- Ensure estimated_end_date is after start_date
    IF NEW.start_date IS NOT NULL AND NEW.estimated_end_date IS NOT NULL THEN
        IF NEW.estimated_end_date < NEW.start_date THEN
            RAISE EXCEPTION 'Estimated end date cannot be before start date';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate equipment rental dates
CREATE OR REPLACE FUNCTION validate_rental_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure end_date is after start_date
    IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
        IF NEW.end_date < NEW.start_date THEN
            RAISE EXCEPTION 'Rental end date cannot be before start date';
        END IF;
    END IF;
    
    -- Ensure planned_end_date is after start_date
    IF NEW.start_date IS NOT NULL AND NEW.planned_end_date IS NOT NULL THEN
        IF NEW.planned_end_date < NEW.start_date THEN
            RAISE EXCEPTION 'Planned end date cannot be before start date';
        END IF;
    END IF;
    
    -- Check for equipment availability (no overlapping active rentals)
    IF NEW.status = 'activo' THEN
        IF EXISTS (
            SELECT 1 FROM equipment_rentals 
            WHERE equipment_id = NEW.equipment_id 
            AND status = 'activo'
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
            AND (
                (start_date <= NEW.start_date AND (end_date IS NULL OR end_date >= NEW.start_date))
                OR
                (start_date <= COALESCE(NEW.end_date, NEW.planned_end_date) AND (end_date IS NULL OR end_date >= COALESCE(NEW.end_date, NEW.planned_end_date)))
                OR
                (start_date >= NEW.start_date AND start_date <= COALESCE(NEW.end_date, NEW.planned_end_date))
            )
        ) THEN
            RAISE EXCEPTION 'Equipment is not available for the specified date range';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate rental total cost
CREATE OR REPLACE FUNCTION calculate_rental_cost()
RETURNS TRIGGER AS $$
DECLARE
    days_count INTEGER := 0;
BEGIN
    -- Calculate total cost if daily_rate and dates are provided
    IF NEW.daily_rate IS NOT NULL AND NEW.start_date IS NOT NULL THEN
        IF NEW.end_date IS NOT NULL THEN
            days_count := NEW.end_date - NEW.start_date + 1;
        ELSIF NEW.planned_end_date IS NOT NULL THEN
            days_count := NEW.planned_end_date - NEW.start_date + 1;
        END IF;
        
        IF days_count > 0 THEN
            NEW.total_cost := NEW.daily_rate * days_count;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update project status based on dates
CREATE OR REPLACE FUNCTION auto_update_project_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If start_date is today or in the past and status is still 'planificacion'
    IF NEW.start_date IS NOT NULL AND NEW.start_date <= CURRENT_DATE AND NEW.status = 'planificacion' THEN
        NEW.status := 'en_progreso';
    END IF;
    
    -- If end_date is in the past and status is 'en_progreso'
    IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE AND NEW.status = 'en_progreso' THEN
        NEW.status := 'completado';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle user profile creation from auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'operativo')::user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync user updates from auth
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET
        email = NEW.email,
        name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        role = COALESCE(NEW.raw_user_meta_data->>'role', role)::user_role,
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE TRIGGERS

-- Trigger to recalculate project summaries when expenses change
CREATE TRIGGER trigger_recalculate_summary_on_expense_change
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION calculate_project_summary(COALESCE(NEW.project_id, OLD.project_id));

-- Trigger to recalculate project summaries when client payments change
CREATE TRIGGER trigger_recalculate_summary_on_payment_change
    AFTER INSERT OR UPDATE OR DELETE ON client_payments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_project_summary(COALESCE(NEW.project_id, OLD.project_id));

-- Trigger to update equipment status based on rentals
CREATE TRIGGER trigger_update_equipment_status
    AFTER INSERT OR UPDATE OR DELETE ON equipment_rentals
    FOR EACH ROW
    EXECUTE FUNCTION update_equipment_status();

-- Trigger to validate project dates
CREATE TRIGGER trigger_validate_project_dates
    BEFORE INSERT OR UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION validate_project_dates();

-- Trigger to validate rental dates and availability
CREATE TRIGGER trigger_validate_rental_dates
    BEFORE INSERT OR UPDATE ON equipment_rentals
    FOR EACH ROW
    EXECUTE FUNCTION validate_rental_dates();

-- Trigger to calculate rental cost
CREATE TRIGGER trigger_calculate_rental_cost
    BEFORE INSERT OR UPDATE ON equipment_rentals
    FOR EACH ROW
    EXECUTE FUNCTION calculate_rental_cost();

-- Trigger to auto-update project status
CREATE TRIGGER trigger_auto_update_project_status
    BEFORE INSERT OR UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_project_status();

-- Triggers for auth integration (these will be created on auth.users table)
-- Note: These need to be created by a superuser or in the auth schema
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION handle_new_user();

-- CREATE TRIGGER on_auth_user_updated
--     AFTER UPDATE ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION handle_user_update();

-- Function to get project financial summary
CREATE OR REPLACE FUNCTION get_project_financial_summary(project_uuid UUID)
RETURNS TABLE(
    project_id UUID,
    project_name VARCHAR(255),
    budget DECIMAL(15,2),
    total_expenses DECIMAL(15,2),
    total_income DECIMAL(15,2),
    profit_loss DECIMAL(15,2),
    expense_percentage DECIMAL(5,2),
    remaining_budget DECIMAL(15,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.budget,
        COALESCE(ps.total_expenses, 0),
        COALESCE(ps.total_income, 0),
        COALESCE(ps.profit_loss, 0),
        COALESCE(ps.expense_percentage, 0),
        p.budget - COALESCE(ps.total_expenses, 0) as remaining_budget
    FROM projects p
    LEFT JOIN project_summaries ps ON p.id = ps.project_id
    WHERE p.id = project_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get equipment availability
CREATE OR REPLACE FUNCTION get_equipment_availability(
    equipment_uuid UUID,
    check_start_date DATE,
    check_end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    is_available BOOLEAN := true;
BEGIN
    -- Check if equipment exists and is not out of service
    IF NOT EXISTS (
        SELECT 1 FROM equipment 
        WHERE id = equipment_uuid 
        AND status != 'fuera_de_servicio'
    ) THEN
        RETURN false;
    END IF;
    
    -- Check for conflicting rentals
    IF EXISTS (
        SELECT 1 FROM equipment_rentals 
        WHERE equipment_id = equipment_uuid 
        AND status = 'activo'
        AND (
            (start_date <= check_start_date AND (end_date IS NULL OR end_date >= check_start_date))
            OR
            (start_date <= check_end_date AND (end_date IS NULL OR end_date >= check_end_date))
            OR
            (start_date >= check_start_date AND start_date <= check_end_date)
        )
    ) THEN
        is_available := false;
    END IF;
    
    RETURN is_available;
END;
$$ LANGUAGE plpgsql;