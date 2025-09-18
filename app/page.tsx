import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Award, Clock, Phone, Mail, MapPin } from "lucide-react"
import Link from "next/link"
import ProjectCard from "@/components/ProjectCard"
import { projects } from "@/lib/projects-data"
import { services } from "@/lib/services-data"
import { AnimatedCounter } from "@/components/AnimatedCounter"
import { ScrollAnimation } from "@/components/ScrollAnimation"
import OptimizedImage from "@/components/OptimizedImage"

export const metadata = {
  title: "Summa Qualitas Architecture and Construction",
  description:
    "Summa Qualitas is a leading company in construction and renovation of residential and commercial projects in Costa Rica.",
  alternates: {
    canonical: "https://summaqualitas.com/ ",
  },
  openGraph: {
    type: "website",
    url: "https://summaqualitas.com/",
    title: "Summa Qualitas Construction Projects",
    description:
      "Summa Qualitas Architecture and Construction is a leading company in construction and renovation of residential and commercial projects in Costa Rica.",
    images: [
      {
        url: "https://summaqualitas.com/images/summa/logo_2b.png",
        width: 1200,
        height: 630,
        alt: "Summa Qualitas Architecture and Construction",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Summa Qualitas Construction Projects",
    description:
      "Summa Qualitas Architecture and Construction is a leading company in construction and renovation of residential and commercial projects in Costa Rica.",
    images: ["https://summaqualitas.com/images/summa/logo_2b.png"],
  },
};

export default function Home() {
  return (
    <div className="flex flex-col mt-8 mb-8">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-900 to-blue-800 text-white py-12 sm:py-16 lg:py-32 xl:py-40">
        <div className="container mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
            <div className="space-y-4 sm:space-y-6 xl:space-y-8 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl font-bold leading-tight">
                Construction Company based in <span className="text-blue-300"> Guanacaste</span>, Costa Rica
              </h1>
              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-blue-100 leading-relaxed text-justify max-w-2xl lg:max-w-none">
                Over 20 years of experience in construction and development of high-quality residential and commercial projects.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 xl:gap-6 justify-center lg:justify-start pt-4">
                <Link href="/proyectos" className="w-full sm:w-auto">
                  <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 w-full sm:w-auto py-3 px-6 xl:py-4 xl:px-8 xl:text-lg">
                    View Projects
                  </Button>
                </Link>
                <Link href="/contacto" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-blue-900 bg-transparent w-full sm:w-auto py-3 px-6 xl:py-4 xl:px-8 xl:text-lg"
                  >
                    Contact
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative order-first lg:order-last">
              <div className="relative rounded-2xl">
                <OptimizedImage
                  src="/images/image1.webp"
                  alt="Construction project"
                  width={450}
                  height={450}
                  className="rounded-2xl shadow-2xl w-full h-auto max-w-md mx-auto lg:max-w-none xl:max-w-2xl"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 450px, 600px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-muted/50 w-full">
        <div className="container mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24 max-w-7xl">
          <ScrollAnimation delay={100}>
            <div className="text-center mb-8 sm:mb-12 lg:mb-16 xl:mb-20">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-3 sm:mb-4 xl:mb-6">Our Services</h2>
              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-muted-foreground max-w-3xl xl:max-w-4xl mx-auto text-justify px-4">
                We offer comprehensive construction solutions with the highest quality standards
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 xl:gap-8 w-full">
            {services.map((service, index) => (
              <ScrollAnimation key={index} delay={200 + index * 100}>
                <Card className="flex flex-col p-6 hover:shadow-lg transition-shadow h-full">
                  <CardHeader className="p-0 mb-4">
                    <service.icon className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-foreground">{service.title}</CardTitle>
                    <CardDescription className="text-muted-foreground text-justify">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="container mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24 max-w-7xl">
          <ScrollAnimation delay={100}>
            <div className="text-center mb-8 sm:mb-12 lg:mb-16 xl:mb-20">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-3 sm:mb-4 xl:mb-6">Our Projects</h2>
              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-muted-foreground max-w-3xl xl:max-w-4xl mx-auto text-center px-4">
                Discover some of our most outstanding projects
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 xl:gap-10">
            {projects.map((project, index) => (
              <ScrollAnimation key={project.id} delay={200 + index * 100}>
                <ProjectCard project={project} />
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-r from-gray-900 to-blue-800 text-white">
        <div className="container mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24 max-w-7xl">
          <ScrollAnimation delay={100}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 xl:gap-16 text-center">
              <div className="py-4 xl:py-8">
                <AnimatedCounter 
                  end={500} 
                  suffix="+" 
                  className="text-3xl sm:text-4xl lg:text-5xl xl:text-7xl font-bold text-blue-300 mb-2 xl:mb-4" 
                />
                <div className="text-base sm:text-lg xl:text-xl text-blue-100">Completed Projects</div>
              </div>
              <div className="py-4 xl:py-8">
                <AnimatedCounter 
                  end={20} 
                  suffix="+" 
                  className="text-3xl sm:text-4xl lg:text-5xl xl:text-7xl font-bold text-blue-300 mb-2 xl:mb-4" 
                />
                <div className="text-base sm:text-lg xl:text-xl text-blue-100">Years of Experience</div>
              </div>
              <div className="py-4 xl:py-8">
                <AnimatedCounter 
                  end={100} 
                  suffix="+" 
                  className="text-3xl sm:text-4xl lg:text-5xl xl:text-7xl font-bold text-blue-300 mb-2 xl:mb-4" 
                />
                <div className="text-base sm:text-lg xl:text-xl text-blue-100">Satisfied Clients</div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24 max-w-7xl">
          <ScrollAnimation delay={100}>
            <div className="text-center mb-8 sm:mb-12 lg:mb-16 xl:mb-20">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground mb-3 sm:mb-4 xl:mb-6 mt-6">Contact Us</h2>
              <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-muted-foreground max-w-3xl xl:max-w-4xl mx-auto text-center px-4">
                We are ready to make your next project a reality
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 xl:gap-12 max-w-5xl mx-auto">
            {[
              {
                icon: Phone,
                title: "Phone",
                info: "+506 8846 0570",
                link: "tel:+50688460570",
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
              <ScrollAnimation key={index} delay={200 + index * 150}>
                <Card className="text-center hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <contact.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                    <CardTitle className="text-foreground">{contact.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href={contact.link} className="text-muted-foreground hover:text-primary transition-colors">
                      {contact.info}
                    </Link>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
