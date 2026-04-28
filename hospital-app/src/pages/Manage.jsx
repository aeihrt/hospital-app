import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Search,
	Plus,
	X,
	Pencil,
	RefreshCcw,
	KeyRound,
} from 'lucide-react';
import '../styles/pages/Manage.css';
import AppLayout from '../components/AppLayout';
import FilterDropdown from '../components/FilterDropdown';
import { getJson, postJson } from '../utils/api';

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
					createdAt: new Date().toLocaleDateString('en-US', {
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					}),
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
										<td className="manage-cell-main">{user.createdAt}</td>
										<td>
											<div className="manage-actions-inline">
												<button type="button" className="manage-action-icon" aria-label="Edit user">
													<Pencil size={14} />
												</button>
												<button type="button" className="manage-action-icon" aria-label="Refresh user">
													<RefreshCcw size={14} />
												</button>
												<button type="button" className="manage-action-icon" aria-label="Access key">
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
								<input id="password" name="password" type="password" placeholder="e.g. Reyes" value={newUser.password} onChange={handleNewUserInput} required />
							</div>

							<div className="manage-field manage-field-full">
								<label htmlFor="role">Assign Roles</label>
								<select id="role" name="role" value={newUser.role} onChange={handleNewUserInput} required>
									<option value="">Select role</option>
									<option value="Admin">Admin</option>
									<option value="Doctor">Doctor</option>
									<option value="Patient">Patient</option>
								</select>
							</div>

							<div className="manage-field manage-field-full">
								<label htmlFor="status">Status</label>
								<select id="status" name="status" value={newUser.status} onChange={handleNewUserInput} required>
									<option value="Active">Active</option>
									<option value="Inactive">Inactive</option>
								</select>
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
		</AppLayout>
	);
}

export default Manage;
