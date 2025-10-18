-- Add missing supplier_phone column to sumitals table
DO $$ 
BEGIN 
  -- Verificar que la tabla exista en el esquema public
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'sumitals'
  ) THEN
    -- Agregar la columna solo si no existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND table_name = 'sumitals' 
        AND column_name = 'supplier_phone'
    ) THEN
      ALTER TABLE public.sumitals ADD COLUMN supplier_phone VARCHAR(50);
      RAISE NOTICE 'Columna supplier_phone agregada exitosamente';
    ELSE
      RAISE NOTICE 'La columna supplier_phone ya existe';
    END IF;
  ELSE
    RAISE NOTICE 'La tabla public.sumitals no existe, omitiendo migración';
  END IF;
END $$;