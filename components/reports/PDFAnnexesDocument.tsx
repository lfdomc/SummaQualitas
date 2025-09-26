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
import { format } from 'date-fns';
import { translateCategory } from '@/lib/utils';

// Tipos para los datos del reporte
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

interface PDFAnnexesDocumentProps {
  reportData: ReportData;
  formatCurrency: (amount: number, currency: 'CRC' | 'USD') => string;
  convertCurrency: (amount: number, fromCurrency: 'CRC' | 'USD', toCurrency: 'CRC' | 'USD') => number;
}

// Estilos para el PDF
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
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#bdc3c7',
    marginBottom: 10
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row'
  },
  tableRowEven: {
    backgroundColor: '#f8f9fa'
  },
  tableColHeader: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#bdc3c7',
    backgroundColor: '#34495e',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tableCol: {
    width: '20%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#bdc3c7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tableCellHeader: {
    margin: 'auto',
    marginTop: 5,
    marginBottom: 5,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center'
  },
  tableCell: {
    margin: 'auto',
    marginTop: 5,
    marginBottom: 5,
    fontSize: 8,
    textAlign: 'center'
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center'
  },
  link: {
    color: '#3498db',
    textDecoration: 'underline',
    fontSize: 8,
    textAlign: 'center',
    margin: 'auto',
    marginTop: 5,
    marginBottom: 5
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: 8,
    borderTop: 1,
    borderTopColor: '#bdc3c7',
    paddingTop: 10
  },
  noteContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#ecf0f1',
    borderRadius: 5
  },
  noteText: {
    fontSize: 8,
    color: '#1565c0',
    textAlign: 'justify'
  }
});

// Componente para el encabezado de página
const PageHeader: React.FC<{ projectName: string }> = ({ projectName }) => (
  <View style={styles.header}>
    <Text style={styles.title}>ANNEXES - ATTACHED DOCUMENTS</Text>
    <Text style={styles.subtitle}>{projectName}</Text>
    <Text style={styles.projectInfo}>Annexes Page</Text>
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

// Componente principal del documento PDF de anexos
const PDFAnnexesDocument: React.FC<PDFAnnexesDocumentProps> = ({ 
  reportData, 
  formatCurrency, 
  convertCurrency 
}) => {
  const { project, incomes, expenses } = reportData;

  return (
    <Document>
      {/* Página única: Solo Anexos */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader projectName={project.name} />
        
        {/* Adjuntos de Ingresos */}
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
                      <Text style={styles.tableCell}>
                        {income.received_date && !isNaN(new Date(income.received_date).getTime()) 
                          ? format(new Date(income.received_date), 'dd/MM/yyyy') 
                          : 'N/A'
                        }
                      </Text>
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
        
        {/* Adjuntos de Gastos */}
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
                      <Text style={styles.tableCell}>
                        {expense.expense_date && !isNaN(new Date(expense.expense_date).getTime()) 
                          ? format(new Date(expense.expense_date), 'dd/MM/yyyy') 
                          : 'N/A'
                        }
                      </Text>
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

export default PDFAnnexesDocument;