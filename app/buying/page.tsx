import DashboardLayout from '../components/DashboardLayout';
import BuyingSpend from '../components/BuyingSpend';

export default function BuyingPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <BuyingSpend />
      </div>
    </DashboardLayout>
  );
}
