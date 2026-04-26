import { useState } from 'react';
import { BookOpen, Plus, Search, Filter, Copy, Edit, Beaker, Scale, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Recipe {
  id: string;
  name: string;
  type: string;
  style: string;
  targetAbv: number;
  targetIbu?: number;
  batchSize: number;
  batchUnit: string;
  status: 'active' | 'draft' | 'archived';
  ingredients: Ingredient[];
  instructions: string[];
  notes?: string;
  createdDate: string;
  lastBrewed?: string;
  totalBatches: number;
}

interface Ingredient {
  id: string;
  name: string;
  type: 'grain' | 'hops' | 'yeast' | 'adjunct' | 'other';
  quantity: number;
  unit: string;
  timing?: string;
  notes?: string;
}

export default function RecipesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Mock data
  const recipes: Recipe[] = [
    {
      id: '1',
      name: 'Hoppy Trail IPA',
      type: 'Beer',
      style: 'West Coast IPA',
      targetAbv: 6.5,
      targetIbu: 65,
      batchSize: 10,
      batchUnit: 'bbl',
      status: 'active',
      createdDate: '2023-06-15',
      lastBrewed: '2024-12-01',
      totalBatches: 45,
      notes: 'Signature IPA with Cascade and Centennial hops',
      ingredients: [
        { id: 'i1', name: '2-Row Pale Malt', type: 'grain', quantity: 200, unit: 'lbs' },
        { id: 'i2', name: 'Crystal 40L', type: 'grain', quantity: 20, unit: 'lbs' },
        { id: 'i3', name: 'Cascade Hops', type: 'hops', quantity: 4, unit: 'lbs', timing: '60 min' },
        { id: 'i4', name: 'Centennial Hops', type: 'hops', quantity: 3, unit: 'lbs', timing: 'Dry hop' },
        { id: 'i5', name: 'US-05 Yeast', type: 'yeast', quantity: 2, unit: 'packs' },
      ],
      instructions: [
        'Mash at 152°F for 60 minutes',
        'Boil for 90 minutes',
        'Add Cascade hops at 60 minutes',
        'Whirlpool at 180°F for 20 minutes',
        'Ferment at 68°F for 14 days',
        'Dry hop with Centennial for 5 days',
        'Cold crash and package',
      ],
    },
    {
      id: '2',
      name: 'Golden Sunset Lager',
      type: 'Beer',
      style: 'German Pilsner',
      targetAbv: 4.8,
      targetIbu: 35,
      batchSize: 15,
      batchUnit: 'bbl',
      status: 'active',
      createdDate: '2023-08-20',
      lastBrewed: '2024-11-28',
      totalBatches: 62,
      notes: 'Crisp and clean lager with noble hops',
      ingredients: [
        { id: 'i6', name: 'Pilsner Malt', type: 'grain', quantity: 280, unit: 'lbs' },
        { id: 'i7', name: 'Saaz Hops', type: 'hops', quantity: 2, unit: 'lbs', timing: '60 min' },
        { id: 'i8', name: 'W-34/70 Yeast', type: 'yeast', quantity: 3, unit: 'packs' },
      ],
      instructions: [
        'Mash at 148°F for 90 minutes',
        'Boil for 90 minutes',
        'Add Saaz hops at 60 minutes',
        'Ferment at 50°F for 21 days',
        'Lager at 35°F for 28 days',
        'Package',
      ],
    },
    {
      id: '3',
      name: 'Midnight Stout',
      type: 'Beer',
      style: 'Imperial Stout',
      targetAbv: 8.2,
      targetIbu: 55,
      batchSize: 7,
      batchUnit: 'bbl',
      status: 'active',
      createdDate: '2023-10-10',
      lastBrewed: '2024-12-10',
      totalBatches: 18,
      notes: 'Rich and complex with coffee and chocolate notes',
      ingredients: [
        { id: 'i9', name: '2-Row Pale Malt', type: 'grain', quantity: 140, unit: 'lbs' },
        { id: 'i10', name: 'Roasted Barley', type: 'grain', quantity: 15, unit: 'lbs' },
        { id: 'i11', name: 'Chocolate Malt', type: 'grain', quantity: 12, unit: 'lbs' },
        { id: 'i12', name: 'Flaked Oats', type: 'grain', quantity: 10, unit: 'lbs' },
        { id: 'i13', name: 'Magnum Hops', type: 'hops', quantity: 1.5, unit: 'lbs', timing: '60 min' },
        { id: 'i14', name: 'Cold Brew Coffee', type: 'adjunct', quantity: 2, unit: 'gallons', timing: 'Secondary' },
        { id: 'i15', name: 'US-05 Yeast', type: 'yeast', quantity: 3, unit: 'packs' },
      ],
      instructions: [
        'Mash at 154°F for 75 minutes',
        'Boil for 90 minutes',
        'Add Magnum hops at 60 minutes',
        'Ferment at 68°F for 14 days',
        'Transfer to secondary and add cold brew coffee',
        'Age for 7 days',
        'Package',
      ],
    },
    {
      id: '4',
      name: 'Citrus Burst Seltzer',
      type: 'Seltzer',
      style: 'Hard Seltzer',
      targetAbv: 5.0,
      batchSize: 20,
      batchUnit: 'bbl',
      status: 'active',
      createdDate: '2024-03-01',
      lastBrewed: '2024-12-05',
      totalBatches: 28,
      notes: 'Light and refreshing with natural citrus flavors',
      ingredients: [
        { id: 'i16', name: 'Cane Sugar', type: 'adjunct', quantity: 150, unit: 'lbs' },
        { id: 'i17', name: 'Citric Acid', type: 'adjunct', quantity: 2, unit: 'lbs' },
        { id: 'i18', name: 'Natural Citrus Flavor', type: 'adjunct', quantity: 1, unit: 'gallon' },
        { id: 'i19', name: 'Champagne Yeast', type: 'yeast', quantity: 2, unit: 'packs' },
      ],
      instructions: [
        'Dissolve cane sugar in hot water',
        'Cool to fermentation temperature',
        'Pitch yeast and ferment at 70°F for 7 days',
        'Add citric acid and natural flavors',
        'Carbonate and package',
      ],
    },
  ];

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.style.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || recipe.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'draft':
        return 'bg-yellow-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getIngredientTypeColor = (type: string) => {
    switch (type) {
      case 'grain':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'hops':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'yeast':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'adjunct':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipe Library</h1>
          <p className="text-muted-foreground">Manage formulas and brewing recipes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Recipe</DialogTitle>
              <DialogDescription>Build a new brewing recipe or formula</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipeName">Recipe Name</Label>
                  <Input id="recipeName" placeholder="Hoppy Trail IPA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="style">Style</Label>
                  <Input id="style" placeholder="West Coast IPA" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beer">Beer</SelectItem>
                      <SelectItem value="seltzer">Seltzer</SelectItem>
                      <SelectItem value="cider">Cider</SelectItem>
                      <SelectItem value="wine">Wine</SelectItem>
                      <SelectItem value="spirits">Spirits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAbv">Target ABV (%)</Label>
                  <Input id="targetAbv" type="number" step="0.1" placeholder="6.5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetIbu">Target IBU</Label>
                  <Input id="targetIbu" type="number" placeholder="65" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchSize">Batch Size</Label>
                  <Input id="batchSize" type="number" placeholder="10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchUnit">Unit</Label>
                  <Select>
                    <SelectTrigger id="batchUnit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bbl">Barrels (bbl)</SelectItem>
                      <SelectItem value="gal">Gallons</SelectItem>
                      <SelectItem value="L">Liters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ingredients</Label>
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-4">Ingredient</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-1">Unit</div>
                    <div className="col-span-2">Timing</div>
                    <div className="col-span-1"></div>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <Input className="col-span-4" placeholder="2-Row Pale Malt" />
                    <Select>
                      <SelectTrigger className="col-span-2">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grain">Grain</SelectItem>
                        <SelectItem value="hops">Hops</SelectItem>
                        <SelectItem value="yeast">Yeast</SelectItem>
                        <SelectItem value="adjunct">Adjunct</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input className="col-span-2" type="number" placeholder="200" />
                    <Input className="col-span-1" placeholder="lbs" />
                    <Input className="col-span-2" placeholder="Mash" />
                    <Button variant="ghost" size="sm" className="col-span-1">
                      ×
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Ingredient
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Recipe Notes</Label>
                <Textarea id="notes" placeholder="Add brewing notes, tips, or variations..." rows={3} />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="outline">Save as Draft</Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>Create Recipe</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipes.length}</div>
            <p className="text-xs text-muted-foreground">In library</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recipes</CardTitle>
            <Beaker className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipes.filter((r) => r.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">In production</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recipes.reduce((sum, r) => sum + r.totalBatches, 0)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. ABV</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(recipes.reduce((sum, r) => sum + r.targetAbv, 0) / recipes.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Across recipes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes or styles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Beer">Beer</SelectItem>
                  <SelectItem value="Seltzer">Seltzer</SelectItem>
                  <SelectItem value="Cider">Cider</SelectItem>
                  <SelectItem value="Wine">Wine</SelectItem>
                  <SelectItem value="Spirits">Spirits</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipes Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredRecipes.map((recipe) => (
          <Card key={recipe.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{recipe.name}</CardTitle>
                  <CardDescription>
                    {recipe.style} • {recipe.type}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(recipe.status)}>{recipe.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ABV:</span>
                  <span className="ml-1 font-medium">{recipe.targetAbv}%</span>
                </div>
                {recipe.targetIbu && (
                  <div>
                    <span className="text-muted-foreground">IBU:</span>
                    <span className="ml-1 font-medium">{recipe.targetIbu}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Batch:</span>
                  <span className="ml-1 font-medium">
                    {recipe.batchSize} {recipe.batchUnit}
                  </span>
                </div>
              </div>

              {recipe.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2">{recipe.notes}</p>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Ingredients ({recipe.ingredients.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {recipe.ingredients.slice(0, 5).map((ingredient) => (
                    <Badge
                      key={ingredient.id}
                      variant="outline"
                      className={getIngredientTypeColor(ingredient.type)}
                    >
                      {ingredient.name}
                    </Badge>
                  ))}
                  {recipe.ingredients.length > 5 && (
                    <Badge variant="outline">+{recipe.ingredients.length - 5} more</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm border-t pt-4">
                <div>
                  <span className="text-muted-foreground">Total Batches:</span>
                  <span className="ml-1 font-medium">{recipe.totalBatches}</span>
                </div>
                {recipe.lastBrewed && (
                  <div>
                    <span className="text-muted-foreground">Last Brewed:</span>
                    <span className="ml-1 font-medium">
                      {new Date(recipe.lastBrewed).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recipe Detail Dialog */}
      {selectedRecipe && (
        <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRecipe.name}</DialogTitle>
              <DialogDescription>
                {selectedRecipe.style} • {selectedRecipe.type}
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="ingredients" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              <TabsContent value="ingredients" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Timing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRecipe.ingredients.map((ingredient) => (
                      <TableRow key={ingredient.id}>
                        <TableCell className="font-medium">{ingredient.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getIngredientTypeColor(ingredient.type)}>
                            {ingredient.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ingredient.quantity} {ingredient.unit}
                        </TableCell>
                        <TableCell>{ingredient.timing || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="instructions" className="space-y-4">
                <ol className="space-y-3">
                  {selectedRecipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {index + 1}
                      </span>
                      <span className="text-sm">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </TabsContent>
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target ABV</Label>
                    <p className="text-2xl font-bold">{selectedRecipe.targetAbv}%</p>
                  </div>
                  {selectedRecipe.targetIbu && (
                    <div className="space-y-2">
                      <Label>Target IBU</Label>
                      <p className="text-2xl font-bold">{selectedRecipe.targetIbu}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Batch Size</Label>
                    <p className="text-2xl font-bold">
                      {selectedRecipe.batchSize} {selectedRecipe.batchUnit}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Batches</Label>
                    <p className="text-2xl font-bold">{selectedRecipe.totalBatches}</p>
                  </div>
                </div>
                {selectedRecipe.notes && (
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <p className="text-sm text-muted-foreground">{selectedRecipe.notes}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
