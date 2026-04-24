import { useMemo, useState } from 'react';
import { Plus, Users, CircleCheck, CircleX, Pencil, RefreshCcw, KeyRound } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import '../styles/pages/Doctors.css';

const doctors = [
	{
		name: 'Maria Reyes',
		email: 'maria.reyes@email.com',
		day: 'Monday',
		start: '8:00am',
		end: '12:00pm',
		slot: 30,
		status: 'Active',
		license: 'LIC-2021-001',
		room: 'Room 24',
		phone: '09181234567',
		specialty: 'Cardiology',
	},
	{
		name: 'Dr. Jose Santos',
		email: 'jose.santos@hospital.com',
		day: 'Wednesday',
		start: '8:00am',
		end: '12:00pm',
		slot: 30,
		status: 'Active',
		license: 'LIC-2021-002',
		room: 'Room 25',
		phone: '09181234568',
		specialty: 'Orthopedics',
	},
	{
		name: 'Juan Dela Cruz',
		email: 'juan.admin@hospital.com',
		day: 'Tuesday',
		start: '8:00am',
		end: '12:00pm',
		slot: 30,
		status: 'Active',
		license: 'LIC-2021-003',
		room: 'Room 26',
		phone: '09181234569',
		specialty: 'Neurology',
	},
	{
		name: 'Ana Lim',
		email: 'ana.lim@email.com',
		day: 'Thursday',
		start: '8:00am',
		end: '12:00pm',
		slot: 30,
		status: 'Inactive',
		license: 'LIC-2021-004',
		room: 'Room 27',
		phone: '09181234570',
		specialty: 'Dermatology',
	},
	{
		name: 'Pedro Bautista',
		email: 'pedro.b@email.com',
		day: 'Friday',
		start: '8:00am',
		end: '12:00pm',
		slot: 30,
		status: 'Active',
		license: 'LIC-2021-005',
		room: 'Room 28',
		phone: '09181234571',
		specialty: 'Pediatrics',
	},
];

function Doctors() {
	const [activeTab, setActiveTab] = useState('list');
	const [statusFilter, setStatusFilter] = useState('All');
	const userName = localStorage.getItem('user_name') || 'Juan';

	const filteredDoctors = useMemo(() => {
		if (statusFilter === 'All') return doctors;
		return doctors.filter((doctor) => doctor.status === statusFilter);
	}, [statusFilter]);

	const totalDoctors = doctors.length;
	const activeDoctors = doctors.filter((doctor) => doctor.status === 'Active').length;
	const inactiveDoctors = totalDoctors - activeDoctors;

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

						<button type="button" className="doctors-add-btn">
							<Plus size={17} />
							<span>Add New Doctor</span>
						</button>
					</div>
				</section>

				{activeTab === 'list' ? (
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
													<button type="button" className="doctors-action-icon" aria-label="Edit doctor"><Pencil size={14} /></button>
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
				) : (
					<section className="doctors-cards-grid">
						{filteredDoctors.map((doctor, index) => (
							<article key={`${doctor.license}-${index}`} className="doctors-profile-card">
								<header className="doctors-profile-head">
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
								</div>
							</article>
						))}
					</section>
				)}
			</main>
		</AppLayout>
	);
}

export default Doctors;
