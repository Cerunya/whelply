'use client'

export type PuppyCareValues = {
  hasPedigree: boolean
  isVaccinated: boolean
  isDewormed: boolean
  isChipped: boolean
  isInsured: boolean
  trainingMedical: boolean
  trainingCharaktertest: boolean
  trainingAndereTiere: boolean
  trainingHaushaltsgeraeusche: boolean
  trainingKinder: boolean
  trainingAutofahren: boolean
  trainingBelebteOrte: boolean
  trainingNotes: string
}

export const EMPTY_PUPPY_CARE: PuppyCareValues = {
  hasPedigree: false,
  isVaccinated: false,
  isDewormed: false,
  isChipped: false,
  isInsured: false,
  trainingMedical: false,
  trainingCharaktertest: false,
  trainingAndereTiere: false,
  trainingHaushaltsgeraeusche: false,
  trainingKinder: false,
  trainingAutofahren: false,
  trainingBelebteOrte: false,
  trainingNotes: '',
}

const HEALTH_FIELDS = [
  { key: 'hasPedigree', label: 'Ahnentafel vorhanden' },
  { key: 'isVaccinated', label: 'Geimpft' },
  { key: 'isDewormed', label: 'Entwurmt' },
  { key: 'isChipped', label: 'Gechipt' },
  { key: 'isInsured', label: 'Versichert' },
] as const

const TRAINING_FIELDS = [
  { key: 'trainingMedical', label: 'Medical Training' },
  { key: 'trainingCharaktertest', label: 'Charaktertest' },
  { key: 'trainingAndereTiere', label: 'Andere Tiere' },
  { key: 'trainingHaushaltsgeraeusche', label: 'Haushaltsgeräusche' },
  { key: 'trainingKinder', label: 'Kinder' },
  { key: 'trainingAutofahren', label: 'Autofahren' },
  { key: 'trainingBelebteOrte', label: 'Belebte Orte' },
] as const

export default function PuppyCareFields({
  values,
  onChange,
  disabled = false,
}: {
  values: PuppyCareValues
  onChange: (values: PuppyCareValues) => void
  disabled?: boolean
}) {
  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest bg-white disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400'

  function renderFields(fields: typeof HEALTH_FIELDS | typeof TRAINING_FIELDS) {
    return fields.map(({ key, label }) => (
      <label key={key} className={`flex items-center gap-3 p-3 bg-cream rounded-xl border border-cream-deep transition-colors ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-stone-50'}`}>
        <input
          type="checkbox"
          checked={values[key]}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, [key]: e.target.checked })}
          className="w-4 h-4 rounded accent-forest disabled:cursor-not-allowed"
        />
        <span className="text-sm text-stone-700">{label}</span>
      </label>
    ))
  }

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-3">Gesundheit &amp; Dokumente</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderFields(HEALTH_FIELDS)}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-3">Training &amp; Sozialisierung</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderFields(TRAINING_FIELDS)}
        </div>
        <textarea
          value={values.trainingNotes}
          disabled={disabled}
          onChange={(e) => onChange({ ...values, trainingNotes: e.target.value })}
          rows={3}
          maxLength={1000}
          placeholder="Weitere Angaben zu Training & Sozialisierung (optional)"
          className={inputClass + ' resize-none mt-3'}
        />
      </div>
    </>
  )
}
