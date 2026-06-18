package com.qacollector.service;

import com.qacollector.dto.WorldCityDTO;
import com.qacollector.dto.WorldCountryDTO;
import com.qacollector.dto.WorldProvinceDTO;
import com.qacollector.entity.WorldCity;
import com.qacollector.entity.WorldCountry;
import com.qacollector.entity.WorldProvince;
import com.qacollector.repository.WorldCityRepository;
import com.qacollector.repository.WorldCountryRepository;
import com.qacollector.repository.WorldProvinceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorldService {

    private final WorldCountryRepository countryRepo;
    private final WorldProvinceRepository provinceRepo;
    private final WorldCityRepository cityRepo;

    public List<WorldCountryDTO> getCountries() {
        return countryRepo.findAllByOrderByNameZhAsc().stream()
                .map(c -> new WorldCountryDTO(c.getCode(), c.getNameZh(), c.getNameEn()))
                .toList();
    }

    public List<WorldProvinceDTO> getProvinces(String countryCode) {
        return provinceRepo.findByCountryCodeOrderByNameZhAsc(countryCode).stream()
                .map(p -> new WorldProvinceDTO(p.getId(), p.getNameZh(), p.getNameEn()))
                .toList();
    }

    public List<WorldCityDTO> getCities(Long provinceId) {
        return cityRepo.findByProvinceIdOrderByNameZhAsc(provinceId).stream()
                .map(c -> new WorldCityDTO(c.getId(), c.getNameZh(), c.getNameEn(),
                        c.getLatitude(), c.getLongitude(), c.getTimezone()))
                .toList();
    }
}
