// postcss.config.mjs — เปิดใช้ Tailwind CSS (ผ่าน PostCSS) เพื่อให้ใช้ class เช่น bg-white, p-4 ในไฟล์ .jsx ได้
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
