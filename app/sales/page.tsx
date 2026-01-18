import DashboardLayout from '../components/DashboardLayout';
import SalesPerformance from '../components/SalesPerformance';

export default function SalesPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <SalesPerformance />
      </div>
    </DashboardLayout>
  );
}
