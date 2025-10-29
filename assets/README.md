# Assets Directory

## Overview

This directory contains all static assets required for building and distributing Holophonix Animator v2 across different platforms.

## Required Icons

### For Linux builds:
- `icon.png` - 512x512 PNG icon for Linux packages (deb, AppImage)
  - Used by: Debian packages, AppImage, desktop shortcuts
  - Format: PNG with transparency support
  - Size: 512x512 pixels (recommended)
  - Color space: RGB/A

### For Windows builds:
- `icon.ico` - Windows icon file
  - Used by: NSIS installer, desktop shortcuts, taskbar
  - Format: ICO with multiple sizes embedded
  - Sizes: 16x16, 32x32, 48x48, 256x256 (recommended)
  - Color depth: 32-bit with alpha channel

## Asset Specifications

### Icon Design Requirements
- **Style**: Modern, clean, professional
- **Theme**: Sound/spatial animation related
- **Colors**: Work well with light and dark themes
- **Scalability**: Clear at all sizes from 16px to 512px
- **Background**: Transparent or solid color that works on any background

### Recommended Icon Content
- Sound waves or spatial visualization elements
- 3D geometric shapes suggesting movement
- Clean typography if including text
- Avoid photographic elements or complex gradients

## File Structure

```
assets/
├── README.md                    # This file
├── icon.png                     # Linux icon (512x512)
├── icon.ico                     # Windows icon (multi-size)
├── icons/                       # Source files and alternatives
│   ├── icon.svg                 # Vector source (if available)
│   ├── icon-256.png             # High resolution PNG
│   ├── icon-128.png             # Medium resolution PNG
│   └── icon-64.png              # Small resolution PNG
├── build/                       # Build-specific assets
│   ├── installer-background.png # Windows installer background
│   ├── splash.png               # Application splash screen
│   └── banner.png               # Windows installer banner
└── documentation/               # Documentation images
    ├── screenshots/             # Application screenshots
    ├── diagrams/                # Technical diagrams
    └── logos/                   # Brand assets
```

## Build Integration

### Electron Builder Configuration
The assets are referenced in `package.json`:

```json
{
  "build": {
    "appId": "com.holophonix.animator",
    "productName": "Holophonix Animator v2",
    "directories": {
      "output": "release",
      "buildResources": "assets"
    },
    "files": [
      "main.cjs",
      "preload.cjs", 
      "dist/**/*"
    ],
    "linux": {
      "target": ["deb", "AppImage"],
      "category": "AudioVideo",
      "icon": "assets/icon.png"
    },
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "installerIcon": "assets/icon.ico",
      "uninstallerIcon": "assets/icon.ico",
      "installerHeaderIcon": "assets/icon.ico"
    }
  }
}
```

## Asset Generation

### Creating Icons from SVG Source
If you have an SVG source file:

```bash
# Install required tools
npm install -g sharp

# Generate PNG for Linux
sharp icon.svg -resize 512x512 icon.png

# Generate ICO for Windows (requires png2ico)
png2ico icon.ico icon-256.png icon-128.png icon-64.png icon-32.png icon-16.png
```

### Using Online Tools
1. **SVG to PNG**: Use Online-Convert or CloudConvert
2. **PNG to ICO**: Use ICO Convert or ConvertICO
3. **Multi-size ICO**: Use Favicon.io or RealFaviconGenerator

## Quality Guidelines

### Technical Requirements
- **File size**: Keep under 1MB for each icon
- **Compression**: Use lossless compression for PNG
- **Transparency**: Support alpha channel for professional look
- **Color profile**: sRGB for cross-platform consistency

### Visual Guidelines
- **Contrast**: Ensure good contrast against various backgrounds
- **Readability**: Icon should be recognizable at small sizes
- **Professionalism**: Avoid cartoonish or overly decorative elements
- **Brand consistency**: Match application's visual design language

## Testing Icons

### Visual Testing
Test icons on different backgrounds and sizes:

```bash
# Create test grid (manual process)
1. Place icon on white background
2. Place icon on black background  
3. Place icon on gray background
4. Test at 16px, 32px, 48px, 128px, 256px, 512px
5. Verify clarity and recognizability
```

### Platform Testing
Test actual integration:

```bash
# Windows testing
1. Build Windows installer: npm run build:win
2. Install and check desktop shortcut
3. Verify taskbar icon appearance
4. Check installer UI icons

# Linux testing  
1. Build Linux packages: npm run build:linux
2. Install .deb package
3. Check application menu icon
4. Verify desktop shortcut icon
5. Test AppImage icon display
```

## Troubleshooting

### Common Icon Issues

#### Issue: Icon appears blurry or pixelated
**Cause**: Insufficient resolution or poor scaling
**Solution**: 
- Use vector source (SVG) when possible
- Ensure high-resolution source (512x512 minimum)
- Test at multiple sizes during generation

#### Issue: Icon has jagged edges
**Cause**: Poor anti-aliasing or compression
**Solution**:
- Use proper anti-aliasing during export
- Avoid aggressive compression
- Use professional icon generation tools

#### Issue: Transparent background becomes white
**Cause**: Format doesn't support transparency
**Solution**:
- Use PNG for Linux (supports transparency)
- Ensure ICO file has proper alpha channel
- Test transparency on both platforms

#### Issue: Icon doesn't appear in installer
**Cause**: Incorrect file path or format
**Solution**:
- Verify icon file exists in assets directory
- Check Electron Builder configuration
- Ensure correct file format (.ico for Windows, .png for Linux)

## Asset Management

### Version Control
```bash
# Include in Git
git add assets/icon.png assets/icon.ico
git commit -m "Add application icons"

# Ignore generated files
echo "build/" >> .gitignore
echo "temp/" >> .gitignore
```

### Backup Strategy
- Keep source SVG files in version control
- Store high-resolution masters separately
- Document generation process for future updates
- Maintain backup of original design files

## Updating Icons

### When to Update
- New branding or logo changes
- Platform guideline updates
- Quality improvements
- User feedback on icon clarity

### Update Process
1. Create new icon designs
2. Generate platform-specific formats
3. Test on all target platforms
4. Update build configuration if needed
5. Commit changes and test builds
6. Update documentation

---

**Last Updated**: 2024-01-15
**Maintainer**: Holophonix Animator Team
**Version**: v2.0.0
