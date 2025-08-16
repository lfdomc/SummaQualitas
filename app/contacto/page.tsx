"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollAnimation } from "@/components/ScrollAnimation"
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react"
import { generateContactMessage, openWhatsApp } from "@/lib/whatsapp-utils"

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Generar mensaje para WhatsApp
    const whatsappMessage = generateContactMessage(formData)
    
    // Abrir WhatsApp con el mensaje
    openWhatsApp(whatsappMessage)
    
    // Limpiar formulario
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
    
    // Mostrar mensaje de confirmación
    alert("Te redirigiremos a WhatsApp para enviar tu mensaje.")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 to-blue-800 text-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">Contact Us</h1>
            <p className="text-sm sm:text-base lg:text-xl text-blue-100 max-w-3xl mx-auto text-justify">
              We are here to help you make your project a reality. Get in touch with us and discover how
              we can work together.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {/* Contact Form */}
            <div className="order-2 lg:order-1">
              <ScrollAnimation delay={100}>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Send Us a Message</h2>
              </ScrollAnimation>
              <ScrollAnimation delay={200}>
                <Card>
                  <CardContent className="p-4 sm:p-6">
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Full Name *
                        </label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Email *
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          className="text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Phone
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1 (555) 123-4567"
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label htmlFor="subject" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Subject *
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="Subject of your inquiry"
                          className="text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your project..."
                        rows={5}
                        className="text-sm sm:text-base resize-none"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-sm sm:text-base">
                      <Send className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Send Message
                    </Button>
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
