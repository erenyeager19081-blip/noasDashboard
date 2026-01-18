import DashboardLayout from '../components/DashboardLayout';
import TimeDemand from '../components/TimeDemand';

export default function TimeDemandPage() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <TimeDemand />
      </div>
    </DashboardLayout>
  );
}
