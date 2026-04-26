import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import apiRoutes from "vite-plugin-api-routes";

const allowedHosts: string[] = [];
if (process.env.FRONTEND_DOMAIN) {
	allowedHosts.push(process.env.FRONTEND_DOMAIN, `http://${process.env.FRONTEND_DOMAIN}`, `https://${process.env.FRONTEND_DOMAIN}`);
}
if (process.env.ALLOWED_ORIGINS) {
	allowedHosts.push(...process.env.ALLOWED_ORIGINS.split(','));
}
if (process.env.VITE_PARENT_ORIGIN) {
	allowedHosts.push(process.env.VITE_PARENT_ORIGIN);
}
if (allowedHosts.length === 0) {
	allowedHosts.push('*');
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, __dirname, "");
	Object.assign(process.env, env);
	const devPort = Number.parseInt(process.env.PORT ?? "5182", 10);

	return {
		plugins: [
			react(),
			apiRoutes({
				mode: 'isolated',
				configure: 'src/server/configure.js',
				dirs: [{ dir: './src/server/api', route: '' }],
				forceRestart: true,
			}),
			
		],

		resolve: {
			alias: {
				nothing: "/src/fallbacks/missingModule.ts",
				"@/api": path.resolve(__dirname, "./src/server/api"),
				"@/db": path.resolve(__dirname, "./src/server/db"),
				"@": path.resolve(__dirname, "./src"),
				"@bevforge/ui-shared": path.resolve(__dirname, "../../packages/ui-shared/src"),
			},
		},

		server: {
			host: "0.0.0.0",
			port: Number.isFinite(devPort) ? devPort : 5182,
			strictPort: true,
			allowedHosts,
			cors: {
				origin: allowedHosts,
				credentials: true,
				methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
				allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'User-Agent']
			},
			hmr: {
				overlay: false
			}
		},

		build: {
			rollupOptions: {
				// No external dependencies - bundle everything
			}
		},
	};
});
