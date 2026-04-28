import { useEffect, useMemo, useState } from 'react';
import { Plus, Users, CircleCheck, CircleX, Pencil, RefreshCcw, X } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import FilterDropdown from '../components/FilterDropdown';
import '../styles/pages/Doctors.css';
import { getJson, postJson } from '../utils/api';

const EMPTY_DOCTOR_FORM = {
	doctorId: '',
	name: '',
	license: '',
	department: '',
	room: '',
	phone: '',
	email: '',
	status: 'Active',
};

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function toInputTime(value) {
	const text = String(value || '').trim();
	if (!text || text === 'N/A') return '08:00';

	const parsed = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
	if (!parsed) return '08:00';

	let hour = parseInt(parsed[1], 10);
	const minute = parsed[2];
	const meridiem = (parsed[3] || '').toUpperCase();

	if (meridiem === 'PM' && hour < 12) hour += 12;
	if (meridiem === 'AM' && hour === 12) hour = 0;

	return `${String(hour).padStart(2, '0')}:${minute}`;
}

function toDisplayTime(value) {
	const text = String(value || '').trim();
	const parsed = text.match(/^(\d{1,2}):(\d{2})$/);
	if (!parsed) return 'N/A';

	const hour24 = parseInt(parsed[1], 10);
	const minute = parsed[2];
	const ampm = hour24 >= 12 ? 'PM' : 'AM';
	const hour12 = hour24 % 12 || 12;
	return `${hour12}:${minute} ${ampm}`;
}

