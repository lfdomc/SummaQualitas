"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollAnimation } from "@/components/ScrollAnimation"
import { Calculator, FileText, Clock, CheckCircle } from "lucide-react"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Generar mensaje para WhatsApp
    const whatsappMessage = generateQuoteMessage(formData)
    
    // Abrir WhatsApp con el mensaje
    openWhatsApp(whatsappMessage)
    
    // Mostrar mensaje de confirmación
    alert("Te redirigiremos a WhatsApp para enviar tu solicitud de cotización.")
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
        <div className="container mx-auto px-4">
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
        <div className="container mx-auto px-4">
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

      {/* Quote Form */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
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
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Full Name *</label>
                        <Input
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your full name"
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Email *</label>
                        <Input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="tu@email.com"
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Phone *</label>
                        <Input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1 (555) 123-4567"
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Project Location *</label>
                        <Input
                          required
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="City, State"
                          className="text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Project Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Project Type *</label>
                        <Select onValueChange={(value) => setFormData({ ...formData, projectType: value })}>
                          <SelectTrigger className="text-sm sm:text-base">
                            <SelectValue placeholder="Select project type" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectTypes.map((type) => (
                              <SelectItem key={type} value={type} className="text-sm sm:text-base">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Approximate Area (m²) *</label>
                        <Input
                          required
                          value={formData.area}
                          onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                          placeholder="ej. 150"
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Estimated Budget</label>
                        <Select onValueChange={(value) => setFormData({ ...formData, budget: value })}>
                          <SelectTrigger className="text-sm sm:text-base">
                            <SelectValue placeholder="Select your budget range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50k-100k" className="text-sm sm:text-base">$50,000 - $100,000</SelectItem>
                            <SelectItem value="100k-250k" className="text-sm sm:text-base">$100,000 - $250,000</SelectItem>
                            <SelectItem value="250k-500k" className="text-sm sm:text-base">$250,000 - $500,000</SelectItem>
                            <SelectItem value="500k-1m" className="text-sm sm:text-base">$500,000 - $1,000,000</SelectItem>
                            <SelectItem value="1m+" className="text-sm sm:text-base">More than $1,000,000</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Estimated Timeline</label>
                        <Select onValueChange={(value) => setFormData({ ...formData, timeline: value })}>
                          <SelectTrigger className="text-sm sm:text-base">
                            <SelectValue placeholder="When do you want to start?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inmediato" className="text-sm sm:text-base">Immediately</SelectItem>
                            <SelectItem value="1-3-meses" className="text-sm sm:text-base">In 1-3 months</SelectItem>
                            <SelectItem value="3-6-meses" className="text-sm sm:text-base">In 3-6 months</SelectItem>
                            <SelectItem value="6-12-meses" className="text-sm sm:text-base">In 6-12 months</SelectItem>
                            <SelectItem value="mas-12-meses" className="text-sm sm:text-base">More than 12 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Required Services</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {services.map((service) => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            id={service}
                            onCheckedChange={(checked) => handleServiceChange(service, checked as boolean)}
                            className="flex-shrink-0"
                          />
                          <label htmlFor={service} className="text-xs sm:text-sm text-gray-700 cursor-pointer">
                            {service}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Project Description *</label>
                    <Textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your project in detail: objectives, special features, specific requirements, etc."
                      rows={5}
                      className="text-sm sm:text-base resize-none"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-sm sm:text-base">
                    <Calculator className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Request Free Quote
                  </Button>
                </form>
              </CardContent>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
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
