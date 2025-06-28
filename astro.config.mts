import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
	site: 'https://chic-selkie-7c8e5c.netlify.app/',
	base: '/',
	output: 'static',

	vite: {
		plugins: [tailwindcss()],
	},

	adapter: netlify(),
});
