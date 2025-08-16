import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ProjectCard from "@/components/ProjectCard"
import { projects } from "@/lib/projects-data"
import Link from "next/link"

export default function ProyectosPage() {
  const categories = ["All", "Residential", "Commercial", "Corporate", "Health", "Educational"]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">Our Projects</h1>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 max-w-3xl mx-auto px-4">
              Discover our extensive experience through the projects we have successfully developed
            </p>
          </div>
        </div>
      </section>

      

      {/* Projects Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Featured Projects</h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
              Each project represents our commitment to excellence and innovation in construction
            </p>
          </div>

          {/* Category Filter 
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="px-4 py-2 cursor-pointer hover:bg-blue-100 hover:text-blue-800 transition-colors"
              >
                {category}
              </Badge>
            ))}
          </div>*/}

          {/* Projects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Do you have a project in mind?</h2>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Let us be part of your next project and create something extraordinary together
          </p>
          <Link href="/cotizacion" className="inline-block">
          <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 py-3 px-6">
            Start Project
          </Button>
          </Link>
          
          
        </div>
        
      </section>
      
    </div>
  )
}
