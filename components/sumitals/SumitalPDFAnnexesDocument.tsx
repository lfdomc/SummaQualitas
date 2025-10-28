"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import { SumitalAttachment } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingHorizontal: 28,
    paddingBottom: 32,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
    color: "#444",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 8,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  listItem: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
    paddingVertical: 6,
  },
  itemLeft: {
    width: "65%",
  },
  itemRight: {
    width: "35%",
    textAlign: "right",
  },
  link: {
    color: "#1a73e8",
    textDecoration: "none",
  },
  meta: {
    color: "#666",
    fontSize: 10,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 28,
    right: 28,
    fontSize: 9,
    color: "#777",
    borderTopWidth: 0.5,
    borderTopColor: "#e0e0e0",
    paddingTop: 6,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export interface SumitalPDFAnnexesProps {
  sumitalId: string | number;
  sumitalTitle?: string;
  projectName?: string;
  attachments: SumitalAttachment[];
  externalDocuments?: { label: string; url: string }[];
}

function humanFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "—";
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }
  const units = ["KB", "MB", "GB", "TB"];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + " " + units[u];
}

// Build a stable open URL for an attachment id
function buildOpenUrl(id: string | number) {
  return `/api/sumitals/attachments/${id}/open`;
}

export const SumitalPDFAnnexesDocument: React.FC<SumitalPDFAnnexesProps> = ({
  sumitalId,
  sumitalTitle,
  projectName,
  attachments,
  externalDocuments = [],
}) => {
  const signed = attachments.filter(
    (a) => a.attachment_type === "signed_sumital"
  );
  const others = attachments.filter(
    (a) => a.attachment_type !== "signed_sumital"
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>PÁGINA DE ANEXOS — Sumital</Text>
          <Text style={styles.subtitle}>
            {sumitalTitle ? sumitalTitle + " · " : ""}
            {projectName || "Proyecto"} · ID: {String(sumitalId)}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Archivos Adjuntos</Text>
        <View style={styles.list}>
          {others.length === 0 ? (
            <Text style={styles.meta}>No hay archivos adjuntos</Text>
          ) : (
            others.map((att) => (
              <View key={att.id} style={styles.listItem}>
                <View style={styles.itemLeft}>
                  <Text>
                    {att.file_name || att.description || "Documento adjunto"}
                  </Text>
                  <Text style={styles.meta}>
                    Tipo: {att.file_type || att.attachment_type || "—"} · Tamaño: {humanFileSize(att.file_size)}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <Link style={styles.link} src={buildOpenUrl(att.id)}>
                    Abrir
                  </Link>
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Sumital Firmado</Text>
        <View style={styles.list}>
          {signed.length === 0 ? (
            <Text style={styles.meta}>No hay sumital firmado adjunto</Text>
          ) : (
            signed.map((att) => (
              <View key={att.id} style={styles.listItem}>
                <View style={styles.itemLeft}>
                  <Text>{att.file_name || "Sumital firmado"}</Text>
                  <Text style={styles.meta}>
                    Fecha: {att.uploaded_at ? String(att.uploaded_at) : "—"} · Tamaño: {humanFileSize(att.file_size)}
                  </Text>
                </View>
                <View style={styles.itemRight}>
                  <Link style={styles.link} src={buildOpenUrl(att.id)}>
                    Abrir
                  </Link>
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Documentos Externos Vinculados</Text>
        <View style={styles.list}>
          {externalDocuments.length === 0 ? (
            <Text style={styles.meta}>No hay documentos externos vinculados</Text>
          ) : (
            externalDocuments.map((doc, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={styles.itemLeft}>
                  <Text>{doc.label || doc.url}</Text>
                </View>
                <View style={styles.itemRight}>
                  <Link style={styles.link} src={doc.url}>
                    Abrir
                  </Link>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Text>Generado por el sistema de informes de Sumitals</Text>
          <Text>Anexos · Página 1</Text>
        </View>
      </Page>
    </Document>
  );
};

export default SumitalPDFAnnexesDocument;