import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Users, Target, Heart, Building2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function NosotrosPage() {
  const values = [
    {
      icon: Users,
      title: "Honesty:",
      description:
        "Provide our clients with fair, open and sincere treatment, under high standards of professional ethics.",
    },
    {
      icon: Award,
      title: "Efficiency:",
      description: "Work in an orderly manner, seeking suitable solutions to provide the best quality work at the lowest possible price.",
    },
    {
      icon: Target,
      title: "Quality and Service",
      description: "Our main interest in customer satisfaction, providing personalized service and quick response to the challenges that arise.",
    },
    {
      icon: Heart,
      title: "Social Responsibility",
      description: "Improve the quality of life of our clients by offering the best existing options in terms of design and development.",
    },
  ]
  
  const team = [
    {
      name: "Ing. Fernando Apuy",
      position: "Director General",
      image: "/placeholder.svg?height=300&width=300&text=Carlos+Mendoza",
      description: "20+ years of experience in construction and project development.",
    },
    {
      name: "Ing. Abraham Madriz",
      position: "Project Manager",
      image: "/placeholder.svg?height=300&width=300&text=Roberto+Silva",
      description: "Expert in complex project management and technical coordination.",
    },
    {
      name: "Ing. Sofia Madriz",
      position: "Supply Administrator",
      image: "/placeholder.svg?height=300&width=300&text=María+González",
      description: "Specialist in architectural design and urban planning.",
    },
    
    {
      name: "Ing. Ana Rodríguez",
      position: "Quality Director",
      image: "/placeholder.svg?height=300&width=300&text=Ana+Rodríguez",
      description: "Specialist in quality control and international certifications.",
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">About Us</h1>
              <p className="text-xl text-blue-100 leading-relaxed mb-8 text-justify">
                Currently, SUMMA QUÁLITAS is a flexible and innovative company, oriented to provide the best
                construction and project management service, always maintaining continuous growth and
                training to deliver the best quality work to our clients, with the best materials on the
                market, and it is from there that its name derives, whose simple translation is "Total Quality" and/or "The
                Highest Quality".<br /><br />
                All projects are always delivered in complete cleanliness, mainly due to our sense
                of balance with the environment, all our waste is treated, transported and deposited
                in authorized places for proper handling.

              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/proyectos">
                  <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
                    View Projects
                  </Button>
                </Link>
                <Link href="/contacto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-blue-900 bg-transparent"
                  >
                    Contact
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/images/co1.webp?height=500&width=600&text=Team+ConstructPro"
                alt="Team"
                width={600}
                height={500}
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <Card className="p-8">
              <CardHeader className="text-center">
                <Target className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-900">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed text-balance">
                  Manage and develop projects that improve living conditions around us, providing
                  reliable and efficient solutions that guarantee the development, sustainability and quality of our
                  works, having as main policy to satisfy the needs of our clients.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8">
              <CardHeader className="text-center">
                <Building2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <CardTitle className="text-2xl text-gray-900">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed  text-balance p-2">
                  SUMMA QUÁLITAS will seek, in a process of continuous improvement, to be a company with the highest
                  quality standards in its services, thus exceeding the expectations of its clients, always maintaining professional ethics and occupational safety in every step we take and every project
                  we develop.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide each of our projects and business decisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <value.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <CardTitle className="text-gray-900 ">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-justify">{value.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Highly qualified professionals committed to excellence in every project
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-gray-900">{member.name}</CardTitle>
                  <CardDescription className="text-blue-600 font-medium">{member.position}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-blue-300 mb-2">500+</div>
              <div className="text-lg text-blue-100">Completed Projects</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-blue-300 mb-2">20+</div>
              <div className="text-lg text-blue-100">Years of Experience</div>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-blue-300 mb-2">100+</div>
              <div className="text-lg text-blue-100">Satisfied Clients</div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
