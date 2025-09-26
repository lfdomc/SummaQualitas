-- Sample Data for Summa Qualitas Construction Management System
-- This script inserts test data for development and testing purposes

-- Insert sample users
INSERT INTO users (id, email, name, role, phone, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'gerente@summaqualitas.com', 'Juan Carlos Pérez', 'gerencia', '+1-555-0101', true),
('550e8400-e29b-41d4-a716-446655440102', 'admin@summaqualitas.com', 'María González', 'administrativo', '+1-555-0102', true),
('550e8400-e29b-41d4-a716-446655440103', 'operador1@summaqualitas.com', 'Carlos Rodríguez', 'operativo', '+1-555-0103', true),
('550e8400-e29b-41d4-a716-446655440104', 'operador2@summaqualitas.com', 'Ana Martínez', 'operativo', '+1-555-0104', true),
('550e8400-e29b-41d4-a716-446655440105', 'cliente1@empresa.com', 'Roberto Silva', 'cliente', '+1-555-0105', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample clients
INSERT INTO clients (id, name, contact_person, email, phone, address, tax_id, client_type, status) VALUES
('550e8400-e29b-41d4-a716-446655440201', 'Constructora ABC S.A.', 'Roberto Silva', 'contacto@constructoraabc.com', '+1-555-0201', '123 Calle Principal, Ciudad', 'RFC123456789', 'empresa', 'activo'),
('550e8400-e29b-41d4-a716-446655440202', 'Inmobiliaria XYZ', 'Laura Fernández', 'info@inmobiliariaxyz.com', '+1-555-0202', '456 Avenida Central, Ciudad', 'RFC987654321', 'empresa', 'activo'),
('550e8400-e29b-41d4-a716-446655440203', 'Desarrollos Urbanos', 'Miguel Torres', 'contacto@desarrollosurbanos.com', '+1-555-0203', '789 Boulevard Norte, Ciudad', 'RFC456789123', 'empresa', 'activo'),
('550e8400-e29b-41d4-a716-446655440204', 'Familia Hernández', 'José Hernández', 'jose.hernandez@email.com', '+1-555-0204', '321 Calle Residencial, Ciudad', 'CURP123456789', 'particular', 'activo')
ON CONFLICT (id) DO NOTHING;

-- Insert sample suppliers
INSERT INTO suppliers (id, name, contact_person, email, phone, address, tax_id, supplier_type, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Materiales de Construcción López', 'Pedro López', 'ventas@materialeslopez.com', '+1-555-0301', '100 Zona Industrial, Ciudad', 'RFC111222333', 'MATERIALES', 'ACTIVO'),
('550e8400-e29b-41d4-a716-446655440002', 'Servicios de Excavación Rápida', 'Carmen Ruiz', 'info@excavacionrapida.com', '+1-555-0302', '200 Zona Industrial, Ciudad', 'RFC444555666', 'SERVICIOS', 'ACTIVO'),
('550e8400-e29b-41d4-a716-446655440003', 'Alquiler de Equipos Pesados', 'Fernando Castro', 'alquiler@equipospesados.com', '+1-555-0303', '300 Zona Industrial, Ciudad', 'RFC777888999', 'EQUIPOS', 'ACTIVO'),
('550e8400-e29b-41d4-a716-446655440004', 'Subcontratista Eléctrico Pro', 'Elena Vargas', 'contacto@electricopro.com', '+1-555-0304', '400 Zona Industrial, Ciudad', 'RFC000111222', 'SUBCONTRATISTA', 'ACTIVO')
ON CONFLICT (id) DO NOTHING;

-- Insert sample projects
INSERT INTO projects (id, name, description, client_id, manager_id, status, budget, start_date, end_date, estimated_end_date, location) VALUES
('550e8400-e29b-41d4-a716-446655440301', 'Edificio Residencial Torre Norte', 'Construcción de edificio residencial de 15 pisos con 60 departamentos', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', 'en_progreso', 2500000.00, '2024-01-15', NULL, '2024-12-15', 'Zona Norte, Ciudad'),
('550e8400-e29b-41d4-a716-446655440302', 'Centro Comercial Plaza Central', 'Desarrollo de centro comercial con 50 locales comerciales', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', 'planificacion', 3800000.00, '2024-03-01', NULL, '2025-02-28', 'Centro, Ciudad'),
('550e8400-e29b-41d4-a716-446655440303', 'Complejo Habitacional Los Pinos', 'Construcción de 25 casas unifamiliares', '550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440101', 'en_progreso', 1800000.00, '2024-02-01', NULL, '2024-10-31', 'Zona Sur, Ciudad'),
('550e8400-e29b-41d4-a716-446655440304', 'Casa Familiar Hernández', 'Construcción de casa unifamiliar de 200m2', '550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440103', 'completado', 150000.00, '2023-08-01', '2023-12-15', '2023-12-01', 'Zona Residencial, Ciudad')
ON CONFLICT (id) DO NOTHING;

-- Insert sample equipment
INSERT INTO equipment (id, name, description, category, brand, model, serial_number, purchase_date, purchase_price, current_value, status, location, maintenance_schedule) VALUES
('550e8400-e29b-41d4-a716-446655440401', 'Excavadora CAT 320', 'Excavadora hidráulica de 20 toneladas', 'Maquinaria Pesada', 'Caterpillar', '320D', 'CAT320D2024001', '2024-01-10', 450000.00, 420000.00, 'disponible', 'Almacén Principal', 'mensual'),
('550e8400-e29b-41d4-a716-446655440402', 'Grúa Torre Liebherr', 'Grúa torre de 50 metros de altura', 'Maquinaria Pesada', 'Liebherr', 'EC-B 125', 'LBH125EC2024001', '2023-12-15', 850000.00, 800000.00, 'en_uso', 'Proyecto Los Pinos', 'trimestral'),
('550e8400-e29b-41d4-a716-446655440403', 'Mezcladora de Concreto', 'Mezcladora de concreto de 8m3', 'Equipos de Construcción', 'CEMEX', 'MX-500', 'CMX500MX2023001', '2023-08-20', 125000.00, 110000.00, 'mantenimiento', 'Taller de Reparaciones', 'mensual'),
('550e8400-e29b-41d4-a716-446655440404', 'Compactador Vibratorio', 'Compactador vibratorio para suelos', 'Equipos de Construcción', 'Wacker Neuson', 'DPU6555', 'WN6555DP2024001', '2024-02-05', 85000.00, 82000.00, 'disponible', 'Almacén Principal', 'mensual')
ON CONFLICT (id) DO NOTHING;

-- Insert sample equipment rentals
INSERT INTO equipment_rentals (id, equipment_id, project_id, rented_by, start_date, end_date, planned_end_date, daily_rate, status) VALUES
('550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440103', '2024-01-15', NULL, '2024-12-15', 150.00, 'activo'),
('550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440104', '2024-02-01', '2024-02-28', '2024-02-28', 120.00, 'completado'),
('550e8400-e29b-41d4-a716-446655440503', '550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440103', '2024-02-15', NULL, '2024-10-31', 80.00, 'activo');

-- Insert sample expenses
INSERT INTO expenses (id, project_id, supplier_id, description, amount, category, expense_date, invoice_number, payment_status, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440001', 'Cemento y agregados para cimentación', 25000.00, 'otros', '2024-01-20', 'INV-2024-001', 'pagado', '550e8400-e29b-41d4-a716-446655440102'),
('550e8400-e29b-41d4-a716-446655440602', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440002', 'Excavación para cimentación', 18000.00, 'servicios', '2024-01-25', 'INV-2024-002', 'pagado', '550e8400-e29b-41d4-a716-446655440102'),
('550e8400-e29b-41d4-a716-446655440603', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440004', 'Instalación eléctrica primer piso', 12000.00, 'servicios', '2024-02-01', 'INV-2024-003', 'pendiente', '550e8400-e29b-41d4-a716-446655440102'),
('550e8400-e29b-41d4-a716-446655440604', '550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440001', 'Materiales para estructura', 35000.00, 'otros', '2024-02-05', 'INV-2024-004', 'pagado', '550e8400-e29b-41d4-a716-446655440101'),
('550e8400-e29b-41d4-a716-446655440605', '550e8400-e29b-41d4-a716-446655440303', NULL, 'Mano de obra especializada', 22000.00, 'mano_obra', '2024-02-10', NULL, 'pendiente', '550e8400-e29b-41d4-a716-446655440101'),
('550e8400-e29b-41d4-a716-446655440606', '550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440001', 'Materiales de acabado', 8500.00, 'otros', '2023-11-15', 'INV-2023-045', 'pagado', '550e8400-e29b-41d4-a716-446655440103')
ON CONFLICT (id) DO NOTHING;

-- Insert sample client payments
INSERT INTO client_payments (id, project_id, client_id, amount, payment_date, payment_method, reference, description, status, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', 500000.00, '2024-01-10', 'transferencia', 'TRF-2024-001', 'Anticipo 20% del proyecto', 'pagado', '550e8400-e29b-41d4-a716-446655440102'),
('550e8400-e29b-41d4-a716-446655440702', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', 750000.00, '2024-02-15', 'transferencia', 'TRF-2024-002', 'Pago por avance 30%', 'pagado', '550e8400-e29b-41d4-a716-446655440102'),
('550e8400-e29b-41d4-a716-446655440703', '550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440203', 360000.00, '2024-01-25', 'cheque', 'CHQ-2024-001', 'Anticipo 20% del proyecto', 'pagado', '550e8400-e29b-41d4-a716-446655440101'),
('550e8400-e29b-41d4-a716-446655440704', '550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440204', 150000.00, '2023-12-20', 'transferencia', 'TRF-2023-015', 'Pago final del proyecto', 'pagado', '550e8400-e29b-41d4-a716-446655440103')
ON CONFLICT (id) DO NOTHING;

-- Insert sample supplier payments
INSERT INTO supplier_payments (id, project_id, supplier_id, amount, payment_date, payment_method, reference, status, description, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440001', 25000.00, '2024-01-25', 'transferencia', 'PAY-2024-001', 'pagado', 'Pago de cemento y agregados', '550e8400-e29b-41d4-a716-446655440102'),
('550e8400-e29b-41d4-a716-446655440502', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440002', 18000.00, '2024-01-30', 'cheque', 'PAY-2024-002', 'pagado', 'Pago de excavación', '550e8400-e29b-41d4-a716-446655440102'),
('550e8400-e29b-41d4-a716-446655440503', '550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440001', 35000.00, '2024-02-10', 'transferencia', 'PAY-2024-003', 'pagado', 'Pago de materiales estructura', '550e8400-e29b-41d4-a716-446655440101'),
('550e8400-e29b-41d4-a716-446655440504', '550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440001', 8500.00, '2023-11-20', 'transferencia', 'PAY-2023-045', 'pagado', 'Pago de materiales acabado', '550e8400-e29b-41d4-a716-446655440103')
ON CONFLICT (id) DO NOTHING;

-- Sample incomes data will be inserted when the incomes table is created in the main migration

-- Insert sample change orders
INSERT INTO change_orders (
  id, 
  project_id, 
  title, 
  description, 
  amount, 
  status, 
  requested_by, 
  request_date,
  designer,
  cost_impact,
  currency,
  exchange_rate,
  cost_impact_crc,
  schedule_impact_days,
  cost_impact_level,
  quality_impact_level,
  schedule_impact_level,
  risk_impact_level,
  cost_comments,
  quality_comments,
  schedule_comments,
  risk_comments,
  general_comments
) VALUES
(
  '550e8400-e29b-41d4-a716-446655441001', 
  '550e8400-e29b-41d4-a716-446655440301', 
  'Modificación en diseño de fachada', 
  'Cambio de material de fachada por solicitud del cliente', 
  45000.00, 
  'aprobado', 
  '550e8400-e29b-41d4-a716-446655440103', 
  '2024-02-01',
  'Ing. María González',
  2500000.00,
  'CRC',
  520.0000,
  2500000.00,
  15,
  'alto',
  'medio',
  'alto',
  'medio',
  'Incremento debido a cambios en especificaciones de materiales',
  'Mejora en la calidad de acabados',
  'Retraso por tiempo adicional de instalación',
  'Riesgo controlado con supervisión adicional',
  'Orden de cambio aprobada por el cliente para mejorar la calidad del proyecto'
),
(
  '550e8400-e29b-41d4-a716-446655441002', 
  '550e8400-e29b-41d4-a716-446655440301', 
  'Instalación adicional de aire acondicionado', 
  'Instalación de sistema de aire acondicionado en áreas comunes', 
  28000.00, 
  'pendiente', 
  '550e8400-e29b-41d4-a716-446655440102', 
  '2024-02-10',
  'Arq. Carlos Mendez',
  1456000.00,
  'CRC',
  520.0000,
  1456000.00,
  7,
  'medio',
  'alto',
  'bajo',
  'bajo',
  'Costo adicional por equipos de alta eficiencia',
  'Mejora significativa en confort',
  'Instalación rápida sin afectar cronograma',
  'Riesgo mínimo',
  'Instalación solicitada por el cliente para mejorar confort'
),
(
  '550e8400-e29b-41d4-a716-446655441003', 
  '550e8400-e29b-41d4-a716-446655440303', 
  'Ampliación de cocheras', 
  'Ampliación de cocheras en 5 casas del complejo', 
  35000.00, 
  'aprobado', 
  '550e8400-e29b-41d4-a716-446655440101', 
  '2024-02-05',
  'Ing. Ana Rodríguez',
  1820000.00,
  'CRC',
  520.0000,
  1820000.00,
  10,
  'medio',
  'bajo',
  'medio',
  'bajo',
  'Costo por excavación y materiales adicionales',
  'Mantiene estándares de calidad',
  'Extensión moderada del cronograma',
  'Riesgo bajo con supervisión',
  'Ampliación aprobada para aumentar valor de las propiedades'
);

-- Calculate and insert project summaries
-- This will be automatically calculated by triggers, but we can insert initial values
INSERT INTO project_summaries (project_id, total_expenses, total_income, profit_loss, expense_percentage, last_calculated) VALUES
('550e8400-e29b-41d4-a716-446655440301', 55000.00, 1250000.00, 1195000.00, 2.20, NOW()),
('550e8400-e29b-41d4-a716-446655440303', 57000.00, 360000.00, 303000.00, 3.17, NOW()),
('550e8400-e29b-41d4-a716-446655440304', 8500.00, 150000.00, 141500.00, 5.67, NOW())
ON CONFLICT (project_id) DO NOTHING;

-- Update equipment status based on current rentals
UPDATE equipment SET status = 'en_uso' WHERE id = '550e8400-e29b-41d4-a716-446655440402';

-- Add some notes to demonstrate the system
UPDATE projects SET notes = 'Proyecto en desarrollo normal, sin retrasos significativos' WHERE id = '550e8400-e29b-41d4-a716-446655440301';
UPDATE projects SET notes = 'Pendiente de aprobación de permisos municipales' WHERE id = '550e8400-e29b-41d4-a716-446655440302';
UPDATE projects SET notes = 'Avance según cronograma, excelente trabajo del equipo' WHERE id = '550e8400-e29b-41d4-a716-446655440303';
UPDATE projects SET notes = 'Proyecto completado satisfactoriamente, cliente muy contento' WHERE id = '550e8400-e29b-41d4-a716-446655440304';