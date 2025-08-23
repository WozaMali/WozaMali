// This file contains examples of how to use the new Supabase services
// that connect to your installed database schemas

import React, { useState, useEffect } from 'react'
import type {
  CustomerDashboardView,
  CollectorDashboardView,
  AdminDashboardView,
  SystemImpactView,
  MaterialPerformanceView,
  Profile,
  Material
} from './supabase'

// Example 1: Customer Dashboard Component
export const CustomerDashboardExample: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<CustomerDashboardView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false)
      setDashboardData([])
    }, 1000)
  }, [])

  if (loading) return <div>Loading dashboard...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="customer-dashboard">
      <h2>My Recycling Dashboard</h2>
      {dashboardData.length === 0 ? (
        <div>No recycling data available yet.</div>
      ) : (
        dashboardData.map((pickup) => (
          <div key={pickup.pickup_id} className="pickup-card">
            <h3>Pickup #{pickup.pickup_id.slice(0, 8)}</h3>
            <div className="pickup-details">
              <p>Status: {pickup.status}</p>
              <p>Total Weight: {pickup.total_kg} kg</p>
              <p>Total Value: R{pickup.total_value}</p>
              <p>Points Earned: {pickup.total_points}</p>
            </div>
            
            <div className="environmental-impact">
              <h4>Environmental Impact</h4>
              <p>CO2 Saved: {pickup.environmental_impact.co2_saved} kg</p>
              <p>Water Saved: {pickup.environmental_impact.water_saved} L</p>
              <p>Trees Equivalent: {pickup.environmental_impact.trees_equivalent}</p>
            </div>

            <div className="fund-allocation">
              <h4>Fund Allocation</h4>
              <p>Green Scholar Fund: R{pickup.fund_allocation.green_scholar_fund}</p>
              <p>Your Wallet: R{pickup.fund_allocation.user_wallet}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// Example 2: Admin Analytics Component
export const AdminAnalyticsExample: React.FC = () => {
  const [systemImpact, setSystemImpact] = useState<SystemImpactView | null>(null)
  const [materialPerformance, setMaterialPerformance] = useState<MaterialPerformanceView[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false)
      setSystemImpact(null)
      setMaterialPerformance([])
    }, 1000)
  }, [])

  if (loading) return <div>Loading analytics...</div>

  return (
    <div className="admin-analytics">
      <h2>System Analytics</h2>
      {systemImpact ? (
        <div className="system-impact">
          <h3>System Impact</h3>
          <p>Total Pickups: {systemImpact.total_pickups}</p>
          <p>Total Customers: {systemImpact.unique_customers}</p>
          <p>Total Collectors: {systemImpact.unique_collectors}</p>
          <p>Total Weight: {systemImpact.total_kg_collected} kg</p>
        </div>
      ) : (
        <div>No system impact data available.</div>
      )}
    </div>
  )
}

// Example 3: Collector Dashboard Component
export const CollectorDashboardExample: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<CollectorDashboardView[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false)
      setDashboardData([])
    }, 1000)
  }, [])

  if (loading) return <div>Loading collector dashboard...</div>

  return (
    <div className="collector-dashboard">
      <h2>Collector Dashboard</h2>
      {dashboardData.length === 0 ? (
        <div>No collection data available yet.</div>
      ) : (
        <div>Collection data will appear here.</div>
      )}
    </div>
  )
}

// Example 4: Material Management Component
export const MaterialManagementExample: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false)
      setMaterials([])
    }, 1000)
  }, [])

  if (loading) return <div>Loading materials...</div>

  return (
    <div className="material-management">
      <h2>Material Management</h2>
      {materials.length === 0 ? (
        <div>No materials available yet.</div>
      ) : (
        <div>Materials will appear here.</div>
      )}
    </div>
  )
}

// Example 5: Pickup Creation Component
export const PickupCreationExample: React.FC = () => {
  const [customerId, setCustomerId] = useState('')
  const [collectorId, setCollectorId] = useState('')
  const [addressId, setAddressId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate pickup creation
    console.log('Creating pickup:', { customerId, collectorId, addressId })
  }

  return (
    <div className="pickup-creation">
      <h2>Create New Pickup</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Customer ID:</label>
          <input
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Collector ID:</label>
          <input
            type="text"
            value={collectorId}
            onChange={(e) => setCollectorId(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Address ID:</label>
          <input
            type="text"
            value={addressId}
            onChange={(e) => setAddressId(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create Pickup</button>
      </form>
    </div>
  )
}

// Example 6: Profile Management Component
export const ProfileManagementExample: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedRole, setSelectedRole] = useState<Profile['role']>('CUSTOMER')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false)
      setProfiles([])
    }, 1000)
  }, [])

  if (loading) return <div>Loading profiles...</div>

  return (
    <div className="profile-management">
      <h2>Profile Management</h2>
      <div>
        <label>Filter by Role:</label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as Profile['role'])}
        >
          <option value="CUSTOMER">Customer</option>
          <option value="COLLECTOR">Collector</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
        </select>
      </div>
      {profiles.length === 0 ? (
        <div>No profiles available yet.</div>
      ) : (
        <div>Profiles will appear here.</div>
      )}
    </div>
  )
}
