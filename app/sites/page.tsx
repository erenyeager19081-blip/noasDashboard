import DashboardLayout from '../components/DashboardLayout';
import SiteComparison from '../components/SiteComparison';

export default function SitesPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <SiteComparison />
      </div>
    </DashboardLayout>
  );
}
