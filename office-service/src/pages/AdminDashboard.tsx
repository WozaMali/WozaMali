import React from "react";
import { AdminLayout } from "../components/AdminLayout";
import { DashboardMetrics } from "../components/DashboardMetrics";

export default function AdminDashboard() {
  return (
    <AdminLayout currentPage="dashboard">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            Woza Mali Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Recycling Made Simple - Admin Portal
          </p>
        </div>

        <DashboardMetrics />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="card-elegant p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="btn-gradient w-full">
                Add New User
              </button>
              <button className="btn-warm w-full">
                Process Collection
              </button>
              <button className="btn-gradient w-full">
                Approve Withdrawal
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-elegant p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>New user registered</span>
                <span className="text-muted-foreground">2 min ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Collection processed</span>
                <span className="text-muted-foreground">15 min ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Withdrawal approved</span>
                <span className="text-muted-foreground">1 hour ago</span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="card-elegant p-6">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Database</span>
                <span className="text-green-500">● Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Supabase</span>
                <span className="text-green-500">● Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span>API</span>
                <span className="text-green-500">● Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}