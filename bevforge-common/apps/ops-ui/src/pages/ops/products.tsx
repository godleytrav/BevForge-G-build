import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Inventory from './inventory';
import RecipesPage from './recipes';

type WorkspaceFocus = 'inventory' | 'recipes' | 'all';

const isWorkspaceFocus = (value: string | null): value is WorkspaceFocus =>
  value === 'inventory' || value === 'recipes' || value === 'all';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const focus = useMemo<WorkspaceFocus>(() => {
    const raw = searchParams.get('focus');
    if (isWorkspaceFocus(raw)) {
      return raw;
    }
    return 'inventory';
  }, [searchParams]);

  const setFocus = (nextFocus: WorkspaceFocus) => {
    const nextParams = new globalThis.URLSearchParams(searchParams);
    if (nextFocus === 'inventory') {
      nextParams.delete('focus');
    } else {
      nextParams.set('focus', nextFocus);
    }
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={focus === 'inventory' ? 'default' : 'outline'}
          onClick={() => setFocus('inventory')}
        >
          Inventory
        </Button>
        <Button
          size="sm"
          variant={focus === 'recipes' ? 'default' : 'outline'}
          onClick={() => setFocus('recipes')}
        >
          Recipes
        </Button>
        <Button
          size="sm"
          variant={focus === 'all' ? 'default' : 'outline'}
          onClick={() => setFocus('all')}
        >
          Combined
        </Button>
      </div>

      {focus === 'inventory' && <Inventory />}
      {focus === 'recipes' && <RecipesPage />}

      {focus === 'all' && (
        <div className="space-y-10">
          <Inventory />
          <RecipesPage />
        </div>
      )}
    </div>
  );
}
