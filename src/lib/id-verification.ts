// ID-Verifizierungs-Modus: 'didit' (automatische Online-Prüfung) oder
// 'manual' (Züchter lädt Ausweis + Selfie hoch, Admin prüft von Hand).
// Schaltbar unter /admin/einstellungen, gespeichert in platform_settings.
// Default: 'didit' (auch wenn Key/Tabelle fehlt oder bei DB-Fehler).
import { prisma } from '@/lib/prisma'

export type IdVerificationMode = 'didit' | 'manual'

export async function getIdVerificationMode(): Promise<IdVerificationMode> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: 'id_verification_mode' } })
    return row?.value === 'manual' ? 'manual' : 'didit'
  } catch {
    return 'didit'
  }
}
