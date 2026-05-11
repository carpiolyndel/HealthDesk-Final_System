package com.healthdesk.repository;

import com.healthdesk.model.Patient;
import com.healthdesk.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
