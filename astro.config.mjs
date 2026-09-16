// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";

import db from "@astrojs/db";

import vercel from "@astrojs/vercel";

import auth from "auth-astro";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://shiori-blog.space",
  compressHTML: true,
  integrations: [react(), db(), auth()],
  output: "server",
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        "@tiptap/react",
        "@tiptap/starter-kit",
        "@tiptap/extension-image",
        "@tiptap/extension-placeholder",
        "@tiptap/extension-text-style",
        "@tiptap/extension-color",
        "@tiptap/extension-highlight",
      ],
    },
  },
  image: {
    domains: [
      "res.cloudinary.com",
      "ui-avatars.com",
      "placehold.co",
      "lh3.googleusercontent.com",
    ],
  },
});
