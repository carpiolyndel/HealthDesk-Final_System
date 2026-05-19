package com.healthdesk.service;

import com.healthdesk.model.GuestContent;
import com.healthdesk.repository.GuestContentRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GuestContentService {
    public static final Map<String, String> DEFAULTS = Map.ofEntries(
            Map.entry("clinic.name", "HealthDesk Clinic"),
            Map.entry("clinic.address", "Cawayan, Catarman, Northern Samar"),
            Map.entry("clinic.phone", "09486729942"),
            Map.entry("clinic.emergencyPhone", "09486729942"),
            Map.entry("clinic.email", "healthdesk.info1@gmail.com"),
            Map.entry("hours.monday_friday", "8:00 AM - 8:00 PM"),
            Map.entry("hours.saturday", "9:00 AM - 5:00 PM"),
            Map.entry("hours.sunday", "Closed"),
            Map.entry("services.list", String.join("\n",
                    "General Consultation",
                    "Vaccination",
                    "Laboratory Tests",
                    "Dental Checkup",
                    "Annual Physical Exam"))
    );

    private final GuestContentRepository guestContentRepository;

    public GuestContentService(GuestContentRepository guestContentRepository) {
        this.guestContentRepository = guestContentRepository;
    }

    public Map<String, String> getAll() {
        Map<String, String> content = new LinkedHashMap<>(DEFAULTS);
        guestContentRepository.findAll().forEach(item -> {
            if (hasText(item.getKey()) && item.getValue() != null) {
                content.put(item.getKey(), item.getValue());
            }
        });
        return content;
    }

    public String get(String key) {
        return guestContentRepository.findById(key)
                .map(GuestContent::getValue)
                .filter(this::hasText)
                .orElse(DEFAULTS.getOrDefault(key, ""));
    }

    public Map<String, String> update(Map<String, Object> payload) {
        payload.forEach((key, value) -> {
            if (!DEFAULTS.containsKey(key)) return;
            GuestContent item = guestContentRepository.findById(key).orElseGet(GuestContent::new);
            item.setKey(key);
            item.setValue(value == null ? "" : value.toString().trim());
            guestContentRepository.save(item);
        });
        return getAll();
    }

    public Map<String, String> getClinicInfo() {
        Map<String, String> info = new LinkedHashMap<>();
        info.put("name", get("clinic.name"));
        info.put("address", get("clinic.address"));
        info.put("phone", get("clinic.phone"));
        info.put("emergencyPhone", get("clinic.emergencyPhone"));
        info.put("email", get("clinic.email"));
        return info;
    }

    public Map<String, String> getHours() {
        Map<String, String> hours = new LinkedHashMap<>();
        hours.put("monday_friday", get("hours.monday_friday"));
        hours.put("saturday", get("hours.saturday"));
        hours.put("sunday", get("hours.sunday"));
        return hours;
    }

    public List<String> getServices() {
        return get("services.list").lines()
                .map(String::trim)
                .filter(this::hasText)
                .toList();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
