import vr from "./playwright.vr.config";
export default { ...vr, use: { ...vr.use, baseURL: "https://pdfthumb.com" }, webServer: undefined };
