import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface BatchSourceInputDraft {
  id: string;
  category: 'juice' | 'yeast' | 'additive' | 'nutrient' | 'sugar' | 'fining' | 'ingredient' | 'other';
  name: string;
  lotCode?: string;
  sourceName?: string;
  quantity?: string;
  unit?: string;
  brix?: string;
  note?: string;
}

interface BatchSourceInputsFieldsProps {
  value: BatchSourceInputDraft[];
  onChange: (value: BatchSourceInputDraft[]) => void;
  disabled?: boolean;
}

const makeSourceInput = (): BatchSourceInputDraft => ({
  id:
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `source-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  category: 'juice',
  name: '',
  quantity: '',
  unit: '',
  brix: '',
  note: '',
});

const categoryOptions: Array<{ value: BatchSourceInputDraft['category']; label: string }> = [
  { value: 'juice', label: 'Juice / Must' },
  { value: 'yeast', label: 'Yeast' },
  { value: 'additive', label: 'Additive' },
  { value: 'nutrient', label: 'Nutrient' },
  { value: 'sugar', label: 'Sugar' },
  { value: 'fining', label: 'Fining' },
  { value: 'ingredient', label: 'Ingredient' },
  { value: 'other', label: 'Other' },
];

export default function BatchSourceInputsFields({
  value,
  onChange,
  disabled = false,
}: BatchSourceInputsFieldsProps) {
  const entries = value.length > 0 ? value : [makeSourceInput()];

  const updateEntry = (id: string, patch: Partial<BatchSourceInputDraft>) => {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const addEntry = () => {
    onChange([...entries, makeSourceInput()]);
  };

  const removeEntry = (id: string) => {
    const next = entries.filter((entry) => entry.id !== id);
    onChange(next.length > 0 ? next : [makeSourceInput()]);
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div key={entry.id} className="rounded-xl border border-border/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Source Input {index + 1}</p>
              <p className="text-xs text-muted-foreground">
                Capture ingredient, juice, lot, and supplier details for traceability.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeEntry(entry.id)}
              disabled={disabled}
            >
              Remove
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Category</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={entry.category}
                onChange={(event) =>
                  updateEntry(entry.id, {
                    category: event.target.value as BatchSourceInputDraft['category'],
                  })
                }
                disabled={disabled}
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={entry.name}
                onChange={(event) => updateEntry(entry.id, { name: event.target.value })}
                placeholder="Fresh-pressed dessert apple juice"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <Label>Lot / Source Code</Label>
              <Input
                value={entry.lotCode ?? ''}
                onChange={(event) => updateEntry(entry.id, { lotCode: event.target.value })}
                placeholder="JUICE-2026-001"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <Label>Supplier / Orchard / Source</Label>
              <Input
                value={entry.sourceName ?? ''}
                onChange={(event) => updateEntry(entry.id, { sourceName: event.target.value })}
                placeholder="Godley Orchard Block A"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={entry.quantity ?? ''}
                onChange={(event) => updateEntry(entry.id, { quantity: event.target.value })}
                placeholder="155"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <Label>Unit</Label>
              <Input
                value={entry.unit ?? ''}
                onChange={(event) => updateEntry(entry.id, { unit: event.target.value })}
                placeholder="gal"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1">
              <Label>Brix (optional)</Label>
              <Input
                type="number"
                value={entry.brix ?? ''}
                onChange={(event) => updateEntry(entry.id, { brix: event.target.value })}
                placeholder="70"
                disabled={disabled}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={entry.note ?? ''}
                onChange={(event) => updateEntry(entry.id, { note: event.target.value })}
                placeholder="Pressed 2026-03-18, sulfited before transfer, yeast pitched from starter lot Y-18."
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addEntry} disabled={disabled}>
        Add Source Input
      </Button>
    </div>
  );
}
