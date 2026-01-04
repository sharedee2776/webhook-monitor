import React, { useState } from 'react';

const initialMembers = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Owner' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'Member' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'Viewer' },
];

const roles = ['Owner', 'Admin', 'Member', 'Viewer'];

const RoleAccessControl: React.FC = () => {
  const [members, setMembers] = useState(initialMembers);

  const changeRole = (id: number, newRole: string) => {
    setMembers(members.map(m => m.id === id ? { ...m, role: newRole } : m));
  };

  return (
    <div style={{ margin: '2rem 0' }}>
      <h2>Role-Based Access Control</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        <thead style={{ background: '#f5f5f5' }}>
          <tr>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Role</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.75rem' }}>{member.name}</td>
              <td style={{ padding: '0.75rem' }}>{member.email}</td>
              <td style={{ padding: '0.75rem' }}>
                <select value={member.role} onChange={e => changeRole(member.id, e.target.value)} style={{ padding: '0.4rem' }}>
                  {roles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoleAccessControl;
