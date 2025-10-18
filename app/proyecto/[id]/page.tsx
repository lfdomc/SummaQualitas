import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, MapPin, Ruler, User, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { projects } from "@/lib/projects-data"
import { ProjectService } from "@/lib/supabase/database"
import { notFound } from "next/navigation"
import OptimizedImage from "@/components/OptimizedImage"
export const revalidate = 0; // asegura datos frescos en cada request
export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = params

  // Intentar obtener el proyecto desde la BD (Supabase)
  const projectService = new ProjectService(true);
  const dbProject = await projectService.getProjectById(id).catch(() => null);

  // Fallback: usar dataset estático si no existe en BD
  const staticProject = projects.find((p) => p.id === id) || null;

  if (!dbProject && !staticProject) {
    notFound()
  }

  // Preparar valores a mostrar combinando BD y estáticos
  const title = dbProject?.name ?? staticProject?.title ?? 'Proyecto';
  const location = dbProject?.location ?? staticProject?.location ?? 'Ubicación no definida';
  const clientName = (() => {
    const c = dbProject?.client as unknown;
    if (typeof c === 'string') return c;
    return (c as any)?.name ?? staticProject?.client ?? 'Cliente no definido';
  })();
  const statusLabel = (() => {
    const s = dbProject?.status;
    if (!s) return staticProject?.category ?? 'Proyecto';
    switch (s) {
      case 'planificacion': return 'Planificación';
      case 'en_progreso': return 'En Progreso';
      case 'pausado': return 'Pausado';
      case 'completado': return 'Completado';
      case 'cancelado': return 'Cancelado';
      default: return s;
    }
  })();
  const areaDisplay = dbProject?.total_area != null && !Number.isNaN(dbProject.total_area)
    ? `${Number(dbProject.total_area).toLocaleString()} m²`
    : staticProject?.area ?? 'Área no definida';
  const year = (() => {
    const d = dbProject?.estimated_start_date || dbProject?.actual_start_date || dbProject?.created_at;
    if (d) {
      const y = new Date(d).getFullYear();
      return Number.isFinite(y) ? String(y) : staticProject?.year ?? '';
    }
    return staticProject?.year ?? '';
  })();
  const duration = staticProject?.duration ?? '';
  const image = staticProject?.image || "/placeholder.svg";
  const gallery = staticProject?.gallery || [];

  // Asegurar un objeto "project" mínimo para las secciones que requieren campos del dataset estático.
  // Cuando no existe staticProject, usamos valores calculados y defaults seguros.
  const project: {
    features: string[];
    description: string;
    category: string;
    location: string;
    year: string;
    client: string;
    duration: string;
  } = {
    features: staticProject?.features ?? [],
    description: staticProject?.description ?? '',
    category: staticProject?.category ?? statusLabel,
    location,
    year,
    client: clientName,
    duration,
  };

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <Link href="/proyectos">
          <Button variant="outline" className="mb-4 sm:mb-6 bg-transparent text-sm sm:text-base">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 mb-3 sm:mb-4 text-xs sm:text-sm">
                {statusLabel}
              </Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">{title}</h1>
              <p className="text-sm sm:text-base lg:text-xl text-gray-600 leading-relaxed mb-6 sm:mb-8 text-justify">{staticProject?.description || ''}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">{location}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Ruler className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">{areaDisplay}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">{year}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">{clientName}</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 sm:col-span-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">{project.duration}</span>
                </div>
              </div>
            </div>

            <div className="relative order-1 lg:order-2">
              <div className="relative bg-gray-200 animate-pulse rounded-2xl">
                <OptimizedImage
                  src={image}
                  alt={title}
                  width={600}
                  height={400}
                  className="rounded-2xl shadow-xl w-full h-auto"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 600px"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-10 lg:mb-12 text-center">Project Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {gallery.map((image, index) => (
              <div key={index} className="relative h-48 sm:h-56 lg:h-64 group overflow-hidden rounded-xl bg-gray-200 animate-pulse">
                <OptimizedImage
                  src={image || "/placeholder.svg"}
                  alt={`${title} - Image ${index + 1}`}
                  fill
                  className="object-cover transition-all duration-300 group-hover:scale-110 rounded-xl"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Details */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {/* Project Info */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Project Details</h2>

              <Card className="mb-6 sm:mb-8">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center text-lg sm:text-xl">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2 sm:mr-3" />
                    Main Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {project.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-gray-700 text-sm sm:text-base">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="prose max-w-none">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Complete Description</h3>
                <p className="text-gray-700 leading-relaxed mb-4 sm:mb-6 text-justify text-sm sm:text-base">
                  {project.description} This project represents one of our most significant achievements, combining
                  architectural innovation with practical functionality. Every detail was carefully planned and
                  executed to exceed client expectations.
                </p>

                <p className="text-gray-700 leading-relaxed text-justify text-sm sm:text-base">
                  The development of this project involved a multidisciplinary team of architects, engineers and
                  construction specialists, working in close collaboration to deliver an exceptional result
                  within the established time and budget.
                </p>
              </div>
            </div>

            {/* Project Specs */}
            <div>
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Specifications</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Technical project information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm sm:text-base">Category:</span>
                    <Badge variant="secondary" className="text-xs sm:text-sm">{project.category}</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm sm:text-base">Area total:</span>
                    <span className="font-medium text-sm sm:text-base">{areaDisplay}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm sm:text-base">Location:</span>
                    <span className="font-medium text-sm sm:text-base">{project.location}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm sm:text-base">Year:</span>
                    <span className="font-medium text-sm sm:text-base">{project.year}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 text-sm sm:text-base">Client:</span>
                    <span className="font-medium text-sm sm:text-base">{project.client}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm sm:text-base">Duration:</span>
                    <span className="font-medium text-sm sm:text-base">{project.duration}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4 sm:mt-6">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Interested in a similar project?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  <p className="text-gray-600 text-xs sm:text-sm text-justify">
                    We can help you develop a similar project adapted to your specific needs.
                  </p>
                  <div className="space-y-2 sm:space-y-3">
                    <Link href="/cotizacion" className="block">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 py-2 sm:py-3 text-sm sm:text-base">Request Quote</Button>
                    </Link>
                    <Link href="/contacto" className="block">
                      <Button variant="outline" className="w-full bg-transparent py-2 sm:py-3 text-sm sm:text-base">
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
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 sm:mb-10 lg:mb-12 text-center">Related Projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {projects
              .filter((p) => p.id !== id && p.category === project.category)
              .slice(0, 3)
              .map((relatedProject) => (
                <Link key={relatedProject.id} href={`/proyecto/${relatedProject.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 rounded-xl">
                    <div className="relative h-40 sm:h-44 lg:h-48 bg-gray-200 animate-pulse rounded-t-xl">
                      <OptimizedImage
                        src={relatedProject.image || "/placeholder.svg"}
                        alt={relatedProject.title}
                        fill
                        className="object-cover rounded-t-xl"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                      />
                    </div>
                    <CardHeader className="p-3 sm:p-4 lg:p-6">
                      <CardTitle className="text-gray-900 hover:text-blue-600 transition-colors text-sm sm:text-base lg:text-lg">
                        {relatedProject.title}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">{relatedProject.location}</CardDescription>
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
