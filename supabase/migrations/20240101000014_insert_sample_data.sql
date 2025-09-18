-- Sample Data for Summa Qualitas Construction Management System
-- This script inserts test data for development and testing purposes

-- Insert sample users
INSERT INTO users (id, email, name, role, phone, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'gerente@summaqualitas.com', 'Juan Carlos Pérez', 'gerencia', '+1-555-0101', true),
('22222222-2222-2222-2222-222222222222', 'admin@summaqualitas.com', 'María González', 'administrativo', '+1-555-0102', true),
('33333333-3333-3333-3333-333333333333', 'operador1@summaqualitas.com', 'Carlos Rodríguez', 'operativo', '+1-555-0103', true),
('44444444-4444-4444-4444-444444444444', 'operador2@summaqualitas.com', 'Ana Martínez', 'operativo', '+1-555-0104', true),
('55555555-5555-5555-5555-555555555555', 'cliente1@empresa.com', 'Roberto Silva', 'cliente', '+1-555-0105', true);

-- Insert sample clients
INSERT INTO clients (id, name, contact_person, email, phone, address, tax_id, client_type, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Constructora ABC S.A.', 'Roberto Silva', 'contacto@constructoraabc.com', '+1-555-0201', '123 Calle Principal, Ciudad', 'RFC123456789', 'empresa', 'activo'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Inmobiliaria XYZ', 'Laura Fernández', 'info@inmobiliariaxyz.com', '+1-555-0202', '456 Avenida Central, Ciudad', 'RFC987654321', 'empresa', 'activo'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Desarrollos Urbanos', 'Miguel Torres', 'contacto@desarrollosurbanos.com', '+1-555-0203', '789 Boulevard Norte, Ciudad', 'RFC456789123', 'empresa', 'activo'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Familia Hernández', 'José Hernández', 'jose.hernandez@email.com', '+1-555-0204', '321 Calle Residencial, Ciudad', 'CURP123456789', 'particular', 'activo');

-- Insert sample suppliers
INSERT INTO suppliers (id, name, contact_person, email, phone, address, tax_id, supplier_type, status) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Materiales de Construcción López', 'Pedro López', 'ventas@materialeslopez.com', '+1-555-0301', '100 Zona Industrial, Ciudad', 'RFC111222333', 'MATERIALES', 'ACTIVO'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Servicios de Excavación Rápida', 'Carmen Ruiz', 'info@excavacionrapida.com', '+1-555-0302', '200 Zona Industrial, Ciudad', 'RFC444555666', 'SERVICIOS', 'ACTIVO'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Alquiler de Equipos Pesados', 'Fernando Castro', 'alquiler@equipospesados.com', '+1-555-0303', '300 Zona Industrial, Ciudad', 'RFC777888999', 'EQUIPOS', 'ACTIVO'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Subcontratista Eléctrico Pro', 'Elena Vargas', 'contacto@electricopro.com', '+1-555-0304', '400 Zona Industrial, Ciudad', 'RFC000111222', 'SUBCONTRATISTA', 'ACTIVO');

