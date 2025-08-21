// This file contains examples of how to use the new Supabase services
// that connect to your installed database schemas

import React, { useState, useEffect } from 'react'
import { 
  dashboardServices, 
  analyticsServices, 
  pickupServices,
  materialServices,
  profileServices 
} from './supabase-services'
import type {
  CustomerDashboardView,
  CollectorDashboardView,
  AdminDashboardView,
  SystemImpactView,
  MaterialPerformanceView
} from './supabase'

// Example 1: Customer Dashboard Component
export const CustomerDashboardExample: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<CustomerDashboardView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const data = await dashboardServices.getCustomerDashboard()
        setDashboardData(data)
      } catch (err) {
        setError('Failed to fetch dashboard data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) return <div>Loading dashboard...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="customer-dashboard">
      <h2>My Recycling Dashboard</h2>
      {dashboardData.map((pickup) => (
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
      ))}
    </div>
  )
}

// Example 2: Admin Analytics Component
export const AdminAnalyticsExample: React.FC = () => {
  const [systemImpact, setSystemImpact] = useState<SystemImpactView | null>(null)
  const [materialPerformance, setMaterialPerformance] = useState<MaterialPerformanceView[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const [impact, materials] = await Promise.all([
          analyticsServices.getSystemImpact(),
          analyticsServices.getMaterialPerformance()
        ])
        
        setSystemImpact(impact)
        setMaterialPerformance(materials || [])
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) return <div>Loading analytics...</div>

  return (
    <div className="admin-analytics">
      <h2>System Analytics</h2>
      
      {systemImpact && (
        <div className="system-overview">
          <h3>System Overview</h3>
          <div className="metrics-grid">
            <div className="metric">
              <h4>Total Pickups</h4>
              <p>{systemImpact.total_pickups}</p>
            </div>
            <div className="metric">
              <h4>Total Weight Collected</h4>
              <p>{systemImpact.total_kg_collected} kg</p>
            </div>
            <div className="metric">
              <h4>Total Value Generated</h4>
              <p>R{systemImpact.total_value_generated}</p>
            </div>
            <div className="metric">
              <h4>CO2 Saved</h4>
              <p>{systemImpact.total_co2_saved} kg</p>
            </div>
            <div className="metric">
              <h4>Water Saved</h4>
              <p>{systemImpact.total_water_saved} L</p>
            </div>
            <div className="metric">
              <h4>Trees Equivalent</h4>
              <p>{systemImpact.total_trees_equivalent}</p>
            </div>
          </div>
        </div>
      )}

      <div className="material-performance">
        <h3>Material Performance</h3>
        <div className="materials-grid">
          {materialPerformance.map((material) => (
            <div key={material.material_name} className="material-card">
              <h4>{material.material_name}</h4>
              <p>Category: {material.category}</p>
              <p>Rate: R{material.rate_per_kg}/kg</p>
              <p>Total Collected: {material.total_kg_collected} kg</p>
              <p>Total Value: R{material.total_value_generated}</p>
              <p>CO2 Saved: {material.total_co2_saved} kg</p>
              <p>Points Generated: {material.total_points_generated}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Example 3: Collector Dashboard Component
export const CollectorDashboardExample: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<CollectorDashboardView[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCollectorDashboard = async () => {
      try {
        setLoading(true)
        const data = await dashboardServices.getCollectorDashboard()
        setDashboardData(data)
      } catch (err) {
        console.error('Failed to fetch collector dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCollectorDashboard()
  }, [])

  if (loading) return <div>Loading collector dashboard...</div>

  return (
    <div className="collector-dashboard">
      <h2>Collector Dashboard</h2>
      {dashboardData.map((pickup) => (
        <div key={pickup.pickup_id} className="pickup-card">
          <h3>Pickup #{pickup.pickup_id.slice(0, 8)}</h3>
          <div className="customer-info">
            <h4>Customer Information</h4>
            <p>Name: {pickup.customer_name}</p>
            <p>Email: {pickup.customer_email}</p>
            <p>Phone: {pickup.customer_phone}</p>
          </div>
          
          <div className="pickup-details">
            <h4>Pickup Details</h4>
            <p>Status: {pickup.status}</p>
            <p>Total Weight: {pickup.total_kg} kg</p>
            <p>Total Value: R{pickup.total_value}</p>
            <p>Points Earned: {pickup.total_points}</p>
          </div>

          <div className="address-info">
            <h4>Pickup Address</h4>
            <p>{pickup.line1}</p>
            <p>{pickup.suburb}, {pickup.city}</p>
            <p>{pickup.postal_code}</p>
          </div>

          <div className="payment-info">
            <h4>Payment Information</h4>
            <p>Status: {pickup.payment_status || 'Pending'}</p>
            <p>Amount: R{pickup.payment_amount || 0}</p>
            <p>Method: {pickup.payment_method || 'Not specified'}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// Example 4: Material Management Component
export const MaterialManagementExample: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true)
        const data = await materialServices.getActiveMaterials()
        setMaterials(data)
      } catch (err) {
        console.error('Failed to fetch materials:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [])

  if (loading) return <div>Loading materials...</div>

  return (
    <div className="material-management">
      <h2>Available Materials</h2>
      <div className="materials-grid">
        {materials.map((material) => (
          <div key={material.id} className="material-card">
            <h3>{material.name}</h3>
            <p>Category: {material.category}</p>
            <p>Rate: R{material.rate_per_kg}/{material.unit}</p>
            <p>Status: {material.is_active ? 'Active' : 'Inactive'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Example 5: Pickup Creation Component
export const PickupCreationExample: React.FC = () => {
  const [customerId, setCustomerId] = useState('')
  const [collectorId, setCollectorId] = useState('')
  const [addressId, setAddressId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreatePickup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerId || !collectorId || !addressId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const pickup = await pickupServices.createPickup({
        customer_id: customerId,
        collector_id: collectorId,
        address_id: addressId
      })

      if (pickup) {
        alert('Pickup created successfully!')
        // Reset form or redirect
      } else {
        alert('Failed to create pickup')
      }
    } catch (err) {
      console.error('Error creating pickup:', err)
      alert('Error creating pickup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pickup-creation">
      <h2>Create New Pickup</h2>
      <form onSubmit={handleCreatePickup}>
        <div className="form-group">
          <label htmlFor="customerId">Customer ID:</label>
          <input
            id="customerId"
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="collectorId">Collector ID:</label>
          <input
            id="collectorId"
            type="text"
            value={collectorId}
            onChange={(e) => setCollectorId(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="addressId">Address ID:</label>
          <input
            id="addressId"
            type="text"
            value={addressId}
            onChange={(e) => setAddressId(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Pickup'}
        </button>
      </form>
    </div>
  )
}

// Example 6: Profile Management Component
export const ProfileManagementExample: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState<Profile['role']>('customer')

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true)
        const data = await profileServices.getProfilesByRole(selectedRole)
        setProfiles(data)
      } catch (err) {
        console.error('Failed to fetch profiles:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [selectedRole])

  if (loading) return <div>Loading profiles...</div>

  return (
    <div className="profile-management">
      <h2>Profile Management</h2>
      
      <div className="role-filter">
        <label htmlFor="roleSelect">Filter by Role:</label>
        <select
          id="roleSelect"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as Profile['role'])}
        >
          <option value="customer">Customer</option>
          <option value="collector">Collector</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="profiles-grid">
        {profiles.map((profile) => (
          <div key={profile.id} className="profile-card">
            <h3>{profile.full_name || 'No Name'}</h3>
            <p>Email: {profile.email}</p>
            <p>Phone: {profile.phone || 'No Phone'}</p>
            <p>Role: {profile.role}</p>
            <p>Status: {profile.is_active ? 'Active' : 'Inactive'}</p>
            <p>Created: {new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Export all examples for easy importing
export {
  CustomerDashboardExample,
  AdminAnalyticsExample,
  CollectorDashboardExample,
  MaterialManagementExample,
  PickupCreationExample,
  ProfileManagementExample
}
