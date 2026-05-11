package com.healthdesk.repository;

import com.healthdesk.model.Appointment;
import com.healthdesk.model.AppointmentStatus;
import com.healthdesk.model.Patient;
import com.healthdesk.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, String> {

    List<Appointment> findByPatient(Patient patient);
    List<Appointment> findByDoctor(User doctor);
    List<Appointment> findByStatus(AppointmentStatus status);
    List<Appointment> findByAppointmentDateTimeBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId AND a.appointmentDateTime = :dateTime AND a.status != 'CANCELLED'")
    Optional<Appointment> findConflictingAppointment(@Param("doctorId") String doctorId, @Param("dateTime") LocalDateTime dateTime);

    @Query("SELECT a FROM Appointment a WHERE a.appointmentDateTime < :cutoff AND a.isArchived = false")
    List<Appointment> findPastAppointmentsForArchiving(@Param("cutoff") LocalDateTime cutoff);

    @Modifying
    @Transactional
    @Query("UPDATE Appointment a SET a.isArchived = true WHERE a.id = :id")
    void archiveAppointment(@Param("id") String id);

    List<Appointment> findByAppointmentDateTimeBetweenAndDoctor(LocalDateTime start, LocalDateTime end, User doctor);
}