import { themeScript } from "@/lib/theme";

export function ThemeScript() {
  return <script id="sonae-theme-script" dangerouslySetInnerHTML={{ __html: themeScript() }} />;
}
