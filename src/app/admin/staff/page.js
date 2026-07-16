"use client";
import { useEffect, useState } from 'react';
import { Plus, Search, ShieldCheck } from 'lucide-react';
import styles from './page.module.css';

const roles = ['support', 'manager', 'admin', 'super_admin'];
const statuses = ['active', 'inactive', 'suspended'];

export default function AdminStaffPage() {
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'support',
    status: 'active',
    password: '',
  });

  async function loadStaff() {
    try {
      const response = await fetch('/api/admin/staff');
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load staff.');
      setStaff(data.staff || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  const createStaff = async (event) => {
    event.preventDefault();
    setIsCreating(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to create staff.');
      setForm({ fullName: '', email: '', phone: '', role: 'support', status: 'active', password: '' });
      setMessage(data.authUserCreated
        ? 'Staff account created successfully.'
        : 'Staff profile saved. Add Supabase service role key to create login users automatically.');
      await loadStaff();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const updateStaff = async (id, patch) => {
    try {
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to update staff.');
      await loadStaff();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const filteredStaff = staff.filter((member) => {
    const haystack = `${member.fullName} ${member.email} ${member.role} ${member.status}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Staff & Roles</h1>
          <p className={styles.subtitle}>Create staff accounts and control admin, manager, and support access.</p>
        </div>
      </div>

      {message && <p className={styles.notice}>{message}</p>}

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div>
            <h3>Role Permission Guide</h3>
            <p className={styles.textMuted}>
              super_admin can manage everything. admin can manage staff except super_admin. manager can manage catalog, orders, coupons, shipping, and settings. support can manage support tickets and view operational records.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div>
            <h3 className={styles.cardTitle}><ShieldCheck size={18} /> Create Staff</h3>
          </div>
        </div>
        <form onSubmit={createStaff} className={styles.staffForm}>
          <input placeholder="Full name" value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} required />
          <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          <input placeholder="Phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <input type="password" placeholder="Temporary password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
            {roles.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className={styles.linkBtn} disabled={isCreating}>
            <Plus size={16} /> {isCreating ? 'Creating...' : 'Create Staff'}
          </button>
        </form>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search staff..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr><td colSpan="6">No staff found.</td></tr>
              ) : filteredStaff.map((member) => (
                <tr key={member.id}>
                  <td className={styles.fw500}>{member.fullName || 'Staff'}</td>
                  <td>{member.email}</td>
                  <td>{member.phone || '-'}</td>
                  <td>
                    <select className={styles.select} value={member.role} onChange={(event) => updateStaff(member.id, { role: event.target.value })}>
                      {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className={styles.select} value={member.status} onChange={(event) => updateStaff(member.id, { status: event.target.value })}>
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
