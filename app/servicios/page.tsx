import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollAnimation } from "@/components/ScrollAnimation"
import { Building2, Users, Wrench, Home, Building, Hammer } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { services } from "@/lib/services-data"

export default function ServiciosPage() {
   

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 to-blue-800 text-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <ScrollAnimation delay={100}>
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">Our Services</h1>
              <p className="text-base sm:text-lg lg:text-xl text-blue-100 max-w-3xl mx-auto text-justify px-4">
                We offer comprehensive construction solutions with over 20 years of experience and the highest
                quality standards
              </p>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {services.map((service, index) => (
              <ScrollAnimation key={index} delay={200 + index * 100}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="relative h-48 sm:h-56 md:h-auto">
                      <Image
                        src={service.image || "/placeholder.svg"}
                        alt={service.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4 sm:p-6">
                      <CardHeader className="p-0 mb-3 sm:mb-4">
                        <service.icon className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mb-3 sm:mb-4" />
                        <CardTitle className="text-gray-900 text-lg sm:text-xl">{service.title}</CardTitle>
                        <CardDescription className="text-gray-600 text-justify text-sm sm:text-base">{service.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ul className="space-y-2">
                          {service.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start text-xs sm:text-sm text-gray-600">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <ScrollAnimation delay={100}>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Ready to start your project?</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto text-justify px-4">
              Contact us today for a free consultation and discover how we can make your vision a reality
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto sm:max-w-none">
              <Link href="/cotizacion" className="w-full sm:w-auto">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto py-3 px-6">
                  Request Quote
                </Button>
              </Link>
              <Link href="/contacto" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto py-3 px-6">
                  Contact
                </Button>
              </Link>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </div>
  )
}
