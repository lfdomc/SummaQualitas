import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import type { Project } from "@/lib/types"

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/proyecto/${project.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
        <div className="relative h-48">
          <Image src={project.image || "/placeholder.svg"} alt={project.title} fill className="object-cover" />
        </div>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-gray-900 hover:text-blue-600 transition-colors">{project.title}</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {project.category}
            </Badge>
          </div>
          <CardDescription className="text-gray-600">{project.location}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4 line-clamp-2">{project.description}</p>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Área: {project.area}</span>
            <span>{project.year}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
