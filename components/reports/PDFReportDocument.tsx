import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Font
} from '@react-pdf/renderer';
import { translateCategory } from '@/lib/utils';
// Helper function to format dates safely
const formatDate = (dateString: string, formatStr: string = 'dd/MM/yyyy'): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return 'N/A';
  }
};
// Removed Display import as it's not exported from @react-pdf/renderer

// Types for report data
interface Project {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: string;
  budget_crc?: number;
  budget_usd?: number;
}

interface Income {
  id: string;
  description: string;
  amount: number;
  currency: 'CRC' | 'USD';
  received_date: string;
  receipt_url?: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: 'CRC' | 'USD';
  expense_date: string;
  category: string;
  supplier?: { name: string };
  reference?: string;
  receipt_url?: string;
  reference_attachment_url?: string;
  reference_attachment_name?: string;
  reference_attachment_type?: string;
  reference_attachment_size?: number;
}

interface ReportData {
  project: Project;
  incomes: Income[];
  expenses: Expense[];
  exchangeRate: number;
}

interface PDFReportDocumentProps {
  reportData: ReportData;
  formatCurrency: (amount: number, currency: 'CRC' | 'USD') => string;
  convertCurrency: (amount: number, fromCurrency: 'CRC' | 'USD', toCurrency: 'CRC' | 'USD') => number;
}

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
    borderBottom: 2,
    borderBottomColor: '#2c3e50',
    paddingBottom: 10
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 10
  },
  projectInfo: {
    fontSize: 11,
    color: '#34495e'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center'
  },
  table: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    marginBottom: 10
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row'
  },
  tableRowEven: {
    backgroundColor: '#ecf0f1'
  },
  tableColHeader: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    backgroundColor: '#34495e',
    padding: 5
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    padding: 5
  },
  tableCellHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center'
  },
  tableCell: {
    fontSize: 8,
    color: '#2c3e50'
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
    fontSize: 8
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#bdc3c7',
    paddingTop: 10
  },
  summaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#dee2e6'
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  summaryLabel: {
    fontSize: 9,
    color: '#495057'
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  noteContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#bbdefb'
  },
  noteText: {
    fontSize: 8,
    color: '#1565c0',
    textAlign: 'justify'
  }
});

// Componente para el encabezado de página
const PageHeader: React.FC<{ projectName: string; pageNumber: number; totalPages: number }> = ({ 
  projectName, 
  pageNumber, 
  totalPages 
}) => (
  <View style={styles.header}>
    <Text style={styles.title}>DETAILED PROJECT REPORT</Text>
    <Text style={styles.subtitle}>{projectName}</Text>
    <Text style={styles.projectInfo}>Page {pageNumber} of {totalPages}</Text>
  </View>
);

// Componente para el pie de página
const PageFooter: React.FC = () => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <View style={styles.footer}>
      <Text>Generated on {formattedDate}</Text>
      <Text>Project Management System - Summa Qualitas</Text>
    </View>
  );
};

