// Twitter Card image — identical to the Open Graph image.
// Next.js requires a dedicated `twitter-image` file convention to emit
// `twitter:image`; it does not reuse `opengraph-image` automatically.
export { default, alt, size, contentType } from "./opengraph-image";
