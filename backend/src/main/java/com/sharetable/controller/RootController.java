package com.sharetable.controller;

import java.util.Map;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class RootController {

  @GetMapping("/")
  @ResponseBody
  public Map<String, String> root() {
    return Map.of(
        "message", "ShareTable API is running",
        "frontend", "Open the app at http://localhost:5180 (or the port Vite prints)",
        "health", "http://localhost:8080/actuator/health");
  }
}