// Componente principal del documento PDF
const PDFReportDocument: React.FC<PDFReportDocumentProps> = ({ 
  reportData, 
  formatCurrency, 
  convertCurrency 
}) => {
  const { project, incomes, expenses, exchangeRate } = reportData;

  // Calcular totales
  const totalIncomesCRC = incomes.reduce((sum, income) => 
    sum + convertCurrency(income.amount, income.currency, 'CRC'), 0
  );
  const totalIncomesUSD = incomes.reduce((sum, income) => 
    sum + convertCurrency(income.amount, income.currency, 'USD'), 0
  );

  const totalExpensesCRC = expenses.reduce((sum, expense) => 
    sum + convertCurrency(expense.amount, expense.currency, 'CRC'), 0
  );
  const totalExpensesUSD = expenses.reduce((sum, expense) => 
    sum + convertCurrency(expense.amount, expense.currency, 'USD'), 0
  );

  const profitCRC = totalIncomesCRC - totalExpensesCRC;
  const profitUSD = totalIncomesUSD - totalExpensesUSD;

  // Group expenses by category
  const expenseCategories = [
    { title: 'DIRECT COST', expenses: expenses.filter(e => e.category === 'direct_cost') },
    { title: 'MANO DE OBRA', expenses: expenses.filter(e => e.category === 'mano_obra') },
    { title: 'EQUIPOS', expenses: expenses.filter(e => e.category === 'equipos') },
    { title: 'SERVICIOS', expenses: expenses.filter(e => e.category === 'servicios') },
    { title: 'TRANSPORTE', expenses: expenses.filter(e => e.category === 'transporte') },
    { title: 'OTROS', expenses: expenses.filter(e => e.category === 'otros') }
  ];

  return (
    <Document>
      {/* Page 1: Income */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader projectName={project.name} pageNumber={1} totalPages={4} />
        
        <Text style={styles.sectionTitle}>INCOME TABLE</Text>
        
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>#</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Date</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Description</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Amount (CRC)</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Amount (USD)</Text>
            </View>
          </View>
          
          {incomes.map((income, index) => (
            <View key={income.id} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{index + 1}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{income.received_date ? formatDate(income.received_date) : 'N/A'}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {income.description.length > 25 ? income.description.substring(0, 22) + '...' : income.description}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{formatCurrency(income.amount, income.currency)}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>
                  {formatCurrency(convertCurrency(income.amount, income.currency, 'USD'), 'USD')}
                </Text>
              </View>
            </View>
          ))}
          
          {/* Fila de totales */}
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: '60%' }]}>
              <Text style={styles.tableCellHeader}>TOTAL INCOME</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>{formatCurrency(totalIncomesCRC, 'CRC')}</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>{formatCurrency(totalIncomesUSD, 'USD')}</Text>
            </View>
          </View>
        </View>
        
        <PageFooter />
      </Page>

      {/* Pages 2-3: Expenses by category */}
      {expenseCategories.map((category, categoryIndex) => (
        category.expenses.length > 0 && (
          <Page key={category.title} size="LETTER" style={styles.page}>
            <PageHeader projectName={project.name} pageNumber={categoryIndex + 2} totalPages={4} />
            
            <Text style={styles.sectionTitle}>{category.title}</Text>
            
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>#</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Date</Text>
                </View>
                {category.title === 'DIRECT COSTS' && (
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>Supplier</Text>
                  </View>
                )}
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Description</Text>
                </View>
                {(category.title === 'DIRECT COSTS' || category.title === 'INDIRECT COSTS') && (
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>Reference</Text>
                  </View>
                )}
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Amount (CRC)</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Amount (USD)</Text>
                </View>
              </View>
              
              {category.expenses.map((expense, index) => (
                <View key={expense.id} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{index + 1}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{expense.expense_date ? formatDate(expense.expense_date) : 'N/A'}</Text>
                  </View>
                  {category.title === 'DIRECT COSTS' && (
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>{expense.supplier?.name || '-'}</Text>
                    </View>
                  )}
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      {expense.description.length > 25 ? expense.description.substring(0, 22) + '...' : expense.description}
                    </Text>
                  </View>
                  {(category.title === 'DIRECT COSTS' || category.title === 'INDIRECT COSTS') && (
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>{expense.reference || expense.invoice_number || '-'}</Text>
                    </View>
                  )}
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>{formatCurrency(expense.amount, expense.currency)}</Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      {formatCurrency(convertCurrency(expense.amount, expense.currency, 'USD'), 'USD')}
                    </Text>
                  </View>
                </View>
              ))}
              
              {/* Fila de totales por categoría */}
              <View style={styles.tableRow}>
                <View style={[styles.tableColHeader, { width: category.title === 'DIRECT COSTS' ? '60%' : '40%' }]}>
                  <Text style={styles.tableCellHeader}>TOTAL {category.title}</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>
                    {formatCurrency(
                      category.expenses.reduce((sum, expense) => 
                        sum + convertCurrency(expense.amount, expense.currency, 'CRC'), 0
                      ), 'CRC'
                    )}
                  </Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>
                    {formatCurrency(
                      category.expenses.reduce((sum, expense) => 
                        sum + convertCurrency(expense.amount, expense.currency, 'USD'), 0
                      ), 'USD'
                    )}
                  </Text>
                </View>
              </View>
            </View>
            
            <PageFooter />
          </Page>
        )
      ))}

      {/* Página final: Resumen y Anexos */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader projectName={project.name} pageNumber={4} totalPages={4} />
        
        <Text style={styles.sectionTitle}>EXECUTIVE SUMMARY</Text>
        
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>FINANCIAL SUMMARY</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Income (CRC):</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalIncomesCRC, 'CRC')}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Income (USD):</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalIncomesUSD, 'USD')}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Expenses (CRC):</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalExpensesCRC, 'CRC')}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Expenses (USD):</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalExpensesUSD, 'USD')}</Text>
          </View>
          

          
          {/* Separador para información del presupuesto */}
          <View style={[styles.summaryRow, { borderTop: '1pt solid #bdc3c7', paddingTop: 8, marginTop: 8 }]}>
            <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: '#2c3e50' }]}>BUDGET INFORMATION</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Budget (CRC):</Text>
            <Text style={[styles.summaryValue, { color: '#2980b9' }]}>
              {formatCurrency(project.budget_crc || 0, 'CRC')}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Budget (USD):</Text>
            <Text style={[styles.summaryValue, { color: '#2980b9' }]}>
              {formatCurrency(project.budget_usd || 0, 'USD')}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount Paid - Income (CRC):</Text>
            <Text style={[styles.summaryValue, { color: '#27ae60' }]}>
              {formatCurrency(totalIncomesCRC, 'CRC')}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount Paid - Income (USD):</Text>
            <Text style={[styles.summaryValue, { color: '#27ae60' }]}>
              {formatCurrency(totalIncomesUSD, 'USD')}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining to Pay (CRC):</Text>
            <Text style={[styles.summaryValue, { color: (project.budget_crc || 0) - totalIncomesCRC >= 0 ? '#e74c3c' : '#27ae60' }]}>
              {formatCurrency((project.budget_crc || 0) - totalIncomesCRC, 'CRC')}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining to Pay (USD):</Text>
            <Text style={[styles.summaryValue, { color: (project.budget_usd || 0) - totalIncomesUSD >= 0 ? '#e74c3c' : '#27ae60' }]}>
              {formatCurrency((project.budget_usd || 0) - totalIncomesUSD, 'USD')}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>% Paid of Budget:</Text>
            <Text style={[styles.summaryValue, { color: '#2980b9' }]}>
              {((project.budget_crc || 0) > 0 ? (totalIncomesCRC / (project.budget_crc || 1)) * 100 : 0).toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Anexos con enlaces clickeables */}
        <Text style={styles.sectionTitle}>ANNEXES - ATTACHED FILES</Text>
        
        {/* Income Attachments */}
        {incomes.some(income => income.receipt_url) && (
          <View>
            <Text style={[styles.summaryTitle, { marginTop: 10 }]}>INCOME ATTACHMENTS</Text>
            
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>#</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Description</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Date</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Attached File</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Type</Text>
                </View>
              </View>
              
              {incomes
                .filter(income => income.receipt_url)
                .map((income, index) => (
                  <View key={income.id} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>{index + 1}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>
                        {income.description.length > 20 ? income.description.substring(0, 17) + '...' : income.description}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>{income.received_date ? formatDate(income.received_date) : 'N/A'}</Text>
                    </View>
                    <View style={styles.tableCol}>
                      {income.receipt_url ? (
                        <Link src={income.receipt_url} style={styles.link}>
                          Receipt
                        </Link>
                      ) : (
                        <Text style={styles.tableCell}>Receipt</Text>
                      )}
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>PDF</Text>
                    </View>
                  </View>
                ))
              }
            </View>
          </View>
        )}
        
        {/* Expense Attachments */}
        {expenses.some(expense => expense.receipt_url || expense.reference_attachment_url) && (
          <View>
            <Text style={[styles.summaryTitle, { marginTop: 15 }]}>EXPENSE ATTACHMENTS</Text>
            
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={[styles.tableColHeader, { width: '8%' }]}>
                  <Text style={styles.tableCellHeader}>#</Text>
                </View>
                <View style={[styles.tableColHeader, { width: '25%' }]}>
                  <Text style={styles.tableCellHeader}>Description</Text>
                </View>
                <View style={[styles.tableColHeader, { width: '20%' }]}>
                  <Text style={styles.tableCellHeader}>Category</Text>
                </View>
                <View style={[styles.tableColHeader, { width: '12%' }]}>
                  <Text style={styles.tableCellHeader}>Date</Text>
                </View>
                <View style={[styles.tableColHeader, { width: '17.5%' }]}>
                  <Text style={styles.tableCellHeader}>Invoice Receipt</Text>
                </View>
                <View style={[styles.tableColHeader, { width: '17.5%' }]}>
                  <Text style={styles.tableCellHeader}>Reference Attachment</Text>
                </View>
              </View>
              
              {expenses
                .filter(expense => expense.receipt_url || expense.reference_attachment_url)
                .map((expense, index) => (
                  <View key={expense.id} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}>
                    <View style={[styles.tableCol, { width: '8%' }]}>
                      <Text style={styles.tableCell}>{index + 1}</Text>
                    </View>
                    <View style={[styles.tableCol, { width: '25%' }]}>
                      <Text style={styles.tableCell}>
                        {expense.description.length > 15 ? expense.description.substring(0, 12) + '...' : expense.description}
                      </Text>
                    </View>
                    <View style={[styles.tableCol, { width: '20%' }]}>
                      <Text style={styles.tableCell}>
                        {translateCategory(expense.category || '')}
                      </Text>
                    </View>
                    <View style={[styles.tableCol, { width: '12%' }]}>
                      <Text style={styles.tableCell}>{expense.expense_date ? formatDate(expense.expense_date) : 'N/A'}</Text>
                    </View>
                    <View style={[styles.tableCol, { width: '17.5%' }]}>
                      {expense.receipt_url ? (
                        <Link src={expense.receipt_url} style={styles.link}>
                          Invoice
                        </Link>
                      ) : (
                        <Text style={styles.tableCell}>-</Text>
                      )}
                    </View>
                    <View style={[styles.tableCol, { width: '17.5%' }]}>
                      {expense.reference_attachment_url ? (
                        <Link src={expense.reference_attachment_url} style={styles.link}>
                          {expense.reference_attachment_name || 'Reference'}
                        </Link>
                      ) : (
                        <Text style={styles.tableCell}>-</Text>
                      )}
                    </View>
                  </View>
                ))
              }
            </View>
          </View>
        )}
        
        {/* Nota informativa */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            <Text style={{ fontWeight: 'bold' }}>Note:</Text> The attached files listed in this section are available 
            digitally in the system. Click on the file name to view the original document 
            and verify its content.
          </Text>
        </View>
        
        <PageFooter />
      </Page>
    </Document>
  );
};

export default PDFReportDocument;