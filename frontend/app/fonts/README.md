Use `.woff2` for local fonts in this app.

Current cursive font file:

- `frontend/app/fonts/GreatVibes-Regular.woff2`

Load local fonts with `next/font/local`, for example:

```ts
import localFont from "next/font/local"

const cursiveFont = localFont({
  src: "./fonts/GreatVibes-Regular.woff2",
  variable: "--font-cursive",
  display: "swap",
})
```
