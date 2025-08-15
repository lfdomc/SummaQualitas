import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Award, Clock, Phone, Mail, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import ProjectCard from "@/components/ProjectCard"
import { projects } from "@/lib/projects-data"
import { services } from "@/lib/services-data"

export const metadata = {
  title: "Summa Qualitas Architecture and Construction",
  description:
    "Summa Qualitas is a leading company in construction and renovation of residential and commercial projects in Costa Rica.",
  alternates: {
    canonical: "https://summaqualitas.com/ ",
  },
  openGraph: {
    url: "https://summaqualitas.com/ ",
  title: "Summa Qualitas Construction Projects",
    description:
      "Summa Qualitas Architecture and Construction is a leading company in construction and renovation of residential and commercial projects in Costa Rica.",
    images: [
      {
        url: "/images/summa/logo_2b.png",
        width: 1200,
        height: 630,
        alt: "Summa Qualitas Architecture and Construction",
      },
    ],
  },
};




export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-900 to-blue-800 text-white py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                
                Construction Company based in <span className="text-blue-300"> Guanacaste</span>, Costa Rica
                
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed ">
                Over 20 years of experience in construction and development of high-quality residential and commercial projects.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/proyectos" className="flex items-center space-x-2">
                <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
                  View Projects
                </Button>
                </Link>
                <Link href="/proyectos" className="flex items-center space-x-2">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-900 bg-transparent"
                >Contact</Button>
                </Link>
                

              </div>
            </div>
            <div className="relative">
              <Image
                src="/images/conste.webp?height=400&width=600&text=Construcción"
                alt="Construction project"
                width={450}
                height={450}
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto text-justify">
              We offer comprehensive construction solutions with the highest quality standards
            </p>
          </div>

          <section className="py-5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-10">
            {services.map((service, index) => (
              <Card key={index} className="flex flex-col p-6 hover:shadow-lg transition-shadow">
                <CardHeader className="p-0 mb-4">
                  <service.icon className="h-12 w-12 text-blue-600 mb-4" />
                  <CardTitle className="text-gray-900">{service.title}</CardTitle>
                  <CardDescription className="text-gray- text-justify">{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Our Projects</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover some of our most outstanding projects
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { number: "500+", label: "Completed Projects" },
              { number: "20+", label: "Years of Experience" },
              { number: "100+", label: "Satisfied Clients" },
              
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl lg:text-5xl font-bold text-blue-300 mb-2">{stat.number}</div>
                <div className="text-lg text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We are ready to make your next project a reality
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                icon: Phone,
                title: "Phone",
                info: "+506 8846 0570",
                link: "tel:+5068846 0570 ",
              },
              {
                icon: Mail,
                title: "Email",
                info: "proyectos@qualitascr.com",
                link: "mailto:proyectos@qualitascr.com",
              },
              {
                icon: MapPin,
                title: "Address",
                info: "Tamarindo, Guanacaste, Costa Rica",
                link: "#",
              },
            ].map((contact, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <contact.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle className="text-gray-900">{contact.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={contact.link} className="text-gray-600 hover:text-blue-600 transition-colors">
                    {contact.info}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
