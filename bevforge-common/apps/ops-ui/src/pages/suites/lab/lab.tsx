// LAB Suite - Recipe Management & R&D
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Beaker, FileText, TrendingUp, Archive } from 'lucide-react';
import { useState } from 'react';

export default function LabPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Lab – Recipes & R&D</h1>
        <p className="text-muted-foreground">
          Welcome to the Lab suite. Develop recipes, track experiments, and innovate your brewing process.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recipe Management */}
        <Card 
          className="backdrop-blur-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(160, 75%, 50%)',
            backdropFilter: 'blur(12px)',
            boxShadow: hoveredCard === 'recipes' ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none'
          }}
          onMouseEnter={() => setHoveredCard('recipes')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5" style={{ color: 'hsl(240, 70%, 60%)' }} />
              Recipe Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create, edit, and version control your brewing recipes and formulations.
            </p>
          </CardContent>
        </Card>

        {/* Experiment Tracking */}
        <Card 
          className="backdrop-blur-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(160, 75%, 50%)',
            backdropFilter: 'blur(12px)',
            boxShadow: hoveredCard === 'experiments' ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none'
          }}
          onMouseEnter={() => setHoveredCard('experiments')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" style={{ color: 'hsl(240, 70%, 60%)' }} />
              Experiment Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Document R&D experiments, test batches, and innovation projects.
            </p>
          </CardContent>
        </Card>

        {/* Quality Analysis */}
        <Card 
          className="backdrop-blur-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(160, 75%, 50%)',
            backdropFilter: 'blur(12px)',
            boxShadow: hoveredCard === 'quality' ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none'
          }}
          onMouseEnter={() => setHoveredCard('quality')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" style={{ color: 'hsl(240, 70%, 60%)' }} />
              Quality Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Analyze taste profiles, chemical properties, and quality metrics.
            </p>
          </CardContent>
        </Card>

        {/* Recipe Archive */}
        <Card 
          className="backdrop-blur-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(160, 75%, 50%)',
            backdropFilter: 'blur(12px)',
            boxShadow: hoveredCard === 'archive' ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none'
          }}
          onMouseEnter={() => setHoveredCard('archive')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" style={{ color: 'hsl(240, 70%, 60%)' }} />
              Recipe Archive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access historical recipes, seasonal brews, and legacy formulations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
