// Utilidades para generar mensajes de WhatsApp

export const WHATSAPP_PHONE = "+50688460570"

// Función para generar mensaje de contacto
export function generateContactMessage(data: {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}) {
  const message = `NUEVO MENSAJE DE CONTACTO

` +
    `Nombre: ${data.name}
` +
    `Email: ${data.email}
` +
    `Telefono: ${data.phone || 'No proporcionado'}
` +
    `Asunto: ${data.subject}

` +
    `Mensaje:
${data.message}`

  return message
}

// Función para generar mensaje de cotización
export function generateQuoteMessage(data: {
  name: string
  email: string
  phone: string
  projectType: string
  area: string
  location: string
  budget: string
  timeline: string
  description: string
  services: string[]
}) {
  const message = `NUEVA SOLICITUD DE COTIZACION

` +
    `Datos del Cliente:
` +
    `- Nombre: ${data.name}
` +
    `- Email: ${data.email}
` +
    `- Telefono: ${data.phone}
` +
    `- Ubicacion: ${data.location}

` +
    `Detalles del Proyecto:
` +
    `- Tipo: ${data.projectType}
` +
    `- Area: ${data.area} m2
` +
    `- Presupuesto: ${data.budget || 'No especificado'}
` +
    `- Cronograma: ${data.timeline || 'No especificado'}

` +
    `Servicios Requeridos:
${data.services.length > 0 ? data.services.map(service => `- ${service}`).join('\n') : '- No especificados'}

` +
    `Descripcion del Proyecto:
${data.description}`

  return message
}

// Función para generar URL de WhatsApp
export function generateWhatsAppUrl(message: string, phone: string = WHATSAPP_PHONE) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

// Función para abrir WhatsApp
export function openWhatsApp(message: string, phone: string = WHATSAPP_PHONE) {
  const url = generateWhatsAppUrl(message, phone)
  window.open(url, '_blank', 'noopener,noreferrer')
}