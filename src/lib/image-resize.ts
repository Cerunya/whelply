// Verkleinert/komprimiert ein Bild im Browser vor dem Upload, damit Fotos
// (insb. von Smartphones, oft 3-8MB) nicht in voller Größe übertragen und
// ausgeliefert werden müssen. Reduziert Ladezeiten erheblich.

export async function resizeImage(
  file: File,
  maxDimension = 1920,
  quality = 0.85
): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }

  let objectUrl: string | null = null
  try {
    const img = await loadImage(file, (url) => { objectUrl = url })
    const { width, height } = img

    // Kleine Bilder unverändert lassen
    if (width <= maxDimension && height <= maxDimension && file.size <= 1.5 * 1024 * 1024) {
      return file
    }

    const scale = Math.min(1, maxDimension / Math.max(width, height))
    const targetWidth = Math.max(1, Math.round(width * scale))
    const targetHeight = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    })
    if (!blob) return file

    // Nur verwenden, wenn tatsächlich kleiner als das Original
    if (blob.size >= file.size) return file

    const newName = file.name.replace(/\.\w+$/, '') + '.jpg'
    return new File([blob], newName, { type: 'image/jpeg' })
  } catch {
    return file
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
  }
}

function loadImage(file: File, onUrl: (url: string) => void): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    onUrl(url)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'))
    img.src = url
  })
}
