package com.healthdesk.controller;

import com.healthdesk.dto.UserDTO;
import com.healthdesk.security.CurrentUserService;
import com.healthdesk.service.UserService;
import com.healthdesk.model.User;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private CurrentUserService currentUserService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getUsers(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(userService.getUsers(search));
    }

    @GetMapping("/archived")
    public ResponseEntity<List<UserDTO>> getArchivedUsers(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(userService.getArchivedUsers(search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable String id) {
        UserDTO user = userService.getUser(id);
        return user != null ? ResponseEntity.ok(user) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserDTO dto) {
        User actor = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.createUser(dto, actor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable String id, @Valid @RequestBody UserDTO dto) {
        User actor = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.updateUser(id, dto, actor));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        User actor = currentUserService.getCurrentUser();
        userService.deleteUser(id, actor);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<UserDTO> resetPassword(@PathVariable String id, @RequestBody Map<String, String> payload) {
        User actor = currentUserService.getCurrentUser();
        String newPassword = payload.get("password");
        return ResponseEntity.ok(userService.resetPassword(id, newPassword, actor));
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<UserDTO> archiveUser(@PathVariable String id) {
        User actor = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userService.archiveUser(id, actor));
    }
}
