# Team Management Guide

## 🎯 Quick Setup: Add playamin998@gmail.com to Hamid Store

### SQL Command (Run in Supabase):
```sql
INSERT INTO store_teams (store_id, user_id, role, status, permissions)
SELECT 
    s.id, u.id, 'admin', 'active',
    '{"canManageContent": true, "canManageProducts": true, "canManageOrders": true}'::jsonb
FROM stores s, users u
WHERE s.name = 'Hamid' AND u.email = 'playamin998@gmail.com'
ON CONFLICT (store_id, user_id) DO UPDATE SET role = 'admin', status = 'active';
```

## 🔧 Team Management Options for info@itomoti.com

### Option 1: API Endpoints (Recommended)
You can manage teams through these API endpoints:

#### **View Team Members**
```bash
GET /api/store-teams/{store_id}
Authorization: Bearer {your_token}
```

#### **Invite New Member**
```bash
POST /api/store-teams/{store_id}/invite
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "email": "playamin998@gmail.com",
  "role": "admin",
  "message": "Welcome to the Hamid store team!"
}
```

#### **Update Member Role**
```bash
PUT /api/store-teams/{store_id}/members/{member_id}
Authorization: Bearer {your_token}
Content-Type: application/json

{
  "role": "editor",
  "permissions": {
    "canManageProducts": true,
    "canManageOrders": false
  }
}
```

#### **Remove Member**
```bash
DELETE /api/store-teams/{store_id}/members/{member_id}
Authorization: Bearer {your_token}
```

### Option 2: Direct SQL Management (Supabase)

#### **View All Team Members**
```sql
SELECT 
    s.name as store_name,
    u.email as member_email,
    st.role,
    st.status,
    st.permissions,
    st.accepted_at
FROM store_teams st
JOIN stores s ON s.id = st.store_id
JOIN users u ON u.id = st.user_id
WHERE s.user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com')
   OR st.store_id IN (
       SELECT store_id FROM store_teams 
       WHERE user_id = (SELECT id FROM users WHERE email = 'info@itomoti.com')
   )
ORDER BY s.name, u.email;
```

#### **Add Team Member**
```sql
INSERT INTO store_teams (store_id, user_id, role, status, permissions)
SELECT 
    s.id, u.id, 'admin', 'active',
    '{"canManageContent": true}'::jsonb
FROM stores s, users u
WHERE s.name = 'STORE_NAME' AND u.email = 'USER_EMAIL';
```

#### **Remove Team Member**
```sql
UPDATE store_teams 
SET status = 'removed', is_active = false
WHERE store_id = (SELECT id FROM stores WHERE name = 'STORE_NAME')
  AND user_id = (SELECT id FROM users WHERE email = 'USER_EMAIL');
```

### Option 3: Frontend Interface (To Be Built)

We can create a team management interface at:
- `/admin/team-management` - View and manage all team members
- Store selector dropdown to choose which store to manage
- Team member list with roles and permissions
- Add/invite/remove member functionality

## 🔑 Role Permissions

### **Owner** (Store Creator)
- Full access to everything
- Can transfer ownership
- Can delete store
- Can manage team members

### **Admin** (Team Member)
- Manage store content
- Manage team members
- View all reports
- Cannot delete store or transfer ownership

### **Editor** (Team Member)
- Manage products, categories, orders
- View reports
- Cannot manage team members

### **Viewer** (Team Member)
- Read-only access
- View products, orders, reports
- Cannot make changes

## 📍 Where to Manage Teams Currently

### **API Testing (Postman/Thunder Client)**
```
Base URL: https://catalyst-backend-fzhu.onrender.com
Authorization: Bearer {store_owner_auth_token from localStorage}

1. GET /api/store-teams/{hamid_store_id} - View team
2. POST /api/store-teams/{hamid_store_id}/invite - Invite member
3. PUT /api/store-teams/{hamid_store_id}/members/{member_id} - Update role
4. DELETE /api/store-teams/{hamid_store_id}/members/{member_id} - Remove
```

### **Browser Console (Quick Test)**
```javascript
// Get Hamid store ID
fetch('/api/stores/dropdown', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('store_owner_auth_token')}` }
})
.then(r => r.json())
.then(data => {
  const hamidStore = data.data.find(s => s.name === 'Hamid');
  console.log('Hamid Store ID:', hamidStore.id);
  
  // View team members
  return fetch(`/api/store-teams/${hamidStore.id}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('store_owner_auth_token')}` }
  });
})
.then(r => r.json())
.then(data => console.log('Team Members:', data));
```

### **Supabase Dashboard (Direct Database)**
- Go to Supabase → Table Editor
- Open `store_teams` table
- View/edit team memberships directly

## 🚀 Next Steps

1. **Run the SQL** to add playamin998@gmail.com to Hamid store
2. **Test API endpoints** to manage the team
3. **Build frontend interface** for easier team management (optional)

The team system is fully functional - you just need to choose your preferred management method!