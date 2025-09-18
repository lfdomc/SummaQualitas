"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollAnimation } from "@/components/ScrollAnimation"
import { Calculator, FileText, Clock, CheckCircle, User, Mail, Phone, MapPin, Building, DollarSign, Calendar, Send, Loader2 } from "lucide-react"
import { generateQuoteMessage, openWhatsApp } from "@/lib/whatsapp-utils"

export default function CotizacionPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    projectType: "",
    area: "",
    location: "",
    budget: "",
    timeline: "",
    description: "",
    services: [] as string[],
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

  const projectTypes = [
    "Residential Construction",
    "Commercial Construction",
    "Industrial Construction",
    "Remodeling",
    "Maintenance",
    "Consulting",
  ]

  const services = [
    "Architectural Design",
    "Complete Construction",
    "Construction Supervision",
    "Permit Management",
    "Specialized Finishes",
    "Landscaping",
    "Special Installations",
  ]

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido"
    if (!formData.email.trim()) newErrors.email = "El email es requerido"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }
    if (!formData.phone.trim()) newErrors.phone = "El teléfono es requerido"
    if (!formData.location.trim()) newErrors.location = "La ubicación es requerida"
    if (!formData.projectType) newErrors.projectType = "El tipo de proyecto es requerido"
    if (!formData.budget) newErrors.budget = "El presupuesto es requerido"
    if (!formData.timeline) newErrors.timeline = "El cronograma es requerido"
    if (!formData.description.trim()) newErrors.description = "La descripción es requerida"
    
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
      
      const message = generateQuoteMessage(formData)
      openWhatsApp(message)
      
      // Reset form after successful submission
      setFormData({
        name: "",
        email: "",
        phone: "",
        projectType: "",
        area: "",
        location: "",
        budget: "",
        timeline: "",
        description: "",
        services: [],
      })
      setErrors({})
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleServiceChange = (service: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        services: [...formData.services, service],
      })
    } else {
      setFormData({
        ...formData,
        services: formData.services.filter((s) => s !== service),
      })
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 to-blue-800 text-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24">
          <div className="text-center">
            <Calculator className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-blue-300 mx-auto mb-4 sm:mb-6" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">Request Quote</h1>
            <p className="text-sm sm:text-base lg:text-xl text-blue-100 max-w-3xl mx-auto text-justify">
              Get a personalized quote for your project. Our team of experts will provide you with a
              detailed and professional estimate.
            </p>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24">
          <ScrollAnimation delay={100}>
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Our Quote Process
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Simple and transparent steps to get your personalized construction quote
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {[
              {
                icon: FileText,
                step: "01",
                title: "Complete the Form",
                description: "Provide detailed information about your construction project, including location, type, and specific requirements."
              },
              {
                icon: Clock,
                step: "02",
                title: "Technical Analysis",
                description: "Our expert team analyzes your project requirements and conducts a preliminary technical evaluation."
              },
              {
                icon: Calculator,
                step: "03",
                title: "Detailed Quote",
                description: "Receive a comprehensive proposal with itemized costs, timeline, and project specifications."
              },
              {
                icon: CheckCircle,
                step: "04",
                title: "Follow-up Meeting",
                description: "Schedule a consultation to discuss the quote details and answer any questions you may have."
              }
            ].map((item, index) => (
              <ScrollAnimation key={index} delay={200 + index * 100}>
                <div className="relative">
                  {/* Connection Line */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-blue-300 z-0" />
                  )}
                  
                  {/* Card */}
                  <div className="relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center group hover:-translate-y-2">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                        {item.step}
                      </div>
                    </div>
                    
                    {/* Icon */}
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 mt-2 group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </ScrollAnimation>
            ))}
          </div>

       

      {/* Quote Form */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24">
          <div className="max-w-4xl mx-auto">
            <ScrollAnimation delay={200}>
              <Card>
              <CardHeader className="text-center p-4 sm:p-6">
                <CardTitle className="text-xl sm:text-2xl text-gray-900">Project Information</CardTitle>
                <CardDescription className="text-justify text-sm sm:text-base">
                  Complete all fields to receive an accurate and detailed quote
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Información Personal
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-foreground">
                          Nombre Completo *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => {
                              setFormData({ ...formData, name: e.target.value })
                              if (errors.name) setErrors({ ...errors, name: "" })
                            }}
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
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => {
                              setFormData({ ...formData, email: e.target.value })
                              if (errors.email) setErrors({ ...errors, email: "" })
                            }}
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
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                          Teléfono *
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => {
                              setFormData({ ...formData, phone: e.target.value })
                              if (errors.phone) setErrors({ ...errors, phone: "" })
                            }}
                            placeholder="+51 999 888 777"
                            className={`pl-10 h-12 text-base mobile-padding focus:ring-2 focus:ring-primary/20 ${
                              errors.phone ? "border-red-500 focus:border-red-500" : ""
                            }`}
                            autoComplete="tel"
                          />
                        </div>
                        {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-sm font-medium text-foreground">
                          Ubicación del Proyecto *
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="location"
                            required
                            value={formData.location}
                            onChange={(e) => {
                              setFormData({ ...formData, location: e.target.value })
                              if (errors.location) setErrors({ ...errors, location: "" })
                            }}
                            placeholder="Ciudad, Distrito"
                            className={`pl-10 h-12 text-base mobile-padding focus:ring-2 focus:ring-primary/20 ${
                              errors.location ? "border-red-500 focus:border-red-500" : ""
                            }`}
                            autoComplete="address-level2"
                          />
                        </div>
                        {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      Detalles del Proyecto
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="projectType" className="text-sm font-medium text-foreground">
                          Tipo de Proyecto *
                        </Label>
                        <Select 
                          value={formData.projectType}
                          onValueChange={(value) => {
                            setFormData({ ...formData, projectType: value })
                            if (errors.projectType) setErrors({ ...errors, projectType: "" })
                          }}
                        >
                          <SelectTrigger className={`h-12 text-base mobile-padding focus:ring-2 focus:ring-primary/20 ${
                            errors.projectType ? "border-red-500 focus:border-red-500" : ""
                          }`}>
                            <SelectValue placeholder="Selecciona el tipo de proyecto" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectTypes.map((type) => (
                              <SelectItem key={type} value={type} className="text-base">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.projectType && <p className="text-sm text-red-500 mt-1">{errors.projectType}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area" className="text-sm font-medium text-foreground">
                          Área Aproximada (m²) *
                        </Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="area"
                            required
                            value={formData.area}
                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                            placeholder="ej. 150"
                            className="pl-10 h-12 text-base mobile-padding focus:ring-2 focus:ring-primary/20"
                            type="number"
                            min="1"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="budget" className="text-sm font-medium text-foreground">
                          Rango de Presupuesto *
                        </Label>
                        <Select 
                          value={formData.budget}
                          onValueChange={(value) => {
                            setFormData({ ...formData, budget: value })
                            if (errors.budget) setErrors({ ...errors, budget: "" })
                          }}
                        >
                          <SelectTrigger className={`h-12 text-base mobile-padding focus:ring-2 focus:ring-primary/20 ${
                            errors.budget ? "border-red-500 focus:border-red-500" : ""
                          }`}>
                            <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Selecciona el rango de presupuesto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50k-100k" className="text-base">$50,000 - $100,000</SelectItem>
                            <SelectItem value="100k-250k" className="text-base">$100,000 - $250,000</SelectItem>
                            <SelectItem value="250k-500k" className="text-base">$250,000 - $500,000</SelectItem>
                            <SelectItem value="500k-1m" className="text-base">$500,000 - $1,000,000</SelectItem>
                            <SelectItem value="1m+" className="text-base">Más de $1,000,000</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.budget && <p className="text-sm text-red-500 mt-1">{errors.budget}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="timeline" className="text-sm font-medium text-foreground">
                          Cronograma *
                        </Label>
                        <Select 
                          value={formData.timeline}
                          onValueChange={(value) => {
                            setFormData({ ...formData, timeline: value })
                            if (errors.timeline) setErrors({ ...errors, timeline: "" })
                          }}
                        >
                          <SelectTrigger className={`h-12 text-base mobile-padding focus:ring-2 focus:ring-primary/20 ${
                            errors.timeline ? "border-red-500 focus:border-red-500" : ""
                          }`}>
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="¿Cuándo quieres empezar?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inmediato" className="text-base">Inmediatamente</SelectItem>
                            <SelectItem value="1-3-meses" className="text-base">En 1-3 meses</SelectItem>
                            <SelectItem value="3-6-meses" className="text-base">En 3-6 meses</SelectItem>
                            <SelectItem value="6-12-meses" className="text-base">En 6-12 meses</SelectItem>
                            <SelectItem value="mas-12-meses" className="text-base">Más de 12 meses</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.timeline && <p className="text-sm text-red-500 mt-1">{errors.timeline}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="space-y-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      Servicios Adicionales
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecciona los servicios adicionales que necesitas (opcional)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {services.map((service) => (
                        <div key={service} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                          <Checkbox
                            id={service}
                            checked={formData.services.includes(service)}
                            onCheckedChange={(checked) => handleServiceChange(service, checked as boolean)}
                            className="min-h-touch min-w-touch"
                          />
                          <label 
                            htmlFor={service} 
                            className="text-sm font-medium text-foreground cursor-pointer flex-1 leading-relaxed"
                          >
                            {service}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-foreground">
                      Descripción del Proyecto *
                    </Label>
                    <Textarea
                      id="description"
                      required
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value })
                        if (errors.description) setErrors({ ...errors, description: "" })
                      }}
                      placeholder="Describe tu proyecto en detalle: objetivos, características especiales, requerimientos específicos, materiales preferidos, etc."
                      rows={isMobile ? 4 : 5}
                      className={`text-base mobile-padding resize-none focus:ring-2 focus:ring-primary/20 ${
                        errors.description ? "border-red-500 focus:border-red-500" : ""
                      }`}
                      maxLength={1000}
                    />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{formData.description.length}/1000 caracteres</span>
                      {errors.description && <span className="text-red-500">{errors.description}</span>}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="lg"
                      className="w-full sm:flex-1 h-12 sm:h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Solicitar Cotización por WhatsApp
                        </>
                      )}
                    </Button>
                    
                    {Object.keys(errors).length > 0 && (
                      <div className="w-full sm:w-auto">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                          <p className="text-sm text-red-600 font-medium">
                            Por favor, corrige los errores antes de enviar
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
                    <p>
                      Al enviar este formulario, serás redirigido a WhatsApp para completar tu solicitud de cotización.
                      Nuestro equipo te responderá en el menor tiempo posible.
                    </p>
                  </div>
                </form>
              </CardContent>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </section>

   {/* Call to Action */}
          <ScrollAnimation delay={600}>
            <div className="text-center mt-12 lg:mt-16">
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Ready to Start Your Project?
                </h3>
                <p className="text-gray-600 mb-6">
                  Get your free, detailed quote today and take the first step towards your dream construction project.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3">
                    Start Quote Process
                  </Button>
                  <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3">
                    View Sample Quote
                  </Button>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24">
          <ScrollAnimation delay={100}>
            <div className="text-center mb-8 sm:mb-10 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Why choose our quote?</h2>
            </div>
          </ScrollAnimation>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <ScrollAnimation delay={200}>
              <Card className="text-center">
                <CardHeader className="p-4 sm:p-6">
                  <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 mx-auto mb-3 sm:mb-4" />
                  <CardTitle className="text-base sm:text-lg">Free and No Commitment</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-gray-600 text-justify text-sm sm:text-base">
                    Receive a detailed quote completely free, with no commitment on your part.
                  </p>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation delay={300}>
              <Card className="text-center">
                <CardHeader className="p-4 sm:p-6">
                  <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mx-auto mb-3 sm:mb-4" />
                  <CardTitle className="text-base sm:text-lg">Response in 24 Hours</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-gray-600 text-justify text-sm sm:text-base">
                    Our team will contact you in less than 24 hours with an initial proposal.
                  </p>
                </CardContent>
              </Card>
            </ScrollAnimation>

            <ScrollAnimation delay={400}>
              <Card className="text-center">
                <CardHeader className="p-4 sm:p-6">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-purple-600 mx-auto mb-3 sm:mb-4" />
                  <CardTitle className="text-base sm:text-lg">Detailed Quote</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-gray-600 text-justify text-sm sm:text-base">
                    Receive a complete breakdown of costs, materials and work schedule.
                  </p>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </section>
    </div>
  )
}