function Doctors() {
	const [activeTab, setActiveTab] = useState('list');
	const [statusFilter, setStatusFilter] = useState('All');
	const [departmentFilter, setDepartmentFilter] = useState('All Departments');
	const [doctors, setDoctors] = useState([]);
	const [selectedDoctor, setSelectedDoctor] = useState(null);
	const [isViewOpen, setIsViewOpen] = useState(false);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [doctorForm, setDoctorForm] = useState(EMPTY_DOCTOR_FORM);
	const [loading, setLoading] = useState(true);
	const [isSavingDoctor, setIsSavingDoctor] = useState(false);
	const [formError, setFormError] = useState('');
	const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
	const [isSavingSchedule, setIsSavingSchedule] = useState(false);
	const [scheduleError, setScheduleError] = useState('');
	const [scheduleForm, setScheduleForm] = useState({
		doctorId: '',
		userId: '',
		name: '',
		day: 'Monday',
		startTime: '08:00',
		endTime: '12:00',
		slotMinutes: '30',
		scheduleStatus: 'Active',
	});




	const userName = localStorage.getItem('user_name') || 'Juan';

	useEffect(() => {
		loadDoctors();
	}, []);

	const loadDoctors = async () => {
		try {
			setLoading(true);
			const result = await getJson('doctors.php');
			setDoctors(result.doctors || []);
		} catch (error) {
			console.error('Error loading doctors:', error);
		} finally {
			setLoading(false);
		}
	};

	const filteredDoctors = useMemo(() => {
		return doctors.filter((doctor) => {
			const matchStatus = statusFilter === 'All' || doctor.status === statusFilter;
			const matchDepartment = departmentFilter === 'All Departments' || doctor.specialty === departmentFilter;
			return matchStatus && matchDepartment;
		});
	}, [statusFilter, departmentFilter, doctors]);

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
				doctorId: doctor.doctorId || '',
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
			setDoctorForm(EMPTY_DOCTOR_FORM);
		}

		setFormError('');
		setIsFormOpen(true);
	};

	const closeForm = () => {
		setIsFormOpen(false);
		setFormError('');
	};
	const closeView = () => setIsViewOpen(false);

	const openScheduleModal = (doctor) => {
		setSelectedDoctor(doctor);
		setScheduleForm({
			doctorId: doctor.doctorId || '',
			userId: doctor.userId || '',
			name: doctor.name || '',
			day: doctor.day && doctor.day !== 'N/A' ? doctor.day : 'Monday',
			startTime: toInputTime(doctor.start),
			endTime: toInputTime(doctor.end === 'N/A' ? '12:00 PM' : doctor.end),
			slotMinutes: String(doctor.slot || 30),
			scheduleStatus: doctor.status || 'Active',
		});
		setScheduleError('');
		setIsScheduleModalOpen(true);
	};

	const closeScheduleModal = () => {
		setAccessCode('');
		setAccessMessage('');
	};

	const handleFormChange = (event) => {
		const { name, value } = event.target;
		setDoctorForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleFormSubmit = async (event) => {
		event.preventDefault();

		if (!doctorForm.name.trim() || !doctorForm.department.trim() || !doctorForm.phone.trim() || !doctorForm.email.trim()) {
			setFormError('Please fill in the required fields.');
			return;
		}

		try {
			setIsSavingDoctor(true);
			const result = await postJson('doctors.php', {
				doctorId: doctorForm.doctorId,
				name: doctorForm.name.trim(),
				license: doctorForm.license.trim(),
				department: doctorForm.department.trim(),
				room: doctorForm.room.trim(),
				phone: doctorForm.phone.trim(),
				email: doctorForm.email.trim().toLowerCase(),
				status: doctorForm.status,
			});

			const savedDoctor = result.doctor || {
				doctorId: doctorForm.doctorId || `${Date.now()}`,
				name: doctorForm.name.trim(),
				license: doctorForm.license.trim(),
				specialty: doctorForm.department.trim(),
				room: doctorForm.room.trim(),
				phone: doctorForm.phone.trim(),
				email: doctorForm.email.trim().toLowerCase(),
				status: doctorForm.status,
				day: doctorForm.day || 'N/A',
				start: doctorForm.start || 'N/A',
				end: doctorForm.end || 'N/A',
				slot: doctorForm.slot || 30,
				schedules: doctorForm.schedules || [],
			};

			setDoctors((previous) => {
				const filtered = previous.filter((doctor) => doctor.doctorId !== savedDoctor.doctorId);
				return [
					{
						...selectedDoctor,
						...savedDoctor,
					},
					...filtered,
				];
			});

			closeForm();
		} catch (error) {
			setFormError(error?.message || 'Failed to save doctor.');
		} finally {
			setIsSavingDoctor(false);
		}
	};

	const handleScheduleSubmit = async (event) => {
		event.preventDefault();

		if (!scheduleForm.day || !scheduleForm.startTime || !scheduleForm.endTime) {
			setScheduleError('Please complete the schedule fields.');
			return;
		}

		const slotMinutes = Number(scheduleForm.slotMinutes);
		if (!Number.isFinite(slotMinutes) || slotMinutes < 5 || slotMinutes > 240) {
			setScheduleError('Slot minutes must be between 5 and 240.');
			return;
		}

		try {
			setIsSavingSchedule(true);
			setScheduleError('');

			await postJson('doctors.php', {
				doctorId: scheduleForm.doctorId,
				userId: scheduleForm.userId,
				day: scheduleForm.day,
				startTime: scheduleForm.startTime,
				endTime: scheduleForm.endTime,
				slotMinutes,
				scheduleStatus: scheduleForm.scheduleStatus,
			});

			setDoctors((previous) => previous.map((doctor) => {
				if (doctor.doctorId !== scheduleForm.doctorId) return doctor;

				const updatedSchedule = {
					scheduleId: `local-${Date.now()}`,
					day: scheduleForm.day,
					time: `${toDisplayTime(scheduleForm.startTime)} - ${toDisplayTime(scheduleForm.endTime)}`,
					slotMinutes,
					isActive: scheduleForm.scheduleStatus === 'Active',
				};

				return {
					...doctor,
					day: scheduleForm.day,
					start: toDisplayTime(scheduleForm.startTime),
					end: toDisplayTime(scheduleForm.endTime),
					slot: slotMinutes,
					schedules: [updatedSchedule],
				};
			}));

			closeScheduleModal();
		} catch (error) {
			setScheduleError(error?.message || 'Failed to update schedule.');
		} finally {
			setAccessMessage('Unable to copy automatically. Please copy it manually.');
		}
	};

	const handleLogout = () => {
		localStorage.removeItem('user_role');
		localStorage.removeItem('user_id');
		localStorage.removeItem('user_name');
		window.location.href = '/login';
	};

	const handleToggleStatus = async (doctor) => {
		const nextStatus = doctor.status === 'Active' ? 'Inactive' : 'Active';

		try {
			await postJson('doctors.php', {
				doctorId: doctor.doctorId,
				userId: doctor.userId,
				name: doctor.name,
				license: doctor.license,
				department: doctor.specialty,
				room: doctor.room,
				phone: doctor.phone,
				email: doctor.email,
				status: nextStatus,
			});

			setDoctors((previous) => previous.map((item) => (
				item.doctorId === doctor.doctorId
					? { ...item, status: nextStatus }
					: item
			)));
		} catch (error) {
			console.error('Failed to update doctor status:', error);
		}
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
						<FilterDropdown
							value={departmentFilter}
							options={['All Departments', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology']}
							onChange={setDepartmentFilter}
							ariaLabel="Select department"
							className="doctors-dept-select"
						/>

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
											onClick={() => handleToggleStatus(doctor)}
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
													<button type="button" className="doctors-action-icon" aria-label="Refresh doctor" onClick={() => openScheduleModal(doctor)}><RefreshCcw size={14} /></button>
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
					<div className="doctors-view-overlay app-modal-backdrop" onClick={closeView}>
						<div className="doctors-view-modal app-modal" onClick={(event) => event.stopPropagation()}>
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
					<div className="doctors-form-overlay app-modal-backdrop" onClick={closeForm}>
						<div className="doctors-form-modal app-modal" onClick={(event) => event.stopPropagation()}>
							<button type="button" className="doctors-form-close" onClick={closeForm} aria-label="Close doctor form">
								<X size={30} />
							</button>

							<form className="doctors-form-grid" onSubmit={handleFormSubmit}>
								<div className="doctors-form-field doctors-form-field-full">
									<label htmlFor="doctorName">Full Name</label>
									<input id="doctorName" name="name" value={doctorForm.name} onChange={handleFormChange} placeholder="e.g. Dr. Maria Santos" required />
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
									<input id="doctorEmail" name="email" type="email" value={doctorForm.email} onChange={handleFormChange} placeholder="e.g. dr.santos@hospital.com" required />
								</div>

								<div className="doctors-form-field doctors-form-field-full">
									<label htmlFor="doctorStatus">Status</label>
									<FilterDropdown
										value={doctorForm.status}
										options={['Active', 'Inactive']}
										onChange={(status) => setDoctorForm((previous) => ({ ...previous, status }))}
										ariaLabel="Select doctor status"
										className="doctors-form-dropdown"
									/>
								</div>

								<div className="doctors-form-actions doctors-form-field-full">
									<button type="button" className="doctors-cancel-btn" onClick={closeForm}>Cancel</button>
									<button type="submit" className="doctors-update-btn">Update</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{isScheduleModalOpen && (
					<div className="doctors-form-overlay app-modal-backdrop" onClick={closeScheduleModal}>
						<div className="doctors-form-modal doctors-modal-compact app-modal" onClick={(event) => event.stopPropagation()}>
							<div className="app-modal-title-wrap">
								<h3 className="app-modal-title">Update Doctor Schedule</h3>
								<button type="button" className="doctors-form-close" onClick={closeScheduleModal} aria-label="Close schedule modal">
									<X size={24} />
								</button>
							</div>

							<form className="doctors-form-grid app-modal-body" onSubmit={handleScheduleSubmit}>
								<div className="doctors-form-field doctors-form-field-full">
									<label htmlFor="scheduleDoctor">Doctor</label>
									<input id="scheduleDoctor" value={scheduleForm.name} readOnly />
								</div>

								<div className="doctors-form-field">
									<label htmlFor="scheduleDay">Day</label>
									<FilterDropdown
										value={scheduleForm.day}
										options={DAY_OPTIONS}
										onChange={(day) => setScheduleForm((previous) => ({ ...previous, day }))}
										ariaLabel="Select schedule day"
										className="doctors-form-dropdown"
									/>
								</div>

								<div className="doctors-form-field">
									<label htmlFor="scheduleSlot">Slot Minutes</label>
									<input
										id="scheduleSlot"
										type="number"
										min="5"
										max="240"
										step="5"
										value={scheduleForm.slotMinutes}
										onChange={(event) => setScheduleForm((previous) => ({ ...previous, slotMinutes: event.target.value }))}
									/>
								</div>

								<div className="doctors-form-field">
									<label htmlFor="scheduleStart">Start Time</label>
									<input
										id="scheduleStart"
										type="time"
										value={scheduleForm.startTime}
										onChange={(event) => setScheduleForm((previous) => ({ ...previous, startTime: event.target.value }))}
										required
									/>
								</div>

								<div className="doctors-form-field">
									<label htmlFor="scheduleEnd">End Time</label>
									<input
										id="scheduleEnd"
										type="time"
										value={scheduleForm.endTime}
										onChange={(event) => setScheduleForm((previous) => ({ ...previous, endTime: event.target.value }))}
										required
									/>
								</div>

								<div className="doctors-form-field doctors-form-field-full">
									<label htmlFor="scheduleStatus">Schedule Status</label>
									<FilterDropdown
										value={scheduleForm.scheduleStatus}
										options={['Active', 'Inactive']}
										onChange={(scheduleStatus) => setScheduleForm((previous) => ({ ...previous, scheduleStatus }))}
										ariaLabel="Select schedule status"
										className="doctors-form-dropdown"
									/>
								</div>

								{scheduleError && <p className="doctors-form-error doctors-form-field-full">{scheduleError}</p>}

								<div className="doctors-form-actions doctors-form-field-full app-modal-footer">
									<button type="button" className="doctors-cancel-btn" onClick={closeScheduleModal}>Cancel</button>
									<button type="submit" className="doctors-update-btn" disabled={isSavingSchedule}>
										{isSavingSchedule ? 'Saving...' : 'Save Schedule'}
									</button>
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
