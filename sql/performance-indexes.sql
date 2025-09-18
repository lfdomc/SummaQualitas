
-- Índices para mejorar el rendimiento de consultas
-- Ejecutar estos comandos en el editor SQL de Supabase

-- Índices para la tabla projects
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);
CREATE INDEX IF NOT EXISTS idx_projects_status_client ON projects(status, client_id);

-- Índices para la tabla expenses
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_currency ON expenses(currency);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_project_currency ON expenses(project_id, currency);

-- Índices para la tabla clients
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Índices para la tabla change_orders (si existe)
CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON change_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);
CREATE INDEX IF NOT EXISTS idx_change_orders_date ON change_orders(date);

-- Índices para la tabla incomes (si existe)
CREATE INDEX IF NOT EXISTS idx_incomes_project_id ON incomes(project_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_currency ON incomes(currency);

-- Índices compuestos para consultas complejas
CREATE INDEX IF NOT EXISTS idx_projects_composite ON projects(status, client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_composite ON expenses(project_id, currency, date);

-- Comentarios sobre los índices:
-- idx_projects_status: Para filtrar proyectos por estado
-- idx_projects_client_id: Para filtrar proyectos por cliente
-- idx_projects_created_at: Para ordenar por fecha de creación
-- idx_projects_status_client: Para filtros combinados de estado y cliente
-- idx_expenses_project_id: Para obtener gastos de un proyecto específico
-- idx_expenses_currency: Para filtrar por moneda
-- idx_expenses_project_currency: Para consultas de gastos por proyecto y moneda
-- Los índices compuestos mejoran las consultas que usan múltiples columnas
