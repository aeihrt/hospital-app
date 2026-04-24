import { useMemo, useState } from 'react';
import { Plus, Users, CircleCheck, CircleX, Pencil, RefreshCcw, KeyRound, X } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import '../styles/pages/Doctors.css';

const doctors = [
	{
		name: 'Maria Reyes',
		email: 'maria.reyes@email.com',
		userId: 'USR-0001',
		day: 'Monday',
		start: '8:00am',
		end: '12:00pm',
		slot: 30,
		status: 'Active',
		license: 'LIC-2021-001',
		room: 'Room 24',
		phone: '09181234567',
		specialty: 'Cardiology',
		schedules: [
			{ day: 'Monday', time: '8:00 AM - 12:00 PM' },
			{ day: 'Wednesday', time: '1:00 PM - 5:00 PM' },
		],
	},
	{
		name: 'Dr. Jose Santos',
		email: 'jose.santos@hospital.com',
		userId: 'USR-0002',
		day: 'Wednesday',
		start: '8:00am',
		end: '12:00pm',
		slot: 30,
		status: 'Active',
		license: 'LIC-2021-002',
		room: 'Room 25',
		phone: '09181234568',
		specialty: 'Orthopedics',
		schedules: [
			{ day: 'Monday', time: '8:00 AM - 12:00 PM' },
			{ day: 'Wednesday', time: '1:00 PM - 5:00 PM' },
		],
	},
	{
		name: 'Juan Dela Cruz',
		email: 'juan.admin@hospital.com',
		userId: 'USR-0003',
		day: 'Tuesday',
		start: '8:00am',
		end: '12:00pm',
		slot: 30,
		status: 'Active',
		license: 'LIC-2021-003',
		room: 'Room 26',
		phone: '09181234569',
		specialty: 'Neurology',
		schedules: [{ day: 'Tuesday', time: '8:00 AM - 12:00 PM' }],
	},
	{
		name: 'Ana Lim',
		email: 'ana.lim@email.com',
		userId: 'USR-0004',
		day: 'Thursday',
		start: '8:00am',
		end: '12:00pm',
		slot: 30,
		status: 'Inactive',
		license: 'LIC-2021-004',
		room: 'Room 27',
		phone: '09181234570',
		specialty: 'Dermatology',
		schedules: [{ day: 'Thursday', time: '8:00 AM - 12:00 PM' }],
	},
	{
		name: 'Pedro Bautista',
		email: 'pedro.b@email.com',
		userId: 'USR-0005',
		day: 'Friday',
		start: '8:00am',
		end: '12:00pm',
		slot: 30,
		status: 'Active',
		license: 'LIC-2021-005',
		room: 'Room 28',
		phone: '09181234571',
		specialty: 'Pediatrics',
		schedules: [{ day: 'Friday', time: '8:00 AM - 12:00 PM' }],
	},
];

