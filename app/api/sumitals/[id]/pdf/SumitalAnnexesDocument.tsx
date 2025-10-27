import React from 'react';
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';

interface Attachment {
  id?: string;
  file_name?: string;
  file_type?: string;
  created_at?: string;
  url?: string;
}

interface SumitalAnnexesProps {
  projectName: string;
  documentAttachments: Attachment[];
  signedAttachments: Attachment[];
  linkAttachments: Attachment[];
  origin: string;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 16,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#2c3e50',
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  table: {
    flexDirection: 'column',
    width: 'auto',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#bdc3c7',
    marginBottom: 10,
  },
  row: { flexDirection: 'row' },
  rowEven: { backgroundColor: '#f8f9fa' },
  colHeader: {
    borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: '#bdc3c7',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#34495e',
  },
  col: {
    borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, borderColor: '#bdc3c7',
    alignItems: 'center', justifyContent: 'center',
  },
  cellHeader: { margin: 'auto', marginTop: 4, marginBottom: 4, fontSize: 9, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  cell: { margin: 'auto', marginTop: 4, marginBottom: 4, fontSize: 8, textAlign: 'center' },
  link: { color: '#2563eb', textDecoration: 'underline', fontSize: 8, textAlign: 'center', margin: 'auto', marginTop: 4, marginBottom: 4 },
  noteContainer: { marginTop: 10, padding: 10, backgroundColor: '#ecf0f1', borderRadius: 5 },
  noteText: { fontSize: 8, color: '#1565c0', textAlign: 'justify' },
});

export default function SumitalAnnexesDocument({ projectName, documentAttachments, signedAttachments, linkAttachments, origin }: SumitalAnnexesProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>ANEXOS - DOCUMENTOS ADJUNTOS DEL SUMITAL</Text>
          <Text style={styles.subtitle}>{projectName}</Text>
        </View>

        {documentAttachments?.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>DOCUMENTOS</Text>
            <View style={styles.table}>
              <View style={styles.row}>
                <View style={[styles.colHeader, { width: '10%' }]}><Text style={styles.cellHeader}>#</Text></View>
                <View style={[styles.colHeader, { width: '40%' }]}><Text style={styles.cellHeader}>Nombre</Text></View>
                <View style={[styles.colHeader, { width: '20%' }]}><Text style={styles.cellHeader}>Fecha</Text></View>
                <View style={[styles.colHeader, { width: '15%' }]}><Text style={styles.cellHeader}>Archivo</Text></View>
                <View style={[styles.colHeader, { width: '15%' }]}><Text style={styles.cellHeader}>Tipo</Text></View>
              </View>
              {documentAttachments.map((att, idx) => (
                <View key={`${att.id || 'doc'}-${idx}`} style={[styles.row, idx % 2 === 0 ? styles.rowEven : {}]}> 
                  <View style={[styles.col, { width: '10%' }]}><Text style={styles.cell}>{idx + 1}</Text></View>
                  <View style={[styles.col, { width: '40%' }]}><Text style={styles.cell}>{att.file_name || 'Sin nombre'}</Text></View>
                  <View style={[styles.col, { width: '20%' }]}>
                    <Text style={styles.cell}>
                      {att.created_at ? new Date(att.created_at).toLocaleDateString('es-ES') : 'N/A'}
                    </Text>
                  </View>
                  <View style={[styles.col, { width: '15%' }]}> 
                    {att.id ? (
                      <Link src={`${origin}/api/sumitals/attachments/${att.id}/open`} style={styles.link}>Abrir</Link>
                    ) : (
                      <Text style={styles.cell}>-</Text>
                    )}
                  </View>
                  <View style={[styles.col, { width: '15%' }]}>
                    <Text style={styles.cell}>
                      {att.file_type?.includes('pdf') ? 'PDF' : att.file_type?.startsWith('image/') ? 'Imagen' : (att.file_type || 'N/A')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {signedAttachments?.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>SUMITALES FIRMADOS</Text>
            <View style={styles.table}>
              <View style={styles.row}>
                <View style={[styles.colHeader, { width: '10%' }]}><Text style={styles.cellHeader}>#</Text></View>
                <View style={[styles.colHeader, { width: '45%' }]}><Text style={styles.cellHeader}>Nombre</Text></View>
                <View style={[styles.colHeader, { width: '20%' }]}><Text style={styles.cellHeader}>Fecha</Text></View>
                <View style={[styles.colHeader, { width: '25%' }]}><Text style={styles.cellHeader}>Archivo</Text></View>
              </View>
              {signedAttachments.map((att, idx) => (
                <View key={`${att.id || 'signed'}-${idx}`} style={[styles.row, idx % 2 === 0 ? styles.rowEven : {}]}> 
                  <View style={[styles.col, { width: '10%' }]}><Text style={styles.cell}>{idx + 1}</Text></View>
                  <View style={[styles.col, { width: '45%' }]}><Text style={styles.cell}>{att.file_name || 'Sin nombre'}</Text></View>
                  <View style={[styles.col, { width: '20%' }]}>
                    <Text style={styles.cell}>
                      {att.created_at ? new Date(att.created_at).toLocaleDateString('es-ES') : 'N/A'}
                    </Text>
                  </View>
                  <View style={[styles.col, { width: '25%' }]}> 
                    {att.id ? (
                      <Link src={`${origin}/api/sumitals/attachments/${att.id}/open`} style={styles.link}>Abrir / Descargar</Link>
                    ) : (
                      <Text style={styles.cell}>-</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {linkAttachments?.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>ENLACES EXTERNOS</Text>
            <View style={styles.table}>
              <View style={styles.row}>
                <View style={[styles.colHeader, { width: '10%' }]}><Text style={styles.cellHeader}>#</Text></View>
                <View style={[styles.colHeader, { width: '35%' }]}><Text style={styles.cellHeader}>Nombre</Text></View>
                <View style={[styles.colHeader, { width: '20%' }]}><Text style={styles.cellHeader}>Fecha</Text></View>
                <View style={[styles.colHeader, { width: '35%' }]}><Text style={styles.cellHeader}>URL</Text></View>
              </View>
              {linkAttachments.map((att, idx) => (
                <View key={`${att.id || 'link'}-${idx}`} style={[styles.row, idx % 2 === 0 ? styles.rowEven : {}]}> 
                  <View style={[styles.col, { width: '10%' }]}><Text style={styles.cell}>{idx + 1}</Text></View>
                  <View style={[styles.col, { width: '35%' }]}><Text style={styles.cell}>{att.file_name || 'Sin nombre'}</Text></View>
                  <View style={[styles.col, { width: '20%' }]}>
                    <Text style={styles.cell}>
                      {att.created_at ? new Date(att.created_at).toLocaleDateString('es-ES') : 'N/A'}
                    </Text>
                  </View>
                  <View style={[styles.col, { width: '35%' }]}> 
                    {att.url ? (
                      <Link src={att.url} style={styles.link}>Ver enlace</Link>
                    ) : (
                      <Text style={styles.cell}>-</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            <Text style={{ fontWeight: 'bold' }}>Nota:</Text> Los documentos listados en esta sección están disponibles digitalmente en el sistema. El texto subrayado indica enlaces clickeables para abrir o descargar los archivos.
          </Text>
        </View>
      </Page>
    </Document>
  );
}