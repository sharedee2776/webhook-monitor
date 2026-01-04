import React, { useState } from 'react';

const TeamManagement: React.FC = () => {
  // Dummy team data
  const [team, setTeam] = useState([
    { id: 1, name: 'Alice', role: 'Owner' },
    { id: 2, name: 'Bob', role: 'Member' },
  ]);
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail) {
      setTeam([...team, { id: team.length + 1, name: inviteEmail, role: 'Invited' }]);
      setInviteEmail('');
    }
  };

  return (
    <div style={{ margin: '2rem 0', padding: '1rem', background: '#e5f7ff', borderRadius: 8 }}>
      <h2>Team Management</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {team.map(member => (
          <li key={member.id} style={{ marginBottom: '0.5rem' }}>
            {member.name} <span style={{ color: '#888' }}>({member.role})</span>
          </li>
        ))}
      </ul>
      <form onSubmit={handleInvite} style={{ marginTop: '1rem' }}>
        <input
          type="email"
          placeholder="Invite by email"
          value={inviteEmail}
          onChange={e => setInviteEmail(e.target.value)}
          required
          style={{ padding: '0.5rem', marginRight: '0.5rem' }}
        />
        <button type="submit">Invite</button>
      </form>
    </div>
  );
};

export default TeamManagement;
