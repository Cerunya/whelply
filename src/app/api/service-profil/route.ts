import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { geocodeAddress } from '@/lib/geocode'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const provider = await prisma.serviceProvider.findUnique({ where: { userId: session.user.id } })
  if (!provider) return NextResponse.json({ error: 'Kein Dienstleister-Profil' }, { status: 404 })

  const body = await req.json()

  await prisma.serviceProvider.update({
    where: { id: provider.id },
    data: {
      name: body.name?.slice(0, 120) || provider.name,
      category: body.category || provider.category,
      description: body.description || null,
      street: body.street || null,
      zip: body.zip?.slice(0, 5) || null,
      city: body.city?.slice(0, 80) || null,
      state: body.state?.slice(0, 50) || null,
      phone: body.phone?.slice(0, 20) || null,
      website: body.website?.slice(0, 200) || null,
      openingHours: body.openingHours || null,
      paymentMethods: body.paymentMethods || null,
    },
  })

  // Koordinaten aktualisieren
  if (body.zip || body.city) {
    const coords = await geocodeAddress({ zip: body.zip, city: body.city, state: body.state, street: body.street })
    if (coords) {
      await prisma.serviceProvider.update({
        where: { id: provider.id },
        data: { lat: coords.lat, lng: coords.lng },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