-- Insert sample projects
INSERT INTO projects (id, name, description, client_id, manager_id, status, budget, start_date, end_date, estimated_end_date, location) VALUES
('aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 'Edificio Residencial Torre Norte', 'Construcción de edificio residencial de 15 pisos con 60 departamentos', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'en_progreso', 2500000.00, '2024-01-15', NULL, '2024-12-15', 'Zona Norte, Ciudad'),
('aaaabbbb-cccc-dddd-eeee-ffffgggghhh2', 'Centro Comercial Plaza Central', 'Desarrollo de centro comercial con 50 locales comerciales', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'planificacion', 3800000.00, '2024-03-01', NULL, '2025-02-28', 'Centro, Ciudad'),
('aaaabbbb-cccc-dddd-eeee-ffffgggghhh3', 'Complejo Habitacional Los Pinos', 'Construcción de 25 casas unifamiliares', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'en_progreso', 1800000.00, '2024-02-01', NULL, '2024-10-31', 'Zona Sur, Ciudad'),
('aaaabbbb-cccc-dddd-eeee-ffffgggghhh4', 'Casa Familiar Hernández', 'Construcción de casa unifamiliar de 200m2', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'completado', 150000.00, '2023-08-01', '2023-12-15', '2023-12-01', 'Zona Residencial, Ciudad');

-- Insert sample equipment
INSERT INTO equipment (id, name, description, category, brand, model, serial_number, purchase_date, purchase_price, current_value, status, location) VALUES
('11111111-aaaa-bbbb-cccc-dddddddddddd', 'Excavadora Hidráulica', 'Excavadora hidráulica de 20 toneladas', 'Maquinaria Pesada', 'Caterpillar', '320D', 'CAT320D001', '2022-01-15', 180000.00, 150000.00, 'disponible', 'Almacén Principal'),
('22222222-aaaa-bbbb-cccc-dddddddddddd', 'Grúa Torre', 'Grúa torre de 50 metros de altura', 'Maquinaria Pesada', 'Liebherr', '85EC-B5', 'LIE85EC001', '2021-06-10', 250000.00, 200000.00, 'en_uso', 'Proyecto Torre Norte'),
('33333333-aaaa-bbbb-cccc-dddddddddddd', 'Mezcladora de Concreto', 'Mezcladora de concreto de 8m3', 'Equipos de Construcción', 'CEMEX', 'MX-8000', 'CMX8000001', '2023-03-20', 45000.00, 40000.00, 'disponible', 'Almacén Principal'),
('44444444-aaaa-bbbb-cccc-dddddddddddd', 'Compactador Vibratorio', 'Compactador vibratorio para suelos', 'Equipos de Construcción', 'Wacker', 'BPU2540A', 'WAC2540001', '2023-05-15', 8500.00, 7500.00, 'mantenimiento', 'Taller'),
('55555555-aaaa-bbbb-cccc-dddddddddddd', 'Generador Eléctrico', 'Generador eléctrico de 100KW', 'Equipos Auxiliares', 'Caterpillar', 'C4.4', 'CATC44001', '2022-09-30', 35000.00, 30000.00, 'disponible', 'Almacén Principal');

-- Insert sample equipment rentals
INSERT INTO equipment_rentals (id, equipment_id, project_id, rented_by, start_date, end_date, planned_end_date, daily_rate, status) VALUES
('rent0001-1111-2222-3333-444444444444', '22222222-aaaa-bbbb-cccc-dddddddddddd', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', '33333333-3333-3333-3333-333333333333', '2024-01-15', NULL, '2024-12-15', 150.00, 'activo'),
('rent0002-1111-2222-3333-444444444444', '11111111-aaaa-bbbb-cccc-dddddddddddd', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh3', '44444444-4444-4444-4444-444444444444', '2024-02-01', '2024-02-28', '2024-02-28', 120.00, 'completado'),
('rent0003-1111-2222-3333-444444444444', '33333333-aaaa-bbbb-cccc-dddddddddddd', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh3', '33333333-3333-3333-3333-333333333333', '2024-02-15', NULL, '2024-10-31', 80.00, 'activo');

-- Insert sample expenses
INSERT INTO expenses (id, project_id, supplier_id, description, amount, category, expense_date, invoice_number, payment_status, created_by) VALUES
('exp00001-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Cemento y agregados para cimentación', 25000.00, 'materiales', '2024-01-20', 'INV-2024-001', 'pagado', '22222222-2222-2222-2222-222222222222'),
('exp00002-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Excavación para cimentación', 18000.00, 'servicios', '2024-01-25', 'INV-2024-002', 'pagado', '22222222-2222-2222-2222-222222222222'),
('exp00003-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Instalación eléctrica primer piso', 12000.00, 'servicios', '2024-02-01', 'INV-2024-003', 'pendiente', '22222222-2222-2222-2222-222222222222'),
('exp00004-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh3', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Materiales para estructura', 35000.00, 'materiales', '2024-02-05', 'INV-2024-004', 'pagado', '11111111-1111-1111-1111-111111111111'),
('exp00005-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh3', NULL, 'Mano de obra especializada', 22000.00, 'mano_obra', '2024-02-10', NULL, 'pendiente', '11111111-1111-1111-1111-111111111111'),
('exp00006-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh4', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Materiales de acabado', 8500.00, 'materiales', '2023-11-15', 'INV-2023-045', 'pagado', '33333333-3333-3333-3333-333333333333');

-- Insert sample client payments
INSERT INTO client_payments (id, project_id, client_id, amount, payment_date, payment_method, reference, description, status, created_by) VALUES
('pay00001-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 500000.00, '2024-01-10', 'Transferencia', 'TRF-2024-001', 'Anticipo 20% del proyecto', 'pagado', '22222222-2222-2222-2222-222222222222'),
('pay00002-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 750000.00, '2024-02-15', 'Transferencia', 'TRF-2024-002', 'Pago por avance 30%', 'pagado', '22222222-2222-2222-2222-222222222222'),
('pay00003-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh3', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 360000.00, '2024-01-25', 'Cheque', 'CHQ-2024-001', 'Anticipo 20% del proyecto', 'pagado', '11111111-1111-1111-1111-111111111111'),
('pay00004-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh4', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 150000.00, '2023-12-20', 'Transferencia', 'TRF-2023-015', 'Pago final del proyecto', 'pagado', '33333333-3333-3333-3333-333333333333');

-- Insert sample supplier payments
INSERT INTO supplier_payments (id, supplier_id, project_id, amount, payment_date, payment_method, reference, description, status, created_by) VALUES
('spay0001-1111-2222-3333-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 25000.00, '2024-01-25', 'Transferencia', 'TRF-SUP-001', 'Pago factura INV-2024-001', 'pagado', '22222222-2222-2222-2222-222222222222'),
('spay0002-1111-2222-3333-444444444444', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 18000.00, '2024-01-30', 'Cheque', 'CHQ-SUP-001', 'Pago servicios de excavación', 'pagado', '22222222-2222-2222-2222-222222222222'),
('spay0003-1111-2222-3333-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh3', 35000.00, '2024-02-10', 'Transferencia', 'TRF-SUP-002', 'Pago materiales estructura', 'pagado', '11111111-1111-1111-1111-111111111111');

-- Insert sample incomes (additional income entries)
INSERT INTO incomes (id, project_id, client_id, description, amount, category, status, income_date, reference, created_by) VALUES
('inc00001-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Anticipo inicial del proyecto', 500000.00, 'anticipo', 'confirmado', '2024-01-10', 'TRF-2024-001', '22222222-2222-2222-2222-222222222222'),
('inc00002-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pago por avance de obra', 750000.00, 'pago_parcial', 'confirmado', '2024-02-15', 'TRF-2024-002', '22222222-2222-2222-2222-222222222222'),
('inc00003-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh3', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Anticipo proyecto Los Pinos', 360000.00, 'anticipo', 'confirmado', '2024-01-25', 'CHQ-2024-001', '11111111-1111-1111-1111-111111111111');

-- Insert sample change orders
INSERT INTO change_orders (id, project_id, title, description, amount, status, requested_by, request_date) VALUES
('co000001-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 'Modificación en diseño de fachada', 'Cambio de material de fachada por solicitud del cliente', 45000.00, 'aprobado', '33333333-3333-3333-3333-333333333333', '2024-02-01'),
('co000002-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 'Instalación adicional de aire acondicionado', 'Instalación de sistema de aire acondicionado en áreas comunes', 28000.00, 'pendiente', '22222222-2222-2222-2222-222222222222', '2024-02-10'),
('co000003-1111-2222-3333-444444444444', 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh3', 'Ampliación de cocheras', 'Ampliación de cocheras en 5 casas del complejo', 35000.00, 'aprobado', '11111111-1111-1111-1111-111111111111', '2024-02-05');

-- Calculate and insert project summaries
-- This will be automatically calculated by triggers, but we can insert initial values
INSERT INTO project_summaries (project_id, total_expenses, total_income, profit_loss, expense_percentage, last_calculated) VALUES
('aaaabbbb-cccc-dddd-eeee-ffffgggghhh1', 55000.00, 1250000.00, 1195000.00, 2.20, NOW()),
('aaaabbbb-cccc-dddd-eeee-ffffgggghhh3', 57000.00, 360000.00, 303000.00, 3.17, NOW()),
('aaaabbbb-cccc-dddd-eeee-ffffgggghhh4', 8500.00, 150000.00, 141500.00, 5.67, NOW());

-- Update equipment status based on current rentals
UPDATE equipment SET status = 'en_uso' WHERE id = '22222222-aaaa-bbbb-cccc-dddddddddddd';

-- Add some notes to demonstrate the system
UPDATE projects SET notes = 'Proyecto en desarrollo normal, sin retrasos significativos' WHERE id = 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh1';
UPDATE projects SET notes = 'Pendiente de aprobación de permisos municipales' WHERE id = 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh2';
UPDATE projects SET notes = 'Avance según cronograma, excelente trabajo del equipo' WHERE id = 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh3';
UPDATE projects SET notes = 'Proyecto completado satisfactoriamente, cliente muy contento' WHERE id = 'aaaabbbb-cccc-dddd-eeee-ffffgggghhh4';