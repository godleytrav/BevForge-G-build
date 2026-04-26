import { Navigate, useParams } from 'react-router-dom';

export default function OpsCrmClientDetailPage() {
  const { clientId } = useParams();

  if (!clientId) {
    return <Navigate to="/ops/crm/clients" replace />;
  }

  return <Navigate to={`/ops/crm/records/client/${clientId}`} replace />;
}
