import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import OptimizedImage from "@/components/OptimizedImage"
import type { Project } from "@/lib/types"

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/proyecto/${project.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer rounded-xl">
        <div className="relative h-40 sm:h-44 lg:h-48 bg-gray-200 animate-pulse">
          <OptimizedImage
            src={project.image || "/placeholder.svg"}
            alt={project.title}
            fill
            className="object-cover rounded-t-xl"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        </div>
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-gray-900 hover:text-blue-600 transition-colors text-sm sm:text-base lg:text-lg flex-1">{project.title}</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs sm:text-sm flex-shrink-0">
              {project.category}
            </Badge>
          </div>
          <CardDescription className="text-gray-600 text-xs sm:text-sm">{project.location}</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <p className="text-gray-700 mb-3 sm:mb-4 line-clamp-2 text-xs sm:text-sm">{project.description}</p>
          <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500">
            <span>Área: {project.area}</span>
            <span>{project.year}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
