import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Search,
	Plus,
	X,
	Pencil,
	RefreshCcw,
	KeyRound,
	Eye,
	EyeOff,
} from 'lucide-react';
import '../styles/pages/Manage.css';
import AppLayout from '../components/AppLayout';
import FilterDropdown from '../components/FilterDropdown';
import { getJson, postJson } from '../utils/api';

function formatCreatedAt(dateStr) {
	if (!dateStr) return 'N/A';
	const d = new Date(dateStr);
	return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function Manage() {
	const navigate = useNavigate();
	const [userName, setUserName] = useState('');
	const [loading, setLoading] = useState(true);
	const [isUsersLoading, setIsUsersLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedRole, setSelectedRole] = useState('All Roles');
	const [selectedStatus, setSelectedStatus] = useState('All');
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [users, setUsers] = useState([]);
	const [formError, setFormError] = useState('');
	const [isSavingUser, setIsSavingUser] = useState(false);
	const [newUser, setNewUser] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		password: '',
		role: '',
		status: 'Active',
		dateOfBirth: '',
		specialization: '',
	});

	const [editModal, setEditModal] = useState({ isOpen: false, user: null });
	const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: '', status: '' });
	const [editError, setEditError] = useState('');
	const [isSavingEdit, setIsSavingEdit] = useState(false);

	const [statusModal, setStatusModal] = useState({ isOpen: false, user: null });
	const [isTogglingStatus, setIsTogglingStatus] = useState(false);

	const [passwordModal, setPasswordModal] = useState({ isOpen: false, user: null });
	const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
	const [passwordError, setPasswordError] = useState('');
	const [isSavingPassword, setIsSavingPassword] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const filteredUsers = useMemo(() => {
		return users.filter((user) => {
			const normalizedSearch = searchTerm.trim().toLowerCase();
			const searchableText = `${user.fullName} ${user.email} ${user.phone} ${user.role}`.toLowerCase();
			const matchSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
			const matchRole = selectedRole === 'All Roles' || user.role === selectedRole;
			const matchStatus = selectedStatus === 'All' || user.status === selectedStatus;

			return matchSearch && matchRole && matchStatus;
		});
	}, [users, searchTerm, selectedRole, selectedStatus]);

	useEffect(() => {
		loadUserData();
		loadUsers();
	}, []);

	const loadUserData = async () => {
		try {
			const userId = localStorage.getItem('user_id');
			if (!userId) {
				navigate('/login');
				return;
			}

			setUserName(localStorage.getItem('user_name') || 'Juan');
		} catch (error) {
			console.error('Error loading user data:', error);
		} finally {
			setLoading(false);
		}
	};

	const loadUsers = async () => {
		try {
			setIsUsersLoading(true);
			const result = await getJson('users.php');
			setUsers(result.users || []);
		} catch (error) {
			console.error('Error loading users:', error);
		} finally {
			setIsUsersLoading(false);
		}
	};

	const handleLogout = async () => {
		localStorage.removeItem('user_role');
		localStorage.removeItem('user_id');
		localStorage.removeItem('user_name');
		navigate('/login');
	};

	const closeAddModal = () => {
		setIsAddModalOpen(false);
		setFormError('');
		setNewUser({
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			password: '',
			role: '',
			status: 'Active',
			dateOfBirth: '',
			specialization: '',
		});
	};

	const handleNewUserInput = (event) => {
		const { name, value } = event.target;
		setNewUser((previous) => ({ ...previous, [name]: value }));
	};

	const handleSaveUser = async (event) => {
		event.preventDefault();
		setFormError('');

		const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'password', 'role', 'status'];
		const hasAllValues = requiredFields.every((field) => newUser[field]?.trim());

		if (!hasAllValues) {
			setFormError('Please fill in all required fields.');
			return;
		}

		if (newUser.role === 'Patient' && !newUser.dateOfBirth.trim()) {
			setFormError('Date of birth is required for patients.');
			return;
		}

		if (newUser.role === 'Doctor' && !newUser.specialization.trim()) {
			setFormError('Specialization is required for doctors.');
			return;
		}

		try {
			setIsSavingUser(true);
			const result = await postJson('register.php', {
				fullName: `${newUser.firstName.trim()} ${newUser.lastName.trim()}`,
				email: newUser.email.trim().toLowerCase(),
				phone: newUser.phone.trim(),
				password: newUser.password,
				role: newUser.role.toUpperCase(),
				status: newUser.status,
				dateOfBirth: newUser.dateOfBirth,
				specialization: newUser.specialization,
			});

			setUsers((previous) => [
				{
					fullName: `${result.user?.first_name || newUser.firstName} ${result.user?.last_name || newUser.lastName}`.trim(),
					email: result.user?.email || newUser.email.trim().toLowerCase(),
					phone: newUser.phone.trim(),
					role: newUser.role,
					status: result.user?.status || newUser.status,
					createdAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
				},
				...previous,
			]);
			closeAddModal();
		} catch (error) {
			setFormError(error?.message || 'Failed to save user.');
		} finally {
			setIsSavingUser(false);
		}

	};

	const openEditModal = (user) => {
		const parts = user.fullName.trim().split(' ');
		const firstName = parts[0] || '';
		const lastName = parts.slice(1).join(' ');
		setEditForm({ firstName, lastName, email: user.email, phone: user.phone, role: user.role, status: user.status });
		setEditError('');
		setEditModal({ isOpen: true, user });
	};

	const closeEditModal = () => {
		setEditModal({ isOpen: false, user: null });
		setEditError('');
	};

	const handleEditInput = (event) => {
		const { name, value } = event.target;
		setEditForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSaveEdit = async (event) => {
		event.preventDefault();
		setEditError('');

		if (!editForm.firstName.trim() || !editForm.email.trim()) {
			setEditError('First name and email are required.');
			return;
		}

		try {
			setIsSavingEdit(true);
			await postJson('update_user.php', {
				action: 'edit',
				userId: editModal.user.userId,
				firstName: editForm.firstName.trim(),
				lastName: editForm.lastName.trim(),
				email: editForm.email.trim().toLowerCase(),
				phone: editForm.phone.trim(),
				role: editForm.role,
				status: editForm.status,
			});
			const fullName = `${editForm.firstName.trim()} ${editForm.lastName.trim()}`.trim();
			setUsers((prev) => prev.map((u) =>
				u.userId === editModal.user.userId
					? { ...u, fullName, email: editForm.email.trim().toLowerCase(), phone: editForm.phone.trim(), role: editForm.role, status: editForm.status }
					: u,
			));
			closeEditModal();
		} catch (error) {
			setEditError(error?.message || 'Failed to update user.');
		} finally {
			setIsSavingEdit(false);
		}
	};

	const openStatusModal = (user) => setStatusModal({ isOpen: true, user });
	const closeStatusModal = () => setStatusModal({ isOpen: false, user: null });

	const handleToggleStatus = async () => {
		try {
			setIsTogglingStatus(true);
			const result = await postJson('update_user.php', {
				action: 'toggle_status',
				userId: statusModal.user.userId,
			});
			setUsers((prev) => prev.map((u) =>
				u.userId === statusModal.user.userId ? { ...u, status: result.newStatus } : u,
			));
			closeStatusModal();
		} catch (error) {
			console.error('Failed to toggle status:', error);
		} finally {
			setIsTogglingStatus(false);
		}
	};

	const openPasswordModal = (user) => {
		setPasswordForm({ password: '', confirmPassword: '' });
		setPasswordError('');
		setShowPassword(false);
		setShowConfirmPassword(false);
		setPasswordModal({ isOpen: true, user });
	};

	const closePasswordModal = () => {
		setPasswordModal({ isOpen: false, user: null });
		setPasswordError('');
	};

	const handlePasswordInput = (event) => {
		const { name, value } = event.target;
		setPasswordForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSavePassword = async (event) => {
		event.preventDefault();
		setPasswordError('');

		if (passwordForm.password.length < 6) {
			setPasswordError('Password must be at least 6 characters.');
			return;
		}
		if (passwordForm.password !== passwordForm.confirmPassword) {
			setPasswordError('Passwords do not match.');
			return;
		}

		try {
			setIsSavingPassword(true);
			await postJson('update_user.php', {
				action: 'change_password',
				userId: passwordModal.user.userId,
				password: passwordForm.password,
			});
			closePasswordModal();
		} catch (error) {
			setPasswordError(error?.message || 'Failed to change password.');
		} finally {
			setIsSavingPassword(false);
		}
	};

	if (loading) {
		return (
			<div className="manage-loading">
				<div className="manage-loading-text">Loading...</div>
			</div>
		);
	}

	return (
		<AppLayout activePage="manage" title="User Management" userName={userName} onLogout={handleLogout}>
			<main className="manage-main">
				<section className="manage-header-row">
					<div>
						<h2 className="manage-welcome">Welcome back, {userName || 'Juan'} <span aria-hidden="true"></span></h2>
						<p className="manage-subtitle">Manage all system users, roles, and account status.</p>
					</div>
					<button type="button" className="manage-add-user-btn" onClick={() => setIsAddModalOpen(true)}>
						<Plus size={16} />
						<span>Add New User</span>
					</button>
				</section>

				<section className="manage-filter-row">
					<div className="manage-search-wrap">
						<Search size={15} />
						<input
							type="search"
							placeholder="Search here"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
						/>
					</div>
					<FilterDropdown
						value={selectedRole}
						options={['All Roles', 'Admin', 'Doctor', 'Patient']}
						onChange={setSelectedRole}
						ariaLabel="Select user role"
						className="manage-role-select"
					/>
					<div className="manage-status-filter">
						{['All', 'Inactive', 'Active'].map((status) => (
							<button
								key={status}
								type="button"
								className={`manage-status-btn ${selectedStatus === status ? 'manage-status-btn-active' : ''}`}
								onClick={() => setSelectedStatus(status)}
							>
								{status}
							</button>
						))}
					</div>
				</section>

				<section className="manage-table-wrap">
					<div className="manage-table-top">Showing {filteredUsers.length} of {users.length} users {isUsersLoading ? '(refreshing...)' : ''}</div>
					<div className="manage-table-scroll">
						<table className="manage-table">
							<thead>
								<tr>
									<th>Users</th>
									<th>Phone</th>
									<th>Role</th>
									<th>Status</th>
									<th>Created At</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{filteredUsers.map((user, index) => (
									<tr key={`${user.email}-${index}`}>
										<td>
											<p className="manage-cell-main">{user.fullName}</p>
											<p className="manage-cell-sub">{user.email}</p>
										</td>
										<td className="manage-cell-main">{user.phone}</td>
										<td className="manage-cell-main">{user.role}</td>
										<td>
											<span className={`manage-status-pill ${user.status === 'Active' ? 'manage-status-pill-active' : 'manage-status-pill-inactive'}`}>
												{user.status}
											</span>
										</td>
										<td className="manage-cell-main">{formatCreatedAt(user.createdAt)}</td>
										<td>
											<div className="manage-actions-inline">
												<button type="button" className="manage-action-icon" aria-label="Edit user" onClick={() => openEditModal(user)}>
													<Pencil size={14} />
												</button>
												<button type="button" className="manage-action-icon" aria-label="Toggle status" onClick={() => openStatusModal(user)}>
													<RefreshCcw size={14} />
												</button>
												<button type="button" className="manage-action-icon" aria-label="Change password" onClick={() => openPasswordModal(user)}>
													<KeyRound size={14} />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>

			</main>

			{isAddModalOpen && (
				<div className="manage-modal-overlay" onClick={closeAddModal}>
					<div className="manage-modal" role="dialog" aria-modal="true" aria-label="Add New User" onClick={(event) => event.stopPropagation()}>
						<div className="manage-modal-head">
							<div className="manage-modal-title-wrap">
								<Plus size={28} />
								<h2>Add New User</h2>
							</div>
							<button type="button" className="manage-modal-close" onClick={closeAddModal} aria-label="Close add user modal">
								<X size={22} />
							</button>
						</div>

						<form className="manage-modal-form" onSubmit={handleSaveUser}>
							{formError && <p className="manage-form-error">{formError}</p>}

							<div className="manage-field">
								<label htmlFor="firstName">First Name</label>
								<input id="firstName" name="firstName" type="text" placeholder="e.g. Maria" value={newUser.firstName} onChange={handleNewUserInput} required />
							</div>

							<div className="manage-field">
								<label htmlFor="lastName">Last Name</label>
								<input id="lastName" name="lastName" type="text" placeholder="e.g. Reyes" value={newUser.lastName} onChange={handleNewUserInput} required />
							</div>

							<div className="manage-field manage-field-full">
								<label htmlFor="email">Email</label>
								<input id="email" name="email" type="email" placeholder="e.g. maria@email.com" value={newUser.email} onChange={handleNewUserInput} required />
							</div>

							<div className="manage-field">
								<label htmlFor="phone">Phone</label>
								<input id="phone" name="phone" type="text" placeholder="e.g. 09171234567" value={newUser.phone} onChange={handleNewUserInput} required />
							</div>

							<div className="manage-field">
								<label htmlFor="password">Password</label>
								<input id="password" name="password" type="password" placeholder="Enter password" value={newUser.password} onChange={handleNewUserInput} required />
								<p className="manage-field-hint">Min 8 chars &bull; 1 uppercase &bull; 1 number &bull; 1 symbol</p>
							</div>

							<div className="manage-field manage-field-full">
								<label htmlFor="role">Assign Roles</label>
								<FilterDropdown
									value={newUser.role || 'Select role'}
									options={['Select role', 'Admin', 'Doctor', 'Patient']}
									onChange={(role) => setNewUser((previous) => ({ ...previous, role: role === 'Select role' ? '' : role }))}
									ariaLabel="Assign role"
									className="manage-modal-dropdown"
								/>
							</div>

							<div className="manage-field manage-field-full">
								<label htmlFor="status">Status</label>
								<FilterDropdown
									value={newUser.status}
									options={['Active', 'Inactive']}
									onChange={(status) => setNewUser((previous) => ({ ...previous, status }))}
									ariaLabel="Select user status"
									className="manage-modal-dropdown"
								/>
							</div>

							{newUser.role === 'Patient' && (
								<div className="manage-field manage-field-full">
									<label htmlFor="dateOfBirth">Date of Birth</label>
									<input id="dateOfBirth" name="dateOfBirth" type="date" value={newUser.dateOfBirth} onChange={handleNewUserInput} required={newUser.role === 'Patient'} />
								</div>
							)}

							{newUser.role === 'Doctor' && (
								<div className="manage-field manage-field-full">
									<label htmlFor="specialization">Specialization</label>
									<input id="specialization" name="specialization" type="text" placeholder="e.g. Cardiology" value={newUser.specialization} onChange={handleNewUserInput} required={newUser.role === 'Doctor'} />
								</div>
							)}

							<div className="md:col-span-2 mt-2 flex justify-end gap-4">
								<button type="button" className="manage-cancel-btn" onClick={closeAddModal}>Cancel</button>
								<button type="submit" className="manage-save-btn" disabled={isSavingUser}>{isSavingUser ? 'Saving...' : 'Save User'}</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{editModal.isOpen && (
				<div className="manage-modal-overlay" onClick={closeEditModal}>
					<div className="manage-modal" role="dialog" aria-modal="true" aria-label="Edit User" onClick={(e) => e.stopPropagation()}>
						<div className="manage-modal-head">
							<div className="manage-modal-title-wrap">
								<Pencil size={28} />
								<h2>Edit User</h2>
							</div>
							<button type="button" className="manage-modal-close" onClick={closeEditModal} aria-label="Close">
								<X size={22} />
							</button>
						</div>
						<form className="manage-modal-form" onSubmit={handleSaveEdit}>
							{editError && <p className="manage-form-error manage-field-full">{editError}</p>}
							<div className="manage-field">
								<label htmlFor="edit-firstName">First Name</label>
								<input id="edit-firstName" name="firstName" type="text" placeholder="e.g. Maria" value={editForm.firstName} onChange={handleEditInput} required />
							</div>
							<div className="manage-field">
								<label htmlFor="edit-lastName">Last Name</label>
								<input id="edit-lastName" name="lastName" type="text" placeholder="e.g. Reyes" value={editForm.lastName} onChange={handleEditInput} />
							</div>
							<div className="manage-field manage-field-full">
								<label htmlFor="edit-email">Email</label>
								<input id="edit-email" name="email" type="email" placeholder="e.g. maria@email.com" value={editForm.email} onChange={handleEditInput} required />
							</div>
							<div className="manage-field">
								<label htmlFor="edit-phone">Phone</label>
								<input id="edit-phone" name="phone" type="text" placeholder="e.g. 09171234567" value={editForm.phone} onChange={handleEditInput} />
							</div>
							<div className="manage-field">
								<label>Role</label>
								<FilterDropdown
									value={editForm.role}
									options={['Admin', 'Doctor', 'Patient']}
									onChange={(role) => setEditForm((prev) => ({ ...prev, role }))}
									ariaLabel="Assign role"
									className="manage-modal-dropdown"
								/>
							</div>
							<div className="manage-field manage-field-full">
								<label>Status</label>
								<FilterDropdown
									value={editForm.status}
									options={['Active', 'Inactive']}
									onChange={(status) => setEditForm((prev) => ({ ...prev, status }))}
									ariaLabel="Select status"
									className="manage-modal-dropdown"
								/>
							</div>
							<div className="md:col-span-2 mt-2 flex justify-end gap-4">
								<button type="button" className="manage-cancel-btn" onClick={closeEditModal}>Cancel</button>
								<button type="submit" className="manage-save-btn" disabled={isSavingEdit}>{isSavingEdit ? 'Saving...' : 'Save Changes'}</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{statusModal.isOpen && (
				<div className="manage-modal-overlay" onClick={closeStatusModal}>
					<div className="manage-modal manage-confirm-modal" role="dialog" aria-modal="true" aria-label="Toggle Status" onClick={(e) => e.stopPropagation()}>
						<div className="manage-modal-head">
							<div className="manage-modal-title-wrap">
								<RefreshCcw size={28} />
								<h2>Toggle Status</h2>
							</div>
							<button type="button" className="manage-modal-close" onClick={closeStatusModal} aria-label="Close">
								<X size={22} />
							</button>
						</div>
						<div className="manage-confirm-body">
							<p className="manage-confirm-text">
								Are you sure you want to{' '}
								<strong>{statusModal.user?.status === 'Active' ? 'deactivate' : 'activate'}</strong>{' '}
								<strong>{statusModal.user?.fullName}</strong>?
							</p>
							<p className="manage-confirm-sub">
								Their status will change from{' '}
								<span className={statusModal.user?.status === 'Active' ? 'manage-text-active' : 'manage-text-inactive'}>{statusModal.user?.status}</span>
								{' '}to{' '}
								<span className={statusModal.user?.status === 'Active' ? 'manage-text-inactive' : 'manage-text-active'}>
									{statusModal.user?.status === 'Active' ? 'Inactive' : 'Active'}
								</span>.
							</p>
							<div className="manage-confirm-actions">
								<button type="button" className="manage-cancel-btn" onClick={closeStatusModal}>Cancel</button>
								<button type="button" className="manage-save-btn" onClick={handleToggleStatus} disabled={isTogglingStatus}>
									{isTogglingStatus ? 'Updating...' : 'Confirm'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{passwordModal.isOpen && (
				<div className="manage-modal-overlay" onClick={closePasswordModal}>
					<div className="manage-modal manage-confirm-modal" role="dialog" aria-modal="true" aria-label="Change Password" onClick={(e) => e.stopPropagation()}>
						<div className="manage-modal-head">
							<div className="manage-modal-title-wrap">
								<KeyRound size={28} />
								<h2>Change Password</h2>
							</div>
							<button type="button" className="manage-modal-close" onClick={closePasswordModal} aria-label="Close">
								<X size={22} />
							</button>
						</div>
						<form className="manage-modal-form manage-password-form" onSubmit={handleSavePassword}>
							{passwordError && <p className="manage-form-error manage-field-full">{passwordError}</p>}
							<p className="manage-confirm-sub manage-field-full">
								Changing password for <strong>{passwordModal.user?.fullName}</strong>
							</p>
							<div className="manage-field manage-field-full">
								<label htmlFor="new-password">New Password</label>
								<div className="manage-password-wrap">
									<input
										id="new-password"
										name="password"
										type={showPassword ? 'text' : 'password'}
										placeholder="Min 8 chars, 1 uppercase, 1 number, 1 symbol"
										value={passwordForm.password}
										onChange={handlePasswordInput}
										required
									/>
									<button type="button" className="manage-password-toggle" onClick={() => setShowPassword((p) => !p)} aria-label="Toggle password visibility">
										{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
									</button>
								</div>
								<p className="manage-field-hint">Min 8 chars &bull; 1 uppercase &bull; 1 number &bull; 1 symbol</p>
							</div>
							<div className="manage-field manage-field-full">
								<label htmlFor="confirm-password">Confirm Password</label>
								<div className="manage-password-wrap">
									<input
										id="confirm-password"
										name="confirmPassword"
										type={showConfirmPassword ? 'text' : 'password'}
										placeholder="Re-enter password"
										value={passwordForm.confirmPassword}
										onChange={handlePasswordInput}
										required
									/>
									<button type="button" className="manage-password-toggle" onClick={() => setShowConfirmPassword((p) => !p)} aria-label="Toggle confirm password visibility">
										{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
									</button>
								</div>
							</div>
							<div className="md:col-span-2 mt-2 flex justify-end gap-4">
								<button type="button" className="manage-cancel-btn" onClick={closePasswordModal}>Cancel</button>
								<button type="submit" className="manage-save-btn" disabled={isSavingPassword}>{isSavingPassword ? 'Saving...' : 'Save Password'}</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppLayout>
	);
}

export default Manage;
