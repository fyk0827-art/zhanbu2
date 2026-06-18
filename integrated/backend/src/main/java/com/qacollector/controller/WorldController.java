package com.qacollector.controller;

import com.qacollector.dto.ApiResponse;
import com.qacollector.dto.WorldCityDTO;
import com.qacollector.dto.WorldCountryDTO;
import com.qacollector.dto.WorldProvinceDTO;
import com.qacollector.service.WorldService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/world")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorldController {

    private final WorldService worldService;

    @GetMapping("/countries")
    public ApiResponse<List<WorldCountryDTO>> getCountries() {
        return ApiResponse.ok(worldService.getCountries());
    }

    @GetMapping("/provinces")
    public ApiResponse<List<WorldProvinceDTO>> getProvinces(@RequestParam String countryCode) {
        return ApiResponse.ok(worldService.getProvinces(countryCode));
    }

    @GetMapping("/cities")
    public ApiResponse<List<WorldCityDTO>> getCities(@RequestParam Long provinceId) {
        return ApiResponse.ok(worldService.getCities(provinceId));
    }
}
