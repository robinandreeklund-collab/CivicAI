import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Monitoring Dashboard Component
 * 
 * Features:
 * - Real-time progress dashboard
 * - GPU/CPU utilization charts
 * - Training scheduling
 * - Notification system
 * - Resource usage tracking
 */
export default function MonitoringDashboard() {
  const [resourceMetrics, setResourceMetrics] = useState({ cpu: [], gpu: [], memory: [] });
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchResourceMetrics();
    fetchTrainingHistory();
    fetchSchedule();
    fetchNotifications();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchResourceMetrics();
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchResourceMetrics = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/resources');
      if (response.ok) {
        const data = await response.json();
        setResourceMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching resource metrics:', error);
    }
  };

  const fetchTrainingHistory = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/training-history');
      if (response.ok) {
        const data = await response.json();
        setTrainingHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching training history:', error);
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/schedule');
      if (response.ok) {
        const data = await response.json();
        setSchedule(data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const updateSchedule = async (scheduleData) => {
    try {
      const response = await fetch('/api/admin/monitoring/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });

      if (response.ok) {
        alert('Schedule updated successfully!');
        await fetchSchedule();
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Failed to update schedule');
    }
  };

  const clearNotification = async (notificationId) => {
    try {
      await fetch(`/api/admin/monitoring/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      await fetchNotifications();
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  };

  // Chart data configuration
  const cpuChartData = {
    labels: resourceMetrics.cpu.map((_, i) => `T-${resourceMetrics.cpu.length - i}`),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: resourceMetrics.cpu,
        borderColor: '#888',
        backgroundColor: 'rgba(136, 136, 136, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const gpuChartData = {
    labels: resourceMetrics.gpu.map((_, i) => `T-${resourceMetrics.gpu.length - i}`),
    datasets: [
      {
        label: 'GPU Usage (%)',
        data: resourceMetrics.gpu,
        borderColor: '#eee',
        backgroundColor: 'rgba(238, 238, 238, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: {
          color: '#2a2a2a',
        },
        ticks: {
          color: '#666',
          font: {
            family: 'monospace',
            size: 10,
          },
        },
      },
      x: {
        grid: {
          color: '#2a2a2a',
        },
        ticks: {
          color: '#666',
          font: {
            family: 'monospace',
            size: 10,
          },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
          <h2 className="text-[#eee] font-mono text-lg mb-4">Notifications</h2>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start justify-between p-3 border border-[#2a2a2a] rounded bg-[#0a0a0a]"
              >
                <div className="flex-1">
                  <div className="text-[#888] font-mono text-sm mb-1">
                    {notification.message}
                  </div>
                  <div className="text-[#666] font-mono text-xs">
                    {new Date(notification.timestamp).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => clearNotification(notification.id)}
                  className="text-[#666] hover:text-[#888] text-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resource Usage Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
          <h2 className="text-[#eee] font-mono text-lg mb-4">CPU Usage</h2>
          <div style={{ height: '200px' }}>
            {resourceMetrics.cpu.length > 0 ? (
              <Line data={cpuChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-[#666] font-mono text-sm">
                No data available
              </div>
            )}
          </div>
        </div>

        <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
          <h2 className="text-[#eee] font-mono text-lg mb-4">GPU Usage</h2>
          <div style={{ height: '200px' }}>
            {resourceMetrics.gpu.length > 0 ? (
              <Line data={gpuChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-[#666] font-mono text-sm">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Training Schedule */}
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
        <h2 className="text-[#eee] font-mono text-lg mb-4">Training Schedule</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                Periodic Training
              </label>
              <select
                value={schedule?.frequency || 'manual'}
                onChange={(e) => updateSchedule({ frequency: e.target.value })}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444]"
              >
                <option value="manual">Manual Only</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                Auto-train on New Data
              </label>
              <select
                value={schedule?.autoTrain ? 'enabled' : 'disabled'}
                onChange={(e) => updateSchedule({ autoTrain: e.target.value === 'enabled' })}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444]"
              >
                <option value="disabled">Disabled</option>
                <option value="enabled">Enabled</option>
              </select>
            </div>
          </div>

          {schedule && (
            <div className="p-4 border border-[#2a2a2a] rounded bg-[#0a0a0a]">
              <div className="text-[#666] font-mono text-xs space-y-1">
                <div>Last training: {schedule.lastTraining || 'Never'}</div>
                <div>Next training: {schedule.nextTraining || 'Not scheduled'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Training History */}
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
        <h2 className="text-[#eee] font-mono text-lg mb-4">Recent Training Sessions</h2>
        
        {trainingHistory.length === 0 ? (
          <div className="text-[#666] font-mono text-sm text-center py-8">
            No training history available
          </div>
        ) : (
          <div className="space-y-2">
            {trainingHistory.map((session, index) => (
              <div
                key={index}
                className="p-3 border border-[#2a2a2a] rounded bg-[#0a0a0a]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#888] font-mono text-sm">
                    {session.modelVersion}
                  </span>
                  <span className="text-[#666] font-mono text-xs">
                    {new Date(session.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="text-[#666] font-mono text-xs space-x-4">
                  <span>Duration: {session.duration}s</span>
                  <span>Samples: {session.samples}</span>
                  {session.metrics && (
                    <>
                      <span>Loss: {session.metrics.loss?.toFixed(4)}</span>
                      <span>Accuracy: {session.metrics.accuracy?.toFixed(2)}%</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
