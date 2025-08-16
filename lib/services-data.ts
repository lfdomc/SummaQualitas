import type { Services } from "@/lib/types"
import { Building2, Users, Wrench, Home, Building, Hammer } from "lucide-react"

export const services: Services[] = [
    {
      icon: Home,
      title: "Residential Construction",
      description:
        "Construction of houses, condominiums and residential developments with the highest quality standards.",
      features: ["Architectural design", "Complete construction", "Luxury finishes", "Gardens and landscaping"],
      image: "/images/residential1.webp?height=300&width=400&text=Residential+Construction",
    },
    {
      icon: Building,
      title: "Commercial Projects",
      description: "Development of shopping centers, offices and modern and functional corporate spaces.",
      features: ["Shopping centers", "Office buildings", "Commercial premises", "Corporate spaces"],
      image: "/images/comercial.webp?height=300&width=400&text=Commercial+Projects",
    },
    {
      icon: Building2,
      title: "Industrial Construction",
      description: "Industrial warehouses, storage facilities and production plants with cutting-edge technology.",
      features: ["Industrial warehouses", "Logistics warehouses", "Production plants", "Specialized facilities"],
      image: "/images/industrial.webp?height=300&width=400&text=Industrial+Construction",
    },
    {
      icon: Hammer,
      title: "Renovations",
      description: "Renovation and modernization of existing spaces to maximize their potential.",
      features: ["Complete renovation", "Extensions", "Modernization", "Restoration"],
      image: "/images/reno22.webp?height=300&width=400&text=Renovations",
    },
    {
      icon: Wrench,
      title: "Maintenance",
      description: "Preventive and corrective maintenance services to preserve your investments.",
      features: ["Preventive maintenance", "Repairs", "Technical inspections", "Emergency services"],
      image: "/images/mant1.webp?height=300&width=400&text=Maintenance",
    },
    {
      icon: Users,
      title: "Consulting",
      description: "Specialized consulting in construction projects from planning to execution.",
      features: ["Feasibility studies", "Project management", "Technical supervision", "Legal consulting"],
      image: "/images/consultoria.webp?height=300&width=400&text=Consulting",
    },
  ]