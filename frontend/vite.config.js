// Plugins
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { federation } from '@module-federation/vite'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import { getEnabledLocales } from './locales.config.js'

// Exposes `virtual:modoboa-translations`, returning only the locales
// selected in locales.config.js (or via the MODOBOA_LOCALES env var).
// The committed translations.json keeps every language; this trims what
// actually ends up in the bundle so unused languages aren't shipped.
function bundledTranslations() {
  const VIRTUAL_ID = 'virtual:modoboa-translations'
  const RESOLVED_ID = '\0' + VIRTUAL_ID
  const translationsPath = fileURLToPath(
    new URL('./src/locale/translations.json', import.meta.url)
  )
  return {
    name: 'modoboa-bundled-translations',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      this.addWatchFile(translationsPath)
      const enabledLocales = getEnabledLocales()
      const all = JSON.parse(fs.readFileSync(translationsPath, 'utf8'))
      const translations = {}
      for (const locale of enabledLocales) {
        if (all[locale]) translations[locale] = all[locale]
      }
      return (
        `export const enabledLocales = ${JSON.stringify(enabledLocales)}\n` +
        `export const translations = ${JSON.stringify(translations)}\n`
      )
    },
  }
}

// @module-federation/vite emits its bootstrap shim files via emitFile() with
// an explicit `fileName`, which bypasses Rollup's entry/asset naming patterns
// and dumps them at the bundle root *without a content hash*. Relocate them
// under assets/ AND give them a content hash, so the produced layout matches
// the rest of the build (single canonical asset directory) and every emitted
// file is content-addressed.
//
// The hash matters for caching: these shims are tiny but their content changes
// on every build (they import the hashed entry chunks by name). Without a hash
// in their own filename they cannot be served as immutable — a long-lived
// cache would keep serving a stale bootstrap pointing at chunks that no longer
// exist. Hashing them lets nginx mark the whole /assets/ tree immutable safely.
// Only index.html references these files, so rewriting the HTML is enough.
//
// We do this in writeBundle (post-emit, on the filesystem) rather than
// rewriting the bundle map in generateBundle. Vite 8 runs on Rolldown,
// which ignores `bundle[k] = …; delete bundle[old]` reassignment with a
// warning — the old generateBundle approach silently no-op'd. Filesystem
// moves work identically on Rollup and Rolldown.
function relocateMfBootstrap() {
  return {
    name: 'modoboa-relocate-mf-bootstrap',
    enforce: 'post',
    async writeBundle(options, bundle) {
      const fs = await import('node:fs/promises')
      const path = await import('node:path')
      const crypto = await import('node:crypto')
      const outDir = options.dir
      const moved = new Map()
      const htmlFiles = []
      for (const fileName of Object.keys(bundle)) {
        if (fileName.startsWith('mf-entry-bootstrap-')) {
          const oldPath = path.join(outDir, fileName)
          const content = await fs.readFile(oldPath)
          const hash = crypto
            .createHash('sha256')
            .update(content)
            .digest('hex')
            .slice(0, 8)
          // mf-entry-bootstrap-3.js -> assets/mf-entry-bootstrap-3-<hash>.js
          const newName = `assets/${fileName.replace(/\.js$/, '')}-${hash}.js`
          const newPath = path.join(outDir, newName)
          await fs.mkdir(path.dirname(newPath), { recursive: true })
          await fs.rename(oldPath, newPath)
          moved.set(fileName, newName)
        } else if (fileName.endsWith('.html')) {
          htmlFiles.push(path.join(outDir, fileName))
        }
      }
      if (moved.size === 0) return

      // Locate the auth-gate chunk (emitted via the dynamic import in main.js)
      // so the inline login gate can load it to redirect unauthenticated
      // visitors without booting the SPA.
      const authGateChunk = Object.values(bundle).find(
        (c) =>
          c.type === 'chunk' &&
          (c.name === 'auth-gate' ||
            (c.facadeModuleId && c.facadeModuleId.endsWith('auth-gate.js')))
      )
      const authGateSrc = authGateChunk ? `/${authGateChunk.fileName}` : null
      if (!authGateSrc) {
        console.warn(
          '[login-gate] auth-gate chunk not found; leaving the eager MF ' +
            'bootstrap scripts in index.html (no early login redirect).'
        )
      }
      const bootSrcs = [...moved.values()].map((n) => `/${n}`)
      // Matches the eager MF bootstrap <script> tags in the built index.html.
      const bootRe =
        /[ \t]*<script type="module"[^>]*\bsrc="\/assets\/mf-entry-bootstrap-[^"]+"[^>]*><\/script>\n?/g

      for (const htmlPath of htmlFiles) {
        let html = await fs.readFile(htmlPath, 'utf8')
        for (const [oldName, newName] of moved) {
          html = html.split(`/${oldName}`).join(`/${newName}`)
        }
        bootRe.lastIndex = 0
        if (authGateSrc && bootRe.test(html)) {
          // Remove the eager bootstrap tags; an inline gate injects them only
          // when the visitor is authenticated (or on the OIDC callback, or on
          // any error/uncertainty). Otherwise it loads the small auth-gate
          // chunk and redirects to the IdP — skipping the heavy SPA download.
          // Worst case (any doubt) == today's behaviour: load the full app.
          bootRe.lastIndex = 0
          html = html.replace(bootRe, '')
          const gate =
            '    <script>\n' +
            '      (function () {\n' +
            `        var BOOT = ${JSON.stringify(bootSrcs)};\n` +
            `        var AUTH_GATE = ${JSON.stringify(authGateSrc)};\n` +
            '        function loadApp() {\n' +
            '          for (var i = 0; i < BOOT.length; i++) {\n' +
            "            var s = document.createElement('script');\n" +
            "            s.type = 'module'; s.async = false; s.crossOrigin = 'anonymous';\n" +
            '            s.src = BOOT[i];\n' +
            '            document.head.appendChild(s);\n' +
            '          }\n' +
            '        }\n' +
            '        try {\n' +
            "          if (location.pathname.lastIndexOf('/login', 0) === 0) { loadApp(); return; }\n" +
            '          var authed = false;\n' +
            '          for (var k = 0; k < localStorage.length; k++) {\n' +
            '            var key = localStorage.key(k);\n' +
            "            if (key && key.lastIndexOf('oidc.user:', 0) === 0) {\n" +
            '              try {\n' +
            '                var u = JSON.parse(localStorage.getItem(key));\n' +
            '                if (u && u.access_token && (!u.expires_at || u.expires_at * 1000 > Date.now())) { authed = true; break; }\n' +
            '              } catch (e) {}\n' +
            '            }\n' +
            '          }\n' +
            '          if (authed) { loadApp(); return; }\n' +
            '          import(AUTH_GATE).then(function (m) { return m.redirectToLogin(); }).catch(function () { loadApp(); });\n' +
            '        } catch (e) { loadApp(); }\n' +
            '      })();\n' +
            '    </script>\n'
          html = html.replace('</head>', gate + '  </head>')
        }
        await fs.writeFile(htmlPath, html)
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    process.env.VITE_MOCK_API !== 'true' ? basicSsl() : null,
    vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    federation({
      name: 'modoboa_host',
      filename: 'remoteEntry.js',
      // JS-only project — disable TypeScript declaration generation.
      // Note: `typescript` must still be installed as a devDep because
      // @module-federation/dts-plugin unconditionally `import`s it at
      // module load (the dts: false flag only disables the feature,
      // not the import).
      dts: false,
      // Plugin remotes are registered dynamically at runtime from the
      // backend manifest (see src/utils/federation.js).
      exposes: {
        './stores': './src/stores/index.js',
        './repository': './src/api/repository.js',
        './MenuItems': './src/components/tools/MenuItems.vue',
        './ConfirmDialog': './src/components/tools/ConfirmDialog.vue',
        './ColorField': './src/components/tools/ColorField.vue',
      },
      // Pinned majors for version-skew protection. @module-federation/vite
      // negotiates these correctly across host and plugin even when the
      // installed minor versions differ.
      shared: {
        vue: { singleton: true, requiredVersion: '^3.4.0' },
        'vue-router': { singleton: true, requiredVersion: '^4.0.0' },
        pinia: { singleton: true, requiredVersion: '^3.0.0' },
        vuetify: { singleton: true, requiredVersion: '^4.0.0' },
        'vue3-gettext': { singleton: true, requiredVersion: '^4.0.0-beta.1' },
      },
    }),
    relocateMfBootstrap(),
    bundledTranslations(),
  ],
  base: '/',
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target:
          process.env.DOCKER == 'yes'
            ? 'https://api:8000'
            : 'http://127.0.0.1:8000',
        secure: false,
      },
      '/media': {
        target:
          process.env.DOCKER == 'yes'
            ? 'https://api:8000'
            : 'http://127.0.0.1:8000',
        secure: false,
      },
    },
    https: process.env.VITE_MOCK_API !== 'true',
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['X-Requested-With', 'content-type', 'Authorization'],
    },
  },
  preview: {
    port: 3000,
    proxy: {
      '/api': {
        target:
          process.env.DOCKER == 'yes'
            ? 'https://api:8000'
            : 'http://127.0.0.1:8000',
        secure: false,
      },
      '/media': {
        target:
          process.env.DOCKER == 'yes'
            ? 'https://api:8000'
            : 'http://127.0.0.1:8000',
        secure: false,
      },
    },
    https: process.env.VITE_MOCK_API !== 'true',
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['X-Requested-With', 'content-type', 'Authorization'],
    },
  },
  build: {
    emptyOutDir: true,
    outDir: '../modoboa/frontend_dist',
    // Modern-only target: no legacy transpilation, no injected polyfills.
    // Browsers we serve support native ESM, so the bundle stays lean.
    target: 'esnext',
    // Emit source maps so production JS stays debuggable (and readable by
    // error-reporting tools) without shipping unminified code.
    sourcemap: true,
    // Inject <link rel="modulepreload"> for the static module graph so the
    // browser fetches it in parallel instead of discovering each import
    // serially (a request waterfall). Polyfill off: target is esnext, so the
    // browsers we serve support modulepreload natively.
    modulePreload: { polyfill: false },
    // Minify JS and CSS in production. Without this the main bundle ships
    // unminified (~2.3 MB JS / ~1 MB CSS); esbuild minification roughly
    // halves the JavaScript and shrinks the stylesheet considerably.
    minify: true,
    cssCodeSplit: false,
  },
})
