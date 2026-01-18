import DashboardLayout from '../components/DashboardLayout';
import ProductPerformance from '../components/ProductPerformance';

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <ProductPerformance />
      </div>
    </DashboardLayout>
  );
}
