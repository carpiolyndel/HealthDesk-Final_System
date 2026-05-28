package com.healthdesk.repository;

import com.healthdesk.model.Patient;
import com.healthdesk.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, String> {

    Optional<Patient> findByEmail(String email);

    @Query("SELECT p FROM Patient p WHERE " +
            "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "p.id = :search")
    List<Patient> searchByNameOrId(@Param("search") String search);

    List<Patient> findByAssignedDoctor(User doctor);
    List<Patient> findByAssignedNurse(User nurse);
    List<Patient> findByIsArchivedFalse();
    List<Patient> findByIsArchivedTrue();

    @Modifying
    @Query("UPDATE Patient p SET p.assignedDoctor = null WHERE p.assignedDoctor = :user")
    void clearAssignedDoctor(@Param("user") User user);

    @Modifying
    @Query("UPDATE Patient p SET p.assignedNurse = null WHERE p.assignedNurse = :user")
    void clearAssignedNurse(@Param("user") User user);
}
