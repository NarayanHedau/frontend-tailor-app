export default function StatCard({ label, value, icon: Icon, color = 'blue', sub }) {
  const colors = {
    blue: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
