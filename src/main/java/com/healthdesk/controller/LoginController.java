package com.healthdesk.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LoginController {

    @GetMapping("/login")
    public String loginPage() {
        // Thymeleaf template at templates/user/login.html
        return "user/login";
    }
}