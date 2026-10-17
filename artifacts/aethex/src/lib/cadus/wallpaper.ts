/**
 * Wallpapers for the Cadus workspace: quiet, clinical patterns drawn as SVG
 * (nothing to download), tinted with the accent colour and kept faint so
 * text stays easy to read in light and dark mode.
 */

export type WallpaperId = "none" | "grid" | "ecg" | "hex" | "dots" | "caduceus" | "mesh";

export interface Wallpaper {
  id: WallpaperId;
  name: string;
  hint: string;
}

export const WALLPAPERS: Wallpaper[] = [
  { id: "none", name: "Plain", hint: "No wallpaper" },
  { id: "grid", name: "Chart paper", hint: "A faint grid, like an ECG chart" },
  { id: "ecg", name: "Rhythm", hint: "A slow sinus rhythm trace" },
  { id: "hex", name: "Benzene", hint: "Hexagons, like a structural formula" },
  { id: "dots", name: "Dot grid", hint: "A quiet dot grid" },
  { id: "caduceus", name: "Cells", hint: "Rounded cells under a microscope" },
  { id: "mesh", name: "Mesh", hint: "A soft colour wash" },
];

const svg = (w: number, h: number, body: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`)}")`;

/**
 * CSS for one wallpaper, as a background-image value and a size. `ink` is the
 * line colour (already faint): the page sets it from the theme and the accent.
 */
export function wallpaperCss(id: WallpaperId, ink: string, dark: boolean): { image: string; size: string; position?: string; attachment?: string } | null {
  switch (id) {
    case "grid":
      return { image: svg(40, 40, `<path d='M40 0H0v40' fill='none' stroke='${ink}' stroke-width='1'/><path d='M8 0v40M16 0v40M24 0v40M32 0v40M0 8h40M0 16h40M0 24h40M0 32h40' fill='none' stroke='${ink}' stroke-opacity='.35' stroke-width='.6'/>`), size: "40px 40px" };
    case "ecg":
      return { image: svg(480, 160, `<path d='M0 80h140l10-6 10 6h40l6-28 8 56 6-28h50l8-14 10 14h192' fill='none' stroke='${ink}' stroke-width='1.6' stroke-linejoin='round' stroke-linecap='round'/>`), size: "480px 160px" };
    case "hex":
      return { image: svg(56, 97, `<path d='M28 2 54 17v30L28 62 2 47V17Z M28 66 54 81v30M2 81l26-15' fill='none' stroke='${ink}' stroke-width='1'/>`), size: "56px 97px" };
    case "dots":
      return { image: svg(24, 24, `<circle cx='12' cy='12' r='1.3' fill='${ink}'/>`), size: "24px 24px" };
    case "caduceus":
      return { image: svg(120, 120, `<g fill='none' stroke='${ink}' stroke-width='1'><ellipse cx='30' cy='30' rx='22' ry='18' transform='rotate(-18 30 30)'/><ellipse cx='90' cy='40' rx='18' ry='15' transform='rotate(22 90 40)'/><ellipse cx='60' cy='92' rx='24' ry='17' transform='rotate(-8 60 92)'/><circle cx='30' cy='30' r='5'/><circle cx='90' cy='40' r='4'/><circle cx='60' cy='92' r='5'/></g>`), size: "120px 120px" };
    case "mesh":
      return {
        image: dark
          ? `radial-gradient(60% 55% at 10% 0%, ${ink} 0%, transparent 60%), radial-gradient(45% 45% at 100% 100%, ${ink} 0%, transparent 60%)`
          : `radial-gradient(60% 55% at 10% 0%, ${ink} 0%, transparent 60%), radial-gradient(45% 45% at 100% 100%, ${ink} 0%, transparent 60%)`,
        size: "100% 100%",
        attachment: "fixed",
      };
    default:
      return null;
  }
}

export const isWallpaper = (v: unknown): v is WallpaperId => typeof v === "string" && WALLPAPERS.some((w) => w.id === v);
