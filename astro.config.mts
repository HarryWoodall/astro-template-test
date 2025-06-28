import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import github from '@astrojs/github';

// https://astro.build/config
export default defineConfig({
	site: 'astro-template-test',
	base: 'astro-template-test',
	output: 'static',
	adapter: github(),
	vite: {
		plugins: [tailwindcss()],
	},
});
