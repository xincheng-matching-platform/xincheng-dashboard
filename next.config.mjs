/** @type {import('next').NextConfig} */
const nextConfig = {
  /* 設定內容 */
  reactStrictMode: true,
  // 如果有用到 Leaflet 等需要處理伺服器端渲染的套件，可以在這裡設定
  images: {
    unoptimized: true,
  },
  // 確保環境變數能正確讀取
  env: {
    JOB_SS_ID: process.env.JOB_SS_ID,
    APPLY_SS_ID: process.env.APPLY_SS_ID,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
  }
};

export default nextConfig;