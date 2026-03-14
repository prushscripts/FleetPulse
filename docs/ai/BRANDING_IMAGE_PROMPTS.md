# FleetPulse Branding Image Generation Prompts

Use these prompts with Bing Image Creator (or DALL-E/Midjourney) to generate professional branding assets for FleetPulse.

## 🎨 Logo Design Prompts

### Primary Logo (Icon + Text)
**Prompt:**
```
Modern, minimalist fleet management logo design. A sleek, geometric icon combining a vehicle silhouette with a pulse/heartbeat line graph. Clean, professional typography saying "FleetPulse" in bold, modern sans-serif font. Color scheme: indigo blue (#6366f1) and purple gradient (#9333ea) on white background. Flat design style, suitable for digital use. Vector style, high contrast, professional business logo.
```

### Icon Only (Favicon)
**Prompt:**
```
Simple, recognizable icon for fleet management app. A stylized vehicle (truck or car) with a pulse/heartbeat line integrated into the design. Minimalist, geometric shapes. Indigo blue (#6366f1) color. Square format, suitable for favicon and app icon. Clean lines, modern tech aesthetic.
```

### Logo Variant (Dark Background)
**Prompt:**
```
FleetPulse logo on dark gradient background. Modern fleet management branding with vehicle icon and pulse line. White and light indigo text. Dark indigo to purple gradient background (#1e1b4b to #581c87). Professional, tech-forward design. Suitable for hero sections and dark mode interfaces.
```

## 🖼️ Hero Section Background Images

### Option 1: Abstract Tech Pattern
**Prompt:**
```
Abstract, modern technology background. Subtle geometric patterns with indigo (#6366f1) and purple (#9333ea) gradient overlays. Soft, blurred grid lines suggesting connectivity and data flow. Minimalist, professional. Suitable for hero section background. 1920x1080, subtle texture, not distracting from text overlay.
```

### Option 2: Fleet Vehicles Silhouette
**Prompt:**
```
Professional fleet management background. Silhouette of multiple vehicles (trucks, vans) in a row, fading into distance. Indigo and purple gradient overlay (#6366f1 to #9333ea). Soft focus, professional business aesthetic. Subtle, not overwhelming. 1920x1080, suitable for hero section with text overlay.
```

### Option 3: Dashboard Visualization
**Prompt:**
```
Abstract representation of fleet management dashboard. Floating UI elements, charts, and data visualizations in soft focus. Indigo and purple color scheme (#6366f1, #9333ea). Modern, tech-forward aesthetic. Blurred background effect, suitable for hero section. Professional, clean design.
```

## 📱 App Icon / Favicon

**Prompt:**
```
App icon for FleetPulse fleet management app. Square format, 512x512. Stylized vehicle icon (truck or car) with integrated pulse/heartbeat line. Indigo blue gradient (#6366f1 to #9333ea). Modern, flat design. Clean, recognizable at small sizes. Professional tech app aesthetic.
```

## 🎯 Brand Colors Reference

- **Primary Indigo**: `#6366f1` (indigo-500)
- **Primary Purple**: `#9333ea` (purple-600)
- **Dark Indigo**: `#1e1b4b` (indigo-950)
- **Light Indigo**: `#e0e7ff` (indigo-100)
- **Accent Yellow**: `#facc15` (yellow-400) - for highlights/badges

## 📐 Image Specifications

### Logo Files Needed:
- **Primary Logo**: 1200x400px (horizontal, transparent PNG)
- **Icon Only**: 512x512px (square, transparent PNG)
- **Favicon**: 32x32px, 64x64px, 128x128px (square, transparent PNG/ICO)

### Background Images:
- **Hero Background**: 1920x1080px (16:9 ratio, JPG/PNG)
- **Pattern Overlay**: 60x60px (repeatable pattern, transparent PNG)

## 💡 Usage Tips

1. **Generate multiple variations** - Try each prompt 2-3 times to get options
2. **Test on different backgrounds** - Make sure logos work on both light and dark backgrounds
3. **Keep it simple** - The logo should be recognizable at small sizes (favicon)
4. **Consistent color palette** - Use the exact hex codes provided
5. **Vector-friendly** - If possible, create SVG versions for scalability

## 🔄 After Generating Images

1. Save logo files to: `public/logo.png`, `public/logo-dark.png`, `public/favicon.ico`
2. Update the landing page to use the logo image instead of the SVG placeholder
3. Add favicon to `app/favicon.ico` or `public/favicon.ico`
4. Consider creating a `components/Logo.tsx` component for consistent logo usage

## 🎨 Alternative: Use Existing Assets

If you prefer, you can also:
- Use a logo generator like LogoMaker, Canva, or Looka
- Purchase a logo from Fiverr or 99designs
- Use free logo templates from sites like LogoMaker or Hatchful
