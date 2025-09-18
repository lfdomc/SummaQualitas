import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Estabilizar HMR para evitar recompilaciones constantes
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 600,
        ignored: ['**/node_modules/**', '**/.next/**', '**/.git/**'],
      };
      // Optimizar resolución de módulos
      config.resolve.symlinks = false;
      // Configuración de cache optimizada para reducir warnings de serialización
      config.cache = {
        type: 'filesystem',
        maxMemoryGenerations: 0,
        compression: 'gzip', // Habilitar compresión para reducir tamaño
        buildDependencies: {
          config: [__filename],
        },
      };
      // Optimizar chunks para HMR y reducir warnings
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Separar dependencias grandes en chunks más pequeños
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test(module) {
                return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
              },
              name(module) {
                 const hash = crypto.createHash('sha1');
                 hash.update(module.libIdent ? module.libIdent({ context: config.context }) : module.identifier());
                 return hash.digest('hex').substring(0, 8);
               },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
          },
        },
      };
    }
    
    // Configuración adicional para reducir warnings de serialización
    config.infrastructureLogging = {
      level: 'error',
    };
    
    return config;
  },
}

export default nextConfig
