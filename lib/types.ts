import { LucideIcon } from "lucide-react";
export interface Project {
  id: string
  title: string
  description: string
  image: string
  gallery: string[]
  category: string
  location: string
  area: string
  year: string
  client: string
  duration: string
  features: string[]
}



export type Services = {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  image?: string;
};