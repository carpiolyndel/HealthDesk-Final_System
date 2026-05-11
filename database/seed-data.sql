-- Insert default admin user (password: Admin@123)
INSERT INTO users (id, username, email, password, full_name, role) VALUES
('admin-001', 'admin', 'admin@healthdesk.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', 'System Administrator', 'ADMIN');

-- Insert sample doctor
INSERT INTO users (id, username, email, password, full_name, role) VALUES
('doctor-001', 'dr.smith', 'dr.smith@healthdesk.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', 'Dr. John Smith', 'DOCTOR');

-- Insert sample nurse
INSERT INTO users (id, username, email, password, full_name, role) VALUES
('nurse-001', 'nurse.jane', 'jane@healthdesk.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', 'Jane Wilson', 'NURSE');

-- Insert sample staff
INSERT INTO users (id, username, email, password, full_name, role) VALUES
('staff-001', 'staff.mike', 'mike@healthdesk.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E', 'Mike Johnson', 'STAFF');

-- Insert sample patient
INSERT INTO patients (id, first_name, last_name, age, gender, email, phone_number, assigned_doctor_id, assigned_nurse_id) VALUES
('patient-001', 'Alice', 'Brown', 30, 'Female', 'alice@example.com', '09123456789', 'doctor-001', 'nurse-001');
