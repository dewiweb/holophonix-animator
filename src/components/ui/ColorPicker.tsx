import React, { useEffect, useMemo, useRef, useState } from 'react'

export interface RGBA {
  r: number // 0-1
  g: number // 0-1
  b: number // 0-1
  a: number // 0-1
}

interface ColorPickerProps {
  value: RGBA
  onChange: (rgba: RGBA) => void
  title?: string
}

function rgbaToHex({ r, g, b }: RGBA) {
  const rr = Math.round(r * 255).toString(16).padStart(2, '0')
  const gg = Math.round(g * 255).toString(16).padStart(2, '0')
  const bb = Math.round(b * 255).toString(16).padStart(2, '0')
  return `#${rr}${gg}${bb}`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255
  return { r, g, b }
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, title }) => {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const swatchRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // HSV helpers
  const rgbToHsv = (r: number, g: number, b: number): { h: number; s: number; v: number } => {
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const d = max - min
    let h = 0
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6
      else if (max === g) h = (b - r) / d + 2
      else h = (r - g) / d + 4
      h *= 60
      if (h < 0) h += 360
    }
    const s = max === 0 ? 0 : d / max
    const v = max
    return { h, s, v }
  }
  const hsvToRgb = (h: number, s: number, v: number): { r: number; g: number; b: number } => {
    const c = v * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = v - c
    let rp = 0, gp = 0, bp = 0
    if (0 <= h && h < 60) { rp = c; gp = x; bp = 0 }
    else if (60 <= h && h < 120) { rp = x; gp = c; bp = 0 }
    else if (120 <= h && h < 180) { rp = 0; gp = c; bp = x }
    else if (180 <= h && h < 240) { rp = 0; gp = x; bp = c }
    else if (240 <= h && h < 300) { rp = x; gp = 0; bp = c }
    else { rp = c; gp = 0; bp = x }
    return { r: rp + m, g: gp + m, b: bp + m }
  }
  const [hsv, setHsv] = useState(() => rgbToHsv(value.r, value.g, value.b))
  // Sync HSV when external value changes
  useEffect(() => {
    setHsv(rgbToHsv(value.r, value.g, value.b))
  }, [value.r, value.g, value.b])

  const hex = useMemo(() => rgbaToHex(value), [value])
  const predefined = useMemo(
    () => [
      '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#0BD3D3', '#007AFF', '#5856D6', '#AF52DE',
      '#FF2D55', '#8E8E93', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#D4A5A5', '#9B59B6'
    ],
    []
  )

  // Persist custom colors in localStorage
  const [custom, setCustom] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('customColors')
      if (raw) return JSON.parse(raw)
    } catch {}
    return []
  })
  useEffect(() => {
    try {
      localStorage.setItem('customColors', JSON.stringify(custom))
    } catch {}
  }, [custom])

  return (
    <div className="inline-block" title={title}>
      <button
        ref={swatchRef}
        className="h-10 w-12 rounded border border-gray-300 dark:border-gray-600 shadow-sm"
        style={{ backgroundColor: `rgba(${Math.round(value.r*255)}, ${Math.round(value.g*255)}, ${Math.round(value.b*255)}, ${value.a})` }}
        onClick={() => setOpen(true)}
      />
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          {/* Modal panel */}
          <div className="absolute inset-0 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
            <div
              ref={panelRef}
              className="w-full max-w-md p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">Pick Color</div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {/* SV Square */}
                <div
                  className="relative h-40 w-full rounded overflow-hidden cursor-crosshair"
                  style={{
                    background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`
                  }}
                  onMouseDown={(e) => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
                    const newHsv = { h: hsv.h, s: x, v: 1 - y }
                    setHsv(newHsv)
                    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v)
                    onChange({ r: rgb.r, g: rgb.g, b: rgb.b, a: value.a })
                    const onMove = (ev: MouseEvent) => {
                      const xr = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
                      const yr = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height))
                      const nh = { h: newHsv.h, s: xr, v: 1 - yr }
                      setHsv(nh)
                      const rgb2 = hsvToRgb(nh.h, nh.s, nh.v)
                      onChange({ r: rgb2.r, g: rgb2.g, b: rgb2.b, a: value.a })
                    }
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove)
                      window.removeEventListener('mouseup', onUp)
                    }
                    window.addEventListener('mousemove', onMove)
                    window.addEventListener('mouseup', onUp)
                  }}
                >
                  {/* SV handle */}
                  <div
                    className="absolute h-3 w-3 rounded-full border border-white shadow"
                    style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, transform: 'translate(-50%, -50%)', backgroundColor: hex }}
                  />
                </div>
                {/* Hue slider */}
                <div
                  className="relative h-3 w-full rounded cursor-pointer"
                  style={{
                    background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 66%, #f0f 83%, #f00 100%)'
                  }}
                  onMouseDown={(e) => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                    const newH = x * 360
                    const newHsv = { ...hsv, h: newH }
                    setHsv(newHsv)
                    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v)
                    onChange({ r: rgb.r, g: rgb.g, b: rgb.b, a: value.a })
                    const onMove = (ev: MouseEvent) => {
                      const xr = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
                      const nh = { ...newHsv, h: xr * 360 }
                      setHsv(nh)
                      const rgb2 = hsvToRgb(nh.h, nh.s, nh.v)
                      onChange({ r: rgb2.r, g: rgb2.g, b: rgb2.b, a: value.a })
                    }
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove)
                      window.removeEventListener('mouseup', onUp)
                    }
                    window.addEventListener('mousemove', onMove)
                    window.addEventListener('mouseup', onUp)
                  }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border border-white shadow" style={{ left: `${(hsv.h/360)*100}%`, backgroundColor: `hsl(${hsv.h} 100% 50%)` }} />
                </div>
                {/* Alpha slider */}
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <div
                    className="relative h-3 w-full rounded cursor-pointer"
                    style={{
                      background: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                      backgroundSize: '12px 12px', backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0'
                    }}
                    onMouseDown={(e) => {
                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                      onChange({ ...value, a: x })
                      const onMove = (ev: MouseEvent) => {
                        const xr = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
                        onChange({ ...value, a: xr })
                      }
                      const onUp = () => {
                        window.removeEventListener('mousemove', onMove)
                        window.removeEventListener('mouseup', onUp)
                      }
                      window.addEventListener('mousemove', onMove)
                      window.addEventListener('mouseup', onUp)
                    }}
                  >
                    <div className="absolute inset-0 rounded" style={{ background: `linear-gradient(to right, rgba(${Math.round(255*hsvToRgb(hsv.h, hsv.s, hsv.v).r)}, ${Math.round(255*hsvToRgb(hsv.h, hsv.s, hsv.v).g)}, ${Math.round(255*hsvToRgb(hsv.h, hsv.s, hsv.v).b)}, 0), rgba(${Math.round(255*hsvToRgb(hsv.h, hsv.s, hsv.v).r)}, ${Math.round(255*hsvToRgb(hsv.h, hsv.s, hsv.v).g)}, ${Math.round(255*hsvToRgb(hsv.h, hsv.s, hsv.v).b)}, 1))` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border border-white shadow" style={{ left: `${value.a*100}%`, backgroundColor: `rgba(${Math.round(value.r*255)}, ${Math.round(value.g*255)}, ${Math.round(value.b*255)}, ${value.a})` }} />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{value.a.toFixed(2)}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Preview</div>
                <div className="h-10 w-full rounded border border-gray-200 dark:border-gray-700" style={{ background:
                  `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`, backgroundSize: '12px 12px', backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0' }}>
                  <div className="h-full w-full rounded" style={{ backgroundColor: `rgba(${Math.round(value.r*255)}, ${Math.round(value.g*255)}, ${Math.round(value.b*255)}, ${value.a})` }} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Predefined</div>
                <div className="grid grid-cols-10 gap-1">
                  {predefined.map((h) => (
                    <button
                      key={h}
                      className="h-5 w-5 rounded border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: h }}
                      onClick={() => {
                        const rgb = hexToRgb(h)
                        onChange({ ...value, ...rgb })
                      }}
                      title={h}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-600 dark:text-gray-300">Custom</div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Save current color"
                      onClick={() => {
                        const hexVal = rgbaToHex(value)
                        if (!custom.includes(hexVal)) setCustom([...custom, hexVal])
                      }}
                    >Save</button>
                  </div>
                </div>
                {custom.length === 0 ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400">No custom colors yet.</div>
                ) : (
                  <div className="grid grid-cols-10 gap-1">
                    {custom.map((h) => (
                      <div key={h} className="relative group">
                        <button
                          className="h-5 w-5 rounded border border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: h }}
                          onClick={() => {
                            const rgb = hexToRgb(h)
                            onChange({ ...value, ...rgb })
                          }}
                          title={h}
                        />
                        <button
                          className="absolute -top-1 -right-1 hidden group-hover:block text-[10px] leading-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1"
                          title="Remove"
                          onClick={() => setCustom(custom.filter(c => c !== h))}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
