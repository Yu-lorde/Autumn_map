import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

const isStandalone = process.env.BUILD_STANDALONE === 'true'
// 支持通过环境变量设置 base 路径，用于 GitHub Pages 子路径部署
// 优先级：VITE_BASE_PATH > GITHUB_REPOSITORY > 默认 '/'
const basePath = process.env.VITE_BASE_PATH 
  || (process.env.GITHUB_REPOSITORY?.split('/')[1] ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 仅在构建 standalone 时启用 singlefile 插件
    isStandalone ? viteSingleFile() : null,
  ].filter(Boolean),
  base: basePath,
  build: {
    // standalone 构建时使用内联资源
    ...(isStandalone && {
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          manualChunks: undefined,
          assetFileNames: 'assets/[name].[ext]',
        },
      },
      // 增加 chunk 大小限制，确保所有代码都能内联
      chunkSizeWarningLimit: 10000,
    }),
  },
})




