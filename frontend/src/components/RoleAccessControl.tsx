import React, { useState } from 'react';
import { Plus, Trash, Pencil, Check, X } from '@phosphor-icons/react';

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
}

const initialMembers: Member[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Owner' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'Member' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'Viewer' },
];

const roles = ['Owner', 'Admin', 'Member', 'Viewer'];

const RoleAccessControl: React.FC = () => {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Member>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Member' });

  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setEditForm({ name: member.name, email: member.email, role: member.role });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (editingId && editForm.name && editForm.email && editForm.role) {
      setMembers(members.map(m => 
        m.id === editingId 
          ? { ...m, name: editForm.name!, email: editForm.email!, role: editForm.role! }
          : m
      ));
      setEditingId(null);
      setEditForm({});
    }
  };

  const deleteMember = (id: number) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const addMember = () => {
    if (newMember.name && newMember.email && newMember.role) {
      const newId = Math.max(...members.map(m => m.id), 0) + 1;
      setMembers([...members, { ...newMember, id: newId }]);
      setNewMember({ name: '', email: '', role: 'Member' });
      setShowAddForm(false);
    }
  };

  return (
    <div style={{ margin: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Role-Based Access Control</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            <Plus size={18} /> Add Member
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f8f9fa' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Add New Team Member</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Name</label>
              <input
                type="text"
                placeholder="Enter name"
                value={newMember.name}
                onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Email</label>
              <input
                type="email"
                placeholder="Enter email"
                value={newMember.email}
                onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Role</label>
              <select
                value={newMember.role}
                onChange={e => setNewMember({ ...newMember, role: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
              >
                {roles.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={addMember}
                style={{
                  padding: '0.5rem',
                  background: 'var(--success)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Add member"
              >
                <Check size={20} />
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewMember({ name: '', email: '', role: 'Member' });
                }}
                style={{
                  padding: '0.5rem',
                  background: 'var(--error)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Cancel"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <thead style={{ background: '#f5f5f5' }}>
            <tr>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Name</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Email</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Role</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem' }}>
                  {editingId === member.id ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                    />
                  ) : (
                    member.name
                  )}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {editingId === member.id ? (
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                    />
                  ) : (
                    member.email
                  )}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {editingId === member.id ? (
                    <select
                      value={editForm.role || ''}
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                    >
                      {roles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  ) : (
                    <select
                      value={member.role}
                      onChange={e => {
                        setMembers(members.map(m => m.id === member.id ? { ...m, role: e.target.value } : m));
                      }}
                      style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer' }}
                    >
                      {roles.map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                  )}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  {editingId === member.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={saveEdit}
                        style={{
                          padding: '0.4rem',
                          background: 'var(--success)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Save changes"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: '0.4rem',
                          background: 'var(--error)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => startEdit(member)}
                        style={{
                          padding: '0.4rem',
                          background: 'var(--primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Edit member"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => deleteMember(member.id)}
                        style={{
                          padding: '0.4rem',
                          background: 'var(--error)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Delete member"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {members.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          No team members yet. Click "Add Member" to get started.
        </div>
      )}
    </div>
  );
};

export default RoleAccessControl;
