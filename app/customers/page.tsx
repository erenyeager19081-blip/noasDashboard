import DashboardLayout from '../components/DashboardLayout';
import CustomerBehaviour from '../components/CustomerBehaviour';

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <CustomerBehaviour />
      </div>
    </DashboardLayout>
  );
}