function Doctors() {
	const [activeTab, setActiveTab] = useState('list');
	const [statusFilter, setStatusFilter] = useState('All');
	const [selectedDoctor, setSelectedDoctor] = useState(null);
	const [isViewOpen, setIsViewOpen] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [doctorForm, setDoctorForm] = useState({
		name: '',
		license: '',
		department: '',
		room: '',
		phone: '',
		email: '',
		status: 'Active',
	});
	const userName = localStorage.getItem('user_name') || 'Juan';

	const filteredDoctors = useMemo(() => {
		if (statusFilter === 'All') return doctors;
		return doctors.filter((doctor) => doctor.status === statusFilter);
	}, [statusFilter]);

	const totalDoctors = doctors.length;
	const activeDoctors = doctors.filter((doctor) => doctor.status === 'Active').length;
	const inactiveDoctors = totalDoctors - activeDoctors;

	const openView = (doctor) => {
		setSelectedDoctor(doctor);
		setIsViewOpen(true);
	};

	const openForm = (doctor = null) => {
		if (doctor) {
			setSelectedDoctor(doctor);
			setDoctorForm({
				name: doctor.name,
				license: doctor.license,
				department: doctor.specialty,
				room: doctor.room,
				phone: doctor.phone,
				email: doctor.email,
				status: doctor.status,
			});
		} else {
			setSelectedDoctor(null);
			setDoctorForm({
				name: '',
				license: '',
				department: '',
				room: '',
				phone: '',
				email: '',
				status: 'Active',
			});
		}

		setIsFormOpen(true);
	};

	const closeForm = () => setIsFormOpen(false);
	const closeView = () => setIsViewOpen(false);

	const handleFormChange = (event) => {
		const { name, value } = event.target;
		setDoctorForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleFormSubmit = (event) => {
		event.preventDefault();
		setIsFormOpen(false);
	};

	const handleLogout = () => {
		localStorage.removeItem('user_role');
		localStorage.removeItem('user_id');
		localStorage.removeItem('user_name');
		window.location.href = '/login';
	};

	return (
		<AppLayout activePage="doctors" title="Doctors" userName={userName} onLogout={handleLogout}>
			<main className="doctors-main">
				<section className="doctors-stats-grid">
					<article className="doctors-stat-card">
						<div className="doctors-stat-icon"><Users size={18} /></div>
						<div>
							<p className="doctors-stat-caption">TOTAL DOCTORS</p>
							<p className="doctors-stat-value">{totalDoctors}</p>
						</div>
					</article>
					<article className="doctors-stat-card">
						<div className="doctors-stat-icon doctors-stat-icon-green"><CircleCheck size={18} /></div>
						<div>
							<p className="doctors-stat-caption">ACTIVE</p>
							<p className="doctors-stat-value">{activeDoctors}</p>
						</div>
					</article>
					<article className="doctors-stat-card">
						<div className="doctors-stat-icon doctors-stat-icon-red"><CircleX size={18} /></div>
						<div>
							<p className="doctors-stat-caption">INACTIVE</p>
							<p className="doctors-stat-value">{inactiveDoctors}</p>
						</div>
					</article>
				</section>

				<section className="doctors-filter-row">
					<div className="doctors-tabs">
						<button
							type="button"
							className={`doctors-tab ${activeTab === 'list' ? 'doctors-tab-active' : ''}`}
							onClick={() => setActiveTab('list')}
						>
							Doctor List
						</button>
						<button
							type="button"
							className={`doctors-tab ${activeTab === 'schedules' ? 'doctors-tab-active' : ''}`}
							onClick={() => setActiveTab('schedules')}
						>
							Schedules
						</button>
					</div>

					<div className="doctors-controls">
						<select className="select-dark doctors-dept-select" defaultValue="All Departments">
							<option>All Departments</option>
							<option>Cardiology</option>
							<option>Neurology</option>
							<option>Pediatrics</option>
							<option>Orthopedics</option>
							<option>Dermatology</option>
						</select>

						{['All', 'Inactive', 'Active'].map((status) => (
							<button
								key={status}
								type="button"
								className={`doctors-status-btn ${statusFilter === status ? 'doctors-status-btn-active' : ''}`}
								onClick={() => setStatusFilter(status)}
							>
								{status}
							</button>
						))}

						<button type="button" className="doctors-add-btn" onClick={() => openForm()}>
							<Plus size={17} />
							<span>Add New Doctor</span>
						</button>
					</div>
				</section>

				{activeTab === 'list' ? (
					<section className="doctors-cards-grid">
						{filteredDoctors.map((doctor, index) => (
							<article key={`${doctor.license}-${index}`} className="doctors-profile-card">
								<header className="doctors-profile-head">
									<span className={`doctors-online-dot ${doctor.status === 'Active' ? 'doctors-online-dot-active' : 'doctors-online-dot-inactive'}`} aria-hidden="true" />
									<div className="doctors-avatar">{doctor.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
									<p className="doctors-profile-name">{doctor.name}</p>
									<span className="doctors-profile-specialty">{doctor.specialty}</span>
								</header>
								<div className="doctors-profile-body">
									<div className="doctors-profile-row"><span>License</span><span>{doctor.license}</span></div>
									<div className="doctors-profile-row"><span>Room</span><span>{doctor.room}</span></div>
									<div className="doctors-profile-row"><span>Phone</span><span>{doctor.phone}</span></div>
									<div className="doctors-profile-row"><span>Email</span><span>{doctor.email}</span></div>
									<div className="doctors-profile-row"><span>Schedule</span><span>{doctor.day}</span></div>
									<div className="doctors-profile-row"><span>Status</span><span>{doctor.status}</span></div>
									<div className="doctors-profile-actions">
										<button type="button" className="doctors-card-view-btn" onClick={() => openView(doctor)}>View</button>
										<button
											type="button"
											className={`doctors-card-state-btn ${doctor.status === 'Active' ? 'doctors-card-state-btn-danger' : 'doctors-card-state-btn-success'}`}
										>
											{doctor.status === 'Active' ? 'Deactivate' : 'Activate'}
										</button>
									</div>
								</div>
							</article>
						))}
					</section>
				) : (
					<section className="doctors-table-wrap">
						<div className="doctors-table-top">Showing {filteredDoctors.length} of {doctors.length} users</div>
						<div className="doctors-table-scroll">
							<table className="doctors-table">
								<thead>
									<tr>
										<th>Doctor</th>
										<th>Day of Week</th>
										<th>Start Time</th>
										<th>End Time</th>
										<th>Slot (Mins)</th>
										<th>Status</th>
										<th>Action</th>
									</tr>
								</thead>
								<tbody>
									{filteredDoctors.map((doctor, index) => (
										<tr key={`${doctor.email}-${index}`}>
											<td>
												<p className="doctors-cell-main">{doctor.name}</p>
												<p className="doctors-cell-sub">{doctor.email}</p>
											</td>
											<td className="doctors-cell-main">{doctor.day}</td>
											<td className="doctors-cell-main">{doctor.start}</td>
											<td className="doctors-cell-main">{doctor.end}</td>
											<td className="doctors-cell-main">{doctor.slot}</td>
											<td className="doctors-cell-main">{doctor.status}</td>
											<td>
												<div className="doctors-actions-inline">
													<button type="button" className="doctors-action-icon" aria-label="Edit doctor" onClick={() => openForm(doctor)}><Pencil size={14} /></button>
													<button type="button" className="doctors-action-icon" aria-label="Refresh doctor"><RefreshCcw size={14} /></button>
													<button type="button" className="doctors-action-icon" aria-label="Access doctor"><KeyRound size={14} /></button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>
				)}

				{isViewOpen && selectedDoctor && (
					<div className="doctors-view-overlay" onClick={closeView}>
						<div className="doctors-view-modal" onClick={(event) => event.stopPropagation()}>
							<header className="doctors-view-head">
								<div className="doctors-avatar doctors-avatar-large">{selectedDoctor.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
								<p className="doctors-profile-name doctors-profile-name-large">{selectedDoctor.name}</p>
								<span className="doctors-profile-specialty doctors-profile-specialty-large">{selectedDoctor.specialty}</span>
							</header>

							<section className="doctors-view-body">
								<h3 className="doctors-view-section-title">Doctor Info</h3>
								<div className="doctors-view-grid">
									<div className="doctors-view-item"><label>Full Name</label><p>{selectedDoctor.name}</p></div>
									<div className="doctors-view-item"><label>License No.</label><p>{selectedDoctor.license}</p></div>
									<div className="doctors-view-item"><label>Department</label><p>{selectedDoctor.specialty}</p></div>
									<div className="doctors-view-item"><label>Room</label><p>{selectedDoctor.room}</p></div>
									<div className="doctors-view-item"><label>Phone</label><p>{selectedDoctor.phone}</p></div>
									<div className="doctors-view-item"><label>Email</label><p>{selectedDoctor.email}</p></div>
									<div className="doctors-view-item"><label>UserID</label><p>{selectedDoctor.userId}</p></div>
								</div>

								<h3 className="doctors-view-section-title">Schedule</h3>
								<div className="doctors-view-schedule-grid">
									{(selectedDoctor.schedules || []).map((schedule, scheduleIndex) => (
										<div key={`${schedule.day}-${scheduleIndex}`} className="doctors-view-schedule-card">
											<strong>{schedule.day}</strong>
											<p>{schedule.time} {selectedDoctor.slot}min slots</p>
										</div>
									))}
								</div>
							</section>
						</div>
					</div>
				)}

				{isFormOpen && (
					<div className="doctors-form-overlay" onClick={closeForm}>
						<div className="doctors-form-modal" onClick={(event) => event.stopPropagation()}>
							<button type="button" className="doctors-form-close" onClick={closeForm} aria-label="Close doctor form">
								<X size={30} />
							</button>

							<form className="doctors-form-grid" onSubmit={handleFormSubmit}>
								<div className="doctors-form-field doctors-form-field-full">
									<label htmlFor="doctorName">Full Name</label>
									<input id="doctorName" name="name" value={doctorForm.name} onChange={handleFormChange} placeholder="e.g. Maria" required />
								</div>

								<div className="doctors-form-field">
									<label htmlFor="doctorLicense">License No.</label>
									<input id="doctorLicense" name="license" value={doctorForm.license} onChange={handleFormChange} placeholder="e.g. LIC-2021-001" required />
								</div>

								<div className="doctors-form-field">
									<label htmlFor="doctorDepartment">Department</label>
									<input id="doctorDepartment" name="department" value={doctorForm.department} onChange={handleFormChange} placeholder="e.g. Cardiology" required />
								</div>

								<div className="doctors-form-field">
									<label htmlFor="doctorRoom">Room</label>
									<input id="doctorRoom" name="room" value={doctorForm.room} onChange={handleFormChange} placeholder="e.g. Room 204" required />
								</div>

								<div className="doctors-form-field">
									<label htmlFor="doctorPhone">Phone</label>
									<input id="doctorPhone" name="phone" value={doctorForm.phone} onChange={handleFormChange} placeholder="e.g. 09181234567" required />
								</div>

								<div className="doctors-form-field doctors-form-field-full">
									<label htmlFor="doctorEmail">Email</label>
									<input id="doctorEmail" name="email" type="email" value={doctorForm.email} onChange={handleFormChange} placeholder="Select role" required />
								</div>

								<div className="doctors-form-field doctors-form-field-full">
									<label htmlFor="doctorStatus">Status</label>
									<select id="doctorStatus" name="status" className="doctors-form-select" value={doctorForm.status} onChange={handleFormChange}>
										<option value="Active">Active</option>
										<option value="Inactive">Inactive</option>
									</select>
								</div>

								<div className="doctors-form-actions doctors-form-field-full">
									<button type="button" className="doctors-cancel-btn" onClick={closeForm}>Cancel</button>
									<button type="submit" className="doctors-update-btn">Update</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</main>
		</AppLayout>
	);
}

export default Doctors;
