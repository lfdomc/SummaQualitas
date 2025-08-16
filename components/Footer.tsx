import {  Facebook, Instagram, Twitter, Linkedin, Phone, Mail, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="space-y-4 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <Image
                            src="/images/summa/logo_alone2.png"
                            alt="Logo"
                            width={100}
                            height={100}
                            className="w-auto h-16 sm:h-20"
                          />
              <span className="text-2xl font-bold"></span>
            </div>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              Leading company in construction and renovations with over 20 years of experience.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 text-center sm:text-left">
            <h3 className="text-lg font-semibold text-blue-400">Quick Links</h3>
            <ul className="space-y-2">
              {["Home", "Services", "Projects", "About Us", "Contact"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-300 hover:text-blue-400 transition-colors text-sm sm:text-base">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4 text-center sm:text-left">
            <h3 className="text-lg font-semibold text-blue-400">Services</h3>
            <ul className="space-y-2">
              {[
                "Residential Construction",
                "Commercial Projects",
                "Renovations",
                "Maintenance",
                "Consulting",
              ].map((service) => (
                <li key={service}>
                  <Link href="#" className="text-gray-300 hover:text-blue-400 transition-colors text-sm sm:text-base">
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 text-center sm:text-left">
            <h3 className="text-lg font-semibold text-blue-400">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-center sm:justify-start space-x-3">
                <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm sm:text-base">+(506) 8846-0570</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-3">
                <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm sm:text-base break-all">fernando.apuy@qualitascr.com</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm sm:text-base">Guanacaste, Costa Rica</span>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex space-x-4 sm:space-x-6">
              <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors p-2">
                <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors p-2">
                <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors p-2">
                <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors p-2">
                <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm text-center">
              © {new Date().getFullYear()} Temsa Tecnología. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
