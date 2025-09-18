"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollAnimation } from "@/components/ScrollAnimation"
import { Phone, Mail, MapPin, Clock, Send, User, MessageSquare, Loader2 } from "lucide-react"
import { generateContactMessage, openWhatsApp } from "@/lib/whatsapp-utils"

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido"
    if (!formData.email.trim()) newErrors.email = "El email es requerido"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }
    if (!formData.subject.trim()) newErrors.subject = "El asunto es requerido"
    if (!formData.message.trim()) newErrors.message = "El mensaje es requerido"
    else if (formData.message.trim().length < 10) {
      newErrors.message = "El mensaje debe tener al menos 10 caracteres"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generar mensaje para WhatsApp
      const whatsappMessage = generateContactMessage(formData)
      
      // Abrir WhatsApp con el mensaje
      openWhatsApp(whatsappMessage)
      
      // Limpiar formulario
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
      setErrors({})
      
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" })
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 to-blue-800 text-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">Contáctanos</h1>
            <p className="text-sm sm:text-base lg:text-xl text-blue-100 max-w-3xl mx-auto text-center sm:text-justify">
              Estamos aquí para ayudarte a hacer realidad tu proyecto. Ponte en contacto con nosotros y descubre cómo
              podemos trabajar juntos.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {/* Contact Form */}
            <div className="order-2 lg:order-1">
              <ScrollAnimation delay={100}>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  Envíanos un Mensaje
                </h2>
              </ScrollAnimation>
              <ScrollAnimation delay={200}>
                <Card>
                  <CardContent className="p-4 sm:p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-foreground">
                          Nombre Completo *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Tu nombre completo"
                            className={`pl-10 h-12 text-base mobile-padding focus:ring-2 focus:ring-primary/20 ${
                              errors.name ? "border-red-500 focus:border-red-500" : ""
                            }`}
                            autoComplete="name"
                          />
                        </div>
                        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-foreground">
                          Correo Electrónico *
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="tu@email.com"
                            className={`pl-10 h-12 text-base mobile-padding focus:ring-2 focus:ring-primary/20 ${
                              errors.email ? "border-red-500 focus:border-red-500" : ""
                            }`}
                            autoComplete="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                          />
                        </div>
                        {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                          Teléfono (Opcional)
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+51 999 888 777"
                            className="pl-10 h-12 text-base mobile-padding focus:ring-2 focus:ring-primary/20"
                            autoComplete="tel"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-medium text-foreground">
                          Asunto *
                        </Label>
                        <div className="relative">
                          <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="subject"
                            name="subject"
                            type="text"
                            required
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="Asunto de tu consulta"
                            className={`pl-10 h-12 text-base mobile-padding focus:ring-2 focus:ring-primary/20 ${
                              errors.subject ? "border-red-500 focus:border-red-500" : ""
                            }`}
                          />
                        </div>
                        {errors.subject && <p className="text-sm text-red-500 mt-1">{errors.subject}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium text-foreground">
                        Mensaje *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Cuéntanos sobre tu proyecto, consulta o cómo podemos ayudarte..."
                        rows={isMobile ? 4 : 5}
                        className={`text-base mobile-padding resize-none focus:ring-2 focus:ring-primary/20 ${
                          errors.message ? "border-red-500 focus:border-red-500" : ""
                        }`}
                        maxLength={500}
                      />
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{formData.message.length}/500 caracteres</span>
                        {errors.message && <span className="text-red-500">{errors.message}</span>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-4">
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        size="lg" 
                        className="w-full h-12 sm:h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Enviar Mensaje por WhatsApp
                          </>
                        )}
                      </Button>
                      
                      {Object.keys(errors).length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                          <p className="text-sm text-red-600 font-medium">
                            Por favor, corrige los errores antes de enviar
                          </p>
                        </div>
                      )}
                      
                      <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
                        <p>
                          Al enviar este formulario, serás redirigido a WhatsApp para completar tu mensaje.
                          Te responderemos en el menor tiempo posible.
                        </p>
                      </div>
                    </div>
                  </form>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            </div>

            {/* Contact Info */}
            <div className="order-1 lg:order-2">
              <ScrollAnimation delay={100}>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Contact Information</h2>
              </ScrollAnimation>

              <div className="space-y-4 sm:space-y-6">
                <ScrollAnimation delay={200}>
                  <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-3 sm:p-6">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                      <div>
                        <CardTitle className="text-gray-900 text-sm sm:text-base lg:text-lg">Phone</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Call us directly</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <p className="text-gray-700 font-medium text-sm sm:text-base">(506) 8846-0570</p>
                    <p className="text-gray-600 text-xs sm:text-sm">Monday to Friday: 8:00 AM - 6:00 PM</p>
                  </CardContent>
                  </Card>
                </ScrollAnimation>

                <ScrollAnimation delay={300}>
                  <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-3 sm:p-6">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                      <div>
                        <CardTitle className="text-gray-900 text-sm sm:text-base lg:text-lg">Email</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Send us an email</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <p className="text-gray-700 font-medium text-sm sm:text-base break-all">fernando.apuy@qualitascr.com</p>
                  </CardContent>
                  </Card>
                </ScrollAnimation>

                <ScrollAnimation delay={400}>
                  <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-3 sm:p-6">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                      <div>
                        <CardTitle className="text-gray-900 text-sm sm:text-base lg:text-lg">Main Office</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Visit us</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <p className="text-gray-700 font-medium text-sm sm:text-base">Provincia Guanacaste</p>
                    <p className="text-gray-600 text-xs sm:text-sm">Monday to Friday: 8:00 AM - 5:00 PM</p>
                  </CardContent>
                  </Card>
                </ScrollAnimation>

                <ScrollAnimation delay={500}>
                  <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-3 sm:p-6">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
                      <div>
                        <CardTitle className="text-gray-900 text-sm sm:text-base lg:text-lg">Hours</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">We are available</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="space-y-1 text-xs sm:text-sm">
                      <p className="text-gray-700">
                        <span className="font-medium">Monday - Friday:</span> 8:00 AM - 6:00 PM
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Saturdays:</span> 9:00 AM - 2:00 PM
                      </p>
                      <p className="text-gray-700">
                        <span className="font-medium">Sundays:</span> Closed
                      </p>
                    </div>
                  </CardContent>
                  </Card>
                </ScrollAnimation>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section 
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Location</h2>
            <p className="text-gray-600">Find us easily in the heart of the city</p>
          </div>

          <div className="bg-gray-300 h-96 rounded-lg flex items-center justify-center">
            <p className="text-gray-600">Interactive map - Integrate with Google Maps</p>
          </div>
        </div>
      </section>
      */}
    </div>
  )
}
