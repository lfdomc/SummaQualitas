const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTableStructure(tableName) {
  console.log(`\n📋 Checking structure for table: ${tableName}`)
  console.log('=' .repeat(50))
  
  try {
    // Get table columns
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: tableName })
    
    if (error) {
      // Fallback: try to get a sample record to see structure
      const { data: sample, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (sampleError) {
        console.error(`❌ Error checking ${tableName}:`, sampleError.message)
        return
      }
      
      if (sample && sample.length > 0) {
        console.log('📊 Sample record structure:')
        Object.keys(sample[0]).forEach(key => {
          const value = sample[0][key]
          const type = typeof value
          console.log(`  • ${key}: ${type} (example: ${value})`)
        })
      } else {
        console.log('📭 Table is empty')
      }
    } else {
      console.log('📊 Column structure:')
      columns.forEach(col => {
        console.log(`  • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`)
      })
    }
  } catch (err) {
    console.error(`❌ Error checking ${tableName}:`, err.message)
  }
}

async function main() {
  console.log('🔍 Database Structure Checker')
  console.log('============================')
  
  const tables = ['projects', 'expenses', 'incomes', 'suppliers', 'users']
  
  for (const table of tables) {
    await checkTableStructure(table)
  }
  
  console.log('\n✅ Database structure check completed!')
}

main().catch(console.error)