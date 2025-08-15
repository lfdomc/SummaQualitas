import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, MapPin, Ruler, User, Clock, CheckCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { projects } from "@/lib/projects-data"
import { notFound } from "next/navigation"

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const project = projects.find((p) => p.id === params.id)

  if (!project) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-6">
        <Link href="/proyectos">
          <Button variant="outline" className="mb-6 bg-transparent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 mb-4">
                {project.category}
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">{project.title}</h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">{project.description}</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">{project.location}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Ruler className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">{project.area}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">{project.year}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">{project.client}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">{project.duration}</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <Image
                src={project.image || "/placeholder.svg"}
                alt={project.title}
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Project Gallery</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {project.gallery.map((image, index) => (
              <div key={index} className="relative h-64 group overflow-hidden rounded-lg">
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${project.title} - Image ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Details */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Project Info */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Project Details</h2>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    Main Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {project.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-700">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="prose max-w-none">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Complete Description</h3>
                <p className="text-gray-700 leading-relaxed mb-6 text-justify">
                  {project.description} This project represents one of our most significant achievements, combining
                  architectural innovation with practical functionality. Every detail was carefully planned and
                  executed to exceed client expectations.
                </p>

                <p className="text-gray-700 leading-relaxed text-justify">
                  The development of this project involved a multidisciplinary team of architects, engineers and
                  construction specialists, working in close collaboration to deliver an exceptional result
                  within the established time and budget.
                </p>
              </div>
            </div>

            {/* Project Specs */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Specifications</CardTitle>
                  <CardDescription>Technical project information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Category:</span>
                    <Badge variant="secondary">{project.category}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Area:</span>
                    <span className="font-medium">{project.area}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{project.location}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Year:</span>
                    <span className="font-medium">{project.year}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium">{project.client}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{project.duration}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Interested in a similar project?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    We can help you develop a similar project adapted to your specific needs.
                  </p>
                  <div className="space-y-3">
                    <Link href="/cotizacion" className="block">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">Request Quote</Button>
                    </Link>
                    <Link href="/contacto" className="block">
                      <Button variant="outline" className="w-full bg-transparent">
                        Contact
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Related Projects */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Related Projects</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {projects
              .filter((p) => p.id !== project.id && p.category === project.category)
              .slice(0, 3)
              .map((relatedProject) => (
                <Link key={relatedProject.id} href={`/proyecto/${relatedProject.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="relative h-48">
                      <Image
                        src={relatedProject.image || "/placeholder.svg"}
                        alt={relatedProject.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-gray-900 hover:text-blue-600 transition-colors">
                        {relatedProject.title}
                      </CardTitle>
                      <CardDescription>{relatedProject.location}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  )
}
