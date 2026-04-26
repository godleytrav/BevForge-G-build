import { useParams } from 'react-router-dom';
import YeastDetailsPage from './YeastDetailsPage';
import MaltDetailsPage from './MaltDetailsPage';
import HopsDetailsPage from './HopsDetailsPage';
import FruitDetailsPage from './FruitDetailsPage';
import ItemDetailsPage from './ItemDetailsPage';

// Mock data to determine category - in production, fetch from API
const mockItemCategories: Record<string, string> = {
  '1': 'yeast',
  '2': 'hops',
  '3': 'malt',
  '4': 'packaging',
  '5': 'packaging',
  '6': 'fruit',
};

export default function ItemDetailsRouter() {
  const { id } = useParams<{ id: string }>();
  
  // In production: fetch item category from API
  const category = id ? mockItemCategories[id] : undefined;

  // Route to category-specific page
  switch (category) {
    case 'yeast':
      return <YeastDetailsPage />;
    case 'malt':
      return <MaltDetailsPage />;
    case 'hops':
      return <HopsDetailsPage />;
    case 'fruit':
      return <FruitDetailsPage />;
    default:
      // Fallback to generic page for other categories (packaging, additives, etc.)
      return <ItemDetailsPage />;
  }
}
