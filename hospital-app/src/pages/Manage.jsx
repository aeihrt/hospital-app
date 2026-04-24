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

function Manage() {
	const navigate = useNavigate();
	const [userName, setUserName] = useState('');
	const [userRole, setUserRole] = useState('');
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedRole, setSelectedRole] = useState('All Roles');
	const [selectedStatus, setSelectedStatus] = useState('All');
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [users, setUsers] = useState([
		{ fullName: 'Maria Reyes', email: 'maria.reyes@email.com', phone: '09171234567', role: 'Patient', status: 'Active', createdAt: 'Mar 1, 2026' },
		{ fullName: 'Dr. Jose Santos', email: 'jose.santos@hospital.com', phone: '09181234567', role: 'Doctor', status: 'Active', createdAt: 'Feb 15, 2026' },
		{ fullName: 'Juan Dela Cruz', email: 'juan.admin@hospital.com', phone: '09171234567', role: 'Admin', status: 'Active', createdAt: 'Jan 10, 2026' },
		{ fullName: 'Ana Lim', email: 'ana.lim@email.com', phone: '09171234567', role: 'Patient', status: 'Inactive', createdAt: 'Feb 20, 2026' },
		{ fullName: 'Pedro Bautista', email: 'pedro.b@email.com', phone: '09171234567', role: 'Patient', status: 'Active', createdAt: 'Mar 5, 2026' },
		{ fullName: 'Dr. David Lee', email: 'david.l@hospital.com', phone: '09221234567', role: 'Doctor', status: 'Active', createdAt: 'Jan 22, 2026' },
		{ fullName: 'Carlo Cruz', email: 'carlo.c@email.com', phone: '09231234567', role: 'Patient', status: 'Inactive', createdAt: 'Mar 8, 2026' },
		{ fullName: 'Dr. Maria Garcia', email: 'maria.g@hospital.com', phone: '09241234567', role: 'Doctor', status: 'Active', createdAt: 'Feb 1, 2026' },
	]);
	const [newUser, setNewUser] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		password: '',
		role: '',
		status: 'Active',
	});

	const mappedRole = useMemo(() => {
		const roles = {
			R001: 'Admin',
			R002: 'Doctor',
			R003: 'Patient',
			ADMIN: 'Admin',
			DOCTOR: 'Doctor',
			PATIENT: 'Patient',
		};
		return roles[userRole] || 'User';
	}, [userRole]);

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
	}, []);

	const loadUserData = async () => {
		try {
			const userId = localStorage.getItem('user_id');
			if (!userId) {
				navigate('/login');
				return;
			}

			setUserName(localStorage.getItem('user_name') || 'Juan');
			setUserRole(localStorage.getItem('user_role') || 'ADMIN');
		} catch (error) {
			console.error('Error loading user data:', error);
		} finally {
			setLoading(false);
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
		setNewUser({
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			password: '',
			role: '',
			status: 'Active',
		});
	};

	const handleNewUserInput = (event) => {
		const { name, value } = event.target;
		setNewUser((previous) => ({ ...previous, [name]: value }));
	};

	const handleSaveUser = (event) => {
		event.preventDefault();

		const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'password', 'role', 'status'];
		const hasAllValues = requiredFields.every((field) => newUser[field]?.trim());

		if (!hasAllValues) {
			return;
		}

		const today = new Date().toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});

		const addedUser = {
			fullName: `${newUser.firstName.trim()} ${newUser.lastName.trim()}`,
			email: newUser.email.trim().toLowerCase(),
			phone: newUser.phone.trim(),
			role: newUser.role,
			status: newUser.status,
			createdAt: today,
		};

		setUsers((previous) => [addedUser, ...previous]);
		closeAddModal();
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
					<select className="manage-role-select select-dark" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
						<option>All Roles</option>
						<option>Admin</option>
						<option>Doctor</option>
						<option>Patient</option>
					</select>
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
					<div className="manage-table-top">Showing {filteredUsers.length} of {users.length} users</div>
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

				<p className="manage-footer-meta">Signed in as {mappedRole}</p>
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

							<div className="md:col-span-2 mt-2 flex justify-end gap-4">
								<button type="button" className="manage-cancel-btn" onClick={closeAddModal}>Cancel</button>
								<button type="submit" className="manage-save-btn">Save User</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</AppLayout>
	);
}

export default Manage;
